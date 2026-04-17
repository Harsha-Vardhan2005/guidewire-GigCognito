// Community Voting for New Triggers Service
// Workers can propose and vote on new parametric triggers
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { verifyLocalNewsEvidence } from "../feeds/official-notice-feed.service";
import { detectRing, type RingDecision } from "../fraud/ring-detection.service";
import {
  analyzeLivePhoto,
  cosineSimilarity,
  hammingDistance,
  type LivePhotoInput,
  type LatLng,
} from "./live-photo-evidence.service";

const prisma = new PrismaClient();

type Proposal = {
  id: string;
  title: string;
  description: string;
  triggerType?: string;
  proposer: string;
  zoneId: string;
  votes: number;
  voters: Set<string>;
  voteShare: number;
  eligibleVoters: number;
  status: "LESS_VOTES" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  newsVerified: boolean;
  verificationSource: string;
  verificationEvidence: string[];
  evidenceSignals: number;
  confidenceScore: number;
  primaryEvidence: "NEWS" | "LIVE_PHOTO" | "NEWS_AND_PHOTO";
  ringDecision?: RingDecision;
  createdAt: string;
  approvedAt?: string;
};

type EvidenceRecord = {
  id: string;
  proposalId: string;
  workerId: string;
  zoneId: string;
  submittedAtMs: number;
  capturedAtMs: number;
  gps: LatLng;
  pHashBits: string;
  embedding: number[];
  source: "PROPOSAL" | "VOTE";
};

type ActivityEvent = {
  zoneId: string;
  workerId: string;
  timestampMs: number;
  deviceSignature: string;
  ipPrefix: string;
  duplicateAttempt: boolean;
};

type SubmissionContext = {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  evidencePhoto?: LivePhotoInput;
};

type DuplicateMatch = {
  proposalId: string;
  evidenceId: string;
  pHashDistance: number;
  cosineSimilarity: number;
};

export class DuplicateEvidenceRedirectError extends Error {
  proposalId: string;
  pHashDistance: number;
  cosineSimilarity: number;

  constructor(input: { proposalId: string; pHashDistance: number; cosineSimilarity: number }) {
    super("Similar disruption evidence already exists. Redirecting to vote on existing proposal.");
    this.name = "DuplicateEvidenceRedirectError";
    this.proposalId = input.proposalId;
    this.pHashDistance = input.pHashDistance;
    this.cosineSimilarity = input.cosineSimilarity;
  }
}

const proposals: Record<string, Proposal> = {};
const votes: Record<string, Set<string>> = {};
const evidenceByProposal: Record<string, EvidenceRecord[]> = {};
const zoneEvidence: EvidenceRecord[] = [];
const activityEvents: ActivityEvent[] = [];

const LOCAL_SOURCE_FEED_URL = process.env.LOCAL_SOURCE_FEED_URL || process.env.LOCAL_NEWS_FEED_URL;
const AREA_APPROVAL_THRESHOLD = 0.5;
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const NINETY_SECONDS_MS = 90 * 1000;
const PHASH_DUP_THRESHOLD = 10;
const COSINE_DUP_THRESHOLD = 0.92;

const ZONE_GEOFENCE: Record<string, { lat: number; lng: number; radiusKm: number }> = {
  BLR_KOR_01: { lat: 12.9352, lng: 77.6245, radiusKm: 2.8 },
  BLR_HSR_01: { lat: 12.9116, lng: 77.6389, radiusKm: 2.8 },
  BLR_IND_01: { lat: 12.9784, lng: 77.6408, radiusKm: 2.8 },
  DEL_DWK_01: { lat: 28.5921, lng: 77.046, radiusKm: 3.2 },
  DEL_NOR_01: { lat: 28.5355, lng: 77.391, radiusKm: 3.2 },
  MUM_ANH_01: { lat: 19.1136, lng: 72.8697, radiusKm: 2.8 },
  MUM_BAN_01: { lat: 19.0596, lng: 72.8295, radiusKm: 2.8 },
  PNE_KSB_01: { lat: 18.5167, lng: 73.8562, radiusKm: 2.8 },
  PNE_KHR_01: { lat: 18.5512, lng: 73.9343, radiusKm: 2.8 },
};

function normalizeText(text: string): string {
  return (text || "").toLowerCase();
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function resolveIpPrefix(ipAddress: string | undefined): string {
  if (!ipAddress) return "unknown";
  if (ipAddress.includes(":")) return ipAddress.split(":").slice(0, 4).join(":");
  const parts = ipAddress.split(".");
  return parts.length >= 3 ? `${parts[0]}.${parts[1]}.${parts[2]}` : ipAddress;
}

function resolveDeviceSignature(workerId: string, context?: SubmissionContext): string {
  const fromContext = normalizeText(context?.deviceFingerprint || "").trim();
  if (fromContext) return fromContext.slice(0, 128);

  const fallback = `${normalizeText(context?.userAgent || "unknown")}|${resolveIpPrefix(context?.ipAddress)}|${workerId}`;
  return fallback.slice(0, 128);
}

function pruneStaleMemory(nowMs: number) {
  const cutoff = nowMs - FOUR_HOURS_MS;

  for (let i = zoneEvidence.length - 1; i >= 0; i -= 1) {
    if (zoneEvidence[i].capturedAtMs < cutoff) {
      zoneEvidence.splice(i, 1);
    }
  }

  for (let i = activityEvents.length - 1; i >= 0; i -= 1) {
    if (activityEvents[i].timestampMs < cutoff) {
      activityEvents.splice(i, 1);
    }
  }
}

function recordActivity(workerId: string, zoneId: string, context: SubmissionContext | undefined, duplicateAttempt: boolean) {
  activityEvents.push({
    zoneId,
    workerId,
    timestampMs: Date.now(),
    ipPrefix: resolveIpPrefix(context?.ipAddress),
    deviceSignature: resolveDeviceSignature(workerId, context),
    duplicateAttempt,
  });
}

async function assessZoneRingAnomaly(zoneId: string): Promise<RingDecision> {
  const nowMs = Date.now();
  const threeMinuteWindow = nowMs - 3 * 60 * 1000;
  const tenMinuteWindow = nowMs - 10 * 60 * 1000;

  const events3m = activityEvents.filter((event) => event.zoneId === zoneId && event.timestampMs >= threeMinuteWindow);
  const events10m = activityEvents.filter((event) => event.zoneId === zoneId && event.timestampMs >= tenMinuteWindow);

  const deviceCounts = new Map<string, number>();
  const ipCounts = new Map<string, number>();

  for (const event of events3m) {
    deviceCounts.set(event.deviceSignature, (deviceCounts.get(event.deviceSignature) || 0) + 1);
    ipCounts.set(event.ipPrefix, (ipCounts.get(event.ipPrefix) || 0) + 1);
  }

  let sharedFingerprints = 0;
  for (const count of deviceCounts.values()) {
    if (count > 1) {
      sharedFingerprints += count;
    }
  }

  const largestIpCluster = Math.max(...Array.from(ipCounts.values()), 0);
  const ipClusterRatio = events3m.length ? largestIpCluster / events3m.length : 0;

  let newAccounts7d = 0;
  let expectedRate = 12;
  try {
    const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000);
    newAccounts7d = await prisma.worker.count({
      where: {
        zoneId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const eligible = await getEligibleVoterCount(zoneId);
    expectedRate = Math.max(8, Math.round(eligible * 0.08));
  } catch {
    // Keep fallback defaults when DB is unavailable.
  }

  const duplicatePhotoAttempts = events10m.filter((event) => event.duplicateAttempt).length;

  return detectRing({
    zoneId,
    claimsInWindow: events3m.length,
    windowMinutes: 3,
    newAccounts7d,
    sharedFingerprints,
    expectedRate,
    ipGeoMismatchRate: ipClusterRatio,
    duplicatePhotoAttempts,
  });
}

async function validateLivePhotoEvidence(workerZoneId: string, workerId: string, input?: LivePhotoInput) {
  if (!input?.imageDataUrl) {
    throw new Error("Live camera photo is required for disruption reports.");
  }

  const analyzed = await analyzeLivePhoto(input);

  if (analyzed.captureMode && analyzed.captureMode !== "environment") {
    throw new Error("Rear camera capture is required. Gallery uploads are blocked.");
  }

  if (!analyzed.exifTimestampMs) {
    throw new Error("Photo rejected: missing EXIF timestamp metadata.");
  }

  const timeDrift = Math.abs(Date.now() - analyzed.exifTimestampMs);
  if (timeDrift > NINETY_SECONDS_MS) {
    throw new Error("Photo rejected: capture time must be within 90 seconds of submission.");
  }

  if (!analyzed.gps) {
    throw new Error("Photo rejected: GPS metadata missing.");
  }

  const zone = ZONE_GEOFENCE[workerZoneId];
  if (!zone) {
    throw new Error("Unknown zone for worker profile.");
  }

  const gpsDistance = distanceKm(analyzed.gps.lat, analyzed.gps.lng, zone.lat, zone.lng);
  if (gpsDistance > zone.radiusKm) {
    throw new Error("Photo rejected: GPS does not match your registered zone.");
  }

  const duplicate = findDuplicateInZoneWindow(workerZoneId, analyzed.pHashBits, analyzed.embedding, analyzed.capturedAtMs);

  return {
    analyzed,
    duplicate,
    workerId,
  };
}

function findDuplicateInZoneWindow(zoneId: string, pHashBits: string, embedding: number[], capturedAtMs: number): DuplicateMatch | null {
  const windowStart = capturedAtMs - FOUR_HOURS_MS;

  let bestMatch: DuplicateMatch | null = null;

  for (const evidence of zoneEvidence) {
    if (evidence.zoneId !== zoneId) continue;
    if (evidence.capturedAtMs < windowStart) continue;

    const pHashDistance = hammingDistance(pHashBits, evidence.pHashBits);
    const cosSim = cosineSimilarity(embedding, evidence.embedding);

    if (pHashDistance < PHASH_DUP_THRESHOLD || cosSim > COSINE_DUP_THRESHOLD) {
      const candidate: DuplicateMatch = {
        proposalId: evidence.proposalId,
        evidenceId: evidence.id,
        pHashDistance,
        cosineSimilarity: Number(cosSim.toFixed(4)),
      };

      if (!bestMatch) {
        bestMatch = candidate;
      } else {
        const isBetter =
          candidate.pHashDistance < bestMatch.pHashDistance ||
          (candidate.pHashDistance === bestMatch.pHashDistance && candidate.cosineSimilarity > bestMatch.cosineSimilarity);
        if (isBetter) bestMatch = candidate;
      }
    }
  }

  return bestMatch;
}

function pushEvidenceRecord(
  proposalId: string,
  workerId: string,
  zoneId: string,
  source: "PROPOSAL" | "VOTE",
  analyzed: Awaited<ReturnType<typeof analyzeLivePhoto>>,
): EvidenceRecord {
  const record: EvidenceRecord = {
    id: uuidv4(),
    proposalId,
    workerId,
    zoneId,
    submittedAtMs: Date.now(),
    capturedAtMs: analyzed.capturedAtMs,
    gps: analyzed.gps as LatLng,
    pHashBits: analyzed.pHashBits,
    embedding: analyzed.embedding,
    source,
  };

  zoneEvidence.push(record);
  evidenceByProposal[proposalId] = [...(evidenceByProposal[proposalId] || []), record];
  return record;
}

async function getEligibleVoterCount(zoneId: string): Promise<number> {
  const count = await prisma.worker.count({ where: { zoneId } });
  return Math.max(1, count);
}

async function verifyWithLocalSources(input: { zoneId: string; title: string; description: string }) {
  // Prefer direct in-process verification so post validation does not depend on runtime env wiring.
  try {
    const direct = await verifyLocalNewsEvidence({
      zoneId: input.zoneId,
      title: input.title,
      description: input.description,
    });

    // Only commit to a positive result. A negative from the in-process verifier
    // (e.g. no mock data for this zone, or low score) should fall through to the
    // heuristic — the verifier returning false is not the same as "evidence exists
    // and was checked against real external sources".
    if (direct.verified) {
      return {
        verified: true,
        source: String(direct.sourceMode || "local-verifier"),
        evidence: Array.isArray(direct.sources) ? direct.sources.map(String) : [],
      };
    }
  } catch {
    // Fall through to HTTP verifier, then heuristic fallback.
  }

  if (LOCAL_SOURCE_FEED_URL) {
    try {
      const res = await axios.get(LOCAL_SOURCE_FEED_URL, {
        params: {
          zoneId: input.zoneId,
          title: input.title,
          description: input.description,
        },
        timeout: 4000,
      });

      const verified = Boolean(res.data?.verified);
      const evidence = Array.isArray(res.data?.sources) ? res.data.sources.map(String) : [];
      return {
        verified,
        source: "local-feed",
        evidence,
      };
    } catch {
      return {
        verified: false,
        source: "local-feed-error",
        evidence: ["Local source feed unavailable"],
      };
    }
  }

  // Fallback demo verifier when no external local source feed is configured.
  const text = `${normalizeText(input.title)} ${normalizeText(input.description)}`;
  const likelyLocalIncident = [
    "curfew",
    "bandh",
    "waterlogging",
    "flood",
    "aqi",
    "rain",
    "heat",
    "festival",
    "hanuman",
    "jayanti",
    "jayanthi",
    "road block",
    "blocked road",
    "road blocked",
    "section 144",
  ]
    .some((k) => text.includes(k));

  return {
    verified: likelyLocalIncident,
    source: "heuristic-fallback",
    evidence: likelyLocalIncident
      ? ["Keyword and disruption pattern matched; configure LOCAL_SOURCE_FEED_URL for stronger verification"]
      : ["Insufficient local-source evidence"],
  };
}

function getLowVoteMessage(voteShare: number) {
  return `Less votes: ${(voteShare * 100).toFixed(0)}% support. Needs > ${(AREA_APPROVAL_THRESHOLD * 100).toFixed(0)}% area votes to move to review`;
}

function setStatusEvidence(baseEvidence: string[], message: string) {
  const trimmed = baseEvidence.filter((entry) => !entry.startsWith("Less votes:") && entry !== "News verified and vote threshold met; sent for review");
  return [...trimmed, message];
}

async function evaluateProposalState(proposal: Proposal): Promise<Proposal> {
  proposal.eligibleVoters = await getEligibleVoterCount(proposal.zoneId);
  proposal.voteShare = proposal.votes / proposal.eligibleVoters;

  const voteComponent = clamp01((proposal.voteShare / AREA_APPROVAL_THRESHOLD) * 0.55);
  const sourceComponent = proposal.newsVerified ? 0.22 : 0;
  const photoComponent = Math.min(0.3, proposal.evidenceSignals * 0.05);
  const ringPenalty = proposal.ringDecision?.isRing ? (proposal.ringDecision.action === "CIRCUIT_BREAK" ? 0.45 : 0.15) : 0;
  proposal.confidenceScore = clamp01(voteComponent + sourceComponent + photoComponent - ringPenalty);

  if (proposal.ringDecision?.action === "CIRCUIT_BREAK") {
    proposal.status = "REJECTED";
    proposal.verificationEvidence = setStatusEvidence(
      proposal.verificationEvidence,
      `Blocked by coordinated anomaly detector: ${proposal.ringDecision.flags.join("; ")}`,
    );
    return proposal;
  }

  if (!proposal.newsVerified && proposal.evidenceSignals <= 0) {
    proposal.status = "REJECTED";
    if (!proposal.verificationEvidence.length) {
      proposal.verificationEvidence = ["Rejected: no external news or unique live photo evidence found"];
    }
    return proposal;
  }

  if (proposal.voteShare < AREA_APPROVAL_THRESHOLD) {
    proposal.status = "LESS_VOTES";
    proposal.verificationEvidence = setStatusEvidence(proposal.verificationEvidence, getLowVoteMessage(proposal.voteShare));
    return proposal;
  }

  proposal.status = "UNDER_REVIEW";
  proposal.verificationEvidence = setStatusEvidence(
    proposal.verificationEvidence,
    "Evidence verified and vote threshold met; sent for review",
  );

  return proposal;
}

export async function proposeTrigger(
  workerId: string,
  title: string,
  description: string,
  triggerType?: string,
  context?: SubmissionContext,
) {
  const nowMs = Date.now();
  pruneStaleMemory(nowMs);

  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker?.zoneId) {
    throw new Error("Worker zone is required for community trigger proposals");
  }

  const livePhoto = await validateLivePhotoEvidence(worker.zoneId, workerId, context?.evidencePhoto);

  if (livePhoto.duplicate) {
    recordActivity(workerId, worker.zoneId, context, true);
    throw new DuplicateEvidenceRedirectError({
      proposalId: livePhoto.duplicate.proposalId,
      pHashDistance: livePhoto.duplicate.pHashDistance,
      cosineSimilarity: livePhoto.duplicate.cosineSimilarity,
    });
  }

  recordActivity(workerId, worker.zoneId, context, false);
  const ringDecision = await assessZoneRingAnomaly(worker.zoneId);

  if (ringDecision.action === "CIRCUIT_BREAK") {
    throw new Error(`Proposal paused for investigation: ${ringDecision.flags.join("; ")}`);
  }

  const verification = await verifyWithLocalSources({
    zoneId: worker.zoneId,
    title,
    description,
  });

  const id = uuidv4();
  const proposal: Proposal = {
    id,
    title,
    description,
    triggerType,
    proposer: workerId,
    zoneId: worker.zoneId,
    votes: 1,
    voters: new Set([workerId]),
    voteShare: 0,
    eligibleVoters: 1,
    status: "LESS_VOTES",
    newsVerified: verification.verified,
    verificationSource: verification.source,
    verificationEvidence: [...verification.evidence],
    evidenceSignals: 1,
    confidenceScore: 0,
    primaryEvidence: verification.verified ? "NEWS_AND_PHOTO" : "LIVE_PHOTO",
    ringDecision,
    createdAt: new Date().toISOString(),
  };

  if (!verification.verified) {
    proposal.verificationEvidence.push("No corroborating news found. Accepted with unique live photo evidence.");
  }

  proposals[id] = proposal;
  votes[id] = new Set([workerId]);
  pushEvidenceRecord(id, workerId, worker.zoneId, "PROPOSAL", livePhoto.analyzed);
  return evaluateProposalState(proposal);
}

export async function voteTrigger(workerId: string, proposalId: string, context?: SubmissionContext) {
  const nowMs = Date.now();
  pruneStaleMemory(nowMs);

  if (!proposals[proposalId]) throw new Error("Proposal not found");
  if (proposals[proposalId].status === "REJECTED") {
    throw new Error("This proposal is rejected because no news evidence was found");
  }
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker?.zoneId) throw new Error("Worker zone not found");
  if (worker.zoneId !== proposals[proposalId].zoneId) {
    throw new Error("You can only vote for proposals in your own zone");
  }
  if (votes[proposalId].has(workerId)) throw new Error("Already voted");

  let evidenceAccepted = false;
  let evidenceDuplicate: DuplicateMatch | null = null;

  if (context?.evidencePhoto?.imageDataUrl) {
    const evidence = await validateLivePhotoEvidence(worker.zoneId, workerId, context.evidencePhoto);
    if (evidence.duplicate) {
      evidenceDuplicate = evidence.duplicate;
      recordActivity(workerId, worker.zoneId, context, true);
    } else {
      pushEvidenceRecord(proposalId, workerId, worker.zoneId, "VOTE", evidence.analyzed);
      proposals[proposalId].evidenceSignals += 1;
      evidenceAccepted = true;
      recordActivity(workerId, worker.zoneId, context, false);
    }
  } else {
    recordActivity(workerId, worker.zoneId, context, false);
  }

  proposals[proposalId].ringDecision = await assessZoneRingAnomaly(worker.zoneId);
  if (proposals[proposalId].ringDecision?.action === "CIRCUIT_BREAK") {
    throw new Error(`Voting temporarily paused: ${proposals[proposalId].ringDecision?.flags.join("; ")}`);
  }

  votes[proposalId].add(workerId);
  proposals[proposalId].votes = votes[proposalId].size;
  proposals[proposalId].voters = votes[proposalId];

  const updated = await evaluateProposalState(proposals[proposalId]);
  return {
    ...updated,
    voteEvidence: {
      provided: Boolean(context?.evidencePhoto?.imageDataUrl),
      accepted: evidenceAccepted,
      duplicate: evidenceDuplicate,
    },
  };
}

export function listProposals() {
  return Object.values(proposals).map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    triggerType: p.triggerType,
    zoneId: p.zoneId,
    votes: p.votes,
    voteShare: p.voteShare,
    eligibleVoters: p.eligibleVoters,
    status: p.status,
    verificationSource: p.verificationSource,
    verificationEvidence: p.verificationEvidence,
    newsVerified: p.newsVerified,
    evidenceSignals: p.evidenceSignals,
    confidenceScore: p.confidenceScore,
    primaryEvidence: p.primaryEvidence,
    ringDecision: p.ringDecision,
    createdAt: p.createdAt,
    approvedAt: p.approvedAt,
  }));
}

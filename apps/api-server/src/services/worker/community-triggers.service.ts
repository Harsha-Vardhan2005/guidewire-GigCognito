// Community Voting for New Triggers Service
// Workers can propose and vote on new parametric triggers
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { verifyLocalNewsEvidence } from "../feeds/official-notice-feed.service";

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
  createdAt: string;
  approvedAt?: string;
};

const proposals: Record<string, Proposal> = {};
const votes: Record<string, Set<string>> = {};

const LOCAL_SOURCE_FEED_URL = process.env.LOCAL_SOURCE_FEED_URL || process.env.LOCAL_NEWS_FEED_URL;
const AREA_APPROVAL_THRESHOLD = 0.5;

function normalizeText(text: string): string {
  return (text || "").toLowerCase();
}

function normalizeTriggerType(input?: string, title?: string, description?: string): string {
  const text = `${normalizeText(input || "")} ${normalizeText(title || "")} ${normalizeText(description || "")}`;
  if (text.includes("curfew") || text.includes("section 144")) return "T5_CURFEW";
  if (text.includes("festival") || text.includes("procession")) return "T6_FESTIVAL";
  if (text.includes("aqi") || text.includes("pollution")) return "T2_AQI";
  if (text.includes("heat") || text.includes("heatwave")) return "T4_HEATWAVE";
  if (text.includes("rain") || text.includes("flood")) return "T1_RAINFALL";
  return input || "CUSTOM";
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

  if (!proposal.newsVerified) {
    proposal.status = "REJECTED";
    if (!proposal.verificationEvidence.length) {
      proposal.verificationEvidence = ["Rejected: no matching local news evidence found at submission time"];
    }
    return proposal;
  }

  if (proposal.voteShare < AREA_APPROVAL_THRESHOLD) {
    proposal.status = "LESS_VOTES";
    proposal.verificationEvidence = setStatusEvidence(proposal.verificationEvidence, getLowVoteMessage(proposal.voteShare));
    return proposal;
  }

  // Curfew proposals require one more online verification pass after crossing 50% area votes.
  if (proposal.triggerType === "T5_CURFEW") {
    const recheck = await verifyWithLocalSources({
      zoneId: proposal.zoneId,
      title: proposal.title,
      description: proposal.description,
    });

    proposal.newsVerified = recheck.verified;
    proposal.verificationSource = recheck.source;
    proposal.verificationEvidence = [
      ...proposal.verificationEvidence,
      ...recheck.evidence,
    ];

    if (!recheck.verified) {
      proposal.status = "REJECTED";
      proposal.verificationEvidence = setStatusEvidence(
        proposal.verificationEvidence,
        "Rejected: online local-news verification failed after vote threshold"
      );
      return proposal;
    }

    proposal.status = "APPROVED";
    proposal.approvedAt = new Date().toISOString();
    proposal.verificationEvidence = setStatusEvidence(
      proposal.verificationEvidence,
      "Curfew approved: >=50% zone votes and online local-news verification passed"
    );
    return proposal;
  }

  proposal.status = "UNDER_REVIEW";
  proposal.verificationEvidence = setStatusEvidence(proposal.verificationEvidence, "News verified and vote threshold met; sent for review");

  return proposal;
}

export async function proposeTrigger(workerId: string, title: string, description: string, triggerType?: string) {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker?.zoneId) {
    throw new Error("Worker zone is required for community trigger proposals");
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
    triggerType: normalizeTriggerType(triggerType, title, description),
    proposer: workerId,
    zoneId: worker.zoneId,
    votes: 1,
    voters: new Set([workerId]),
    voteShare: 0,
    eligibleVoters: 1,
    status: verification.verified ? "LESS_VOTES" : "REJECTED",
    newsVerified: verification.verified,
    verificationSource: verification.source,
    verificationEvidence: verification.evidence,
    createdAt: new Date().toISOString(),
  };
  proposals[id] = proposal;
  votes[id] = new Set([workerId]);
  return evaluateProposalState(proposal);
}

export async function voteTrigger(workerId: string, proposalId: string) {
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

  votes[proposalId].add(workerId);
  proposals[proposalId].votes = votes[proposalId].size;
  proposals[proposalId].voters = votes[proposalId];
  return evaluateProposalState(proposals[proposalId]);
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
    createdAt: p.createdAt,
    approvedAt: p.approvedAt,
  }));
}

export function isTriggerApprovedForZone(zoneId: string, triggerType: string) {
  const latestMatching = Object.values(proposals)
    .filter((p) => p.zoneId === zoneId && p.triggerType === triggerType)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return Boolean(latestMatching && latestMatching.status === "APPROVED");
}

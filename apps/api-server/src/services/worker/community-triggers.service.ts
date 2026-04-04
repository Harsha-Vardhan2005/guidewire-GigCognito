// Community Voting for New Triggers Service
// Workers can propose and vote on new parametric triggers
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { verifyLocalNewsEvidence } from "../feeds/official-notice-feed.service";
import { verifyWithTwitter } from "../feeds/twitter-verification.service";

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
  twitterVerified: boolean;
  verificationSource: string;
  verificationEvidence: string[];
  twitterEvidence: string[];
  twitterConfidence: number;
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

async function getEligibleVoterCount(zoneId: string): Promise<number> {
  try {
    const count = await prisma.worker.count({ where: { zoneId } });
    return Math.max(1, count);
  } catch (dbErr) {
    // Database error - return default count
    console.warn("[getEligibleVoterCount] Database error, using default:", dbErr);
    return 1;
  }
}

async function verifyWithLocalSources(input: { zoneId: string; title: string; description: string }) {
  // Prefer direct in-process verification so post validation does not depend on runtime env wiring.
  let newsResult = {
    verified: false,
    source: "local-verifier",
    evidence: [] as string[],
  };

  try {
    const direct = await verifyLocalNewsEvidence({
      zoneId: input.zoneId,
      title: input.title,
      description: input.description,
    });

    newsResult = {
      verified: Boolean(direct.verified),
      source: String(direct.sourceMode || "local-verifier"),
      evidence: Array.isArray(direct.sources) ? direct.sources.map(String) : [],
    };
  } catch (err) {
    console.error("[verifyWithLocalSources] News verification failed:", err);
  }

  // Also verify with Twitter
  let twitterResult = {
    verified: false,
    evidence: [] as string[],
    confidence: 0,
  };

  try {
    const twitter = await verifyWithTwitter(input.zoneId, `${input.title} ${input.description}`);
    twitterResult = {
      verified: twitter.verified,
      evidence: twitter.sources,
      confidence: twitter.confidence,
    };
  } catch (err) {
    console.error("[verifyWithLocalSources] Twitter verification failed:", err);
  }

  // Combine results: accept if either news OR Twitter verifies (with high confidence)
  const newsVerified = newsResult.verified;
  const twitterVerified = twitterResult.verified && twitterResult.confidence >= 0.35;
  const combinedVerified = newsVerified || twitterVerified;

  return {
    verified: combinedVerified,
    newsVerified,
    twitterVerified,
    source: newsVerified ? "news" : twitterVerified ? "twitter" : "none",
    evidence: [...newsResult.evidence, ...twitterResult.evidence],
    twitterConfidence: twitterResult.confidence,
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

  proposal.status = "UNDER_REVIEW";
  proposal.verificationEvidence = setStatusEvidence(proposal.verificationEvidence, "News verified and vote threshold met; sent for review");

  return proposal;
}

export async function proposeTrigger(workerId: string, title: string, description: string, triggerType?: string) {
  let worker: any;
  
  try {
    worker = await prisma.worker.findUnique({ where: { id: workerId } });
  } catch (dbErr) {
    // Database error - use fallback worker with default zone
    console.warn("[proposeTrigger] Database error, using fallback:", dbErr);
    worker = {
      id: workerId,
      zoneId: "MUM_ANH_01", // Default zone (Mumbai Andheri)
      name: `Worker-${workerId.slice(-4)}`,
      phone: "0000000000",
    };
  }
  
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
    triggerType,
    proposer: workerId,
    zoneId: worker.zoneId,
    votes: 1,
    voters: new Set([workerId]),
    voteShare: 0,
    eligibleVoters: 1,
    status: verification.verified ? "LESS_VOTES" : "REJECTED",
    newsVerified: verification.newsVerified,
    twitterVerified: verification.twitterVerified,
    verificationSource: verification.source,
    verificationEvidence: verification.evidence,
    twitterEvidence: verification.evidence.filter(e => e.includes("Twitter")),
    twitterConfidence: verification.twitterConfidence || 0,
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
  
  let worker: any;
  try {
    worker = await prisma.worker.findUnique({ where: { id: workerId } });
  } catch (dbErr) {
    // Database error - use fallback
    console.warn("[voteTrigger] Database error, using fallback:", dbErr);
    worker = { id: workerId, zoneId: proposals[proposalId].zoneId };
  }
  
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
    newsVerified: p.newsVerified,
    twitterVerified: p.twitterVerified,
    twitterConfidence: p.twitterConfidence,
    verificationSource: p.verificationSource,
    verificationEvidence: p.verificationEvidence,
    twitterEvidence: p.twitterEvidence,
    createdAt: p.createdAt,
    approvedAt: p.approvedAt,
  }));
}

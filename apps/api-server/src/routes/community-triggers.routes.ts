import express from "express";
import {
  DuplicateEvidenceRedirectError,
  proposeTrigger,
  voteTrigger,
  listProposals,
} from "../services/worker/community-triggers.service";
import { authenticateWorker } from "../middlewares/authenticateWorker";

const router = express.Router();

// POST /api/community-triggers/propose
router.post("/propose", authenticateWorker, async (req, res) => {
  const workerId = req.user.id;
  const { title, description, triggerType, evidencePhoto, deviceFingerprint } = req.body;
  try {
    const proposal = await proposeTrigger(workerId, title, description, triggerType, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]?.toString(),
      deviceFingerprint: typeof deviceFingerprint === "string" ? deviceFingerprint : undefined,
      evidencePhoto,
    });
    res.json(proposal);
  } catch (err) {
    if (err instanceof DuplicateEvidenceRedirectError) {
      return res.status(409).json({
        error: err.message,
        code: "DUPLICATE_EVIDENCE",
        duplicateProposalId: err.proposalId,
        similarity: {
          pHashDistance: err.pHashDistance,
          cosineSimilarity: err.cosineSimilarity,
        },
      });
    }

    const message = err instanceof Error ? err.message : "Failed to submit proposal";
    res.status(400).json({ error: message });
  }
});

// POST /api/community-triggers/vote
router.post("/vote", authenticateWorker, async (req, res) => {
  const workerId = req.user.id;
  const { proposalId, evidencePhoto, deviceFingerprint } = req.body;
  try {
    const proposal = await voteTrigger(workerId, proposalId, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]?.toString(),
      deviceFingerprint: typeof deviceFingerprint === "string" ? deviceFingerprint : undefined,
      evidencePhoto,
    });
    res.json(proposal);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to vote";
    res.status(400).json({ error: message });
  }
});

// GET /api/community-triggers/list
router.get("/list", authenticateWorker, (req, res) => {
  res.json(listProposals());
});

export default router;

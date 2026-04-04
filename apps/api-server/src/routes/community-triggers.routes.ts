import express from "express";
import { proposeTrigger, voteTrigger, listProposals } from "../services/worker/community-triggers.service";
import { authenticateWorker } from "../middlewares/authenticateWorker";

const router = express.Router();

// POST /api/community-triggers/propose
router.post("/propose", authenticateWorker, async (req, res) => {
  const workerId = req.user.id;
  const { title, description, triggerType } = req.body;
  try {
    const proposal = await proposeTrigger(workerId, title, description, triggerType);
    res.json(proposal);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit proposal";
    res.status(400).json({ error: message });
  }
});

// POST /api/community-triggers/vote
router.post("/vote", authenticateWorker, async (req, res) => {
  const workerId = req.user.id;
  const { proposalId } = req.body;
  try {
    const proposal = await voteTrigger(workerId, proposalId);
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

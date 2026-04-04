import { Router } from "express";
import { createPolicy }           from "../services/policy/policy.service.js";
import { calculateWeeklyPremium } from "../services/policy/pricing.service.js";
import { stressMonsoon14Day }     from "../services/policy/underwriting.service.js";
import { authenticateWorker } from "../middlewares/authenticateWorker";
import { getWorkerPolicyOverview } from "../services/policy/policy-read.service";
import { createOrRenewPolicyForWorker } from "../services/policy/policy-create.service";

const router = Router();

router.post("/quote", (req, res) => {
  const result = calculateWeeklyPremium(req.body);
  res.json(result);
});

router.post("/create", (req, res) => {
  const result = createPolicy(req.body);
  if ("error" in result) return res.status(400).json(result);
  res.json(result);
});

router.post("/create-or-renew", authenticateWorker, async (req, res) => {
  try {
    const requestedTier = String(req.body?.tier || "standard").toLowerCase();
    const tier = requestedTier === "basic" || requestedTier === "premium" ? requestedTier : "standard";
    const result = await createOrRenewPolicyForWorker(req.user.id, tier);
    return res.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create policy";
    return res.status(400).json({ success: false, message });
  }
});

router.post("/stress-test", (_req, res) => {
  const result = stressMonsoon14Day({
    coveredWorkers:   5000,
    avgDailyPayout:   280,
    exposureRate:     0.22,
    avgWeeklyPremium: 35,
  });
  res.json(result);
});

router.get("/me", authenticateWorker, async (req, res) => {
  try {
    const workerId = req.user.id;
    let data = await getWorkerPolicyOverview(workerId);

    // Self-heal: if no active policy exists, attempt to create one for this worker.
    if (data && !data.hasPolicy) {
      try {
        await createOrRenewPolicyForWorker(workerId, "standard");
        data = await getWorkerPolicyOverview(workerId);
      } catch (repairErr) {
        const message = repairErr instanceof Error ? repairErr.message : "Policy auto-create failed";
        return res.status(400).json({ success: false, message });
      }
    }

    if (!data) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }
    return res.json(data);
  } catch (err) {
    console.error("[policy/me]", err);
    return res.status(500).json({ success: false, message: "Failed to load policy" });
  }
});

export default router;

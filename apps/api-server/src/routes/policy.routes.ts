import { Router } from "express";
import { createPolicy }           from "../services/policy/policy.service.js";
import { calculateWeeklyPremium } from "../services/policy/pricing.service.js";
import { stressMonsoon14Day }     from "../services/policy/underwriting.service.js";
import { authenticateWorker } from "../middlewares/authenticateWorker";
import { getWorkerPolicyOverview } from "../services/policy/policy-read.service";
import { createOrRenewPolicyForWorker } from "../services/policy/policy-create.service";

const router = Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8001";

router.post("/quote", (req, res) => {
  const result = calculateWeeklyPremium(req.body);
  res.json(result);
});

/**
 * POST /policy/ml-quote
 * Calls Python ML service for XGBoost-based weekly premium adjustment.
 * Falls back gracefully to rule-based quote if ML service is unavailable.
 */
router.post("/ml-quote", async (req, res) => {
  const { zoneId = "BLR_KOR_01", tier = "standard" } = req.body;
  const ruleBasedQuote = calculateWeeklyPremium({ zoneId, tier });

  try {
    const mlRes = await fetch(`${ML_SERVICE_URL}/pricing/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone_id: zoneId, tier }),
      signal: AbortSignal.timeout(3000),
    });
    if (!mlRes.ok) throw new Error(`ML service returned ${mlRes.status}`);
    const mlData = await mlRes.json() as {
      weekly_adjustment: number;
      zone_label: string;
      zone_disruption_rate: number;
      risk_tier: string;
      zone_safety_note: string;
      features_used: Record<string, number>;
      model: string;
    };

    return res.json({
      ...ruleBasedQuote,
      ml_adjustment: mlData.weekly_adjustment,
      ml_adjusted_premium: ruleBasedQuote.weeklyPremium + mlData.weekly_adjustment,
      zone_label: mlData.zone_label,
      zone_disruption_rate: mlData.zone_disruption_rate,
      risk_tier: mlData.risk_tier,
      zone_safety_note: mlData.zone_safety_note,
      features_used: mlData.features_used,
      model: mlData.model,
      source: "ml",
    });
  } catch {
    // ML service unavailable — return rule-based with note
    return res.json({
      ...ruleBasedQuote,
      ml_adjustment: 0,
      ml_adjusted_premium: ruleBasedQuote.weeklyPremium,
      zone_safety_note: "ML model loading — zone safety discount applied at next sync.",
      model: "rule_based_fallback",
      source: "rule_based",
    });
  }
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

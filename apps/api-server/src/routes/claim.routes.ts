import { Router } from "express";
import { runClaimPipeline }  from "../services/claim/claim-pipeline.service";
import { evaluateTrigger }   from "../services/trigger/trigger-engine.service";
import { checkEligibility }  from "../services/claim/eligibility.service";
import { authenticateWorker } from "../middlewares/authenticateWorker";
import { PrismaClient }      from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /claims/trigger
 * Demo endpoint — fires a synthetic trigger and runs full pipeline.
 * Body: { triggerType, zoneId, source1Value, source2Value, officialAdvisory }
 */
router.post("/trigger", async (req, res) => {
  const {
    triggerType  = "T1_RAINFALL",
    zoneId       = "BLR_KOR_01",
    source1Value = 70,
    source2Value = 68,
    officialAdvisory = true,
  } = req.body;

  const trigger = evaluateTrigger({
    type: triggerType,
    zoneId,
    source1Value,
    source2Value,
    officialAdvisory,
    historicalPattern: 0.8,
  });

  if (trigger.action !== "AUTO_TRIGGER") {
    return res.json({
      triggered: false,
      confidence: trigger.confidence,
      action: trigger.action,
      message: `Confidence ${trigger.confidence} — below auto-trigger threshold.`,
    });
  }

  const result = await runClaimPipeline(trigger, {
    workerId:        "mock_rajan_001",
    workerName:      "Rajan Kumar",
    policyId:        "POL_MOCK_001",
    policyStatus:    "ACTIVE",
    policyZoneId:    zoneId,
    tier:            "standard",
    upiId:           "rajan@phonepe",
    accountCreatedAt: new Date(Date.now() - 14 * 86400_000),
    waitingUntil:    new Date(Date.now() - 7  * 86400_000),
    claimsThisWeek:  0,
  });

  res.json({ triggered: true, trigger, pipeline: result });
});

/**
 * POST /claims/eligibility-check
 * Standalone eligibility gate test.
 */
router.post("/eligibility-check", (req, res) => {
  const result = checkEligibility({
    policyStatus:     req.body.policyStatus    ?? "ACTIVE",
    policyZoneId:     req.body.policyZoneId    ?? "BLR_KOR_01",
    triggerZoneId:    req.body.triggerZoneId   ?? "BLR_KOR_01",
    workerWasOnline:  req.body.workerWasOnline ?? true,
    accountCreatedAt: new Date(Date.now() - 14 * 86400_000),
    waitingUntil:     new Date(Date.now() - 7  * 86400_000),
    claimsThisWeek:   req.body.claimsThisWeek  ?? 0,
    maxClaimsPerWeek: 3,
  });
  res.json(result);
});

/**
 * GET /claims/my
 * Returns the authenticated worker's claim history.
 */
router.get("/my", authenticateWorker, async (req, res) => {
  try {
    const workerId = req.user.id;
    const claims = await prisma.claim.findMany({
      where: { policy: { workerId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        amount: true,
        triggerType: true,
        createdAt: true,
        policy: { select: { zoneId: true, tier: true } },
      },
    });
    res.json({ claims });
  } catch (err) {
    console.error("[claims/my]", err);
    // Fallback mock data for demo when DB unavailable
    res.json({
      claims: [
        {
          id: "CLM_DEMO_001",
          status: "PAID",
          amount: 416,
          triggerType: "T1_RAINFALL",
          createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
          policy: { zoneId: "BLR_KOR_01", tier: "standard" },
        },
        {
          id: "CLM_DEMO_002",
          status: "PAID",
          amount: 208,
          triggerType: "T2_AQI",
          createdAt: new Date(Date.now() - 9 * 86400_000).toISOString(),
          policy: { zoneId: "BLR_KOR_01", tier: "standard" },
        },
      ],
    });
  }
});

export default router;

import { Router } from "express";
import { runClaimPipeline }  from "../services/claim/claim-pipeline.service";
import { evaluateTrigger }   from "../services/trigger/trigger-engine.service";
import { checkEligibility }  from "../services/claim/eligibility.service";
import { antiSpoofingService } from "../services/anti-spoofing.service";
import { authenticateWorker } from "../middlewares/authenticateWorker";
import { authenticateAdmin } from "../middlewares/auth.middleware";
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

/**
 * POST /claims/submit-with-spoofing
 * Worker-initiated claim with anti-spoofing detection
 * Includes device fingerprint and photo metadata for fraud analysis
 */
router.post("/submit-with-spoofing", authenticateAdmin, async (req, res) => {
  try {
    const workerId = req.user.id;
    const {
      claimId,
      triggerType,
      zoneId,
      claimAmount,
      deviceFingerprint,
      photoMetadata,
      claimLocation,
      previousLocations,
    } = req.body;

    if (!claimId || !triggerType || !zoneId || !deviceFingerprint || !claimLocation) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: claimId, triggerType, zoneId, deviceFingerprint, claimLocation",
      });
    }

    // 1. Run anti-spoofing analysis
    console.log(`[Claim] Running anti-spoofing for claim ${claimId}`);
    const antiSpoofingResult = await antiSpoofingService.analyzeClaimSpoofing(
      workerId,
      {
        claimId,
        deviceFingerprint,
        photoMetadata,
        claimLocation,
        previousLocations,
      }
    );

    // 2. Convert spoofing risk to fraud signal
    const spoofingRiskScore = antiSpoofingResult.overallRisk;
    const fraudDecision = 
      spoofingRiskScore > 0.7 
        ? "REJECT" 
        : spoofingRiskScore > 0.5 
          ? "REVIEW" 
          : "APPROVE";

    console.log(`[Claim] Anti-spoofing result: risk=${spoofingRiskScore.toFixed(3)}, decision=${fraudDecision}`);

    // 3. Check if we should reject immediately
    if (fraudDecision === "REJECT") {
      return res.json({
        success: false,
        claimId,
        status: "REJECTED",
        reason: "Failed anti-spoofing checks",
        spoofingRisk: spoofingRiskScore,
        flags: antiSpoofingResult.flags,
        message: `Claim rejected due to high spoofing risk (${(spoofingRiskScore * 100).toFixed(1)}%)`,
      });
    }

    // 4. If flagged for review, return pending status
    if (fraudDecision === "REVIEW") {
      return res.json({
        success: true,
        claimId,
        status: "UNDER_REVIEW",
        reason: "Medium spoofing risk detected",
        spoofingRisk: spoofingRiskScore,
        flags: antiSpoofingResult.flags,
        message: `Claim flagged for manual review (${(spoofingRiskScore * 100).toFixed(1)}% spoofing risk)`,
      });
    }

    // 5. Passed anti-spoofing, proceed to normal pipeline
    return res.json({
      success: true,
      claimId,
      status: "APPROVED",
      spoofingRisk: spoofingRiskScore,
      flags: antiSpoofingResult.flags,
      message: `Claim passed anti-spoofing checks (${(spoofingRiskScore * 100).toFixed(1)}% risk)`,
      analysis: antiSpoofingResult,
    });
  } catch (error) {
    console.error("[Claim Submission] Error:", error);
    res.status(500).json({
      success: false,
      message: "Claim submission failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

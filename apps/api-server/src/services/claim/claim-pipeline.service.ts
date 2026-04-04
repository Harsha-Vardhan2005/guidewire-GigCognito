import { logAudit } from "../audit-log.service";
/**
 * Full end-to-end pipeline:
 * Trigger event → eligibility → fraud → payout → notify
 *
 * Called by trigger-poller after AUTO_TRIGGER decision.
 * Also exposed via POST /claims/trigger for demo/testing.
 */

import { checkEligibility }  from "./eligibility.service";
import { processClaim }      from "./claim.service";
import type { TriggerDecision } from "../trigger/trigger-engine.service";
import type { PremiumTier }     from "@gigshield/shared-config";

// Stubs for PolicyCenter and BillingCenter logging
async function logToPolicyCenter(claimId: string, detail: object) {
  // TODO: Integrate with PolicyCenter
  console.log(`[PolicyCenter] Logged payout for claim ${claimId}`);
}
async function logToBillingCenter(claimId: string, detail: object) {
  // TODO: Integrate with BillingCenter
  console.log(`[BillingCenter] Reconciled payout for claim ${claimId}`);
}

export interface WorkerPolicyContext {
  workerId:        string;
  workerName:      string;
  policyId:        string;
  policyStatus:    string;
  policyZoneId:    string;
  tier:            PremiumTier;
  upiId:           string;
  accountCreatedAt: Date;
  waitingUntil:    Date;
  claimsThisWeek:  number;
}

export interface PipelineResult {
  stage:   "ELIGIBILITY" | "FRAUD" | "PAYOUT" | "COMPLETE";
  success: boolean;
  detail:  object;
}

/**
 * Zero-touch parametric settlement pipeline:
 * 1. Confirm event threshold via Weather API (already done in trigger-poller)
 * 2. Check worker eligibility: active policy, correct zone, no duplicate claim
 * 3. Calculate payout: fixed amount per day × trigger days
 * 4. Fraud check (GPS, signals) BEFORE payment
 * 5. Initiate transfer
 * 6. Update record, log to PolicyCenter and BillingCenter
 * 7. Rollback if fraud or transfer fails
 * 8. All steps are automated, zero worker action
 */
export async function runClaimPipeline(
  trigger:  TriggerDecision,
  worker:   WorkerPolicyContext,
): Promise<PipelineResult> {
  console.log(`[Pipeline] Starting for worker=${worker.workerId} trigger=${trigger.type} zone=${trigger.zoneId}`);

  // 1. Eligibility check (active policy, correct zone, no duplicate claim)
  // Audit: claim initiation
  logAudit("CLAIM_INITIATED", worker.workerId, `${worker.workerId}:${trigger.type}:${trigger.zoneId}:${trigger.payoutHours}`, {
    trigger,
    worker,
  });
  const elig = checkEligibility({
    policyStatus:     worker.policyStatus,
    policyZoneId:     worker.policyZoneId,
    triggerZoneId:    trigger.zoneId,
    workerWasOnline:  true, // TODO: Replace with real online status if available
    accountCreatedAt: worker.accountCreatedAt,
    waitingUntil:     worker.waitingUntil,
    claimsThisWeek:   worker.claimsThisWeek,
    maxClaimsPerWeek: 3,
  });
  if (!elig.eligible) {
    console.log(`[Pipeline] INELIGIBLE: ${elig.reason}`);
    return { stage: "ELIGIBILITY", success: false, detail: elig };
  }

  // 2. Fraud check (GPS, signals) BEFORE payment
  // TODO: Replace mock signals with real GPS/fraud signals from worker device
  const fraudSignals = {
    gpsInZone:             true, // TODO: Validate GPS in zone
    locationContinuous:    true,
    fingerprintConsistent: true,
    ipLocationMatch:       true,
    platformWasOnline:     true,
    deviceHasMotion:       true,
    noActiveDeliveries:    true,
    accountOlderThan7Days: true,
  };

  // 3. Calculate payout: fixed amount per day × trigger days (handled in processClaim)
  // 4. Initiate transfer, update record, log to PolicyCenter/BillingCenter, rollback if needed
  const result = await processClaim({
    workerId:    worker.workerId,
    policyId:    worker.policyId,
    zoneId:      trigger.zoneId,
    triggerType: trigger.type,
    confidence:  trigger.confidence,
    payoutHours: trigger.payoutHours,
    tier:        worker.tier,
    upiId:       worker.upiId,
    workerName:  worker.workerName,
    signals:     fraudSignals,
    zoneBurst: {
      zoneId:              trigger.zoneId,
      claimsInWindow:      12, // TODO: Replace with real-time stats
      windowMinutes:       20,
      newAccounts7d:       2,
      sharedFingerprints:  1,
      expectedRate:        15,
    },
  });

  // 5. Log to PolicyCenter and BillingCenter (stubbed)
  await logToPolicyCenter(result.claimId, result);
  await logToBillingCenter(result.claimId, result);

  // 6. Return result (zero-touch, all steps automated)
  console.log(`[Pipeline] DONE claimId=${result.claimId} status=${result.status} payout=₹${result.immediateAmt}`);
  return { stage: "COMPLETE", success: result.status !== "REJECTED", detail: result };
}

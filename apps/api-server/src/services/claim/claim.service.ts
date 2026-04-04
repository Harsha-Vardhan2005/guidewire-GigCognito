import { logAudit } from "../audit-log.service";
import { evaluateFraud, type FraudSignals } from "../fraud/fraud-score.service";
import { detectRing, type ZoneClaimBurst }  from "../fraud/ring-detection.service";
import { calcPayoutAmount, buildPayoutRecord } from "../payout/payout.service";
import { initiateUPIPayout }                from "../payout/razorpay.service";
import { shouldRetry, nextRetryDelay, markRolledBack } from "../payout/rollback.service";
import { sendClaimNotification }            from "../notification/push.service";
import type { PremiumTier }                 from "@gigshield/shared-config";

export interface ClaimRequest {
  workerId:    string;
  policyId:    string;
  zoneId:      string;
  triggerType: string;
  confidence:  number;
  payoutHours: number;
  tier:        PremiumTier;
  upiId:       string;
  workerName:  string;
  signals:     FraudSignals;
  zoneBurst:   ZoneClaimBurst;
}

export interface ClaimResult {
  claimId:       string;
  status:        string;
  payoutAmount:  number;
  immediateAmt:  number;
  heldAmt:       number;
  fraudAction:   string;
  fraudSignals:  number;
  message:       string;
  rzpPayoutId?:  string;
  utr?:          string;
}

/**
 * processClaim: Executes zero-touch parametric settlement for a claim.
 * Steps:
 * 1. Check for zone circuit breaker (anti-fraud ring detection)
 * 2. Run fraud check (GPS, signals) BEFORE payout
 * 3. If fraud detected, reject or send for review (no payout)
 * 4. Calculate payout (fixed per day × trigger days)
 * 5. Initiate transfer (UPI payout)
 * 6. Rollback if transfer fails
 * 7. Notify worker (zero-touch)
 */
export async function processClaim(req: ClaimRequest): Promise<ClaimResult> {
  const claimId = `CLM_${Date.now()}`;

  // 1. Zone circuit breaker (anti-fraud ring detection)
  const ring = detectRing(req.zoneBurst);
  if (ring.action === "CIRCUIT_BREAK") {
    logAudit("FRAUD_FLAGGED", req.workerId, claimId, { reason: "Zone circuit breaker", ring });
    return {
      claimId, status: "CIRCUIT_BREAK",
      payoutAmount: 0, immediateAmt: 0, heldAmt: 0,
      fraudAction: "CIRCUIT_BREAK",
      fraudSignals: 0,
      message: `Zone circuit breaker tripped: ${ring.flags.join("; ")}`,
    };
  }

  // 2. Fraud check (GPS, signals) BEFORE payout
  const fraud = evaluateFraud(req.signals);
  if (fraud.action === "REJECT") {
    logAudit("CLAIM_REJECTED", req.workerId, claimId, { reason: fraud.message, fraud });
    return {
      claimId, status: "REJECTED",
      payoutAmount: 0, immediateAmt: 0, heldAmt: 0,
      fraudAction: fraud.action,
      fraudSignals: fraud.consistent,
      message: fraud.message,
    };
  }
  if (fraud.action === "HUMAN_REVIEW") {
    logAudit("ADMIN_REVIEW", req.workerId, claimId, { reason: fraud.message, fraud });
    return {
      claimId, status: "UNDER_REVIEW",
      payoutAmount: 0, immediateAmt: 0, heldAmt: 0,
      fraudAction: fraud.action,
      fraudSignals: fraud.consistent,
      message: fraud.message,
    };
  }

  // 3. Calculate payout (fixed per day × trigger days)
  const totalPayout   = calcPayoutAmount(req.tier, req.payoutHours);
  const immediateAmt  = Math.round(totalPayout * (fraud.payoutPct / 100));
  const heldAmt       = totalPayout - immediateAmt;

  // 4. Initiate transfer (UPI payout)
  const payoutRecord = buildPayoutRecord({
    workerId: req.workerId,
    claimId,
    amount:   immediateAmt,
    upiId:    req.upiId,
  });

  let rzpPayoutId: string | undefined;
  let utr: string | undefined;
  let retryState = { attempts: 0, rolledBack: false };

  // 5. Retry payout, rollback if fails
  while (shouldRetry(retryState)) {
    try {
      const result = await initiateUPIPayout({
        amount:  immediateAmt,
        upiId:   req.upiId,
        claimId,
      });
      rzpPayoutId = result.id;
      utr         = result.utr;
      logAudit("CLAIM_PAID", req.workerId, claimId, { amount: immediateAmt, payoutRecord, rzpPayoutId, utr });
      break;
    } catch (err) {
      retryState.attempts++;
      if (!shouldRetry(retryState)) {
        markRolledBack(payoutRecord, String(err));
        logAudit("CLAIM_ROLLED_BACK", req.workerId, claimId, { error: String(err), payoutRecord });
        await sendClaimNotification({
          workerName: req.workerName,
          amount:     immediateAmt,
          upiId:      req.upiId,
          status:     "ROLLBACK",
          claimId,
        });
        return {
          claimId, status: "PAYOUT_FAILED",
          payoutAmount: totalPayout, immediateAmt, heldAmt,
          fraudAction: fraud.action,
          fraudSignals: fraud.consistent,
          message: `Payout of ₹${immediateAmt} is being processed — will reflect within 24 hours.`,
        };
      }
      await new Promise(r => setTimeout(r, nextRetryDelay(retryState.attempts - 1)));
    }
  }

  // 6. Notify worker (zero-touch)
  await sendClaimNotification({
    workerName: req.workerName,
    amount:     immediateAmt,
    upiId:      req.upiId,
    status:     fraud.action === "PROVISIONAL" ? "PROVISIONAL" : "APPROVED",
    claimId,
    heldAmt:    heldAmt > 0 ? heldAmt : undefined,
  });
  logAudit("CLAIM_APPROVED", req.workerId, claimId, {
    payoutAmount: totalPayout,
    immediateAmt,
    heldAmt,
    fraudAction: fraud.action,
    fraudSignals: fraud.consistent,
    rzpPayoutId,
    utr,
  });

  // 7. Return result
  return {
    claimId,
    status:       fraud.action === "PROVISIONAL" ? "PROVISIONAL" : "APPROVED",
    payoutAmount: totalPayout,
    immediateAmt,
    heldAmt,
    fraudAction:  fraud.action,
    fraudSignals: fraud.consistent,
    message:      fraud.message,
    rzpPayoutId,
    utr,
  };
}

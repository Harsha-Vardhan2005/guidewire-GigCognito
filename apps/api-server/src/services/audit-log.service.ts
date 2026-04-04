// Centralized audit logging for all policy and claim actions (IRDAI-aligned)
import fs from "fs";
import path from "path";

const AUDIT_LOG_PATH = path.resolve(__dirname, "../../../logs/audit.log");

export type AuditAction =
  | "POLICY_CREATED"
  | "POLICY_EXPIRED"
  | "POLICY_CANCELLED"
  | "CLAIM_INITIATED"
  | "CLAIM_APPROVED"
  | "CLAIM_REJECTED"
  | "CLAIM_PAID"
  | "CLAIM_ROLLED_BACK"
  | "FRAUD_FLAGGED"
  | "PAYOUT_FAILED"
  | "ADMIN_REVIEW"
  | "APPEAL_SUBMITTED";

export interface AuditLogEntry {
  timestamp: string;
  action: AuditAction;
  actor: string; // workerId, adminId, or system
  entityId: string; // policyId or claimId
  detail: object;
}

export function logAudit(action: AuditAction, actor: string, entityId: string, detail: object = {}) {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    actor,
    entityId,
    detail,
  };
  const line = JSON.stringify(entry) + "\n";
  fs.mkdirSync(path.dirname(AUDIT_LOG_PATH), { recursive: true });
  fs.appendFileSync(AUDIT_LOG_PATH, line, { encoding: "utf8" });
}

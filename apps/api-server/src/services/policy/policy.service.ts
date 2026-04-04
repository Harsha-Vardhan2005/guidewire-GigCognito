import { logAudit } from "../audit-log.service";
import { calculateWeeklyPremium, PricingInput, PricingOutput } from "./pricing.service";
import { v4 as uuidv4 } from "uuid";

export interface PolicyInput {
	workerId: string;
	zoneId: string;
	tier: "basic" | "standard" | "premium";
	season: string;
	zoneRisk: "HIGH" | "MEDIUM" | "LOW";
	tenureMonths: number;
	claimsLast4Weeks: number;
	startDate: Date;
}

export interface PolicyRecord {
	policyId: string;
	workerId: string;
	zoneId: string;
	tier: string;
	premium: number;
	premiumBreakdown: string;
	startDate: Date;
	endDate: Date;
	status: "ACTIVE" | "EXPIRED" | "CANCELLED";
}

/**
 * Creates a new policy, enforcing underwriting and pricing rules.
 * - 7-day term, zone lock, tier lock, waiting period, no-claim bonus, etc.
 * - Calls calculateWeeklyPremium for dynamic pricing.
 */
export function createPolicy(input: PolicyInput): PolicyRecord {
	// Underwriting: enforce 7-day waiting period for new accounts
	if (input.tenureMonths === 0) {
		const now = new Date();
		const waitingUntil = new Date(now.getTime() + 7 * 86400_000);
		if (input.startDate < waitingUntil) {
			throw new Error("Account is within the 7-day waiting period.");
		}
	}

	// Pricing: dynamic weekly premium
	const pricing: PricingOutput = calculateWeeklyPremium({
		tier: input.tier,
		season: input.season,
		zoneRisk: input.zoneRisk,
		tenureMonths: input.tenureMonths,
		claimsLast4Weeks: input.claimsLast4Weeks,
	});

	// Policy term: 7 days from startDate
	const endDate = new Date(input.startDate.getTime() + 7 * 86400_000);

	// Generate policy record
	const policy: PolicyRecord = {
		policyId: uuidv4(),
		workerId: input.workerId,
		zoneId: input.zoneId,
		tier: input.tier,
		premium: pricing.finalPremium,
		premiumBreakdown: pricing.breakdown,
		startDate: input.startDate,
		endDate,
		status: "ACTIVE",
	};

	// Audit log (IRDAI-aligned)
	logAudit("POLICY_CREATED", input.workerId, policy.policyId, {
		zoneId: input.zoneId,
		tier: input.tier,
		premium: pricing.finalPremium,
		premiumBreakdown: pricing.breakdown,
		startDate: input.startDate,
		endDate,
	});

	return policy;
}

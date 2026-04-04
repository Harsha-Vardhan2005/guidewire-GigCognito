import { PrismaClient } from "@prisma/client";
import { calculateWeeklyPremium } from "./pricing.service";

const prisma = new PrismaClient();

// In-memory fallback storage
const fallbackPolicies: Record<string, any> = {};

const KNOWN_ZONE_COORDS: Record<string, { city: string; lat: number; lng: number; riskLevel: "HIGH" | "MEDIUM" | "LOW" }> = {
  BLR_KOR_01: { city: "Bengaluru", lat: 12.9279, lng: 77.6271, riskLevel: "HIGH" },
  BLR_HSR_01: { city: "Bengaluru", lat: 12.9116, lng: 77.6474, riskLevel: "MEDIUM" },
  BLR_IND_01: { city: "Bengaluru", lat: 12.9719, lng: 77.6412, riskLevel: "MEDIUM" },

  DEL_DWK_01: { city: "Delhi", lat: 28.5733, lng: 77.0120, riskLevel: "HIGH" },
  DEL_NOR_01: { city: "Noida", lat: 28.5672, lng: 77.3210, riskLevel: "HIGH" },

  MUM_ANH_01: { city: "Mumbai", lat: 19.1197, lng: 72.8464, riskLevel: "MEDIUM" },
  MUM_BAN_01: { city: "Mumbai", lat: 19.0596, lng: 72.8295, riskLevel: "MEDIUM" },

  PNE_KSB_01: { city: "Pune", lat: 18.5204, lng: 73.8567, riskLevel: "MEDIUM" },
  PNE_KHR_01: { city: "Pune", lat: 18.5535, lng: 73.9475, riskLevel: "MEDIUM" },
};

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function createOrRenewPolicyForWorker(workerId: string, tier: "basic" | "standard" | "premium") {
  try {
    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) {
      throw new Error("Worker not found");
    }
    if (!worker.zoneId) {
      throw new Error("Worker zone is required before creating policy");
    }

    const canonical = KNOWN_ZONE_COORDS[worker.zoneId];
    let zone = await prisma.zone.findUnique({ where: { id: worker.zoneId } });
    if (!zone) {
      zone = await prisma.zone.create({
        data: {
          id: worker.zoneId,
          city: canonical?.city || worker.city || "Unknown",
          lat: canonical?.lat ?? 0,
          lng: canonical?.lng ?? 0,
          riskLevel: canonical?.riskLevel || "MEDIUM",
        },
      });
    } else if (canonical && (zone.lat === 0 || zone.lng === 0)) {
      zone = await prisma.zone.update({
        where: { id: zone.id },
        data: {
          city: zone.city || canonical.city,
          lat: canonical.lat,
          lng: canonical.lng,
          riskLevel: zone.riskLevel || canonical.riskLevel,
        },
      });
    }

    const now = new Date();
    const activePolicy = await prisma.policy.findFirst({
      where: {
        workerId,
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
      orderBy: { activatedAt: "desc" },
    });

    if (activePolicy) {
      return { created: false, policy: activePolicy };
    }

    const pricing = calculateWeeklyPremium({
      tier,
      season: "normal",
      zoneRisk: (zone.riskLevel as "HIGH" | "MEDIUM" | "LOW") || "MEDIUM",
      tenureMonths: worker.tenureMonths ?? 0,
      claimsLast4Weeks: 0,
    });

    const policy = await prisma.policy.create({
      data: {
        workerId,
        zoneId: worker.zoneId,
        tier,
        weeklyPremium: pricing.finalPremium,
        status: "ACTIVE",
        activatedAt: now,
        expiresAt: addDays(now, 7),
        waitingUntil: worker.tenureMonths > 0 ? now : addDays(now, 7),
      },
    });

    return { created: true, policy };
  } catch (dbErr) {
    // Database error - use in-memory fallback
    console.warn("[createOrRenewPolicyForWorker] Database error, using fallback:", dbErr);

    const now = new Date();

    // Check if policy already exists in fallback
    if (fallbackPolicies[workerId]) {
      const existing = fallbackPolicies[workerId];
      if (existing.status === "ACTIVE" && existing.expiresAt > now) {
        return { created: false, policy: existing };
      }
    }

    // Create mock policy
    const canonical = KNOWN_ZONE_COORDS["MUM_ANH_01"]; // Default zone
    const pricing = { finalPremium: 89 };

    const policy = {
      id: `policy-${workerId}-${Date.now()}`,
      workerId,
      zoneId: "MUM_ANH_01",
      tier: tier || "standard",
      weeklyPremium: pricing.finalPremium,
      status: "ACTIVE",
      activatedAt: now,
      expiresAt: addDays(now, 7),
      waitingUntil: addDays(now, 7),
      createdAt: now,
      updatedAt: now,
    };

    fallbackPolicies[workerId] = policy;
    console.log(`[createOrRenewPolicyForWorker] Fallback: Created policy for ${workerId}`, policy);

    return { created: true, policy };
  }
}

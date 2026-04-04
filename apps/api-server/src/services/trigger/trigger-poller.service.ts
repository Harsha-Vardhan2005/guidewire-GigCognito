import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { checkRainfallTrigger } from "./rainfall-trigger.service";
import { checkAQITrigger }      from "./aqi-trigger.service";
import { checkHeatwaveTrigger } from "./heatwave-trigger.service";
import { checkCurfewTrigger }   from "./curfew-trigger.service";
import { checkFestivalTrigger } from "./festival-trigger.service";
import { runClaimPipeline }     from "../claim/claim-pipeline.service";

const prisma = new PrismaClient();

const ACTIVE_ZONES = [
  { id: "BLR_KOR_01", lat: 12.9279, lng: 77.6271 },
  { id: "DEL_DWK_01", lat: 28.5921, lng: 77.0460 },
  { id: "MUM_ANH_01", lat: 19.1136, lng: 72.8697 },
];

type ActivePolicyRecord = {
  id: string;
  zoneId: string;
  tier: "basic" | "standard" | "premium";
  status: string;
  waitingUntil: Date;
  worker: {
    id: string;
    name: string | null;
    upiId: string | null;
    createdAt: Date;
    claims: { id: string }[];
  };
};

async function getActivePoliciesByZone(zoneId: string): Promise<ActivePolicyRecord[]> {
  try {
    return prisma.policy.findMany({
      where: {
        zoneId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      include: {
        worker: {
          include: {
            claims: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
              select: { id: true },
            },
          },
        },
      },
    }) as unknown as ActivePolicyRecord[];
  } catch (dbErr) {
    console.warn("[getActivePoliciesByZone] Database error for zone", zoneId, "returning empty fallback:", dbErr);
    // Return empty array - poller will skip this zone
    return [];
  }
}

export function startTriggerPoller() {
  cron.schedule("*/15 * * * *", async () => {
    console.log("[TriggerPoller] Running zone checks", new Date().toISOString());
    for (const zone of ACTIVE_ZONES) {
      const activePolicies = await getActivePoliciesByZone(zone.id);
      if (!activePolicies.length) {
        continue;
      }

      const rain = await checkRainfallTrigger(zone);
      if (rain?.action === "AUTO_TRIGGER") {
        for (const p of activePolicies) {
          if (!p.worker.upiId) continue;
          await runClaimPipeline(rain, {
            workerId: p.worker.id,
            workerName: p.worker.name || "Worker",
            policyId: p.id,
            policyStatus: p.status,
            policyZoneId: p.zoneId,
            tier: p.tier,
            upiId: p.worker.upiId,
            accountCreatedAt: p.worker.createdAt,
            waitingUntil: p.waitingUntil,
            claimsThisWeek: p.worker.claims.length,
          });
        }
      }

      const aqi = await checkAQITrigger(zone);
      if (aqi?.action === "AUTO_TRIGGER") {
        for (const p of activePolicies) {
          if (!p.worker.upiId) continue;
          await runClaimPipeline(aqi, {
            workerId: p.worker.id,
            workerName: p.worker.name || "Worker",
            policyId: p.id,
            policyStatus: p.status,
            policyZoneId: p.zoneId,
            tier: p.tier,
            upiId: p.worker.upiId,
            accountCreatedAt: p.worker.createdAt,
            waitingUntil: p.waitingUntil,
            claimsThisWeek: p.worker.claims.length,
          });
        }
      }

      // Heatwave
      const heat = await checkHeatwaveTrigger(zone);
      if (heat?.action === "AUTO_TRIGGER") {
        for (const p of activePolicies) {
          if (!p.worker.upiId) continue;
          await runClaimPipeline(heat, {
            workerId: p.worker.id,
            workerName: p.worker.name || "Worker",
            policyId: p.id,
            policyStatus: p.status,
            policyZoneId: p.zoneId,
            tier: p.tier,
            upiId: p.worker.upiId,
            accountCreatedAt: p.worker.createdAt,
            waitingUntil: p.waitingUntil,
            claimsThisWeek: p.worker.claims.length,
          });
        }
      }

      // Curfew
      const curfew = await checkCurfewTrigger(zone);
      if (curfew?.action === "AUTO_TRIGGER") {
        for (const p of activePolicies) {
          if (!p.worker.upiId) continue;
          await runClaimPipeline(curfew, {
            workerId: p.worker.id,
            workerName: p.worker.name || "Worker",
            policyId: p.id,
            policyStatus: p.status,
            policyZoneId: p.zoneId,
            tier: p.tier,
            upiId: p.worker.upiId,
            accountCreatedAt: p.worker.createdAt,
            waitingUntil: p.waitingUntil,
            claimsThisWeek: p.worker.claims.length,
          });
        }
      }

      // Festival Blockage
      const festival = await checkFestivalTrigger(zone);
      if (festival?.action === "AUTO_TRIGGER") {
        for (const p of activePolicies) {
          if (!p.worker.upiId) continue;
          await runClaimPipeline(festival, {
            workerId: p.worker.id,
            workerName: p.worker.name || "Worker",
            policyId: p.id,
            policyStatus: p.status,
            policyZoneId: p.zoneId,
            tier: p.tier,
            upiId: p.worker.upiId,
            accountCreatedAt: p.worker.createdAt,
            waitingUntil: p.waitingUntil,
            claimsThisWeek: p.worker.claims.length,
          });
        }
      }
    }
  });
  console.log("[TriggerPoller] Started — polling every 15 min");
}

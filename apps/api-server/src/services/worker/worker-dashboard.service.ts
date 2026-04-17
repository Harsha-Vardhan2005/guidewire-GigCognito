// Worker Transparency Dashboard Service
// Returns real-time trigger data, payout pool status, and worker risk signals
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { checkRainfallTrigger } from "../trigger/rainfall-trigger.service";
import { checkAQITrigger } from "../trigger/aqi-trigger.service";
import { checkHeatwaveTrigger } from "../trigger/heatwave-trigger.service";
import { checkCurfewTrigger } from "../trigger/curfew-trigger.service";
import { checkFestivalTrigger } from "../trigger/festival-trigger.service";

const prisma = new PrismaClient();
const OWM_KEY = process.env.OWM_API_KEY;
const WAQI_TOKEN = process.env.WAQI_TOKEN;

const KNOWN_ZONE_COORDS: Record<string, { city: string; lat: number; lng: number; riskLevel: "HIGH" | "MEDIUM" | "LOW" }> = {
  BLR_KOR_01: { city: "Bengaluru", lat: 12.9279, lng: 77.6271, riskLevel: "HIGH" },
  BLR_HSR_01: { city: "Bengaluru", lat: 12.9116, lng: 77.6474, riskLevel: "MEDIUM" },
  BLR_IND_01: { city: "Bengaluru", lat: 12.9784, lng: 77.6408, riskLevel: "MEDIUM" },
  DEL_DWK_01: { city: "Delhi", lat: 28.5921, lng: 77.046, riskLevel: "HIGH" },
  DEL_NOR_01: { city: "Delhi", lat: 28.5672, lng: 77.321, riskLevel: "HIGH" },
  MUM_ANH_01: { city: "Mumbai", lat: 19.1136, lng: 72.8697, riskLevel: "MEDIUM" },
  MUM_BAN_01: { city: "Mumbai", lat: 19.0596, lng: 72.8295, riskLevel: "MEDIUM" },
  PNE_KSB_01: { city: "Pune", lat: 18.5204, lng: 73.8567, riskLevel: "MEDIUM" },
  PNE_KHR_01: { city: "Pune", lat: 18.5519, lng: 73.9477, riskLevel: "MEDIUM" },
};

function triggerTypeToLabel(type: string): string {
  switch (type) {
    case "T1_RAINFALL":
      return "Heavy Rainfall Alert";
    case "T2_AQI":
      return "AQI approaching threshold";
    case "T3_FLOOD":
      return "Flooding risk advisory";
    case "T4_HEATWAVE":
      return "Heatwave advisory";
    case "T5_CURFEW":
      return "Curfew disruption advisory";
    case "T6_FESTIVAL":
      return "Festival blockage advisory";
    default:
      return type;
  }
}

function getSeasonContextFromTypes(types: string[]): string {
  if (types.some((t) => t === "T2_AQI")) return "AQI season";
  if (types.some((t) => t === "T1_RAINFALL" || t === "T3_FLOOD")) return "Monsoon season";
  if (types.some((t) => t === "T4_HEATWAVE")) return "Heatwave season";
  if (types.some((t) => t === "T5_CURFEW" || t === "T6_FESTIVAL")) return "Civic disruption season";
  return "Risk conditions monitored";
}

async function getLiveActiveTriggerTypes(zone: { id: string; lat: number; lng: number } | null): Promise<Set<string>> {
  const live = new Set<string>();
  if (!zone) return live;

  const [rain, aqi, heat, curfew, festival] = await Promise.all([
    checkRainfallTrigger(zone),
    checkAQITrigger(zone),
    checkHeatwaveTrigger(zone),
    checkCurfewTrigger(zone),
    checkFestivalTrigger(zone),
  ]);

  for (const decision of [rain, aqi, heat, curfew, festival]) {
    if (decision && decision.action === "AUTO_TRIGGER") {
      live.add(decision.type);
    }
  }

  if (live.has("T1_RAINFALL")) {
    live.add("T3_FLOOD");
  }

  return live;
}

export async function getWorkerDashboard(workerId: string, zoneId: string) {
  // Fetch worker and zone info with fallback
  let worker: any;
  let dbZone: any = null;
  let payouts: any[] = [];
  let claims: any[] = [];
  let recentTriggers: any[] = [];

  try {
    worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) return null;

    const finalZoneId = worker.zoneId || zoneId;
    if (worker.zoneId) {
      dbZone = await prisma.zone.findUnique({ where: { id: worker.zoneId } });
    }

    // Fetch recent payouts (last 3)
    payouts = await prisma.payout.findMany({
      where: { workerId },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Fetch recent claims (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    claims = await prisma.claim.findMany({
      where: { workerId, createdAt: { gte: weekAgo } },
      orderBy: { createdAt: "desc" },
    });

    // Fetch recent trigger events for this zone (last 24h)
    const triggerWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    recentTriggers = await prisma.triggerEvent.findMany({
      where: {
        zoneId: finalZoneId,
        firedAt: { gte: triggerWindowStart },
      },
      orderBy: { firedAt: "desc" },
      take: 8,
    });
  } catch (dbErr) {
    console.warn("[getWorkerDashboard] Database error, using fallback:", dbErr);
    // Create mock worker object for fallback
    worker = {
      id: workerId,
      name: "Worker",
      city: "Unknown",
      zoneId: zoneId,
    };
  }

  const zoneKey = worker.zoneId || zoneId;
  const canonical = zoneKey ? KNOWN_ZONE_COORDS[zoneKey] : undefined;
  const zone = dbZone
    ? {
        ...dbZone,
        lat: dbZone.lat === 0 && canonical ? canonical.lat : dbZone.lat,
        lng: dbZone.lng === 0 && canonical ? canonical.lng : dbZone.lng,
        city: dbZone.city || canonical?.city || worker.city || "Unknown",
        riskLevel: (dbZone.riskLevel || canonical?.riskLevel || "MEDIUM") as string,
      }
    : (canonical
        ? {
            id: zoneKey,
            city: canonical.city,
            lat: canonical.lat,
            lng: canonical.lng,
            riskLevel: canonical.riskLevel,
          }
        : null);

  const liveTypes = await getLiveActiveTriggerTypes(zone);
  const activeTriggerTypes = Array.from(liveTypes);
  const riskSignals = activeTriggerTypes.map(triggerTypeToLabel);
  const activeTriggers = activeTriggerTypes;
  let seasonContext = getSeasonContextFromTypes(activeTriggerTypes);

  // Live now-cast metrics
  let currentTempC: number | null = null;
  let currentAqi: number | null = null;
  let currentRainMm1h: number | null = null;
  let currentWeatherText: string | null = null;

  if (zone && OWM_KEY) {
    try {
      const weatherRes = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
        params: {
          lat: zone.lat,
          lon: zone.lng,
          units: "metric",
          appid: OWM_KEY,
        },
        timeout: 4000,
      });
      currentTempC = weatherRes.data?.main?.temp ?? null;
      currentRainMm1h = weatherRes.data?.rain?.["1h"] ?? 0;
      currentWeatherText = weatherRes.data?.weather?.[0]?.description ?? null;
    } catch (err) {
      console.error("[worker-dashboard] weather fetch failed", err);
    }
  }

  if (zone && WAQI_TOKEN) {
    try {
      const aqiRes = await axios.get(`https://api.waqi.info/feed/geo:${zone.lat};${zone.lng}/`, {
        params: { token: WAQI_TOKEN },
        timeout: 4000,
      });
      currentAqi = aqiRes.data?.data?.aqi ?? null;
    } catch (err) {
      console.error("[worker-dashboard] AQI fetch failed", err);
    }
  }

  const mergedWarnings = riskSignals;

  if (!seasonContext || seasonContext === "Risk conditions monitored") {
    if (typeof currentAqi === "number" && currentAqi >= 150) {
      seasonContext = "AQI season";
    } else if (typeof currentRainMm1h === "number" && currentRainMm1h >= 5) {
      seasonContext = "Monsoon season";
    } else if (typeof currentTempC === "number" && currentTempC >= 38) {
      seasonContext = "Heat-risk season";
    }
  }

  // Last payout info
  const lastPayout = payouts[0]
    ? `${payouts[0].createdAt.toLocaleDateString()} ${payouts[0].amount}`
    : null;

  return {
    zone: zone?.city || worker.city || "Unknown",
    zoneRisk: zone?.riskLevel || "MEDIUM",
    seasonContext,
    workerName: worker.name || "Worker",
    payoutPool: 1200000, // TODO: make dynamic
    riskSignals: mergedWarnings,
    activeTriggers,
    currentTempC,
    currentAqi,
    currentRainMm1h,
    currentWeatherText,
    lastPayout,
    earnedThisWeek: payouts
      .filter(p => p.createdAt >= weekAgo)
      .reduce((sum, p) => sum + p.amount, 0),
    claimsThisWeek: claims.length,
    recentPayouts: payouts.map(p => ({
      amount: p.amount,
      status: p.status,
      trigger: p.claimId,
      date: p.createdAt,
    })),
  };
}

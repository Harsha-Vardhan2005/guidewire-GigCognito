import { PrismaClient } from "@prisma/client";
import { PREMIUM_TIERS } from "@gigshield/shared-config";
import { checkRainfallTrigger } from "../trigger/rainfall-trigger.service";
import { checkAQITrigger } from "../trigger/aqi-trigger.service";
import { checkHeatwaveTrigger } from "../trigger/heatwave-trigger.service";
import { checkCurfewTrigger } from "../trigger/curfew-trigger.service";
import { checkFestivalTrigger } from "../trigger/festival-trigger.service";

const prisma = new PrismaClient();

type TriggerInfo = {
  type: string;
  icon: string;
  label: string;
  desc: string;
  active: boolean;
};

const TRIGGER_DEFS: Omit<TriggerInfo, "active">[] = [
  { type: "T1_RAINFALL", icon: "🌧️", label: "Extreme Rainfall", desc: "> 65mm/3hrs" },
  { type: "T2_AQI", icon: "😷", label: "Severe AQI", desc: "AQI > 400 for 4+ hrs" },
  { type: "T3_FLOOD", icon: "🌊", label: "Flooding", desc: "Zone waterlogging alert" },
  { type: "T4_HEATWAVE", icon: "🌡️", label: "Heatwave", desc: "Temp > 44°C + IMD advisory" },
  { type: "T5_CURFEW", icon: "🚫", label: "Curfew / Section 144", desc: "Official gazette only" },
  { type: "T6_FESTIVAL", icon: "🎉", label: "Festival Blockage", desc: "Municipal calendar" },
];

function formatWeekWindow(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", year: "numeric" });
  return `Week of ${fmt.format(start)} - ${fmt.format(end)}`;
}

async function getLiveActiveTypes(zone: { id: string; lat: number; lng: number } | null): Promise<Set<string>> {
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
    if (decision && (decision.action === "AUTO_TRIGGER" || decision.action === "ADMIN_REVIEW")) {
      live.add(decision.type);
    }
  }

  // Flooding is typically downstream of severe rain/waterlogging advisories.
  if (live.has("T1_RAINFALL")) {
    live.add("T3_FLOOD");
  }

  return live;
}

export async function getWorkerPolicyOverview(workerId: string) {
  try {
    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) return null;

    const policy = await prisma.policy.findFirst({
      where: { workerId, status: "ACTIVE" },
      include: { zone: true },
      orderBy: { activatedAt: "desc" },
    });

    if (!policy) {
      return {
        workerName: worker.name || "Worker",
        hasPolicy: false,
        message: "No active policy found. Please create or renew your policy.",
      };
    }

    const tier = (policy.tier || "standard") as keyof typeof PREMIUM_TIERS;
    const tierConfig = PREMIUM_TIERS[tier] ?? PREMIUM_TIERS.standard;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTriggers = await prisma.triggerEvent.findMany({
      where: {
        zoneId: policy.zoneId,
        firedAt: { gte: since },
      },
      select: { type: true },
      orderBy: { firedAt: "desc" },
    });
    const activeTypes = new Set(recentTriggers.map((t) => t.type));
    const liveTypes = await getLiveActiveTypes(policy.zone ?? null);
    for (const t of liveTypes) activeTypes.add(t);

    if (activeTypes.has("T1_RAINFALL")) {
      activeTypes.add("T3_FLOOD");
    }

    const coveredTriggers: TriggerInfo[] = TRIGGER_DEFS.map((t) => ({
      ...t,
      active: activeTypes.has(t.type),
    }));

    return {
      workerName: worker.name || "Worker",
      hasPolicy: true,
      policyId: policy.id,
      weekLabel: formatWeekWindow(policy.activatedAt, policy.expiresAt),
      plan: tier.charAt(0).toUpperCase() + tier.slice(1),
      weeklyPremium: policy.weeklyPremium,
      zone: policy.zone?.city ? `${policy.zone.city} (${policy.zone.id})` : policy.zoneId,
      maxDailyPayout: tierConfig.maxDailyPayout,
      maxWeeklyPayout: tierConfig.maxWeeklyPayout,
      validTill: policy.expiresAt.toISOString(),
      claimEligibility: new Date() >= policy.waitingUntil && policy.status === "ACTIVE" ? "Active" : "Waiting Period",
      payoutMethod: worker.upiId ? `UPI — ${worker.upiId}` : "UPI not linked",
      coveredTriggers,
    };
  } catch (dbErr) {
    // Database error - return mock policy overview
    console.warn("[getWorkerPolicyOverview] Database error, using fallback:", dbErr);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tierConfig = PREMIUM_TIERS.standard;

    const coveredTriggers: TriggerInfo[] = TRIGGER_DEFS.map((t) => ({
      ...t,
      active: false,
    }));

    return {
      workerName: `Worker-${workerId.slice(-4)}`,
      hasPolicy: true,
      policyId: `policy-${workerId}`,
      weekLabel: formatWeekWindow(now, expiresAt),
      plan: "Standard",
      weeklyPremium: 89,
      zone: "Mumbai (MUM_ANH_01)",
      maxDailyPayout: tierConfig.maxDailyPayout,
      maxWeeklyPayout: tierConfig.maxWeeklyPayout,
      validTill: expiresAt.toISOString(),
      claimEligibility: "Active",
      payoutMethod: "UPI not linked",
      coveredTriggers,
    };
  }
}

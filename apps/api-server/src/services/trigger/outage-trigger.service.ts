import { evaluateTrigger } from "./trigger-engine.service";

const DISCOM_FEED_URL = process.env.DISCOM_FEED_URL ?? "MOCK";

/**
 * T7_OUTAGE — power / internet outage trigger.
 * Mock uses monsoon season calendar: mid-June to mid-September.
 * Source1 = grid instability metric (0-100), derived from season + zone.
 */
const ZONE_OUTAGE_SUSCEPTIBILITY: Record<string, number> = {
  MUM_ANH_01: 0.65, // Mumbai suburban grid — frequent load-shedding
  MUM_BAN_01: 0.60,
  DEL_DWK_01: 0.50, // older west Delhi infrastructure
  DEL_NOR_01: 0.45,
  BLR_KOR_01: 0.35,
  BLR_HSR_01: 0.30,
  BLR_IND_01: 0.30,
  PNE_KSB_01: 0.40,
  PNE_KHR_01: 0.25,
};

function isMonsoonSeason(): boolean {
  const month = new Date().getMonth() + 1; // 1-indexed
  return month >= 6 && month <= 9;
}

function mockOutageDecision(zone: { id: string }) {
  const susceptibility = ZONE_OUTAGE_SUSCEPTIBILITY[zone.id] ?? 0.35;
  const seasonBoost = isMonsoonSeason() ? 0.3 : 0;
  const gridScore = Math.round((susceptibility + seasonBoost) * 100);

  return evaluateTrigger({
    type: "T7_OUTAGE",
    zoneId: zone.id,
    source1Value: gridScore,
    source2Value: gridScore * 0.95,
    officialAdvisory: gridScore >= 80,
    historicalPattern: susceptibility,
  });
}

export async function checkOutageTrigger(zone: { id: string; lat: number; lng: number }) {
  if (DISCOM_FEED_URL === "MOCK") return mockOutageDecision(zone);

  try {
    const res = await fetch(`${DISCOM_FEED_URL}/status?zone=${zone.id}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data: { grid_score: number; advisory: boolean } = await res.json();

    return evaluateTrigger({
      type: "T7_OUTAGE",
      zoneId: zone.id,
      source1Value: data.grid_score,
      source2Value: data.grid_score * 0.95,
      officialAdvisory: data.advisory,
      historicalPattern: ZONE_OUTAGE_SUSCEPTIBILITY[zone.id] ?? 0.35,
    });
  } catch {
    return mockOutageDecision(zone);
  }
}

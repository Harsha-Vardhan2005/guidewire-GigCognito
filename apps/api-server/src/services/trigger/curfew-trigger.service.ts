import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";

const CURFEW_API_URL = process.env.CURFEW_FEED_URL ?? "MOCK";

/**
 * Mock curfew calendar keyed by zone → array of month-days (day-of-month) that
 * have active curfew orders in the simulation window (April 2025).
 */
const MOCK_CURFEW_CALENDAR: Record<string, number[]> = {
  DEL_DWK_01: [10, 11, 12], // communal tension simulation
  DEL_NOR_01: [10, 11],
  BLR_KOR_01: [14], // election eve restriction
  BLR_HSR_01: [],
  BLR_IND_01: [],
  PNE_KSB_01: [],
  PNE_KHR_01: [],
  MUM_ANH_01: [],
  MUM_BAN_01: [],
};

function isMockCurfewActive(zoneId: string): boolean {
  const today = new Date().getDate();
  return (MOCK_CURFEW_CALENDAR[zoneId] ?? []).includes(today);
}

function mockCurfewDecision(zone: { id: string }) {
  const active = isMockCurfewActive(zone.id);
  return evaluateTrigger({
    type: "T5_CURFEW",
    zoneId: zone.id,
    source1Value: active ? 1 : 0,
    source2Value: active ? 1 : 0,
    officialAdvisory: active,
    historicalPattern: active ? 0.7 : 0,
  });
}

export async function checkCurfewTrigger(zone: { id: string; lat: number; lng: number }) {
  if (CURFEW_API_URL === "MOCK") return mockCurfewDecision(zone);

  try {
    const res = await fetch(`${CURFEW_API_URL}/status?zone=${zone.id}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data: { active: boolean; advisory: boolean } = await res.json();

    return evaluateTrigger({
      type: "T5_CURFEW",
      zoneId: zone.id,
      source1Value: data.active ? 1 : 0,
      source2Value: data.active ? 1 : 0,
      officialAdvisory: data.advisory ?? data.active,
      historicalPattern: data.active ? 0.7 : 0,
    });
  } catch {
    return mockCurfewDecision(zone);
  }
}

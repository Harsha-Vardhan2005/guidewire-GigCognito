import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";

const FESTIVAL_API_URL = process.env.FESTIVAL_FEED_URL ?? "MOCK";

/**
 * Mock festival calendar — days-of-month (April 2025) with major city festivals.
 * Festivals reduce gig availability by 20-60%, triggering a T6 income-disruption.
 */
const MOCK_FESTIVAL_CALENDAR: Record<string, number[]> = {
  BLR_KOR_01: [6, 14, 17], // Ugadi(6), Ambedkar Jayanti(14), Ram Navami(17)
  BLR_HSR_01: [6, 17],
  BLR_IND_01: [6, 17],
  MUM_ANH_01: [6, 17],
  MUM_BAN_01: [6, 17],
  DEL_DWK_01: [14, 17],
  DEL_NOR_01: [14, 17],
  PNE_KSB_01: [6, 14, 17], // Gudi Padwa(6)
  PNE_KHR_01: [6, 17],
};

function isFestivalActive(zoneId: string): boolean {
  const today = new Date().getDate();
  return (MOCK_FESTIVAL_CALENDAR[zoneId] ?? []).includes(today);
}

function mockFestivalDecision(zone: { id: string }) {
  const active = isFestivalActive(zone.id);
  return evaluateTrigger({
    type: "T6_FESTIVAL",
    zoneId: zone.id,
    source1Value: active ? 1 : 0,
    source2Value: active ? 1 : 0,
    officialAdvisory: false,
    historicalPattern: active ? 1.0 : 0, // festivals are historically predictable
  });
}

export async function checkFestivalTrigger(zone: { id: string; lat: number; lng: number }) {
  if (FESTIVAL_API_URL === "MOCK") return mockFestivalDecision(zone);

  try {
    const res = await fetch(`${FESTIVAL_API_URL}/events?zone=${zone.id}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data: { festival_day: boolean; name?: string } = await res.json();

    return evaluateTrigger({
      type: "T6_FESTIVAL",
      zoneId: zone.id,
      source1Value: data.festival_day ? 1 : 0,
      source2Value: data.festival_day ? 1 : 0,
      officialAdvisory: false,
      historicalPattern: data.festival_day ? 1.0 : 0,
    });
  } catch {
    return mockFestivalDecision(zone);
  }
}

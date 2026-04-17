import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";
import { isTriggerApprovedForZone } from "../worker/community-triggers.service";

const CURFEW_API_URL = process.env.CURFEW_FEED_URL ?? "MOCK";


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

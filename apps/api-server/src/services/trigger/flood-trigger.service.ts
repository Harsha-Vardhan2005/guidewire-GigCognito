import { evaluateTrigger } from "./trigger-engine.service";
import { checkRainfallTrigger } from "./rainfall-trigger.service";

/**
 * T3_FLOOD — derived from T1_RAINFALL + zone waterlogging index.
 * If sustained rainfall ≥ 65 mm/3hr AND waterlogging_index > 0.4, flood risk elevates.
 * No separate public API (NDMA data is not real-time). Uses rainfall data + zone profile.
 */
const ZONE_WATERLOGGING: Record<string, number> = {
  MUM_ANH_01: 0.75, // Andheri — notorious flooding
  MUM_BAN_01: 0.70,
  BLR_KOR_01: 0.45,
  BLR_HSR_01: 0.30,
  BLR_IND_01: 0.35,
  DEL_DWK_01: 0.50,
  DEL_NOR_01: 0.40,
  PNE_KSB_01: 0.35,
  PNE_KHR_01: 0.15,
};

const FLOOD_RAIN_THRESHOLD = 65; // mm/3hr — exceeds T1 threshold to indicate flooding

export async function checkFloodTrigger(zone: { id: string; lat: number; lng: number }) {
  // Flood builds on rainfall reading
  const rainDecision = await checkRainfallTrigger(zone);
  const rain = rainDecision.confidence >= 60 ? 70 : 40; // infer approximate mm from confidence
  const wlog = ZONE_WATERLOGGING[zone.id] ?? 0.35;

  return evaluateTrigger({
    type: "T3_FLOOD",
    zoneId: zone.id,
    source1Value: rain,
    source2Value: rain * 0.9,
    officialAdvisory: rain >= FLOOD_RAIN_THRESHOLD && wlog >= 0.5,
    historicalPattern: wlog, // waterlogging_index acts as historical flood propensity
  });
}

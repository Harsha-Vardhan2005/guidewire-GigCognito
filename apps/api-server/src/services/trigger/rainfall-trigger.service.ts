import axios from "axios";
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";

const OWM_KEY = process.env.OWM_API_KEY ?? "MOCK";

/** Zone-level seasonal mock rain values (mm/3hr). April = pre-monsoon. */
const ZONE_MOCK_RAIN: Record<string, number> = {
  MUM_ANH_01: 72,   // Mumbai – coastal, already getting pre-monsoon bursts
  MUM_BAN_01: 68,   // Mumbai – coastal
  BLR_KOR_01: 48,   // Bengaluru – moderate
  BLR_HSR_01: 42,
  BLR_IND_01: 45,
  DEL_DWK_01: 8,    // Delhi – dry in April
  DEL_NOR_01: 6,
  PNE_KSB_01: 25,
  PNE_KHR_01: 22,
};

function mockRainfallDecision(zone: { id: string }) {
  const rain = ZONE_MOCK_RAIN[zone.id] ?? 30;
  const decision = evaluateTrigger({
    type: "T1_RAINFALL",
    zoneId: zone.id,
    source1Value: rain,
    source2Value: rain * 0.95,
    officialAdvisory: rain >= 50,
    historicalPattern: rain >= TRIGGER_THRESHOLDS.T1_RAINFALL_MM_3HR ? 0.8 : 0.35,
  });
  console.log(`[Rainfall][MOCK] Zone ${zone.id} | rain=${rain}mm | ${decision.action} (${decision.confidence})`);
  return decision;
}

export async function checkRainfallTrigger(zone: { id: string; lat: number; lng: number }) {
  if (!OWM_KEY || OWM_KEY === "MOCK") {
    return mockRainfallDecision(zone);
  }

  try {
    const res = await axios.get("https://api.openweathermap.org/data/2.5/forecast", {
      params: { lat: zone.lat, lon: zone.lng, appid: OWM_KEY, units: "metric", cnt: 2 },
    });
    const first = res.data?.list?.[0];
    const second = res.data?.list?.[1];
    const rainMm3h = first?.rain?.["3h"] ?? 0;
    const rainSource2 = second?.rain?.["3h"] ?? rainMm3h;
    const weatherMain = String(first?.weather?.[0]?.main ?? "").toLowerCase();
    const imdAdvisory = weatherMain.includes("rain") || weatherMain.includes("thunderstorm");

    const decision = evaluateTrigger({
      type: "T1_RAINFALL",
      zoneId: zone.id,
      source1Value: rainMm3h,
      source2Value: rainSource2,
      officialAdvisory: imdAdvisory,
      historicalPattern: rainMm3h > TRIGGER_THRESHOLDS.T1_RAINFALL_MM_3HR ? 0.8 : 0.2,
    });
    console.log(`[Rainfall] Zone ${zone.id} | rain3h=${rainMm3h}mm | ${decision.action} (${decision.confidence})`);
    return decision;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Rainfall] API error: ${message} — falling back to mock`);
    return mockRainfallDecision(zone);
  }
}

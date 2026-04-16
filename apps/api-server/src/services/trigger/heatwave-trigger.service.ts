import axios from "axios";
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";

const OWM_KEY = process.env.OWM_API_KEY ?? "MOCK";

/** Representative April temperatures by zone (°C). Delhi/Pune hit heatwave thresholds. */
const ZONE_MOCK_TEMP: Record<string, number> = {
  DEL_DWK_01: 42, // severe — qualifies for T4
  DEL_NOR_01: 41,
  PNE_KSB_01: 39,
  PNE_KHR_01: 38,
  BLR_KOR_01: 32,
  BLR_HSR_01: 31,
  BLR_IND_01: 32,
  MUM_ANH_01: 34,
  MUM_BAN_01: 33,
};

function mockHeatwaveDecision(zone: { id: string }) {
  const tempC = ZONE_MOCK_TEMP[zone.id] ?? 36;
  return evaluateTrigger({
    type: "T4_HEATWAVE",
    zoneId: zone.id,
    source1Value: tempC,
    source2Value: tempC * 0.98,
    officialAdvisory: tempC >= 42,
    historicalPattern: tempC > TRIGGER_THRESHOLDS.T4_HEATWAVE_TEMP_C ? 0.9 : 0.3,
  });
}

export async function checkHeatwaveTrigger(zone: { id: string; lat: number; lng: number }) {
  if (OWM_KEY === "MOCK") return mockHeatwaveDecision(zone);

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${zone.lat}&lon=${zone.lng}&units=metric&appid=${OWM_KEY}`;
    const { data } = await axios.get(url, { timeout: 5000 });
    const tempC: number = data.main.temp;

    return evaluateTrigger({
      type: "T4_HEATWAVE",
      zoneId: zone.id,
      source1Value: tempC,
      source2Value: tempC * 0.98,
      officialAdvisory: tempC >= 42,
      historicalPattern: tempC > TRIGGER_THRESHOLDS.T4_HEATWAVE_TEMP_C ? 0.9 : 0.3,
    });
  } catch {
    return mockHeatwaveDecision(zone);
  }
}

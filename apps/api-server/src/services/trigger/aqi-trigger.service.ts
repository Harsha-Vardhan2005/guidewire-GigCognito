import axios from "axios";
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";

const WAQI_TOKEN = process.env.WAQI_TOKEN ?? "MOCK";

/** Average AQI by zone (April conditions). Delhi zones are highest. */
const ZONE_MOCK_AQI: Record<string, number> = {
  DEL_DWK_01: 395, // Delhi approaching severe in April pre-summer
  DEL_NOR_01: 378,
  MUM_ANH_01: 135,
  MUM_BAN_01: 128,
  BLR_KOR_01: 152,
  BLR_HSR_01: 141,
  BLR_IND_01: 148,
  PNE_KSB_01: 92,
  PNE_KHR_01: 87,
};

function mockAqiDecision(zone: { id: string }) {
  const aqi = ZONE_MOCK_AQI[zone.id] ?? 150;
  const cpcb = aqi * 0.95;
  const decision = evaluateTrigger({
    type: "T2_AQI",
    zoneId: zone.id,
    source1Value: aqi,
    source2Value: cpcb,
    officialAdvisory: aqi > TRIGGER_THRESHOLDS.T2_AQI_SEVERE,
    historicalPattern: aqi > 400 ? 0.7 : 0.15,
  });
  console.log(`[AQI][MOCK] Zone ${zone.id} | WAQI=${aqi} CPCB=${cpcb.toFixed(0)} | ${decision.action} (${decision.confidence})`);
  return decision;
}

export async function checkAQITrigger(zone: { id: string; lat: number; lng: number }) {
  if (!WAQI_TOKEN || WAQI_TOKEN === "MOCK") {
    return mockAqiDecision(zone);
  }

  try {
    const res = await axios.get(
      `https://api.waqi.info/feed/geo:${zone.lat};${zone.lng}/?token=${WAQI_TOKEN}`
    );
    const waqiAqi = res.data?.data?.aqi ?? 0;
    const cpcbAqi = waqiAqi * 0.95;
    const decision = evaluateTrigger({
      type: "T2_AQI",
      zoneId: zone.id,
      source1Value: waqiAqi,
      source2Value: cpcbAqi,
      officialAdvisory: waqiAqi > TRIGGER_THRESHOLDS.T2_AQI_SEVERE,
      historicalPattern: waqiAqi > 400 ? 0.7 : 0.1,
    });
    console.log(`[AQI] Zone ${zone.id} | WAQI=${waqiAqi} CPCB=${cpcbAqi.toFixed(0)} | ${decision.action}`);
    return decision;
  } catch (err) {
    console.error("[AQI] API error", err, "— falling back to mock");
    return mockAqiDecision(zone);
  }
}

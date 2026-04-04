import axios from "axios";
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";

const WAQI_TOKEN = process.env.WAQI_TOKEN ?? "MOCK";

export async function checkAQITrigger(zone: { id: string; lat: number; lng: number }) {
  if (!WAQI_TOKEN || WAQI_TOKEN === "MOCK") {
    console.warn("[AQI] WAQI_TOKEN missing; skipping AQI trigger check");
    return null;
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

    console.log(`[AQI] Zone ${zone.id} | WAQI=${waqiAqi} CPCB=${cpcbAqi} | ${decision.action}`);
    return decision;
  } catch (err) {
    console.error("[AQI] API error", err);
    return null;
  }
}

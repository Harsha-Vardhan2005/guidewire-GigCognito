import axios from "axios";
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";

const OWM_KEY = process.env.OWM_API_KEY ?? "MOCK";

export async function checkRainfallTrigger(zone: { id: string; lat: number; lng: number }) {
  if (!OWM_KEY || OWM_KEY === "MOCK") {
    console.warn("[Rainfall] OWM_API_KEY missing; skipping rainfall trigger check");
    return null;
  }

  try {
    // Use 2.5/forecast (free tier) to estimate rainfall in 3-hour blocks.
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
    console.error(`[Rainfall] API error: ${message}`);
    return null;
  }
}

import axios from "axios";
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";

const OWM_KEY = process.env.OWM_API_KEY ?? "MOCK";

export async function checkHeatwaveTrigger(zone: { id: string; lat: number; lng: number }) {
	if (!OWM_KEY || OWM_KEY === "MOCK") {
		console.warn("[Heatwave] OWM_API_KEY missing; skipping heatwave trigger check");
		return null;
	}

	try {
		// Use 2.5/weather (free tier) for current temperature.
		const res = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
			params: { lat: zone.lat, lon: zone.lng, appid: OWM_KEY, units: "metric" },
		});
		const tempC = res.data?.main?.temp ?? 0;
		const weatherMain = String(res.data?.weather?.[0]?.main ?? "").toLowerCase();
		const imdAdvisory = weatherMain.includes("heat");

		const decision = evaluateTrigger({
			type: "T4_HEATWAVE",
			zoneId: zone.id,
			source1Value: tempC,
			source2Value: tempC * 0.98,
			officialAdvisory: imdAdvisory,
			historicalPattern: tempC > TRIGGER_THRESHOLDS.T4_HEATWAVE_TEMP_C ? 0.7 : 0.1,
		});

		console.log(`[Heatwave] Zone ${zone.id} | temp=${tempC}°C | ${decision.action} (${decision.confidence})`);
		return decision;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`[Heatwave] API error: ${message}`);
		return null;
	}
}

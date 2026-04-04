import axios from "axios";
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";

const OWM_KEY = process.env.OWM_API_KEY ?? "MOCK";

export async function checkHeatwaveTrigger(zone: { id: string; lat: number; lng: number }) {
	try {
		let tempC = 0;
		let imdAdvisory = false;

		if (OWM_KEY !== "MOCK") {
			const res = await axios.get("https://api.openweathermap.org/data/3.0/onecall", {
				params: { lat: zone.lat, lon: zone.lng, exclude: "minutely,daily", appid: OWM_KEY, units: "metric" },
			});
			tempC = res.data?.current?.temp ?? 0;
			imdAdvisory = res.data?.alerts?.some((a: { event: string }) =>
				a.event.toLowerCase().includes("heat")) ?? false;
		} else {
			tempC = Math.random() > 0.9 ? 45 : 36;
			imdAdvisory = tempC > 44;
		}

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
		console.error("[Heatwave] API error", err);
		return null;
	}
}

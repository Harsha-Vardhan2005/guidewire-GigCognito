import axios from "axios";
import { evaluateTrigger } from "./trigger-engine.service";

const CURFEW_FEED_URL = process.env.CURFEW_FEED_URL;

export async function checkCurfewTrigger(zone: { id: string; lat: number; lng: number }) {
	if (!CURFEW_FEED_URL) {
		console.warn("[Curfew] CURFEW_FEED_URL missing; skipping curfew trigger check");
		return null;
	}

	let curfewActive = false;
	let officialGazette = false;
	try {
		const res = await axios.get(CURFEW_FEED_URL, {
			params: { zoneId: zone.id, lat: zone.lat, lng: zone.lng },
			timeout: 4000,
		});
		curfewActive = Boolean(res.data?.active);
		officialGazette = Boolean(res.data?.official ?? curfewActive);
	} catch (err) {
		console.error("[Curfew] Feed error", err);
		return null;
	}

	const decision = evaluateTrigger({
		type: "T5_CURFEW",
		zoneId: zone.id,
		source1Value: curfewActive ? 1 : 0,
		source2Value: curfewActive ? 1 : 0,
		officialAdvisory: officialGazette,
		historicalPattern: curfewActive ? 0.8 : 0.1,
	});

	console.log(`[Curfew] Zone ${zone.id} | curfew=${curfewActive} | ${decision.action} (${decision.confidence})`);
	return decision;
}

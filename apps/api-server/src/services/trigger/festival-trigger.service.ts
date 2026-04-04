import axios from "axios";
import { evaluateTrigger } from "./trigger-engine.service";

const FESTIVAL_FEED_URL = process.env.FESTIVAL_FEED_URL;

export async function checkFestivalTrigger(zone: { id: string; lat: number; lng: number }) {
	if (!FESTIVAL_FEED_URL) {
		console.warn("[Festival] FESTIVAL_FEED_URL missing; skipping festival trigger check");
		return null;
	}

	let festivalActive = false;
	let municipalCalendar = false;
	try {
		const res = await axios.get(FESTIVAL_FEED_URL, {
			params: { zoneId: zone.id, lat: zone.lat, lng: zone.lng },
			timeout: 4000,
		});
		festivalActive = Boolean(res.data?.active);
		municipalCalendar = Boolean(res.data?.official ?? festivalActive);
	} catch (err) {
		console.error("[Festival] Feed error", err);
		return null;
	}

	const decision = evaluateTrigger({
		type: "T6_FESTIVAL",
		zoneId: zone.id,
		source1Value: festivalActive ? 1 : 0,
		source2Value: festivalActive ? 1 : 0,
		officialAdvisory: municipalCalendar,
		historicalPattern: festivalActive ? 0.7 : 0.1,
	});

	console.log(`[Festival] Zone ${zone.id} | festival=${festivalActive} | ${decision.action} (${decision.confidence})`);
	return decision;
}

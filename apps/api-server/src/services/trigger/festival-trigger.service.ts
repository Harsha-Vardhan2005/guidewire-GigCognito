// Mock implementation for real-time festival blockage trigger
import { evaluateTrigger } from "./trigger-engine.service";

export async function checkFestivalTrigger(zone: { id: string; lat: number; lng: number }) {
	// In production, poll/load municipal calendars for active events
	// Here, mock a festival event occasionally
	const festivalActive = Math.random() > 0.96;
	const municipalCalendar = festivalActive;

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

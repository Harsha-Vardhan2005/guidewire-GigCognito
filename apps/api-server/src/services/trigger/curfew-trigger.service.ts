// Mock implementation for real-time curfew trigger
import { evaluateTrigger } from "./trigger-engine.service";

export async function checkCurfewTrigger(zone: { id: string; lat: number; lng: number }) {
	// In production, poll PIB/state gazette feeds and run NLP classifier
	// Here, mock a curfew event occasionally
	const curfewActive = Math.random() > 0.97;
	const officialGazette = curfewActive;

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

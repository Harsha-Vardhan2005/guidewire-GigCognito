import cron from "node-cron";
import { checkRainfallTrigger } from "./rainfall-trigger.service";
import { checkAQITrigger }      from "./aqi-trigger.service";
import { runClaimPipeline }     from "../claim/claim-pipeline.service";

const ACTIVE_ZONES = [
  { id: "BLR_KOR_01", lat: 12.9279, lng: 77.6271 },
  { id: "DEL_DWK_01", lat: 28.5921, lng: 77.0460 },
  { id: "MUM_ANH_01", lat: 19.1136, lng: 72.8697 },
];

const MOCK_WORKER = {
  workerId:        "mock_rajan_001",
  workerName:      "Rajan Kumar",
  policyId:        "POL_MOCK_001",
  policyStatus:    "ACTIVE",
  policyZoneId:    "BLR_KOR_01",
  tier:            "standard" as const,
  upiId:           "rajan@phonepe",
  accountCreatedAt: new Date(Date.now() - 14 * 86400_000),
  waitingUntil:    new Date(Date.now() - 7  * 86400_000),
  claimsThisWeek:  0,
};

export function startTriggerPoller() {
  cron.schedule("*/15 * * * *", async () => {
    console.log("[TriggerPoller] Running zone checks", new Date().toISOString());
    for (const zone of ACTIVE_ZONES) {
      const rain = await checkRainfallTrigger(zone);
      if (rain?.action === "AUTO_TRIGGER" && zone.id === MOCK_WORKER.policyZoneId) {
        await runClaimPipeline(rain, MOCK_WORKER);
      }
      const aqi = await checkAQITrigger(zone);
      if (aqi?.action === "AUTO_TRIGGER" && zone.id === MOCK_WORKER.policyZoneId) {
        await runClaimPipeline(aqi, MOCK_WORKER);
      }
      // Heatwave
      const heat = await checkHeatwaveTrigger(zone);
      if (heat?.action === "AUTO_TRIGGER" && zone.id === MOCK_WORKER.policyZoneId) {
        await runClaimPipeline(heat, MOCK_WORKER);
      }
      // Curfew
      const curfew = await checkCurfewTrigger(zone);
      if (curfew?.action === "AUTO_TRIGGER" && zone.id === MOCK_WORKER.policyZoneId) {
        await runClaimPipeline(curfew, MOCK_WORKER);
      }
      // Festival Blockage
      const festival = await checkFestivalTrigger(zone);
      if (festival?.action === "AUTO_TRIGGER" && zone.id === MOCK_WORKER.policyZoneId) {
        await runClaimPipeline(festival, MOCK_WORKER);
      }
    }
  });
  console.log("[TriggerPoller] Started — polling every 15 min");
}

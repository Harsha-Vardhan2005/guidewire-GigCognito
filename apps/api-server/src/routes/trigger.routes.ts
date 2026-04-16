import { Router } from "express";
import { checkRainfallTrigger }  from "../services/trigger/rainfall-trigger.service";
import { checkAQITrigger }       from "../services/trigger/aqi-trigger.service";
import { checkHeatwaveTrigger }  from "../services/trigger/heatwave-trigger.service";
import { checkCurfewTrigger }    from "../services/trigger/curfew-trigger.service";
import { checkFestivalTrigger }  from "../services/trigger/festival-trigger.service";
import { checkFloodTrigger }     from "../services/trigger/flood-trigger.service";
import { checkOutageTrigger }    from "../services/trigger/outage-trigger.service";
import { evaluateTrigger }       from "../services/trigger/trigger-engine.service";
import type { TriggerType }      from "@gigshield/shared-config";

const router = Router();

const ALL_ZONES = [
  { id: "BLR_KOR_01", lat: 12.9279, lng: 77.6271, city: "Bengaluru", label: "Koramangala" },
  { id: "BLR_HSR_01", lat: 12.9120, lng: 77.6430, city: "Bengaluru", label: "HSR Layout" },
  { id: "BLR_IND_01", lat: 12.9716, lng: 77.5946, city: "Bengaluru", label: "Indiranagar" },
  { id: "MUM_ANH_01", lat: 19.1136, lng: 72.8697, city: "Mumbai",    label: "Andheri" },
  { id: "MUM_BAN_01", lat: 19.0596, lng: 72.8295, city: "Mumbai",    label: "Bandra" },
  { id: "DEL_DWK_01", lat: 28.5921, lng: 77.0460, city: "Delhi",     label: "Dwarka" },
  { id: "DEL_NOR_01", lat: 28.7041, lng: 77.1025, city: "Delhi",     label: "North Delhi" },
  { id: "PNE_KSB_01", lat: 18.5204, lng: 73.8567, city: "Pune",      label: "Kothrud/Shivaji Nagar" },
  { id: "PNE_KHR_01", lat: 18.5642, lng: 73.8890, city: "Pune",      label: "Kharadi" },
];

/**
 * GET /triggers/status
 * Run all 7 triggers for all 9 zones and return the current state table.
 */
router.get("/status", async (_req, res) => {
  const results = await Promise.all(
    ALL_ZONES.map(async (zone) => {
      const [rain, aqi, flood, heat, curfew, festival, outage] = await Promise.all([
        checkRainfallTrigger(zone),
        checkAQITrigger(zone),
        checkFloodTrigger(zone),
        checkHeatwaveTrigger(zone),
        checkCurfewTrigger(zone),
        checkFestivalTrigger(zone),
        checkOutageTrigger(zone),
      ]);
      return {
        zoneId: zone.id,
        city: zone.city,
        label: zone.label,
        triggers: { rain, aqi, flood, heat, curfew, festival, outage },
        activeCount: [rain, aqi, flood, heat, curfew, festival, outage].filter(
          (t) => t.action === "AUTO_TRIGGER"
        ).length,
      };
    })
  );
  res.json({ zones: results, ts: new Date().toISOString() });
});

/**
 * POST /triggers/simulate
 * Body: { type, zoneId, intensity: "low" | "high" }
 * Returns a TriggerDecision for demo/testing purposes.
 */
router.post("/simulate", (req, res) => {
  const { type = "T1_RAINFALL", zoneId = "BLR_KOR_01", intensity = "high" } = req.body as {
    type: TriggerType;
    zoneId: string;
    intensity: "low" | "high";
  };

  const highValues: Record<TriggerType, [number, number]> = {
    T1_RAINFALL: [75, 72],
    T2_AQI:      [320, 310],
    T3_FLOOD:    [75, 68],
    T4_HEATWAVE: [43, 42],
    T5_CURFEW:   [1, 1],
    T6_FESTIVAL: [1, 1],
    T7_OUTAGE:   [85, 80],
  };
  const lowValues: Record<TriggerType, [number, number]> = {
    T1_RAINFALL: [20, 18],
    T2_AQI:      [90, 85],
    T3_FLOOD:    [20, 18],
    T4_HEATWAVE: [32, 31],
    T5_CURFEW:   [0, 0],
    T6_FESTIVAL: [0, 0],
    T7_OUTAGE:   [30, 28],
  };

  const [s1, s2] = intensity === "high" ? (highValues[type] ?? [75, 70]) : (lowValues[type] ?? [20, 18]);
  const decision = evaluateTrigger({
    type,
    zoneId,
    source1Value: s1,
    source2Value: s2,
    officialAdvisory: intensity === "high",
    historicalPattern: intensity === "high" ? 0.8 : 0.2,
  });
  res.json(decision);
});

/**
 * GET /triggers/types
 * List all trigger types with thresholds and descriptions.
 */
router.get("/types", (_req, res) => {
  res.json([
    { type: "T1_RAINFALL", label: "Extreme Rainfall",   threshold: "≥ 64 mm/3hr",  payoutHours: 8, sources: ["OpenWeatherMap", "IMD"] },
    { type: "T2_AQI",      label: "Severe Air Quality", threshold: "AQI ≥ 300",    payoutHours: 4, sources: ["OpenAQ", "CPCB"] },
    { type: "T3_FLOOD",    label: "Flash Flood",        threshold: "Rain + high waterlogging index", payoutHours: 8, sources: ["Derived from T1", "NDMA"] },
    { type: "T4_HEATWAVE", label: "Heatwave",           threshold: "≥ 40°C + advisory", payoutHours: 4, sources: ["OpenWeatherMap", "IMD"] },
    { type: "T5_CURFEW",   label: "Curfew / Section 144", threshold: "Official order active", payoutHours: 6, sources: ["Police Advisory Feed", "News APIs"] },
    { type: "T6_FESTIVAL", label: "Festival Disruption", threshold: "Major festival day", payoutHours: 3, sources: ["Google Calendar API", "State Calendar"] },
    { type: "T7_OUTAGE",   label: "Power / Internet Outage", threshold: "Grid score ≥ 80", payoutHours: 2, sources: ["DISCOM Feed", "State Grid"] },
  ]);
});

export default router;

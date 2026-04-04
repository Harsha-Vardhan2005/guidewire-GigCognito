
import { Router } from "express";
import { runFraudDetection, recordPing } from "../services/fraud/fraud-detector.service";
import { putWorkerProfile } from "../controllers/worker.controller";
import { authenticateWorker } from "../middlewares/authenticateWorker";

const router = Router();

// PUT /worker/profile — update worker details
router.put("/profile", authenticateWorker, putWorkerProfile);

/**
 * POST /worker/location
 * Called by frontend every 15 min to record GPS ping.
 * Body: { workerId, lat, lng, accuracy?, deviceMotion?, batteryLevel?, platformStatus? }
 */
router.post("/location", async (req, res) => {
  const {
    workerId,
    lat,
    lng,
    accuracy,
    deviceMotion,
    batteryLevel,
    platformStatus = "online",
  } = req.body;

  if (!workerId || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, message: "workerId, lat, lng are required" });
  }

  const ping = {
    workerId,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    timestamp: Date.now(),
    accuracy,
    deviceMotion,
    batteryLevel,
    platformStatus,
    ipAddress: req.ip || req.headers["x-forwarded-for"]?.toString() || "127.0.0.1",
    userAgent: req.headers["user-agent"] || "",
  };

  // Just record the ping — no fraud check yet (fraud runs at claim time)
  recordPing(ping);

  return res.json({ success: true, message: "Location recorded", timestamp: ping.timestamp });
});

/**
 * POST /worker/fraud-check
 * Full 8-signal fraud detection — called when a trigger fires.
 * Body: { workerId, lat, lng, zoneId, triggerType, accuracy?, deviceMotion?, batteryLevel?, platformStatus? }
 */
router.post("/fraud-check", async (req, res) => {
  const {
    workerId,
    lat,
    lng,
    zoneId        = "BLR_KOR_01",
    triggerType   = "T1_RAINFALL",
    accuracy,
    deviceMotion,
    batteryLevel,
    platformStatus = "online",
  } = req.body;

  if (!workerId || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, message: "workerId, lat, lng are required" });
  }

  const ping = {
    workerId,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    timestamp: Date.now(),
    accuracy,
    deviceMotion,
    batteryLevel,
    platformStatus,
    ipAddress: req.ip || req.headers["x-forwarded-for"]?.toString() || "127.0.0.1",
    userAgent: req.headers["user-agent"] || "",
  };

  try {
    const result = await runFraudDetection(ping, zoneId, triggerType);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("[FraudCheck] Error:", err);
    return res.status(500).json({ success: false, message: "Fraud check failed" });
  }
});

export default router;
import { Router } from "express";
import {
  analyzeSpoofing,
  getGPSSpoofingReport,
  getDeviceFingerprintHistory,
  analyzeWorkerBehavior,
} from "../controllers/anti-spoofing.controller";

const router = Router();

/**
 * Anti-Spoofing Detection Routes
 * POST   /anti-spoofing/analyze           - Analyze claim for spoofing
 * GET    /anti-spoofing/gps-report/:id    - GPS spoofing report for worker
 * GET    /anti-spoofing/devices/:id       - Device fingerprint history
 * GET    /anti-spoofing/behavior/:id      - Behavioral analysis for worker
 */

// Analyze a claim for spoofing indicators
router.post("/anti-spoofing/analyze", analyzeSpoofing);

// Get GPS spoofing report for a worker
router.get("/anti-spoofing/gps-report/:workerId", getGPSSpoofingReport);

// Get device fingerprint history
router.get("/anti-spoofing/devices/:workerId", getDeviceFingerprintHistory);

// Get behavioral analysis
router.get("/anti-spoofing/behavior/:workerId", analyzeWorkerBehavior);

export default router;

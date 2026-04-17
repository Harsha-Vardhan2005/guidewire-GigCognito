import { Router } from "express";
import {
  getDashboardStats,
  getLiveTriggers,
  getFraudQueue,
  getLossRatioTrend,
  getPredictiveAlerts,
  getWorkers,
  updateFraudClaim,
  getZoneHeatmap,
  getLossMetrics,
  getTriggerAnalytics,
  getZoneAnalytics,
} from "../controllers/admin.controller";
import { authenticateAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Auth middleware for all admin routes
router.use(authenticateAdmin);

// Dashboard endpoints
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/triggers", getLiveTriggers);
router.get("/dashboard/fraud-queue", getFraudQueue);
router.get("/dashboard/loss-ratio", getLossRatioTrend);
router.get("/dashboard/predictive-alerts", getPredictiveAlerts);
router.get("/dashboard/workers", getWorkers);
router.get("/dashboard/zone-heatmap", getZoneHeatmap);
router.put("/dashboard/fraud-claim/:claimId", updateFraudClaim);

// Analytics endpoints
router.get("/analytics/loss-metrics", getLossMetrics);
router.get("/analytics/triggers", getTriggerAnalytics);
router.get("/analytics/zones", getZoneAnalytics);

export default router;

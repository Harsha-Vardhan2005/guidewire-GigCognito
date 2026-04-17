import { Request, Response } from "express";
import { dashboardService } from "../services/admin/dashboard.service";
import { analyticsService } from "../services/admin/analytics.service";

/**
 * GET /admin/dashboard/stats
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
};

/**
 * GET /admin/dashboard/triggers
 * Get live trigger events by zone
 */
export const getLiveTriggers = async (req: Request, res: Response) => {
  try {
    const triggers = await dashboardService.getLiveTriggerEvents();
    res.json({ success: true, data: triggers });
  } catch (error) {
    console.error("Triggers error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch triggers" });
  }
};

/**
 * GET /admin/dashboard/fraud-queue
 * Get fraud queue with pagination
 */
export const getFraudQueue = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const queue = await dashboardService.getFraudQueue(limit, offset);
    res.json({ success: true, data: queue });
  } catch (error) {
    console.error("Fraud queue error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch fraud queue" });
  }
};

/**
 * GET /admin/dashboard/loss-ratio
 * Get 12-week loss ratio trend
 */
export const getLossRatioTrend = async (req: Request, res: Response) => {
  try {
    const trend = await dashboardService.getLossRatioTrend();
    res.json({ success: true, data: trend });
  } catch (error) {
    console.error("Loss ratio trend error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch loss ratio trend" });
  }
};

/**
 * GET /admin/dashboard/predictive-alerts
 * Get predictive alerts for next 7 days
 */
export const getPredictiveAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await dashboardService.getPredictiveAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Predictive alerts error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch predictive alerts" });
  }
};

/**
 * GET /admin/dashboard/workers
 * Get workers table with filters
 */
export const getWorkers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      fraudFlag: req.query.fraudFlag === "true",
      zone: req.query.zone as string,
      status: req.query.status as string,
    };

    const workers = await dashboardService.getWorkersTable(limit, offset, filters);
    res.json({ success: true, data: workers });
  } catch (error) {
    console.error("Workers table error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch workers" });
  }
};

/**
 * PUT /admin/dashboard/fraud-claim/:claimId
 * Update fraud claim status (approve/reject)
 */
export const updateFraudClaim = async (req: Request, res: Response) => {
  try {
    const { claimId } = req.params;
    const { action, notes } = req.body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    const result = await dashboardService.updateFraudClaim(claimId, action, notes);
    res.json({ success: true, data: result, message: `Claim ${action}ed successfully` });
  } catch (error) {
    console.error("Fraud claim update error:", error);
    res.status(500).json({ success: false, error: "Failed to update fraud claim" });
  }
};

/**
 * GET /admin/dashboard/zone-heatmap
 * Get zone heatmap data
 */
export const getZoneHeatmap = async (req: Request, res: Response) => {
  try {
    const data = await dashboardService.getZoneHeatmap();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Zone heatmap error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch zone heatmap" });
  }
};

/**
 * GET /admin/analytics/loss-metrics
 * Get detailed loss metrics
 */
export const getLossMetrics = async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as "day" | "week" | "month") || "week";
    const metrics = await analyticsService.calculateLossMetrics(timeframe);
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error("Loss metrics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch loss metrics" });
  }
};

/**
 * GET /admin/analytics/triggers
 * Get trigger effectiveness analytics
 */
export const getTriggerAnalytics = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getTriggerAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Trigger analytics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch trigger analytics" });
  }
};

/**
 * GET /admin/analytics/zones
 * Get zone-wise performance metrics
 */
export const getZoneAnalytics = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getZonePerformance();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Zone analytics error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch zone analytics" });
  }
};

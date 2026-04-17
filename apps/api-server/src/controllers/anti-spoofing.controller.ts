import { Request, Response } from "express";
import { antiSpoofingService } from "../services/anti-spoofing.service";
import { prisma } from "../config/db";

export const analyzeSpoofing = async (req: Request, res: Response) => {
  try {
    const { claimId, workerId, deviceFingerprint, photoMetadata, claimLocation, previousLocations } = req.body;

    if (!claimId || !workerId || !deviceFingerprint || !claimLocation) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: claimId, workerId, deviceFingerprint, claimLocation",
      });
    }

    const analysis = await antiSpoofingService.analyzeClaimSpoofing(workerId, {
      claimId,
      deviceFingerprint,
      photoMetadata,
      claimLocation,
      previousLocations,
    });

    // TODO: Save analysis to database when fraudAnalysis model is added to Prisma schema
    // For now, just return the analysis result
    
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("[Spoofing Controller] Error:", error);
    res.status(500).json({
      success: false,
      message: "Spoofing analysis failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getGPSSpoofingReport = async (req: Request, res: Response) => {
  try {
    const { workerId } = req.params;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: "Missing workerId",
      });
    }

    // TODO: Implement when fraudAnalysis model is added
    // For now, return mock data
    
    res.json({
      success: true,
      data: {
        workerId,
        totalAnalyses: 0,
        highRiskCount: 0,
        averageRiskScore: 0,
        riskLevel: "UNKNOWN",
        topFlags: [],
        detailedAnalyses: [],
        message: "Database not yet configured for analysis storage",
      },
    });
  } catch (error) {
    console.error("[GPS Report Controller] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate GPS spoofing report",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getDeviceFingerprintHistory = async (req: Request, res: Response) => {
  try {
    const { workerId } = req.params;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: "Missing workerId",
      });
    }

    // TODO: Implement when claimEvent model is added
    // For now, return mock data
    
    res.json({
      success: true,
      data: {
        workerId,
        uniqueDevices: 0,
        devices: [],
        message: "Database not yet configured for device tracking",
      },
    });
  } catch (error) {
    console.error("[Device History Controller] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve device history",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const analyzeWorkerBehavior = async (req: Request, res: Response) => {
  try {
    const { workerId } = req.params;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: "Missing workerId",
      });
    }

    // Get worker's claims for past 30 days
    const claims = await prisma.claim.findMany({
      where: {
        workerId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate behavioral metrics
    const metrics = {
      totalClaims: claims.length,
      approvedClaims: claims.filter((c) => c.status === "APPROVED").length,
      rejectedClaims: claims.filter((c) => c.status === "REJECTED").length,
      underReviewClaims: claims.filter((c) => c.status === "UNDER_REVIEW").length,
      approvalRate: 0,
      avgClaimAmount: 0,
      claimsByHour: {} as any,
      dailyClaimsDistribution: [] as any,
    };

    if (metrics.totalClaims > 0) {
      metrics.approvalRate = metrics.approvedClaims / metrics.totalClaims;
      metrics.avgClaimAmount =
        claims.reduce((sum, c) => sum + c.claimAmount, 0) / metrics.totalClaims;
    }

    // Analyze by hour
    claims.forEach((c) => {
      const hour = new Date(c.createdAt).getHours();
      metrics.claimsByHour[hour] = (metrics.claimsByHour[hour] || 0) + 1;
    });

    // Analyze by day of week
    const dayStats = {} as any;
    claims.forEach((c) => {
      const day = new Date(c.createdAt).toLocaleDateString();
      dayStats[day] = (dayStats[day] || 0) + 1;
    });
    metrics.dailyClaimsDistribution = Object.entries(dayStats)
      .sort()
      .slice(-7)
      .map(([day, count]) => ({ day, count }));

    // Red flags
    const redFlags = [];
    if (metrics.approvalRate > 0.95) {
      redFlags.push("Suspiciously high approval rate");
    }
    if (
      Object.values(metrics.claimsByHour).some((count: any) => count > 10) &&
      Object.values(metrics.claimsByHour).filter((count: any) => count > 5).length > 2
    ) {
      redFlags.push("Multiple high-volume hours");
    }
    if (metrics.totalClaims > 20 && Object.keys(metrics.claimsByHour).length >= 18) {
      redFlags.push("Claims spread across all hours (unusual pattern)");
    }

    res.json({
      success: true,
      data: {
        workerId,
        period: "Last 30 days",
        metrics,
        redFlags,
      },
    });
  } catch (error) {
    console.error("[Behavior Analysis Controller] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze worker behavior",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

import { prisma } from "../../config/db";

export const analyticsService = {
  /**
   * Calculate detailed loss metrics
   */
  async calculateLossMetrics(timeframe: "day" | "week" | "month" = "week") {
    const startDate = new Date();
    if (timeframe === "day") startDate.setDate(startDate.getDate() - 1);
    else if (timeframe === "week") startDate.setDate(startDate.getDate() - 7);
    else startDate.setMonth(startDate.getMonth() - 1);

    const [policies, claims, payouts] = await Promise.all([
      prisma.policy.findMany({
        where: { status: "ACTIVE" },
        select: { premiumTier: true },
      }),
      prisma.claim.findMany({
        where: { createdAt: { gte: startDate } },
        select: { status: true, fraudScore: true },
      }),
      prisma.payout.findMany({
        where: { createdAt: { gte: startDate } },
        select: { amount: true, status: true },
      }),
    ]);

    const tierMap: any = { BASIC: 49, STANDARD: 89, PREMIUM: 149 };
    const totalPremium = policies.reduce((sum, p) => sum + (tierMap[p.premiumTier] || 0), 0);

    const approvedPayouts = payouts
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const fraudFlags = claims.filter((c) => c.fraudScore && c.fraudScore > 0.65).length;

    return {
      totalPremium,
      totalPayouts: approvedPayouts,
      claimCount: claims.length,
      approvedClaims: claims.filter((c) => c.status === "APPROVED").length,
      fraudFlags,
      burnRate: totalPremium > 0 ? ((approvedPayouts / totalPremium) * 100).toFixed(2) : "0.00",
    };
  },

  /**
   * Get trigger effectiveness scores
   */
  async getTriggerAnalytics() {
    const triggerStats = await prisma.triggerEvent.groupBy({
      by: ["triggerType"],
      _count: { id: true },
      _avg: { workersAffected: true },
    });

    return triggerStats.map((t) => ({
      triggerType: t.triggerType,
      eventCount: t._count.id,
      avgWorkersAffected: Math.round(t._avg.workersAffected || 0),
    }));
  },

  /**
   * Get zone-wise performance metrics
   */
  async getZonePerformance() {
    const zoneData = await prisma.worker.groupBy({
      by: ["zone"],
      _count: { id: true },
      where: { activePolicies: { gt: 0 } },
    });

    const enriched = await Promise.all(
      zoneData.map(async (z) => {
        const claims = await prisma.claim.count({
          where: {
            worker: { zone: z.zone },
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        });

        return {
          zone: z.zone,
          activeWorkers: z._count.id,
          claimsLast30Days: claims,
          claimRate: z._count.id > 0 ? ((claims / z._count.id) * 100).toFixed(2) : "0.00",
        };
      })
    );

    return enriched;
  },
};

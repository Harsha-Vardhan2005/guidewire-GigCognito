import React, { useEffect, useState } from "react";
import { adminAPI } from "../utils/api";
import { DashboardStats } from "../types";
import { TrendingUp, AlertCircle, Users, Zap } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  loading = false,
}) => {
  return (
    <div className="stat-card">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h3 className={`text-3xl font-bold mt-2 ${loading ? "animate-pulse" : ""}`}>
            {loading ? "..." : value}
          </h3>
          {change && (
            <p className={`text-xs mt-2 ${change.includes("+") ? "text-green-400" : "text-red-400"}`}>
              {change}
            </p>
          )}
        </div>
        <div className="text-blue-400 opacity-60">{icon}</div>
      </div>
    </div>
  );
};

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("[DashboardOverview] Fetching stats...");
        const res = await adminAPI.getDashboardStats();
        console.log("[DashboardOverview] Response received:", res);
        
        if (res.success && res.data) {
          setStats(res.data);
          setError(null);
        } else {
          setError(`API returned: ${res.message || "Unknown error"}`);
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error 
          ? error.message 
          : error?.response?.data?.message || String(error);
        console.error("[DashboardOverview] Error fetching dashboard stats:", errorMsg);
        setError(`Error: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!stats && !loading) {
    return (
      <div className="text-red-400 bg-red-900/20 border border-red-700 p-4 rounded">
        {error || "Failed to load dashboard stats"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Active Policies"
        value={stats?.activePolicies.toLocaleString() || "0"}
        change="+312 this week"
        icon={<Users size={24} />}
        loading={loading}
      />
      <StatCard
        title="Weekly Pool"
        value={
          stats
            ? `₹${(stats.weeklyPoolAmount / 100000).toFixed(1)}L`
            : "₹0L"
        }
        change={`Standard & Premium`}
        icon={<TrendingUp size={24} />}
        loading={loading}
      />
      <StatCard
        title="Claims This Week"
        value={stats?.thisWeekClaims || "0"}
        change={`${stats?.reviewClaims || 0} in review`}
        icon={<AlertCircle size={24} />}
        loading={loading}
      />
      <StatCard
        title="Loss Ratio"
        value={stats ? `${(stats.lossRatio * 100).toFixed(0)}%` : "0%"}
        change={`Cap: ${(stats?.lossRatioCap || 0.7) * 100}%`}
        icon={<Zap size={24} />}
        loading={loading}
      />
    </div>
  );
};

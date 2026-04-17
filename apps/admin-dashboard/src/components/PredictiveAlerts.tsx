import React, { useEffect, useState } from "react";
import { adminAPI } from "../utils/api";
import { PredictiveAlert } from "../types";
import { AlertTriangle, Eye } from "lucide-react";

export const PredictiveAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await adminAPI.getPredictiveAlerts();
        if (res.success && res.data) {
          setAlerts(res.data);
        }
      } catch (error) {
        console.error("Error fetching predictive alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getProbabilityColor = (probability: string) => {
    const value = parseInt(probability);
    if (value >= 80) return "text-red-400 bg-red-900/20";
    if (value >= 60) return "text-orange-400 bg-orange-900/20";
    return "text-yellow-400 bg-yellow-900/20";
  };

  return (
    <div className="glass p-6">
      <div className="section-header flex items-center gap-3 mb-4">
        <Eye size={20} className="text-yellow-400" />
        <span>Predictive Alerts — Next 7 Days</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-400"></div>
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No predictive alerts at this time</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-lg hover:border-yellow-500/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-100">{alert.zone}</span>
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                      {alert.event}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${getProbabilityColor(alert.probability)}`}>
                      {alert.probability}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{alert.impact}</p>
                  <p className="text-xs text-gray-500">
                    📅 Expected in {alert.daysOut} day{alert.daysOut > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
        <p className="text-xs text-yellow-300">
          ⚠️ These are ML-powered forecasts based on weather & historical disruption patterns. Verify with external sources before major decisions.
        </p>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { adminAPI } from "../utils/api";
import { ZoneHeatmapData } from "../types";
import { MapPin } from "lucide-react";

export const ZoneHeatmap: React.FC = () => {
  const [zones, setZones] = useState<ZoneHeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await adminAPI.getZoneHeatmap();
        if (res.success && res.data) {
          setZones(res.data);
        }
      } catch (error) {
        console.error("Error fetching zone heatmap:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 60000);
    return () => clearInterval(interval);
  }, []);

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case "HIGH":
        return { bg: "bg-red-900/40", bar: "bg-red-500", text: "text-red-300" };
      case "MEDIUM":
        return { bg: "bg-orange-900/40", bar: "bg-orange-500", text: "text-orange-300" };
      case "LOW":
        return { bg: "bg-blue-900/40", bar: "bg-blue-500", text: "text-blue-300" };
      default:
        return { bg: "bg-gray-900/40", bar: "bg-gray-500", text: "text-gray-300" };
    }
  };

  return (
    <div className="glass p-6">
      <div className="section-header flex items-center gap-3 mb-4">
        <MapPin size={20} className="text-green-400" />
        <span>Zone Disruption Heatmap (24h)</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-400"></div>
        </div>
      ) : zones.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No zone data available</p>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => {
            const colors = getIntensityColor(zone.intensity);
            return (
              <div key={zone.zone} className={`p-3 rounded-lg ${colors.bg} border border-slate-700/50`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-100">{zone.zone}</span>
                  <span className={`text-xs font-bold ${colors.text}`}>
                    {zone.eventCount} events • {zone.intensity}
                  </span>
                </div>
                <div className="relative w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`${colors.bar} h-full rounded-full transition-all`}
                    style={{ width: `${Math.min(zone.risk, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Risk Level: {zone.risk.toFixed(0)}%
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

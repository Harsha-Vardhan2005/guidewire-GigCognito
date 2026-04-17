import React, { useEffect, useState } from "react";
import { adminAPI } from "../utils/api";
import { TriggerEvent } from "../types";
import { Activity, MapPin } from "lucide-react";

export const LiveTriggerEvents: React.FC = () => {
  const [triggers, setTriggers] = useState<TriggerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTriggers = async () => {
      try {
        const res = await adminAPI.getLiveTriggers();
        if (res.success && res.data) {
          setTriggers(res.data);
        }
      } catch (error) {
        console.error("Error fetching triggers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTriggers();
    const interval = setInterval(fetchTriggers, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const getTriggerColor = (type: string) => {
    const colors: any = {
      "T1_RAINFALL": "bg-blue-500/20 text-blue-300",
      "T2_AQI": "bg-orange-500/20 text-orange-300",
      "T3_FLOOD": "bg-indigo-500/20 text-indigo-300",
      "T4_HEATWAVE": "bg-red-500/20 text-red-300",
      "T5_CURFEW": "bg-purple-500/20 text-purple-300",
      "T6_FESTIVAL": "bg-pink-500/20 text-pink-300",
      "T7_OUTAGE": "bg-gray-500/20 text-gray-300",
    };
    return colors[type] || "bg-gray-500/20 text-gray-300";
  };

  return (
    <div className="glass p-6">
      <div className="section-header flex items-center gap-3 mb-4">
        <Activity size={20} className="text-blue-400" />
        <span>Live Trigger Events</span>
        <span className="ml-auto text-sm text-gray-400 font-normal">
          {triggers.length} active
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-400"></div>
        </div>
      ) : triggers.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No active trigger events</p>
      ) : (
        <div className="space-y-3">
          {triggers.map((trigger) => (
            <div
              key={trigger.id}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-3 h-3 rounded-full ${trigger.status === "AUTO" ? "bg-green-400" : "bg-yellow-400"} animate-pulse`}></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-100">{trigger.zone}</span>
                    <span className={`badge text-xs ${getTriggerColor(trigger.type)}`}>
                      {trigger.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {trigger.workersAffected} workers affected
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="badge badge-success text-xs">{trigger.status}</span>
                <p className="text-xs text-blue-300 mt-2 font-semibold">{trigger.confidence}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

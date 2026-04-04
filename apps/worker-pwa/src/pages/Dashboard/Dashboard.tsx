import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  .fade-in { animation: fadeUp 0.35s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .nav-btn { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 16px; border-radius: 8px; transition: background 0.15s; }
  .nav-btn:hover { background: rgba(255,255,255,0.05); }
  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
  .alert-card { animation: slideIn 0.4s ease both; }
  @keyframes slideIn { from{ opacity:0; transform:translateX(-10px); } to{ opacity:1; transform:translateX(0); } }
`;

type DashboardApiResponse = {
  zone: string;
  zoneRisk?: string;
  seasonContext?: string;
  workerName?: string;
  earnedThisWeek?: number;
  claimsThisWeek?: number;
  riskSignals?: string[];
  currentTempC?: number | null;
  currentAqi?: number | null;
  currentRainMm1h?: number | null;
  currentWeatherText?: string | null;
  recentPayouts?: Array<{ amount: number; status: string; trigger: string; date: string }>;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"home"|"policy"|"claims">("home");
  const [dashboardData, setDashboardData] = useState<DashboardApiResponse | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    if (activeTab === "policy") navigate("/policy");
    if (activeTab === "claims") navigate("/claims");
  }, [activeTab]);

  useEffect(() => {
    async function loadDashboard() {
      setLoadingDashboard(true);
      try {
        const token = localStorage.getItem("gs_token");
        const res = await fetch(`${API_BASE}/api/worker-dashboard/overview`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          throw new Error(`Dashboard request failed: ${res.status}`);
        }
        const data = (await res.json()) as DashboardApiResponse;
        setDashboardData(data);
      } catch (err) {
        console.error("[Dashboard] Failed to load dynamic data", err);
        setDashboardData(null);
      } finally {
        setLoadingDashboard(false);
      }
    }

    loadDashboard();
  }, []);

  const currentWorkerName = dashboardData?.workerName || "Worker";
  const currentZone = dashboardData?.zone || "No zone data";
  const currentZoneRisk = (dashboardData?.zoneRisk || "MEDIUM").toUpperCase();
  const currentRisk = {
    label: currentZoneRisk,
    color: currentZoneRisk === "HIGH" ? "#f87171" : currentZoneRisk === "LOW" ? "#1D9E75" : "#facc15",
    bg: currentZoneRisk === "HIGH" ? "rgba(248,113,113,0.12)" : currentZoneRisk === "LOW" ? "rgba(29,158,117,0.12)" : "rgba(250,204,21,0.12)",
    bar: currentZoneRisk === "HIGH" ? 78 : currentZoneRisk === "LOW" ? 32 : 55,
  };
  const currentEarned = dashboardData?.earnedThisWeek ?? 0;
  const currentClaims = dashboardData?.claimsThisWeek ?? 0;
  const dynamicAlerts =
    dashboardData?.riskSignals && dashboardData.riskSignals.length
      ? dashboardData.riskSignals.map((signal, idx) => ({
          id: idx + 1,
          type: signal.toLowerCase().includes("aqi") ? "aqi" : "rain",
          icon: signal.toLowerCase().includes("aqi") ? "😷" : "🌧️",
          title: signal,
          desc: `${signal} detected in ${currentZone}`,
          time: "Live",
          severity: signal.toLowerCase().includes("heavy") ? "high" : "medium",
          payout: null as number | null,
        }))
      : [];
  const dynamicPayouts =
    dashboardData?.recentPayouts && dashboardData.recentPayouts.length
      ? dashboardData.recentPayouts.map((p, idx) => ({
          id: idx + 1,
          date: new Date(p.date).toLocaleDateString(),
          amount: p.amount,
          reason: `Trigger ${p.trigger.slice(0, 8)} — ${currentZone}`,
          status: p.status,
        }))
      : [];

  const liveTemp = dashboardData?.currentTempC;
  const liveAqi = dashboardData?.currentAqi;
  const liveRain = dashboardData?.currentRainMm1h;
  const liveWeatherText = dashboardData?.currentWeatherText || "No weather text available";

  const seasonLabel = dashboardData?.seasonContext || "Risk conditions monitored";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{STYLES}</style>

      {/* Header */}
      <div style={{ padding: "28px 20px 0", maxWidth: 420, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <span style={{ fontFamily: "'Space Mono', monospace", color: "#378ADD", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>KARYAKAVACH</span>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.45)" }}>Hi, {currentWorkerName.split(" ")[0]} 👋</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.3)", borderRadius: 20, padding: "6px 12px" }}>
            <div className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75" }} />
            <span style={{ fontSize: 12, color: "#1D9E75", fontWeight: 600 }}>ACTIVE</span>
          </div>
        </div>

        {/* Zone Risk Card */}
        <div className="fade-in" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Zone Risk Today</p>
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 600, color: "#fff" }}>{currentZone}</p>
            </div>
            <div style={{ background: currentRisk.bg, border: `1px solid ${currentRisk.color}33`, borderRadius: 8, padding: "5px 12px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: currentRisk.color }}>{currentRisk.label} RISK</span>
            </div>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, marginBottom: 8 }}>
            <div style={{ height: 5, width: `${currentRisk.bar}%`, background: `linear-gradient(90deg, #378ADD, ${currentRisk.color})`, borderRadius: 3, transition: "width 1s ease" }} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{seasonLabel} · Triggers checked every 15 min</p>
        </div>

        {/* Live Conditions */}
        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "AQI Now", value: liveAqi === null || liveAqi === undefined ? "--" : `${liveAqi}`, color: "#f97316" },
            { label: "Temp Now", value: liveTemp === null || liveTemp === undefined ? "--" : `${liveTemp.toFixed(1)}°C`, color: "#facc15" },
            { label: "Rain 1h", value: liveRain === null || liveRain === undefined ? "--" : `${liveRain.toFixed(1)}mm`, color: "#38bdf8" },
          ].map(c => (
            <div key={c.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px" }}>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.03em" }}>{c.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 700, color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{liveWeatherText}</p>

        {/* Stats Row */}
        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Earned back this week", value: `₹${currentEarned}`, color: "#1D9E75", mono: true },
            { label: "Claims this week",      value: `${currentClaims} auto-paid`, color: "#378ADD", mono: false },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.color, fontFamily: s.mono ? "'Space Mono', monospace" : "inherit" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Live Alerts */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 10px", letterSpacing: "0.03em" }}>LIVE ZONE ALERTS</p>
        {dynamicAlerts.length === 0 && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>
            No live alerts available yet for this zone.
          </div>
        )}
        {dynamicAlerts.map((a, i) => (
          <div key={a.id} className="alert-card" style={{ background: a.severity === "high" ? "rgba(248,113,113,0.07)" : "rgba(255,200,80,0.07)", border: `1px solid ${a.severity === "high" ? "rgba(248,113,113,0.25)" : "rgba(255,200,80,0.2)"}`, borderRadius: 12, padding: "14px", marginBottom: 10, animationDelay: `${i * 0.1}s` }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{a.title}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{a.time}</span>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{a.desc}</p>
                {a.payout && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#1D9E75", fontWeight: 600 }}>₹{a.payout} auto-credited to your UPI ✓</p>}
              </div>
            </div>
          </div>
        ))}

        {/* Recent Payouts */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "24px 0 10px", letterSpacing: "0.03em" }}>RECENT PAYOUTS</p>
        {dynamicPayouts.length === 0 && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>
            No payout history available for this worker yet.
          </div>
        )}
        {dynamicPayouts.map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, color: "#fff", fontWeight: 500 }}>{p.reason}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{p.date}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1D9E75", fontFamily: "'Space Mono', monospace" }}>+₹{p.amount}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#1D9E75" }}>{p.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AppShell provides bottom nav */}
      {loadingDashboard && (
        <div style={{ position: "fixed", top: 16, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "6px 10px" }}>
            Refreshing live dashboard...
          </div>
        </div>
      )}
    </div>
  );
}
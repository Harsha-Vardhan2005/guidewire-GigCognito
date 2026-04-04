import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  .fade-in { animation: fadeUp 0.35s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .gs-btn { width: 100%; padding: 14px; border-radius: 10px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif; transition: opacity 0.15s; }
  .gs-btn-primary { background: #378ADD; color: #fff; }
  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
`;

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type PolicyTrigger = {
  type: string;
  icon: string;
  label: string;
  desc: string;
  active: boolean;
};

type PolicyOverview = {
  workerName: string;
  hasPolicy: boolean;
  message?: string;
  weekLabel?: string;
  plan?: string;
  weeklyPremium?: number;
  zone?: string;
  maxDailyPayout?: number;
  maxWeeklyPayout?: number;
  validTill?: string;
  claimEligibility?: string;
  payoutMethod?: string;
  coveredTriggers?: PolicyTrigger[];
};

export default function Policy() {
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PolicyOverview | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPolicy() {
      setLoading(true);
      setError(null);
      setRecovering(false);

      try {
        const token = localStorage.getItem("gs_token");

        // If no token, redirect to onboarding
        if (!token) {
          setError("Not authenticated. Completing onboarding...");
          setTimeout(() => navigate("/onboarding"), 1500);
          return;
        }

        const getPolicy = async (): Promise<PolicyOverview> => {
          const res = await fetch(`${API_BASE}/policy/me`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.status === 401) {
            throw new Error("Session expired. Please complete onboarding again.");
          }

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || `Policy request failed (${res.status})`);
          }

          return (await res.json()) as PolicyOverview;
        };

        let data = await getPolicy();

        if (token && !data.hasPolicy) {
          setRecovering(true);
          const repairRes = await fetch(`${API_BASE}/policy/create-or-renew`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ tier: "standard" }),
          });

          if (repairRes.ok) {
            data = await getPolicy();
          }
        }

        setPolicy(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load policy";
        setError(msg);
        if (msg.includes("Session expired") || msg.includes("Not authenticated")) {
          setTimeout(() => navigate("/onboarding"), 2000);
        }
      } finally {
        setRecovering(false);
        setLoading(false);
      }
    }

    loadPolicy();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0E1A", color: "#fff", display: "grid", placeItems: "center" }}>
        {recovering ? "Creating policy..." : "Loading policy..."}
      </div>
    );
  }

  if (error) {
    return <div style={{ minHeight: "100vh", background: "#0A0E1A", color: "#fca5a5", display: "grid", placeItems: "center", padding: 24 }}>{error}</div>;
  }

  if (!policy?.hasPolicy) {
    return <div style={{ minHeight: "100vh", background: "#0A0E1A", color: "#fff", display: "grid", placeItems: "center", padding: 24 }}>{policy?.message || "No active policy found"}</div>;
  }

  const triggers = policy.coveredTriggers || [];
  const validTill = policy.validTill ? new Date(policy.validTill).toLocaleDateString() : "--";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{STYLES}</style>

      <div style={{ padding: "28px 20px 0", maxWidth: 420, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", color: "#378ADD", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>KARYAKAVACH</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.3)", borderRadius: 20, padding: "6px 12px" }}>
            <div className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75" }} />
            <span style={{ fontSize: 12, color: "#1D9E75", fontWeight: 600 }}>ACTIVE</span>
          </div>
        </div>

        <p style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>Your Policy</p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>Member: {policy.workerName || "Worker"}</p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 24px" }}>{policy.weekLabel || "Current weekly policy"}</p>

        <div className="fade-in" style={{ background: "linear-gradient(135deg, rgba(55,138,221,0.15), rgba(29,158,117,0.1))", border: "1px solid rgba(55,138,221,0.25)", borderRadius: 16, padding: "20px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Plan</p>
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: "#fff" }}>{policy.plan}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Weekly Premium</p>
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: "#378ADD", fontFamily: "'Space Mono', monospace" }}>₹{policy.weeklyPremium ?? 0}</p>
            </div>
          </div>

          {[
            ["Zone", policy.zone || "--"],
            ["Max daily payout", `₹${policy.maxDailyPayout ?? 0}/day`],
            ["Max weekly payout", `₹${policy.maxWeeklyPayout ?? 0}/week`],
            ["Policy valid till", validTill],
            ["Claim eligibility", policy.claimEligibility || "--"],
            ["Payout method", policy.payoutMethod || "--"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{k}</span>
              <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 10px", letterSpacing: "0.03em" }}>COVERED TRIGGERS</p>
        {triggers.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${t.active ? "rgba(29,158,117,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, color: t.active ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 500 }}>{t.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{t.desc}</p>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.active ? "#1D9E75" : "rgba(255,255,255,0.15)" }} />
          </div>
        ))}

        <div style={{ marginTop: 16, padding: "14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>NOT COVERED</p>
          {["Health, accidents, hospitalisation", "Vehicle damage or repair", "Low order demand (no trigger)", "Voluntary time off"].map((item) => (
            <p key={item} style={{ margin: "4px 0", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>✕ {item}</p>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <button className="gs-btn gs-btn-primary">Renew for next week — ₹{policy.weeklyPremium ?? 0}</button>
        </div>
      </div>
    </div>
  );
}

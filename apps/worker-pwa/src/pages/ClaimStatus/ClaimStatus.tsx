import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; }

  @keyframes fadeUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes checkIn  { 0% { transform: scale(0.3) rotate(-30deg); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(60px) rotate(720deg); opacity: 0; } }
  @keyframes glow     { 0%,100% { box-shadow: 0 0 16px rgba(29,158,117,0.25); } 50% { box-shadow: 0 0 32px rgba(29,158,117,0.55); } }
  @keyframes shimmer  { from { background-position: -200% center; } to { background-position: 200% center; } }

  .step-row       { display: flex; gap: 14px; align-items: flex-start; }
  .step-icon-wrap { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; }
  .step-icon-done { background: rgba(29,158,117,0.15); border: 1.5px solid rgba(29,158,117,0.5); animation: checkIn 0.4s ease; }
  .step-icon-pending { background: rgba(55,138,221,0.1); border: 1.5px solid rgba(55,138,221,0.4); animation: spin 1s linear infinite; }
  .step-icon-waiting { background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); }
  .step-fade      { animation: fadeUp 0.4s ease both; }

  .upi-bar        { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.08); overflow: hidden; margin-top: 8px; }
  .upi-fill       { height: 100%; border-radius: 2px;
                    background: linear-gradient(90deg, #1D9E75 0%, #378ADD 50%, #1D9E75 100%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s linear infinite; }

  .confetti-dot   { position: absolute; width: 8px; height: 8px; border-radius: 2px;
                    animation: confetti 0.9s ease forwards; }

  .done-card      { animation: glow 2s ease infinite; }
`;

type PipelineStep = {
  id: number;
  emoji: string;
  title: string;
  detail: string;
  status: "done" | "active" | "waiting";
};

type ClaimPayload = {
  triggerType?: string;
  triggerLabel?: string;
  triggerValue?: string;
  sources?: string[];
  zoneId?: string;
  zoneLabel?: string;
  workerName?: string;
  upiId?: string;
  amount?: number;
  tier?: string;
  fraudScore?: number;
};

const TRIGGER_LABELS: Record<string, { emoji: string; label: string; value: string; sources: string[] }> = {
  T1_RAINFALL: { emoji: "🌧️", label: "Heavy Rainfall",     value: "72 mm / 3hr",   sources: ["OWM ✓", "IMD ✓"] },
  T2_AQI:      { emoji: "😷", label: "Severe AQI",         value: "AQI 342",        sources: ["WAQI ✓", "CPCB ✓"] },
  T3_FLOOD:    { emoji: "🌊", label: "Flash Flood",         value: "High waterlog",  sources: ["NDMA ✓", "IMD ✓"] },
  T4_HEATWAVE: { emoji: "🌡️", label: "Heatwave",           value: "43°C",           sources: ["OWM ✓", "IMD ✓"] },
  T5_CURFEW:   { emoji: "🚫", label: "Curfew Order",        value: "Section 144",    sources: ["Police ✓", "News ✓"] },
  T6_FESTIVAL: { emoji: "🎉", label: "Festival Disruption", value: "Ugadi holiday",  sources: ["Calendar ✓", "PMC ✓"] },
  T7_OUTAGE:   { emoji: "⚡", label: "Grid Outage",         value: "Grid score 88",  sources: ["DISCOM ✓"] },
};

const CONFETTI_COLORS = ["#1D9E75", "#378ADD", "#f59e0b", "#f87171", "#a855f7", "#34d399"];

export default function ClaimStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const payload: ClaimPayload = (location.state as ClaimPayload) ?? {};

  const triggerKey = payload.triggerType ?? "T1_RAINFALL";
  const triggerMeta = TRIGGER_LABELS[triggerKey] ?? TRIGGER_LABELS.T1_RAINFALL;

  const triggerLabel  = payload.triggerLabel ?? triggerMeta.label;
  const triggerValue  = payload.triggerValue ?? triggerMeta.value;
  const sources       = payload.sources      ?? triggerMeta.sources;
  const zoneLabel     = payload.zoneLabel    ?? "Koramangala";
  const workerName    = payload.workerName   ?? "Rajan Kumar";
  const upiId         = payload.upiId        ?? "rajan@phonepe";
  const amount        = payload.amount       ?? 416;
  const fraudScore    = payload.fraudScore   ?? 0.09;
  const tier          = payload.tier         ?? "standard";

  const tierHours: Record<string, number> = { basic: 4, standard: 8, premium: 12 };
  const hourlyRate = Math.round(amount / (tierHours[tier] ?? 8));

  const TOTAL_STEPS = 6;
  const [stepsDone, setStepsDone] = useState(0);
  const [done, setDone] = useState(false);
  const [upiProgress, setUpiProgress] = useState(0);

  useEffect(() => {
    if (stepsDone >= TOTAL_STEPS) { setDone(true); return; }
    const delays = [800, 1200, 1000, 1100, 2200, 900];
    const delay = delays[stepsDone] ?? 900;
    const timer = setTimeout(() => setStepsDone((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [stepsDone]);

  // Animate UPI progress bar when on step 5 (index 4)
  useEffect(() => {
    if (stepsDone !== 5) return;
    let frame = 0;
    const interval = setInterval(() => {
      frame += 3;
      setUpiProgress(Math.min(frame, 100));
      if (frame >= 100) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [stepsDone]);

  const steps: PipelineStep[] = [
    {
      id: 1,
      emoji: triggerMeta.emoji,
      title: `${triggerLabel} confirmed`,
      detail: `${triggerValue} — ${sources.join(" + ")}`,
      status: stepsDone >= 1 ? "done" : stepsDone === 0 ? "active" : "waiting",
    },
    {
      id: 2,
      emoji: "📍",
      title: "Zone matched",
      detail: `Your policy covers ${zoneLabel} ✓`,
      status: stepsDone >= 2 ? "done" : stepsDone === 1 ? "active" : "waiting",
    },
    {
      id: 3,
      emoji: "✅",
      title: "Eligibility confirmed",
      detail: "Active policy · No duplicate claim this week ✓",
      status: stepsDone >= 3 ? "done" : stepsDone === 2 ? "active" : "waiting",
    },
    {
      id: 4,
      emoji: "🔍",
      title: "Fraud check passed",
      detail: `Score ${(fraudScore * 100).toFixed(0)}% — GPS ✓  Motion ✓  Platform ✓`,
      status: stepsDone >= 4 ? "done" : stepsDone === 3 ? "active" : "waiting",
    },
    {
      id: 5,
      emoji: "💸",
      title: `Sending ₹${amount.toLocaleString()} → ${upiId}`,
      detail: stepsDone >= 5 ? "Transfer initiated via UPI" : "Preparing UPI transfer…",
      status: stepsDone >= 5 ? "done" : stepsDone === 4 ? "active" : "waiting",
    },
    {
      id: 6,
      emoji: "🎯",
      title: `₹${amount.toLocaleString()} credited`,
      detail: "Average delivery 2–7 minutes · Zero paperwork",
      status: stepsDone >= 6 ? "done" : stepsDone === 5 ? "active" : "waiting",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", fontFamily: "'DM Sans', system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{STYLES}</style>

      {/* Confetti burst when done */}
      {done && (
        <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)", pointerEvents: "none", zIndex: 100 }}>
          {CONFETTI_COLORS.map((color, i) => (
            <div
              key={i}
              className="confetti-dot"
              style={{
                background: color,
                left: `${-60 + i * 24}px`,
                animationDelay: `${i * 80}ms`,
                animationDuration: `${0.8 + i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      <div style={{ padding: "28px 20px", maxWidth: 420, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", color: "#378ADD", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>KARYAKAVACH</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Zero-Touch Claim</span>
        </div>

        {/* Title bar */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#fff" }}>
            {done ? "Claim processed ✓" : "Processing your claim…"}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
            {done
              ? `₹${amount.toLocaleString()} en route to ${upiId}`
              : `Automated pipeline running · ${workerName}`}
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
          {steps.map((step) => {
            const visible = step.id <= stepsDone + 1;
            if (!visible) return null;

            const iconClass =
              step.status === "done"    ? "step-icon-wrap step-icon-done"    :
              step.status === "active"  ? "step-icon-wrap step-icon-pending" :
              "step-icon-wrap step-icon-waiting";

            return (
              <div key={step.id} className={`step-row step-fade`} style={{ animationDelay: `${(step.id - 1) * 0.02}s` }}>
                <div className={iconClass} style={{ opacity: step.status === "waiting" ? 0.35 : 1 }}>
                  {step.status === "active"
                    ? <div style={{ width: 18, height: 18, border: "2.5px solid #378ADD", borderTopColor: "transparent", borderRadius: "50%" }} />
                    : <span>{step.emoji}</span>}
                </div>
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: step.status === "done" ? 500 : 400, color: step.status === "waiting" ? "rgba(255,255,255,0.25)" : "#fff" }}>
                    {step.title}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    {step.detail}
                  </p>
                  {/* UPI progress bar for step 5 */}
                  {step.id === 5 && step.status === "done" && (
                    <div className="upi-bar" style={{ width: `${upiProgress}%`, transition: "width 0.05s linear" }}>
                      <div className="upi-fill" style={{ width: "100%" }} />
                    </div>
                  )}
                </div>
                {step.status === "done" && (
                  <span style={{ color: "#1D9E75", fontSize: 18, paddingTop: 6, flexShrink: 0 }}>✓</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Done card */}
        {done && (
          <div
            className="done-card step-fade"
            style={{
              background: "rgba(29,158,117,0.1)",
              border: "1.5px solid rgba(29,158,117,0.35)",
              borderRadius: 16,
              padding: "20px 20px",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Amount credited</p>
                <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#1D9E75", fontFamily: "'Space Mono', monospace" }}>
                  ₹{amount.toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Rate</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff" }}>₹{hourlyRate}/hr</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{tierHours[tier] ?? 8} hrs · {tier}</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12, display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Trigger</p>
                <p style={{ margin: 0, fontSize: 13, color: "#fff" }}>{triggerMeta.emoji} {triggerLabel}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Zone</p>
                <p style={{ margin: 0, fontSize: 13, color: "#fff" }}>📍 {zoneLabel}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Delivery</p>
                <p style={{ margin: 0, fontSize: 13, color: "#fff" }}>2–7 min avg</p>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline time callout */}
        {done && (
          <div className="step-fade" style={{ background: "rgba(55,138,221,0.07)", border: "1px solid rgba(55,138,221,0.15)", borderRadius: 10, padding: "12px 14px", marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              <span style={{ color: "#378ADD", fontWeight: 600 }}>6-step automated pipeline</span> —
              trigger verification → zone match → eligibility → fraud screen → UPI transfer.
              No forms. No calls. No waiting.
            </p>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate("/claims")}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.12)",
              background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            View history
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 10, border: "none",
              background: done ? "#1D9E75" : "rgba(55,138,221,0.3)", color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "background 0.3s",
            }}
          >
            {done ? "Back to home" : "Running…"}
          </button>
        </div>
      </div>
    </div>
  );
}

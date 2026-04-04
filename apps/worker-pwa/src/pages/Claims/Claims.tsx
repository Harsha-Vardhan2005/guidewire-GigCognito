import { useState } from "react";
import { useNavigate } from "react-router-dom";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  .fade-in { animation: fadeUp 0.35s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .nav-btn { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 16px; border-radius: 8px; transition: background 0.15s; }
  .claim-row { border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; cursor: pointer; }
  .claim-row:hover { background: rgba(255,255,255,0.02); }
  .tab-btn { flex: 1; padding: 9px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif; border-radius: 8px; transition: all 0.15s; }
`;

const CLAIMS = [
  { id: "CLM-001", date: "Apr 4, 2026",  time: "11:07 AM", trigger: "Heavy Rainfall",    zone: "Koramangala", amount: 416, status: "PAID",     hours: 8, icon: "🌧️", fraudScore: 0.12, sources: ["OWM ✓", "IMD ✓"] },
  { id: "CLM-002", date: "Apr 1, 2026",  time: "02:14 PM", trigger: "Heavy Rainfall",    zone: "Koramangala", amount: 416, status: "PAID",     hours: 8, icon: "🌧️", fraudScore: 0.09, sources: ["OWM ✓", "IMD ✓"] },
  { id: "CLM-003", date: "Mar 28, 2026", time: "09:30 AM", trigger: "Severe AQI (412)",  zone: "Koramangala", amount: 280, status: "PAID",     hours: 4, icon: "😷", fraudScore: 0.08, sources: ["WAQI ✓", "CPCB ✓"] },
  { id: "CLM-004", date: "Mar 22, 2026", time: "06:05 PM", trigger: "Festival Blockage", zone: "Koramangala", amount: 208, status: "PAID",     hours: 4, icon: "🎉", fraudScore: 0.05, sources: ["PMC ✓", "Zone ✓"] },
  { id: "CLM-005", date: "Mar 19, 2026", time: "03:45 PM", trigger: "AQI Advisory",      zone: "Koramangala", amount: 0,   status: "REJECTED", hours: 0, icon: "😷", fraudScore: 0.82, sources: ["WAQI ✓", "CPCB ✗"] },
];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PAID:       { color: "#1D9E75", bg: "rgba(29,158,117,0.12)"  },
  PENDING:    { color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  REJECTED:   { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  REVIEWING:  { color: "#378ADD", bg: "rgba(55,138,221,0.12)"  },
};

export default function Claims() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"ALL"|"PAID"|"REJECTED">("ALL");
  const [expanded, setExpanded] = useState<string|null>(null);

  const filtered = filter === "ALL" ? CLAIMS : CLAIMS.filter(c => c.status === filter);
  const totalPaid = CLAIMS.filter(c => c.status === "PAID").reduce((s, c) => s + c.amount, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{STYLES}</style>

      <div style={{ padding: "28px 20px 0", maxWidth: 420, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", color: "#378ADD", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>KARYAKAVACH</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Claims History</span>
        </div>

        {/* Summary */}
        <div className="fade-in" style={{ background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Total earned back this month</p>
          <p style={{ margin: "0 0 12px", fontSize: 32, fontWeight: 700, color: "#1D9E75", fontFamily: "'Space Mono', monospace" }}>₹{totalPaid.toLocaleString()}</p>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Auto-paid claims</p>
              <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: "#fff" }}>{CLAIMS.filter(c => c.status === "PAID").length}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Zero paperwork filed</p>
              <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: "#fff" }}>0 forms</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Avg payout time</p>
              <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: "#fff" }}>~7 min</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
          {(["ALL", "PAID", "REJECTED"] as const).map(f => (
            <button key={f} className="tab-btn"
              style={{ background: filter === f ? "rgba(55,138,221,0.2)" : "transparent", color: filter === f ? "#378ADD" : "rgba(255,255,255,0.4)" }}
              onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {/* Claims List */}
        {filtered.map((c, i) => {
          const st = STATUS_STYLE[c.status];
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className="claim-row fade-in" style={{ animationDelay: `${i * 0.05}s`, borderRadius: isOpen ? 12 : 0, border: isOpen ? "1px solid rgba(55,138,221,0.2)" : "none", marginBottom: isOpen ? 8 : 0, background: isOpen ? "rgba(55,138,221,0.05)" : "transparent" }}
              onClick={() => setExpanded(isOpen ? null : c.id)}>

              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#fff" }}>{c.trigger}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{c.date} · {c.time}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  {c.amount > 0 && <p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, color: "#1D9E75", fontFamily: "'Space Mono', monospace" }}>+₹{c.amount}</p>}
                  <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: st.bg, padding: "2px 8px", borderRadius: 10 }}>{c.status}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="fade-in" style={{ padding: "0 4px 14px" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "12px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>CLAIM DETAILS</p>
                    {[
                      ["Claim ID",       c.id],
                      ["Zone",           c.zone],
                      ["Hours affected", c.hours > 0 ? `${c.hours} hours` : "—"],
                      ["Data sources",   c.sources.join("  ")],
                      ["Fraud score",    c.fraudScore < 0.5 ? `${c.fraudScore} — Clean ✓` : `${c.fraudScore} — Flagged ⚠`],
                      ["Process",        "Zero-touch auto-claim"],
                    ].map(([k, v]) => (
                      <div key={k as string} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{k}</span>
                        <span style={{ fontSize: 12, color: (k as string) === "Fraud score" && c.fraudScore >= 0.5 ? "#f87171" : "#fff", fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                    {c.status === "REJECTED" && (
                      <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(248,113,113,0.08)", borderRadius: 6, border: "1px solid rgba(248,113,113,0.2)" }}>
                        <p style={{ margin: 0, fontSize: 12, color: "#f87171" }}>CPCB second source did not confirm AQI ≥ 400. Dual-source rule not met. <span style={{ textDecoration: "underline", cursor: "pointer" }}>Appeal within 72 hrs →</span></p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 20 }}>All claims are fully automated. You never need to file anything.</p>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,14,26,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-around", padding: "8px 0 12px" }}>
        {[
          { id: "home",   icon: "⊞", label: "Home",   path: "/dashboard" },
          { id: "policy", icon: "🛡", label: "Policy",  path: "/policy"    },
          { id: "claims", icon: "💸", label: "Claims",  path: "/claims"    },
        ].map(n => (
          <button key={n.id} className="nav-btn" onClick={() => navigate(n.path)}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 11, color: n.id === "claims" ? "#378ADD" : "rgba(255,255,255,0.35)", fontWeight: n.id === "claims" ? 600 : 400 }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
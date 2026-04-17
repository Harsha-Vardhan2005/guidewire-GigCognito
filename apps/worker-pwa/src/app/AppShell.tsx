import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  .fade-in { animation: fadeUp 0.35s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .nav-btn { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 16px; border-radius: 8px; transition: background 0.15s; }
  .nav-btn:hover { background: rgba(255,255,255,0.05); }
`;

const NAV = [
  { id: "home", icon: "⊞", label: "Home", path: "/dashboard" },
  { id: "policy", icon: "�", label: "Policy", path: "/policy" },
  { id: "claims", icon: "💸", label: "Claims", path: "/claims" },
  { id: "vote", icon: "🗳️", label: "Vote", path: "/community-triggers" },
  { id: "transparency", icon: "👁️", label: "Transparency", path: "/transparency-dashboard" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{STYLES}</style>
      <div style={{ minHeight: "calc(100vh - 60px)" }}>{children}</div>
      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,14,26,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 50 }}>
        {NAV.map(n => (
          <button key={n.id} className="nav-btn" onClick={() => navigate(n.path)}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 11, color: location.pathname === n.path ? "#378ADD" : "rgba(255,255,255,0.35)", fontWeight: location.pathname === n.path ? 600 : 400 }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

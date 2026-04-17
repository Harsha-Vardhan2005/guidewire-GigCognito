import React, { useEffect, useState } from "react";

interface Proposal {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: string;
  createdAt: string;
  newsVerified?: boolean;
  twitterVerified?: boolean;
  twitterConfidence?: number;
  newsEvidence?: string[];
  twitterEvidence?: string[];
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  APPROVED: { label: "Approved", dot: "#1D9E75", text: "#5DCAA5", bg: "rgba(29,158,117,0.10)", border: "rgba(29,158,117,0.25)" },
  UNDER_REVIEW: { label: "Under review", dot: "#378ADD", text: "#85B7EB", bg: "rgba(55,138,221,0.10)", border: "rgba(55,138,221,0.30)" },
  LESS_VOTES: { label: "Less votes", dot: "#EF9F27", text: "#FAC775", bg: "rgba(239,159,39,0.10)", border: "rgba(239,159,39,0.25)" },
  REJECTED: { label: "Rejected",  dot: "#D85A30", text: "#F0997B", bg: "rgba(216,90,48,0.10)",  border: "rgba(216,90,48,0.25)"  },
};

function getStatus(s: string) {
  return STATUS_CONFIG[s?.toUpperCase()] ?? STATUS_CONFIG.LESS_VOTES;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TRIGGER_TYPES = ["Waterlogging", "AQI / Pollution", "Rainfall", "Curfew / Bandh", "Heatwave", "Festival blockage", "App outage", "Other"];

export default function CommunityTriggersPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "UNDER_REVIEW" | "LESS_VOTES" | "REJECTED">("ALL");
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("gs_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    async function load() {
      setLoadingList(true);
      try {
        const res = await fetch(`${API_BASE}/api/community-triggers/list`, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setProposals(data);
        }
      } catch {
        setError("Unable to load reports right now.");
      }
      finally { setLoadingList(false); }
    }
    load();
  }, []);

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/community-triggers/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title, description, triggerType }),
      });
      const data = await res.json();
      if (res.ok) {
        const verificationMsg = data.newsVerified && data.twitterVerified 
          ? "Posted. Verified by News & Twitter ✓" 
          : data.newsVerified 
          ? "Posted. Verified by News ✓"
          : data.twitterVerified 
          ? `Posted. Verified by Twitter (${Math.round(data.twitterConfidence * 100)}%) ✓`
          : "Posted. Under review.";
        setSuccess(verificationMsg);
        setProposals(p => [data, ...p]);
        setTitle(""); setDescription(""); setTriggerType(""); setFormOpen(false);
      } else {
        setError(typeof data?.error === "string" ? data.error : "Unable to submit report.");
      }
    } catch {
      setError("Unable to submit report.");
    }
    setLoading(false);
  }

  async function handleVote(id: string) {
    if (votedIds.has(id)) return;
    try {
      const res = await fetch(`${API_BASE}/api/community-triggers/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ proposalId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setVotedIds(s => new Set([...s, id]));
        setProposals(p => p.map(pr => (pr.id === id ? data : pr)));
      } else {
        setError(typeof data?.error === "string" ? data.error : "Unable to cast vote.");
      }
    } catch {
      setError("Unable to cast vote.");
    }
  }

  const filtered = proposals
    .filter(p => filter === "ALL" || p.status.toUpperCase() === filter)
    .sort((a, b) => b.votes - a.votes);

  const counts = {
    ALL: proposals.length,
    UNDER_REVIEW: proposals.filter(p => p.status.toUpperCase() === "UNDER_REVIEW").length,
    LESS_VOTES: proposals.filter(p => p.status.toUpperCase() === "LESS_VOTES").length,
    REJECTED: proposals.filter(p => p.status.toUpperCase() === "REJECTED").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080B14", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .gs-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; padding: 12px 14px; color: #fff; font-size: 14px; font-family: 'DM Sans', system-ui, sans-serif; outline: none; transition: border-color 0.2s, background 0.2s; resize: none; }
        .gs-input:focus { border-color: rgba(55,138,221,0.6); background: rgba(55,138,221,0.05); }
        .gs-input::placeholder { color: rgba(255,255,255,0.25); }
        .gs-select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; padding: 12px 14px; color: #fff; font-size: 14px; font-family: 'DM Sans', system-ui, sans-serif; outline: none; appearance: none; cursor: pointer; }
        .gs-select option { background: #141824; }
        .btn-primary { background: #378ADD; color: #fff; border: none; border-radius: 10px; padding: 12px 20px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif; transition: opacity 0.15s, transform 0.1s; width: 100%; }
        .btn-primary:hover { opacity: 0.88; }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-ghost { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif; transition: background 0.15s; width: 100%; }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); }
        .filter-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.10); background: transparent; color: rgba(255,255,255,0.45); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', system-ui, sans-serif; white-space: nowrap; }
        .filter-btn.active { background: rgba(55,138,221,0.15); border-color: rgba(55,138,221,0.4); color: #85B7EB; }
        .vote-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'Space Mono', monospace; display: flex; align-items: center; gap: 6px; }
        .vote-btn:hover:not(:disabled) { border-color: rgba(29,158,117,0.5); background: rgba(29,158,117,0.1); color: #5DCAA5; }
        .vote-btn.voted { border-color: rgba(29,158,117,0.4); background: rgba(29,158,117,0.12); color: #5DCAA5; cursor: default; }
        .vote-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px; transition: border-color 0.2s; }
        .card:hover { border-color: rgba(255,255,255,0.13); }
        .propose-btn { display: flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 10px; border: 1px dashed rgba(55,138,221,0.35); background: rgba(55,138,221,0.07); color: #85B7EB; font-size: 14px; font-weight: 500; cursor: pointer; width: 100%; font-family: 'DM Sans', system-ui, sans-serif; transition: all 0.15s; justify-content: center; }
        .propose-btn:hover { background: rgba(55,138,221,0.12); border-color: rgba(55,138,221,0.5); }
        .slide-in { animation: slideIn 0.3s ease both; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .rank-bar { height: 2px; background: rgba(55,138,221,0.25); border-radius: 1px; margin-top: 10px; overflow: hidden; }
        .rank-fill { height: 100%; background: linear-gradient(90deg, #1D9E75, #378ADD); border-radius: 1px; transition: width 0.6s ease; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#378ADD", fontWeight: 700, letterSpacing: "0.1em", background: "rgba(55,138,221,0.1)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(55,138,221,0.2)" }}>KARYAKAVACH</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>COMMUNITY</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 8 }}>Trigger board</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Report disruptions in your zone. Proposals with enough community votes are reviewed for automatic payout triggers.</p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total reports", val: proposals.length, color: "#378ADD" },
            { label: "Under review", val: counts.UNDER_REVIEW, color: "#1D9E75" },
            { label: "Less votes", val: counts.LESS_VOTES, color: "#EF9F27" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{s.val}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Propose button / form */}
        {!formOpen ? (
          <button className="propose-btn" style={{ marginBottom: 24 }} onClick={() => setFormOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Report a disruption in your zone
          </button>
        ) : (
          <div className="card slide-in" style={{ marginBottom: 24, borderColor: "rgba(55,138,221,0.2)" }}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>New disruption report</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 18, lineHeight: 1.5 }}>Be specific — include location, time, and how it's affecting deliveries.</p>
            <form onSubmit={handlePropose} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Disruption type</p>
                <select className="gs-select" value={triggerType} onChange={e => setTriggerType(e.target.value)} required>
                  <option value="" disabled>Select type</option>
                  {TRIGGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Title</p>
                <input className="gs-input" placeholder="e.g. Waterlogging near Andheri East depot" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Details</p>
                <textarea className="gs-input" placeholder="Describe what happened, where, and the delivery impact" value={description} onChange={e => setDescription(e.target.value)} required rows={3} />
              </div>
              {error && <p style={{ fontSize: 12, color: "#F0997B" }}>{error}</p>}
              {success && <p style={{ fontSize: 12, color: "#5DCAA5" }}>{success}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? "Submitting…" : "Submit report"}</button>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setFormOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", paddingBottom: 2 }}>
          {(["ALL", "UNDER_REVIEW", "LESS_VOTES", "REJECTED"] as const).map(f => (
            <button key={f} className={`filter-btn${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
              {f === "ALL" ? `All (${counts.ALL})` : f === "UNDER_REVIEW" ? `Under review (${counts.UNDER_REVIEW})` : f === "LESS_VOTES" ? `Less votes (${counts.LESS_VOTES})` : `Rejected (${counts.REJECTED})`}
            </button>
          ))}
        </div>

        {/* List */}
        {loadingList && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>Loading reports…</div>
        )}

        {!loadingList && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>No reports yet. Be the first to flag a disruption.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((p, i) => {
            const cfg = getStatus(p.status);
            const maxVotes = Math.max(...proposals.map(x => x.votes), 1);
            const voted = votedIds.has(p.id);
            return (
              <div key={p.id} className="card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace" }}>{timeAgo(p.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, marginBottom: 6, color: "#fff" }}>{p.title}</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{p.description}</p>
                    
                    {/* Verification badges */}
                    {(p.newsVerified || p.twitterVerified) && (
                      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                        {p.newsVerified && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 14, background: "rgba(29,158,117,0.15)", color: "#5DCAA5", border: "1px solid rgba(29,158,117,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            News verified
                          </span>
                        )}
                        {p.twitterVerified && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 14, background: "rgba(100,149,237,0.15)", color: "#85B7EB", border: "1px solid rgba(100,149,237,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7"/></svg>
                            Twitter verified {p.twitterConfidence && `(${Math.round(p.twitterConfidence * 100)}%)`}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="rank-bar">
                      <div className="rank-fill" style={{ width: `${Math.round((p.votes / maxVotes) * 100)}%` }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button className={`vote-btn${voted ? " voted" : ""}`} onClick={() => handleVote(p.id)} disabled={voted}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                      {p.votes}
                    </button>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>votes</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        {filtered.length > 0 && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 28, lineHeight: 1.7 }}>
            Reports are verified against news feeds (NewsData.io) and real-time social media (Twitter). Approved if verified by either source. Reports with 50%+ zone votes move to automatic review.
          </p>
        )}
      </div>
    </div>
  );
}
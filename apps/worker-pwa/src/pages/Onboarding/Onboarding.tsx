import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const CITIES = [
  { label: "Bengaluru", zones: [{ id: "BLR_KOR_01", label: "Koramangala" }, { id: "BLR_HSR_01", label: "HSR Layout" }, { id: "BLR_IND_01", label: "Indiranagar" }] },
  { label: "Delhi",     zones: [{ id: "DEL_DWK_01", label: "Dwarka" },      { id: "DEL_NOR_01", label: "Noida Sector 18" }] },
  { label: "Mumbai",    zones: [{ id: "MUM_ANH_01", label: "Andheri" },     { id: "MUM_BAN_01", label: "Bandra" }] },
  { label: "Pune",      zones: [{ id: "PNE_KSB_01", label: "Kasba Peth" },  { id: "PNE_KHR_01", label: "Kharadi" }] },
];

const TIERS = [
  { id: "basic",    label: "Basic",    base: 49,  payout: "₹280/day", color: "#1D9E75" },
  { id: "standard", label: "Standard", base: 89,  payout: "₹416/day", color: "#378ADD" },
  { id: "premium",  label: "Premium",  base: 149, payout: "₹560/day", color: "#7F77DD" },
];

const SEASONS: Record<string, string> = {
  BLR_KOR_01: "monsoon", BLR_HSR_01: "monsoon", BLR_IND_01: "monsoon",
  DEL_DWK_01: "delhi_aqi", DEL_NOR_01: "delhi_aqi",
  MUM_ANH_01: "monsoon", MUM_BAN_01: "monsoon",
  PNE_KSB_01: "normal", PNE_KHR_01: "normal",
};

interface Quote { basePremium: number; seasonalAdj: number; zoneAdj: number; tenureDiscount: number; noClaimDiscount: number; finalPremium: number; breakdown: string; }

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [platformId, setPlatformId] = useState("");
  const [platform, setPlatform] = useState("Zepto");
  const [city, setCity] = useState(0);
  const [zone, setZone] = useState("");
  const [earnings, setEarnings] = useState("");
  const [tier, setTier] = useState("standard");
  const [upiId, setUpiId] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const navigate = useNavigate();
  const zones = CITIES[city].zones;

  useEffect(() => {
    if (step === 4 && zone && tier) fetchQuote();
  }, [step, zone, tier]);

  async function fetchQuote() {
    setLoadingQuote(true);
    try {
      const res = await fetch(`${API_BASE}/policy/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          season: SEASONS[zone] ?? "normal",
          zoneRisk: zone.startsWith("DEL") || zone.startsWith("BLR_KOR") ? "HIGH" : "MEDIUM",
          tenureMonths: 0,
          claimsLast4Weeks: 0,
        }),
      });
      const data = await res.json();
      setQuote(data);
    } catch {
      setQuote({ basePremium: 35, seasonalAdj: 0, zoneAdj: 0, tenureDiscount: 0, noClaimDiscount: 0, finalPremium: 89, breakdown: "Offline estimate" });
    } finally {
      setLoadingQuote(false);
    }
  }

  async function sendOtp() {
    if (phone.length !== 10) { setErrors({ phone: "Enter 10-digit mobile number" }); return; }
    setErrors({});
    setSendingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        // In dev mode, backend returns the OTP — auto-fill for demo
        if (data.otp) {
          const digits = data.otp.split("");
          setOtp(digits);
        }
      } else {
        setErrors({ phone: data.message });
      }
    } catch {
      // Fallback to mock if backend unreachable
      setOtpSent(true);
    } finally {
      setSendingOtp(false);
    }
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 3) otpRefs[i + 1].current?.focus();
  }

  async function verifyOtp() {
    if (otp.join("").length !== 4) { setErrors({ otp: "Enter 4-digit OTP" }); return; }
    setErrors({});
    setVerifyingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otp.join("") }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) localStorage.setItem("gs_token", data.token);
        setStep(1);
      } else {
        setErrors({ otp: data.message });
      }
    } catch {
      // Fallback to mock
      setStep(1);
    } finally {
      setVerifyingOtp(false);
    }
  }

  function goStep2() {
    if (!name.trim()) { setErrors({ name: "Enter your full name" }); return; }
    if (!platformId.trim()) { setErrors({ platformId: "Enter your delivery partner ID" }); return; }
    setErrors({});
    setStep(2);
  }

  function goStep3() {
    if (!zone) { setErrors({ zone: "Select your zone" }); return; }
    setErrors({});
    setStep(3);
  }

  function goStep4() {
    if (!earnings) { setErrors({ earnings: "Select your earnings bracket" }); return; }
    setErrors({});
    setStep(4);
  }

  function goStep5() { setStep(5); }

  async function finish() {
    if (!upiId.trim()) { setErrors({ upiId: "Enter your UPI ID" }); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const token = localStorage.getItem("gs_token");

      // Step 1: Update worker profile with zone + UPI
      const profileRes = await fetch(`${API_BASE}/worker/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          city: CITIES[city].label,
          zoneId: zone,
          platformId: `${platform}:${platformId}`,
          upiId,
        }),
      });

      if (!profileRes.ok) {
        const err = await profileRes.json().catch(() => ({}));
        throw new Error(err.message || `Profile update failed (${profileRes.status})`);
      }

      // Step 2: Create or renew policy
      const policyRes = await fetch(`${API_BASE}/policy/create-or-renew`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier }),
      });

      if (!policyRes.ok) {
        const err = await policyRes.json().catch(() => ({}));
        throw new Error(err.message || `Policy creation failed (${policyRes.status})`);
      }

      // Success - go to dashboard
      navigate("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Onboarding setup failed";
      setErrors({ submit: msg });
      console.error("[Onboarding]", msg);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = done ? 100 : Math.round((step / 6) * 100);

  if (done) return <SuccessScreen workerName={name.trim() || "Partner"} zone={zones.find(z => z.id === zone)?.label ?? zone} premium={quote?.finalPremium ?? 89} tier={tier} />;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", fontFamily: "'DM Sans', system-ui, sans-serif", padding: "0 0 40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        .gs-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 13px 16px; color: #fff; font-size: 15px; font-family: 'DM Sans', system-ui, sans-serif; outline: none; transition: border-color 0.2s; }
        .gs-input:focus { border-color: rgba(55,138,221,0.7); }
        .gs-input::placeholder { color: rgba(255,255,255,0.3); }
        .gs-btn { width: 100%; padding: 14px; border-radius: 10px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif; transition: opacity 0.15s, transform 0.1s; }
        .gs-btn:active { transform: scale(0.98); }
        .gs-btn-primary { background: #378ADD; color: #fff; }
        .gs-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .gs-btn-ghost { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1); }
        .gs-select { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 13px 16px; color: #fff; font-size: 15px; font-family: 'DM Sans', system-ui, sans-serif; outline: none; appearance: none; cursor: pointer; }
        .gs-select option { background: #1a1f2e; }
        .zone-chip { padding: 10px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', system-ui, sans-serif; }
        .zone-chip.active { border-color: #378ADD; background: rgba(55,138,221,0.15); color: #fff; }
        .earn-chip { padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer; transition: all 0.15s; text-align: center; font-family: 'DM Sans', system-ui, sans-serif; }
        .earn-chip.active { border-color: #1D9E75; background: rgba(29,158,117,0.15); color: #fff; }
        .tier-card { padding: 16px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); cursor: pointer; transition: all 0.15s; }
        .tier-card.active { background: rgba(55,138,221,0.1); }
        .otp-box { width: 52px; height: 56px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #fff; font-size: 22px; font-weight: 700; text-align: center; font-family: 'Space Mono', monospace; outline: none; transition: border-color 0.2s; }
        .otp-box:focus { border-color: #378ADD; }
        .plat-btn { flex: 1; padding: 11px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); font-size: 14px; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', system-ui, sans-serif; font-weight: 500; }
        .plat-btn.active { border-color: #378ADD; background: rgba(55,138,221,0.15); color: #fff; }
        .err { color: #f09595; font-size: 12px; margin-top: 4px; }
        .label { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 7px; letter-spacing: 0.03em; }
        .fade-in { animation: fadeUp 0.35s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>
        <div style={{ paddingTop: 28, paddingBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", color: "#378ADD", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>KARYAKAVACH</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace" }}>{step}/5</span>
          </div>
          <div style={{ height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
            <div style={{ height: 2, width: `${progress}%`, background: "linear-gradient(90deg,#1D9E75,#378ADD)", borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>
        </div>

        {step === 0 && (
          <div className="fade-in">
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 26, fontWeight: 600, color: "#fff", lineHeight: 1.3, margin: "0 0 8px" }}>Income protection for delivery partners</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>Zero forms. Instant UPI payout when your zone is disrupted.</p>
            </div>
            {!otpSent ? (
              <>
                <p className="label">Mobile number</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "13px 14px", color: "rgba(255,255,255,0.5)", fontSize: 15, whiteSpace: "nowrap" }}>+91</div>
                  <input className="gs-input" placeholder="98765 43210" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} style={{ flex: 1 }} />
                </div>
                {errors.phone && <p className="err">{errors.phone}</p>}
                <button className="gs-btn gs-btn-primary" style={{ marginTop: 20 }} 
                  onClick={sendOtp} disabled={sendingOtp}>
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <p className="label">Enter 4-digit OTP sent to +91 {phone}</p>
                <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                  {otp.map((v, i) => (
                    <input key={i} ref={otpRefs[i]} className="otp-box" maxLength={1} value={v}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => { if (e.key === "Backspace" && !v && i > 0) otpRefs[i-1].current?.focus(); }} />
                  ))}
                </div>
                {errors.otp && <p className="err">{errors.otp}</p>}
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "8px 0 0" }}>Demo: any 4 digits work</p>
                <button className="gs-btn gs-btn-primary" style={{ marginTop: 20 }} 
                    onClick={verifyOtp} disabled={verifyingOtp}>
                    {verifyingOtp ? "Verifying..." : "Verify & Continue"}
                  </button>
                <button className="gs-btn gs-btn-ghost" style={{ marginTop: 8 }} onClick={() => setOtpSent(false)}>Change number</button>
              </>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="fade-in">
            <p style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Your delivery platform</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>We'll cross-verify your active status during disruptions.</p>
            <p className="label">Full name</p>
            <input className="gs-input" placeholder="e.g. Rajan Kumar" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 4 }} />
            {errors.name && <p className="err">{errors.name}</p>}
            <div style={{ height: 14 }} />
            <p className="label">Platform</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["Zepto", "Blinkit", "Both"].map(p => (
                <button key={p} className={`plat-btn${platform === p ? " active" : ""}`} onClick={() => setPlatform(p)}>{p}</button>
              ))}
            </div>
            <p className="label">Delivery partner ID</p>
            <input className="gs-input" placeholder="e.g. ZPT-BLR-209471" value={platformId} onChange={e => setPlatformId(e.target.value)} />
            {errors.platformId && <p className="err">{errors.platformId}</p>}
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "8px 0 0" }}>Find this in your Zepto/Blinkit partner app under Profile</p>
            <button className="gs-btn gs-btn-primary" style={{ marginTop: 24 }} onClick={goStep2}>Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <p style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Your delivery zone</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>Payouts are triggered zone-by-zone. Select your primary dark store area.</p>
            <p className="label">City</p>
            <select className="gs-select" value={city} onChange={e => { setCity(+e.target.value); setZone(""); }} style={{ marginBottom: 16 }}>
              {CITIES.map((c, i) => <option key={c.label} value={i}>{c.label}</option>)}
            </select>
            <p className="label">Zone</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {zones.map(z => (
                <button key={z.id} className={`zone-chip${zone === z.id ? " active" : ""}`} onClick={() => setZone(z.id)}>{z.label}</button>
              ))}
            </div>
            {errors.zone && <p className="err">{errors.zone}</p>}
            <div style={{ marginTop: 20, padding: "12px 14px", background: "rgba(55,138,221,0.08)", borderRadius: 8, border: "1px solid rgba(55,138,221,0.2)" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>Coverage is zone-specific. A trigger in Koramangala does not pay Whitefield workers. This is how we keep premiums low.</p>
            </div>
            <button className="gs-btn gs-btn-primary" style={{ marginTop: 20 }} onClick={goStep3}>Continue</button>
            <button className="gs-btn gs-btn-ghost" style={{ marginTop: 8 }} onClick={() => setStep(1)}>Back</button>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <p style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Weekly earnings</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>Used only to calculate your payout rate. Locked for 30 days.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "3000", label: "Up to ₹3,000/week", sub: "~₹500/day" },
                { id: "4500", label: "₹3,000 – ₹5,000/week", sub: "~₹700/day" },
                { id: "6000", label: "₹5,000+/week", sub: "~₹900/day" },
              ].map(e => (
                <button key={e.id} className={`earn-chip${earnings === e.id ? " active" : ""}`} onClick={() => setEarnings(e.id)} style={{ textAlign: "left" }}>
                  <span style={{ fontWeight: 500, color: "#fff" }}>{e.label}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginTop: 2 }}>{e.sub}</span>
                </button>
              ))}
            </div>
            {errors.earnings && <p className="err">{errors.earnings}</p>}
            <button className="gs-btn gs-btn-primary" style={{ marginTop: 24 }} onClick={goStep4}>Continue</button>
            <button className="gs-btn gs-btn-ghost" style={{ marginTop: 8 }} onClick={() => setStep(2)}>Back</button>
          </div>
        )}

        {step === 4 && (
          <div className="fade-in">
            <p style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Choose your plan</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>Your personalised premium for <span style={{ color: "#fff" }}>{zones.find(z => z.id === zone)?.label}</span> this week:</p>

            {loadingQuote ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Calculating your rate...</div>
            ) : quote && (
              <div style={{ background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.25)", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Your rate ({tier})</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#1D9E75", fontFamily: "'Space Mono', monospace" }}>₹{quote.finalPremium}<span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/week</span></span>
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "6px 0 0", fontFamily: "'Space Mono', monospace" }}>{quote.breakdown}</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TIERS.map(t => (
                <div key={t.id} className={`tier-card${tier === t.id ? " active" : ""}`}
                  style={{ borderColor: tier === t.id ? t.color : "rgba(255,255,255,0.1)" }}
                  onClick={() => setTier(t.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 600, color: "#fff", fontSize: 15 }}>{t.label}</span>
                      {t.id === "standard" && <span style={{ marginLeft: 8, fontSize: 11, background: "rgba(55,138,221,0.2)", color: "#85b7eb", padding: "2px 8px", borderRadius: 20 }}>Most popular</span>}
                    </div>
                    <span style={{ fontFamily: "'Space Mono', monospace", color: t.color, fontWeight: 700, fontSize: 15 }}>₹{t.base}+</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "5px 0 0" }}>Up to {t.payout} when disrupted</p>
                </div>
              ))}
            </div>
            <button className="gs-btn gs-btn-primary" style={{ marginTop: 24 }} onClick={goStep5}>Continue</button>
            <button className="gs-btn gs-btn-ghost" style={{ marginTop: 8 }} onClick={() => setStep(3)}>Back</button>
          </div>
        )}

        {step === 5 && (
          <div className="fade-in">
            <p style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Link your UPI</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>Payouts go here automatically — you never have to do anything when a disruption hits.</p>
            <p className="label">UPI ID</p>
            <input className="gs-input" placeholder="yourname@phonepe" value={upiId} onChange={e => setUpiId(e.target.value)} />
            {errors.upiId && <p className="err">{errors.upiId}</p>}
            {errors.submit && <p className="err">{errors.submit}</p>}
            <div style={{ marginTop: 16, padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 10px", fontWeight: 500 }}>Summary</p>
              {[
                ["Zone", zones.find(z => z.id === zone)?.label],
                ["Plan", TIERS.find(t => t.id === tier)?.label],
                ["Weekly premium", `₹${quote?.finalPremium ?? "—"}`],
                ["Max daily payout", TIERS.find(t => t.id === tier)?.payout],
                ["First claim eligibility", "7 days from today"],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "12px 0 0", lineHeight: 1.6 }}>By activating, you agree to the KaryaKavach policy terms. Your location is used only for zone matching and purged after 30 days (DPDPA 2023).</p>
            <button className="gs-btn gs-btn-primary" style={{ marginTop: 16, background: "#1D9E75" }} disabled={submitting} onClick={finish}>
              {submitting ? "Activating coverage..." : `Activate — Pay ₹${quote?.finalPremium ?? "—"}/week`}
            </button>
            <button className="gs-btn gs-btn-ghost" style={{ marginTop: 8 }} onClick={() => setStep(4)}>Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessScreen({ workerName, zone, premium, tier }: { workerName: string; zone: string; premium: number; tier: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif", padding: "20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        @keyframes pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(29,158,117,0.15)", border: "2px solid #1D9E75", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "pop 0.5s ease both" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p style={{ fontSize: 26, fontWeight: 600, color: "#fff", margin: "0 0 8px", animation: "fadeUp 0.4s 0.1s both" }}>You're covered, {workerName}</p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 32px", animation: "fadeUp 0.4s 0.2s both" }}>KaryaKavach is now active for <strong style={{ color: "#fff" }}>{zone}</strong>. If a disruption hits your zone, we'll send money to your UPI automatically — no action needed.</p>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.08)", animation: "fadeUp 0.4s 0.3s both" }}>
          {[
            ["Zone", zone],
            ["Plan", tier.charAt(0).toUpperCase() + tier.slice(1)],
            ["Weekly premium", `₹${premium}`],
            ["Status", "ACTIVE"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{k}</span>
              <span style={{ fontSize: 13, color: k === "Status" ? "#1D9E75" : "#fff", fontWeight: 500, fontFamily: k === "Weekly premium" ? "'Space Mono', monospace" : "inherit" }}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 24, animation: "fadeUp 0.4s 0.4s both" }}>First claim eligible in 7 days. Triggers checked every 15 minutes.</p>
      </div>
    </div>
  );
}
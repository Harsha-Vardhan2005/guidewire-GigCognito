# KaryaKavach: AI-Powered Parametric Income Protection for India's Q-Commerce Delivery Partners

> **Guidewire DEVTrails 2026 | Phase 1 & Phase 2 Submission**
> Protecting the Last Mile: Automated income insurance for Zepto / Blinkit delivery partners against uncontrollable external disruptions — zero paperwork, instant UPI payout.

---

## 0. Current Build Status (April 2026)

Phase 2 implementation complete. All core systems are live and API-backed.

### Phase 1 ✅ — Architecture, design, policy logic, actuarial model

### Phase 2 ✅ — All deliverables implemented and pushed

| Feature | Status | Notes |
|---|---|---|
| Worker onboarding PWA | ✅ Live | JWT auth, zone picker, OTP mock |
| ML-Adjusted Pricing (`POST /policy/ml-quote`) | ✅ Live | XGBoost 1.7.6 trained; zone safety discounts active |
| All 7 parametric triggers (T1–T7) | ✅ Live | Mock deterministic fallbacks — no API key required for demo |
| Trigger poller (node-cron, 15 min) | ✅ Live | Polls all 9 zones × 7 trigger types simultaneously |
| `GET /triggers/status` | ✅ Live | Returns live state for all zones |
| `POST /triggers/simulate` | ✅ Live | Test any trigger type / zone / intensity |
| `GET /triggers/types` | ✅ Live | Trigger type metadata |
| Zero-touch ClaimStatus animated pipeline | ✅ Live | 6-step UX at `/claim-processing` with confetti burst |
| `GET /claims/my` | ✅ Live | Authenticated claim history (DB + mock fallback) |
| XGBoost pricing model trained | ✅ Done | RMSE ₹1.46 · Kharadi/Pune −₹12.2/week · Andheri/Mumbai +₹20.8/week |
| RandomForest fraud classifier trained | ✅ Done | AUC-ROC 1.0 · 8 fraud signals · 236 KB artifact |
| Worker dashboard backend wiring | ✅ Live | Worker, claims, payouts, zone risk metadata |

### Running the demo locally

1. Start API server: `cd apps/api-server && pnpm dev` (port 8000)
2. Start worker PWA: `cd apps/worker-pwa && pnpm dev`
3. Start ML service: `cd apps/ml-service && uvicorn app.main:app --port 5001`
4. Trained model artifacts (`xgboost_pricing.pkl`, `fraud_classifier.pkl`) are present in `apps/ml-service/app/artifacts/`
5. All trigger endpoints work without external API keys (mock fallbacks active)

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem — Ground Reality](#2-the-problem--ground-reality)
3. [Our Persona — The Zepto/Blinkit Rider](#3-our-persona--the-zeptoblinkit-rider)
4. [Use Case Scenarios — Real India, Real Stories](#4-use-case-scenarios--real-india-real-stories)
5. [Solution Overview](#5-solution-overview)
6. [Application Workflow](#6-application-workflow)
7. [Parametric Trigger Design](#7-parametric-trigger-design)
8. [Weekly Premium Model & Business Viability](#8-weekly-premium-model--business-viability)
9. [Policy Logic & Coverage Boundaries](#9-policy-logic--coverage-boundaries)
10. [AI/ML Architecture](#10-aiml-architecture)
11. [Adversarial Defense & Anti-Spoofing Strategy](#11-adversarial-defense--anti-spoofing-strategy)
12. [System Architecture & Tech Stack](#12-system-architecture--tech-stack)
13. [Real-Time Data Integration](#13-real-time-data-integration)
14. [Onboarding Flow](#14-onboarding-flow)
15. [Payout Processing](#15-payout-processing)
16. [Dashboard Design](#16-dashboard-design)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Development Roadmap](#18-development-roadmap)
19. [Business Viability & Regulatory Alignment](#19-business-viability--regulatory-alignment)
20. [Appendix: Data Sources](#20-appendix-data-sources)
21. [Worker Transparency Dashboard](#21-worker-transparency-dashboard)
22. [Community Voting for New Triggers](#22-community-voting-for-new-triggers)
23. [Local Development (Monorepo)](#23-local-development-monorepo)

---

## 1. Executive Summary

**KaryaKavach** is an AI-powered, fully parametric income protection platform built exclusively for **Q-Commerce delivery partners** (Zepto, Blinkit) operating in Tier-1 Indian cities. When a verified weather, pollution, or civic disruption hits a worker's registered delivery zone, KaryaKavach automatically pays them for lost earning hours via UPI — **zero forms, zero calls, zero waiting.** The worker never needs to file anything.

The platform runs on a **weekly premium model** (₹49–₹149/week) mirroring the weekly payout cycle of every major delivery platform — no annual lock-in, no paperwork, no bank visit required.

| Dimension | Value |
|---|---|
| Weekly premium | ₹49–₹149/week (ML-driven dynamic pricing) |
| Automated payout | ₹280–₹560/disruption day (within minutes) |
| Claim process | Zero-touch — worker never files anything |
| Coverage scope | Income loss ONLY from parametric disruption events |
| Fraud protection | Multi-signal, 7-layer adversarial defense |
| Platform | Mobile-first PWA (React + Node.js + AWS) |

**Real-world validation:** SEWA's parametric heat-insurance program in Ahmedabad triggered automatic payouts to 50,000 informal workers (₹2.92 crore disbursed in 2024). Bajaj Allianz's ClimateSafe (2025) extends this to gig workers with automatic settlement. GoDigit × Jan Sahas Delhi pilot (2025) delivered live UPI trigger payouts to migrant workers on temperature breach. KaryaKavach operationalises this proven model for the digital-native Q-Commerce cohort.

---

## 2. The Problem — Ground Reality

### Why Q-Commerce Specifically?

| Dimension | Q-Commerce (Zepto/Blinkit) | Food (Zomato/Swiggy) | E-Commerce (Amazon) |
|---|---|---|---|
| **Disruption Sensitivity** | 🔴 Extreme — 10-min SLA, outdoor micro-routes | 🟠 High | 🟡 Moderate |
| **Income Variability** | 🔴 Very High — surge + flat hours | 🟠 High | 🟡 Medium |
| **Zone Density** | 🔴 Hyper-local 2km dark store radius | 🟠 City-wide | 🟡 Wide radius |
| **Addressable Market** | ~450K–500K active monthly partners | ~3M | ~2M |

Q-Commerce riders operate from hyper-local dark store zones, work in all weather to meet the 10-minute promise, and have no formal income protection. **This is the highest-need, least-served segment.**

### The Income Vulnerability

| Metric | Data |
|---|---|
| Average daily earnings | ₹600–₹900/day |
| Working days per week | 5–6 days |
| Weekly earnings | ₹4,000–₹5,500/week |
| Income lost on a disruption day | ₹600–₹900 |
| Disruption days per month (India avg) | 3–5 days |
| Monthly income at risk | ₹1,800–₹4,500 (20–30% of earnings) |

### The Insurance Gap

Currently available products for gig workers address health, accident, and vehicle damage — partially. **Income loss from external disruptions: nobody covers this.** That is the gap KaryaKavach fills.

---

## 3. Our Persona — The Zepto/Blinkit Rider

### Meet Rajan — Primary User

> **Rajan Kumar, 24**
> Zepto delivery partner, Koramangala zone, Bengaluru
> Weekly earnings: ₹4,200–₹5,500 | Works 6–8 hrs/day, 6 days/week
> Operates from Koramangala dark store on a 2-km radius
> Android budget phone | UPI-only (PhonePe) | Platform pays weekly
> *"Agar baarish aa gayi toh poora din barbaad ho jaata hai. Koi nahi sunta."*

**Rajan's pain points:**
- Loses ₹700–₹900 every time there's heavy rain or a bandh
- Has no way to know in advance if his zone will be affected
- Lives week-to-week — cannot absorb even one lost day
- Doesn't trust complex insurance products — too many forms, too many rejections
- Needs payouts fast — not in 30 days, not in 7 days — **today**

### Secondary Persona — Priya

> **Priya Devi, 24**
> Blinkit partner, Dwarka zone, Delhi | Works daytime shifts only
> Severely affected by Delhi's November–January AQI crisis
> Needs coverage that respects her specific working pattern

### What Makes These Users Different?

| Attribute | Implication for KaryaKavach |
|---|---|
| Low digital literacy | Onboarding under 5 minutes, WhatsApp-level UX |
| Week-to-week cash flow | Weekly pricing aligned with platform payout cycle |
| UPI-first | All payouts via UPI (PhonePe/GPay), not bank transfer |
| Trust deficit | Automated, transparent triggers — no human discretion |
| Language diversity | Hindi + English + Kannada interface |
| Data privacy rights | DPDPA 2023 compliance — location data purged after 30 days, explicit consent at onboarding |

### Market Size (India, 2025–2026)

| Metric | Data | Source |
|---|---|---|
| Q-Commerce delivery partners (active monthly) | ~450,000–500,000 | Economic Times, Nov 2025 |
| Total Q-Commerce GMV (2025) | >$10 billion | Redseer, 2025 |
| Avg. weekly earnings — Tier-1 cities | ₹4,000–₹6,500 | Blinkit partner FAQ |
| Insurance penetration in gig workforce | <5% | IRDAI Bima Sugam baseline, 2025 |
| India parametric insurance CAGR | ~11.3% (2024–2028) | Allied Market Research |

**Addressable income-loss pool:** 475,000 workers × ₹5,000 avg. weekly earnings × ~4.5 disruption-affected weeks/year *(disruption days average 3–5/month = 36–60 days/year; ~4.5 qualifying threshold weeks/year after applying multi-day event grouping — to be calibrated against pilot data)* × 38% avg. income loss = **~₹4,060 crore/year in direct income loss.** *(Pricing-model assumption for stress testing — to be calibrated against pilot claims data.)*

> **Affordability check:** Standard tier (₹89/week) = ~1.6–2.2% of avg. weekly earnings — below the 2% micro-insurance viability threshold (CGAP Microinsurance Guidelines, 2023).

---

## 4. Use Case Scenarios — Real India, Real Stories

### Scenario 1: 🌧️ The Bengaluru Monsoon Cloudburst

**Context:** July 14th, 11 AM. A sudden cloudburst hits Koramangala. Rainfall crosses 70mm/3hrs. Streets flood in 20 minutes. Rajan's bike cannot navigate.

**Without KaryaKavach:** Rajan waits 4 hours. Loses ₹450 in missed deliveries. Eats into his weekly grocery budget.

**With KaryaKavach:**
- 11:02 AM — OpenWeatherMap detects rainfall > 65mm/3hrs in Koramangala zone; IMD "extremely heavy rain" advisory cross-confirmed
- 11:03 AM — KaryaKavach cross-checks Rajan's last GPS ping: confirmed in Koramangala at 10:58 AM
- 11:04 AM — Dual-source confidence confirmed (OWM ✅ + IMD ✅); 6 of 7 fraud signals consistent with genuine stranded worker
- 11:05 AM — Claim auto-initiated. Fraud score: clean. Payout approved.
- 11:07 AM — ₹416 credited to Rajan's PhonePe. Notification: *"KaryaKavach ne aapka ₹416 bhej diya. Surakshit rahein."*

**Total time: ~5 minutes. Zero action required from Rajan.**

---

### Scenario 2: 😷 The Delhi AQI Crisis

**Context:** November 3rd, Delhi. AQI hits 420 (Severe+). Both WAQI and CPCB stations report above 400 for 5 consecutive hours. Priya cannot safely work outdoors.

**With KaryaKavach:**
- WAQI API detects AQI = 420 in Dwarka; CPCB nearest station confirms 415 — dual-source validated
- Priya's zone GPS pinged at 8:45 AM (shift start); platform shows "active/available" status before trigger
- Claim auto-triggered. Payout: ₹280 (4 disrupted hours × ₹70/hr declared rate)
- Notification: *"Aaj Delhi ka AQI bahut kharab hai. ₹280 aapke account mein bheja gaya. Apna khayal rakhen."*

---

### Scenario 3: 🚫 The Mumbai Bandh

**Context:** August 20th, Mumbai. Sudden political bandh in Andheri. Official Section 144 gazette published. Dark store access blocked.

**With KaryaKavach:**
- PIB gazette feed triggers NLP classifier (DistilBERT confidence: 0.92 ✅); geofence matches Ahmed's registered zone
- Ahmed (Blinkit, Andheri) — platform shows "active/available" pre-trigger ✅
- Payout of ₹500 auto-processed.
- Notification: *"Mumbai bandh detected in your area. ₹500 sent to your UPI. Stay safe."*

> **T5 Design Note:** Only official gazette and government sources trigger the curfew classifier — not social media or news aggregators. Single-source unverified alerts do NOT pay out.

---

### Scenario 4: 🎉 Ganesh Chaturthi — Pune Festival Blockage

**Context:** September 7th, Pune. PMC pre-announces Ganesh procession routes blocking Kasba Peth zone 6 PM–11 PM.

**With KaryaKavach:**
- Festival calendar (updated weekly from PMC/municipal announcements) pre-flags Suresh's zone
- At 5:50 PM: system activates coverage for the disruption window
- Payout of ₹250 auto-processed at 6:01 PM
- Notification: *"Aaj aapke zone mein Ganesh procession hai. ₹250 aapke account mein bhej diya gaya."*

---

### Scenario 5: 🌡️ Rajasthan Heatwave

**Context:** May 18th, Jaipur. Temperature hits 46°C. IMD heat wave advisory active for 2+ consecutive days.

**With KaryaKavach:**
- OpenWeatherMap confirms temp > 44°C; IMD advisory cross-validated
- Worker's zone confirmed active (GPS ping within 2 hours)
- ₹280 payout processed — covers peak heat window (11 AM–3 PM)

---

### Scenario 6: 📶 Network Drop During Active Weather *(Edge Case — Honest Worker Protected)*

Rajan is at a pickup point when a severe storm cuts mobile connectivity for 40 minutes. His GPS drops mid-shift.

**KaryaKavach does NOT penalise him.** The system looks back 30 minutes: his pre-drop location is confirmed in the active disruption zone, and the weather trigger is already active. Claim processes without interruption — Rajan never sees a flag.

---

## 5. Solution Overview

KaryaKavach is a **parametric income insurance platform** — payouts are triggered by measurable, pre-defined external events, not subjective claim assessments.

### How It Differs from Traditional Insurance

| Aspect | Traditional Insurance | KaryaKavach (Parametric) |
|---|---|---|
| Claim process | Worker files manually | Zero-touch, fully automated |
| Proof required | Documents, photos, receipts | None — external data verifies |
| Payout time | 7–30 days | 5–10 minutes |
| Fraud risk | High (subjective) | Low (objective, multi-signal) |
| Pricing | Fixed annual/monthly | Dynamic weekly (ML-adjusted) |
| Trust | Low (opaque decisions) | High (transparent trigger logic) |

### Core Principles

1. **Parametric only** — no manual intervention in the claim process
2. **Dual-source validation** — two independent APIs must agree before any payout
3. **Income protection only** — strictly no health, vehicle, or accident coverage
4. **Weekly pricing** — aligned with how gig workers earn and plan
5. **Hyper-local** — pin code / dark store zone precision, not city-level
6. **Zero friction** — if you were in the zone, you're covered. Period.

---

## 6. Application Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KaryaKavach PLATFORM FLOW                             │
├──────────────┬──────────────────────────────────┬───────────────────────────┤
│  ONBOARDING  │    ACTIVE POLICY MANAGEMENT      │   CLAIM & PAYOUT          │
│  (< 5 min)   │                                  │                           │
│              │  • Weekly policy renewal (UPI    │ 1. External trigger        │
│ 1. Phone OTP │    autopay or manual)            │    detected — dual source │
│ 2. Platform  │  • Real-time disruption map      │    validated              │
│    Worker ID │  • Earnings protected log        │                           │
│ 3. Zone pick │  • Coverage status badge         │ 2. Anti-Spoofing Check    │
│    on map    │  • Weekly premium alert          │    (8-signal, <90 sec)    │
│ 4. Earnings  │  • Offline exclusion enforced    │                           │
│    bracket   │                                  │ 3. Auto Claim Initiated   │
│ 5. UPI link  │                                  │    (Zero worker action)   │
│ 6. Tier pick │                                  │                           │
│              │                                  │ 4. UPI Payout dispatched  │
│              │                                  │    (Target: < 10 min)     │
│              │                                  │                           │
│              │                                  │ 5. WhatsApp + push notify │
└──────────────┴──────────────────────────────────┴───────────────────────────┘
```

### Zero-Touch ClaimStatus Pipeline (Phase 2 UX)

Workers who navigate to `/claim-processing` see a 6-step animated pipeline — no action required:

| Step | Label | Detail |
|---|---|---|
| 1 | Trigger Confirmed | External parametric event verified (dual-source) |
| 2 | Zone Match | Worker's registered zone matches trigger area |
| 3 | Eligibility Check | Policy active, waiting period passed, no exclusions |
| 4 | Fraud Check | 8-signal behavioral validation (< 90 seconds) |
| 5 | UPI Transfer | Razorpay Payout API initiated (shimmer progress bar) |
| 6 | Credited | Payout complete — confetti burst + breakdown card |

---

## 7. Parametric Trigger Design

All triggers are **objective, third-party verifiable, monitored every 15 minutes** during active coverage windows (6 AM–10 PM). Every trigger requires **at least 2 independent data sources to agree** — single-source anomalies do not pay out.

### Core Triggers

| # | Trigger | Data Sources | Threshold | Dual-Source Rule | Payout |
|---|---|---|---|---|---|
| **T1** | Extreme Rainfall | OpenWeatherMap + IMD district alerts | > 65mm/3hrs OR IMD "extremely heavy rain" advisory | OWM ≥ threshold AND IMD alert active | Full disrupted hours |
| **T2** | Severe AQI | WAQI (aqicn.org) + CPCB CAAQMS | AQI > 400 for ≥ 4 consecutive hours (6 AM–8 PM) | WAQI ≥ 400 AND CPCB nearest station ≥ 400 | Hours AQI ≥ 400 |
| **T3** | Flooding / Waterlogging | BBMP/MCGM ward alerts + OpenWeatherMap | Active red-alert waterlogging for registered zone | Official civic alert AND OWM heavy rain ongoing | Full working day |
| **T4** | Heatwave | OpenWeatherMap + IMD heat alert | Temp > 44°C for ≥ 2 consecutive days with IMD advisory | OWM ≥ threshold AND IMD advisory active | 4 hrs/day (11 AM–3 PM peak) |
| **T5** | Curfew / Section 144 | PIB gazette + State govt feed + DistilBERT NLP | Official order for registered pin code ≥ 4 hrs; NLP confidence ≥ 0.92 | Official source attribution confirmed + geofence match | Full declared disruption hours |
| **T6** | Festival Road Blockage | Municipal calendar (PMC/MCGM/BBMP) | Pre-announced route closure > 2 hrs in active zone | Municipal source + zone match | Disrupted hours |
| **T7** | Platform App Outage | KaryaKavach heartbeat monitor + platform status page | App unresponsive > 90 min during peak hours (8–11 AM or 6–10 PM) | 3 consecutive failed pings + status page confirms | 25% per hour, max 75% daily |

### Trigger Fallback Sources

| Primary Source | Fallback Source | If Both Fail |
|---|---|---|
| OpenWeatherMap API | Tomorrow.io API | IMD direct HTTP scrape |
| WAQI API | IQAir API | CPCB only, with 6-hr grace period |
| Platform heartbeat | Platform public status page | Trigger suspended — no payout or denial |
| PIB gazette feed | State government RSS | T5 suspended, manual review |

### Trigger Confidence Scoring

```
Confidence Score (0–100) =
  Weather API signal weight      (40%)
+ AQI/secondary API validation   (20%)
+ Official source/news signal    (30%)
+ Historical disruption pattern  (10%)

≥ 75 → AUTO-TRIGGER payout
50–74 → FLAG for admin review
< 50  → IGNORE
```

### Zone-Based Precision

KaryaKavach operates at **pin code / dark store zone level** — not city level. A trigger in Koramangala does NOT auto-pay a worker in Whitefield (same city, different zone). This precision is critical for accurate payouts, fraud prevention, and cost control.

---

## 8. Weekly Premium Model & Business Viability

### Why Weekly?

Blinkit and Zepto release earnings every 7 days. A monthly premium requires saving across 4 weeks — an unrealistic ask for workers living week-to-week. KaryaKavach mirrors the platform payout cadence exactly.

### Weekly Premium Tiers

| Tier | Weekly Premium | Hourly Payout Rate | Max Daily Payout | Max Weekly Payout |
|---|---|---|---|---|
| **Basic** | ₹49 | ₹35/hr | ₹280 | ₹1,120 |
| **Standard** | ₹89 | ₹52/hr | ₹416 | ₹1,664 |
| **Premium** | ₹149 | ₹70/hr | ₹560 | ₹2,240 |

> **Affordability check:** Standard tier (₹89/week) = ~1.6–2.2% of avg. weekly earnings (₹4,000–₹5,500). Below the 2% micro-insurance affordability threshold.

### Competitor Benchmarking

| Product | Weekly Premium Equiv. | Coverage | KaryaKavach Differentiation |
|---|---|---|---|
| Bajaj Allianz ClimateSafe (2025) | ~₹69 base | Weather events only | Multi-trigger + AI dynamic pricing + zero-touch |
| SEWA Parametric Heat (2024) | ~₹35 equivalent | Heat events only | Zone-specific, real-time AQI + rain + social triggers |
| **KaryaKavach Standard** | ₹89 (dynamic) | Weather + AQI + flood + curfew + festival | Platform-embedded, instant payout, fraud-defended |

### ML-Driven Dynamic Pricing

The weekly premium is recalculated every Sunday for the upcoming week:

| Risk Factor | Adjustment |
|---|---|
| Historical disruption rate for zone (last 12 weeks) | +/- ₹5–20 |
| Seasonal multiplier (monsoon Jun–Sep: 1.3×; Delhi AQI Nov–Jan: 1.2×) | +/- ₹10–30 |
| Worker platform tenure > 1 year | -₹5–10 |
| Zone waterlogging index (BBMP/MCGM historical data) | +/- ₹5–25 |
| No-claim bonus (0 claims in prior 4 weeks) | -5% of tier base |

**Illustrative example:** Rajan, Standard tier, Koramangala, July. Base ₹89 + zone monsoon risk +₹12 + seasonal +₹18 − tenure credit -₹8 = **₹111/week effective.** With a June no-claim bonus: **₹105/week.**

### Loss Ratio Analysis

| Metric | Conservative Scenario | Base Scenario |
|---|---|---|
| Active covered workers (pilot) | 20,000 | 50,000 |
| Avg. effective weekly premium | ₹95 | ₹105 |
| Weekly premium pool | ₹19 lakh | ₹52.5 lakh |
| Zone exposure rate per trigger event | 15–20% | 20–25% |
| Avg. approved payout per triggered worker | ₹280–₹350 | ₹300–₹420 |
| Loss ratio range | 55–65% | 55–65% |
| IRDAI parametric loss ratio cap | 70% | 70% |
| **Post-reinsurance operating margin** | **~20–25%** | **~25–30%** |

> **Model Assumption Note:** The income-loss pool figures are Phase 1 pricing simulation assumptions derived from estimated active workforce × avg. weekly earnings × estimated disruption-event frequency. Real loss frequency will be calibrated against pilot claims data.

---

## 8A. Underwriting, Triggers, Pricing & Actuarial Logic (Parametric Insurance)

### Underwriting
- Risk is assessed by city, peril type (trigger), and worker activity tier.
- Only workers with active policies, correct zone registration, and no duplicate claims are eligible for payout.
- New accounts have a 7-day waiting period before first claim eligibility.

### Triggers
- Payouts are triggered by objective, third-party data (e.g., weather, AQI, government advisories).
- Every trigger requires at least two independent data sources to agree (dual-source rule).
- Triggers are polled every 15 minutes; if threshold is crossed, eligible workers are auto-processed for payout.
- No manual claim filing — the process is zero-touch for the worker.

### Pricing — Weekly Premium Model
- Offered premium tiers: ₹49–₹149 per worker per week (Basic / Standard / Premium — see tier table in Section 8 above). The underlying actuarial formula can produce a wider theoretical range; consumer tiers are fixed at three price points.
- Formula:
  
  $\text{Weekly Premium} = (\text{Trigger Probability}) \times (\text{Avg Income Lost per Day}) \times (\text{Days Exposed})$

- Premiums are adjusted for city, peril type, and worker activity tier.
- Weekly cycle matches gig payout rhythm — never monthly.

### Actuarial Basics
- BCR (Burning Cost Rate):
  
  $\text{BCR} = \frac{\text{Total Claims Paid}}{\text{Total Premium Collected}}$

- Target BCR: 0.55–0.70 (i.e., 55–70% of premium goes to payouts).
- If Loss Ratio > 85%, new enrollments are suspended to control risk.
- Stress scenario modeling: e.g., simulate a 14-day monsoon to test solvency and payout sufficiency.

**Implementation:**
- The backend (Node.js, see `/apps/api-server/src/services/claim/claim-pipeline.service.ts`, `/claim.service.ts`, and `/policy/policy.service.ts`) enforces all underwriting, trigger, pricing, payout, and audit logic:
  - Weather API and other data confirm event threshold.
  - Worker eligibility and anti-fraud checks (including GPS) are performed before payout.
  - Payout is calculated as fixed amount per day × number of trigger days.
  - Transfers are initiated automatically; all records are updated.
  - **Detailed audit logging**: Every policy and claim action (creation, approval, rejection, payout, rollback, fraud flag, admin review, appeal) is logged to a centralized audit log (`logs/audit.log`) with timestamp, action, actor, entityId, and details, aligned with IRDAI requirements.
  - PolicyCenter and BillingCenter logging stubs are included for future integration.
  - The process is zero-touch for the worker and completes within minutes.

---

## 9. Policy Logic & Coverage Boundaries

A policy term is **7 calendar days** from the activation timestamp.

### What IS Covered

- ✅ Income lost due to extreme rainfall preventing outdoor delivery
- ✅ Income lost due to hazardous AQI levels (outdoor work advisories)
- ✅ Income lost due to heatwave advisories (IMD declared)
- ✅ Income lost due to verified flooding/waterlogging in registered zone
- ✅ Income lost due to government-declared curfews / Section 144
- ✅ Income lost due to verified bandh/strikes blocking dark store access
- ✅ Income lost due to pre-announced festival route closures in operating zone

### What is NOT Covered

- ❌ Accidents, illness, medical expenses, hospitalisation
- ❌ Vehicle damage, repair, or theft
- ❌ Low order demand without an active parametric trigger
- ❌ Voluntary time off or personal unavailability
- ❌ Events outside the registered operating zone
- ❌ Workers who were "offline/unavailable" on platform before the trigger fired


### Key Policy Rules (Enforced in Code)

| Rule | Detail |
|---|---|
| Zone lock | Coverage valid only for registered zone selected before weekly window opens (enforced in backend) |
| Earnings tier lock | Tier locked 30 days — cannot upgrade immediately before a known weather event (backend logic) |
| Waiting period | New accounts: 7 calendar days before first claim eligibility (backend-enforced) |
| Minimum commitment | 4-week rolling subscription — prevents adverse selection via selective weekly activation before known weather events |
| Free-look period | 7-day free-look from activation (IRDAI mandatory for digital policies) |
| Payout cap | Maximum ₹2,240/week regardless of trigger event count (backend-enforced) |
| Basis risk disclosure | If trigger occurs but worker is outside covered zone, no payout. Zone-level, not individual-loss-verified. |
| Appeals | Any rejected claim: 72-hour appeal window via 60-second voice note + timestamped selfie (admin review queue) |
| Bima Sugam compliance | Distribution via IRDAI Bima Sugam API-compliant digital channel |
| **Audit logging** | Every policy and claim action (creation, approval, rejection, payout, rollback, fraud flag, admin review, appeal) is logged to `logs/audit.log` for regulatory compliance |

**Automation & Compliance:**
- All policy, pricing, payout, and anti-fraud rules are enforced in backend code (`/apps/api-server/src/services/claim/claim-pipeline.service.ts`, `/claim.service.ts`, `/policy/policy.service.ts`).
- The process is zero-touch: claims and payouts are fully automated, with dual-source triggers and multi-signal fraud checks.
- All actions are logged for auditability and IRDAI compliance (see `logs/audit.log`).

---

## 10. AI/ML Architecture

Three distinct ML components, each solving a specific problem:

### ML Component 1: Dynamic Premium Engine

**Model:** XGBoost Regression (v1.7.6) — chosen for interpretability and performance on tabular data

**Status: ✅ Trained — Phase 2**

**Training data:** 6,000 synthetic samples derived from IMD historical weather data, CPCB AQI historical records, SEWA/AXA Climate parametric pilot claims data, zone-level delivery density across 9 zones (Bengaluru, Mumbai, Pune, Delhi NCR)

**Training results:**
| Metric | Value |
|---|---|
| Validation RMSE | ₹1.46 |
| Validation MAE | ₹1.14 |
| Feature importance — waterlogging_index | 45.3% |
| Feature importance — zone_disruption_rate | 41.0% |
| Feature importance — season_encoded | 7.8% |
| Artifact | `app/artifacts/xgboost_pricing.pkl` (764 KB) |

**Sample zone outputs (trained model):**
| Zone | City | ML Adjustment | Direction |
|---|---|---|---|
| Kharadi | Pune | −12.2/week | ↓ Discount (low disruption) |
| Kasba Peth | Pune | −10.1/week | ↓ Discount |
| HSR Layout | Bengaluru | +9.5/week | ↑ Surcharge |
| Bandra | Mumbai | +19.4/week | ↑ Surcharge (coastal + flooding) |
| Andheri | Mumbai | +20.8/week | ↑ Surcharge (high waterlogging) |

**Input features (per worker, per week):**
```json
{
  "zone_id": "BLR_KOR_01",
  "season": "monsoon",
  "zone_historical_disruption_rate": 0.23,
  "forecast_rainfall_next_7_days": 62.1,
  "aqi_avg_last_week": 142,
  "worker_claims_last_4_weeks": 1,
  "peer_avg_claims_same_zone": 0.8,
  "worker_platform_tenure_months": 14,
  "worker_active_hours_profile": "daytime"
}
```

**Output:** `weekly_premium` (₹49–₹149, tier-adjusted) + `zone_safety_note` (displayed to worker during onboarding)

**Serving:** Python FastAPI microservice (`POST /pricing/quote`), called from Node backend via `POST /policy/ml-quote` at policy renewal. Graceful fallback to rule-based pricing if ML service is unavailable.

---

### ML Component 2: Disruption Confidence Scorer

**Model:** Weighted ensemble scoring (rule-based MVP, upgradeable to classifier)

**Logic:**
```
1. Weather API reports rain > 65mm/3hrs in zone BLR_KOR_01
2. System checks:
   a. Does IMD district alert confirm? (dual-source rule)
   b. Are other workers in zone showing GPS inactivity? (cluster signal)
   c. Any conflicting signal? ("partial rain, clearing soon")
3. Confidence Score calculated
4. ≥ 75 → AUTO-TRIGGER | 50–74 → REVIEW | < 50 → IGNORE
```

---

### ML Component 3: Fraud Detection Engine

**Model:** RandomForest Classifier (Phase 2 trained) — upgradeable to Gradient Boosted + Isolation Forest ensemble in Phase 3

**Status: ✅ Trained — Phase 2**

| Metric | Value |
|---|---|
| AUC-ROC | 1.0 (5,000-sample synthetic dataset) |
| Artifact | `app/artifacts/fraud_classifier.pkl` (236 KB) |
| Fraud signals used | 8 |

> **Note on AUC-ROC 1.0:** A perfect score is expected on clean synthetic data with no real-world noise — the synthetic dataset has fully separable class boundaries by design. This is a training baseline, not a production claim. Real-world performance will be re-evaluated and recalibrated against actual pilot claims data before any automated rejection decisions are made.

**Key anomaly signals:**

| Signal | Description | Weight |
|---|---|---|
| Claim velocity | > 5 disruption days in rolling 4-week window | High |
| Offline-before-trigger | Platform shows worker offline before trigger activated | Auto-disqualify |
| Platform cross-check | Active deliveries recorded during claimed disruption hours | Immediate flag |
| Network clustering | Multiple claims from same device ID / IP subnet in narrow window | High |
| Account age + burst | Account < 7 days old + immediate claim | Auto-hold |
| Zone cluster anomaly | Claim spike from single pin code inconsistent with zone boundary | Ring investigation |
| Device fingerprint | Fingerprint/session inconsistency across claims | Medium |

**Output:** Risk score 0–1. Score > 0.75 = manual review. Score > 0.90 = auto-hold.

---

### ML Component 4: Curfew NLP Classifier

**Model:** Fine-tuned DistilBERT on Indian government alert text

**Sources monitored:** PIB press releases, State government official feeds, NDMA alerts — **verified government domains ONLY**

**Confidence threshold:** ≥ 0.92 AND official source attribution confirmed before T5 fires

---

## 11. Adversarial Defense & Anti-Spoofing Strategy

> This section addresses a core DEVTrails concern: a coordinated ring of delivery workers using GPS-spoofing apps to fake locations inside a declared weather zone and drain the liquidity pool.

### Core Principle

**GPS coordinates are one of ~8 signals. A fraudster who spoofs GPS has fooled exactly one sensor.** Genuine stranded workers and GPS spoofers produce distinctly different behavioral fingerprints across signals that cannot all be simultaneously manipulated through a consumer spoofing app.

### Defense Layer 1 — 7-Signal Validation

| Signal | Genuine Stranded Worker | GPS Spoofer | Source |
|---|---|---|---|
| GPS coordinates | In alert zone ✅ | Spoofed to alert zone ✅ | Browser Geolocation |
| Location continuity | Smooth path into zone over prior 20–30 min | Sudden appearance, no route history | Session history log |
| Browser/device fingerprint | Consistent with onboarding session | Inconsistent, rotating, or emulator signatures | Browser APIs |
| IP / session behaviour | IP consistent with outdoor delivery zone | Home ISP IP, geographically inconsistent | PWA |
| Platform activity | "Active/available" before trigger; idle after | "Offline" before trigger, or active deliveries during disruption | Mock platform API |
| Device motion / accelerometer | Micro-movements consistent with sheltering | Flat zero-movement — phone stationary at home | DeviceMotion API (permission-based) |
| Pre-trigger online status | "Online/available" before trigger fired | Offline before trigger — automatic exclusion | Platform API |
| Battery drain rate | Higher drain from active navigation + screen-on use outdoors | Normal drain inconsistent with outdoor active delivery | PWA Battery API |

**Decision rule:**
- ≥ 4 of 8 signals consistent → **Auto-approve**
- 2–3 consistent → **Provisional approval** (80% payout immediate, 20% held 24 hrs)
- ≤ 1 consistent → **Flag for rapid human review**

---

### Defense Layer 2 — Coordinated Ring Detection

A single bad actor is hard to detect in isolation. A ring of 500 produces a **statistically impossible pattern:**

**1. Temporal spike analysis:** Natural events produce a smooth claim ramp over 20–40 minutes. A coordinated ring produces a sharp spike (50+ claims within a 3-minute window) — mathematically inconsistent with organic behavior.

**2. Spatial clustering vs. IP-geo mismatch:** High-density claim GPS cluster in a tight grid cell, but browser IP geo-lookups show devices scattered across residential areas → mismatch triggers ring investigation.

**3. Device fingerprint graph:** If 20+ "different workers" share near-identical browser fingerprints (user-agent, screen resolution, canvas fingerprint, timezone) → app cloning or shared-device ring.

**4. New account velocity:** > 15 new accounts in same zone within 7 days before a trigger AND all file immediately → high-confidence synthetic ring. All new accounts have a mandatory 7-day waiting period.

**5. Platform cross-validation:** Mock Zepto/Blinkit API checks whether the platform recorded the worker completing a delivery during the claimed disruption window. If yes → immediate disqualification.

**6. Zone-level payout circuit breaker:** Total claims from any single pin code in a single event cannot exceed 2× the actuarially expected rate. Excess enters accelerated human review — not automatic approval.

---

### Defense Layer 3 — Worker-Facing UX (Protecting Honest Workers)

| Scenario | System Action | Worker Message |
|---|---|---|
| Clean claim (≥ 4/8 signals consistent) | Auto-approve; payout dispatched | *"Your claim is approved. ₹416 is on its way to your UPI."* |
| Signal gap (network drop in bad weather) | Provisional: 80% immediate, 20% held 24 hrs | *"₹332 sent. Verifying one more data point — remaining ₹84 arrives by tomorrow morning."* |
| Flagged claim (≤ 2 signals consistent) | Rapid Human Review Queue (2-hr SLA) | *"Your claim is being reviewed. We'll update you within 2 hours."* |
| High-confidence fraud (ring + fingerprint + platform mismatch) | Rejected; account flagged | *"We were unable to verify your location. Tap here to appeal."* — No accusatory language. |
| Network drop mid-shift (GPS drops, 30-min lookback confirms zone + trigger active) | Full auto-approval using location history | No interruption — worker never sees a flag. |

**Appeals:** Any rejected claim: 60-second voice note + timestamped selfie at claimed location. Reviewed within 4 business hours. No permanent ban on first flag.

---

### Defense Layer 4 — Structural Safeguards

| Safeguard | Mechanism |
|---|---|
| 7-day new account waiting period | Prevents burst account creation ahead of known weather events |
| 30-day earnings tier lock | Prevents pre-event tier upgrades (known parametric fraud pattern) |
| Offline-before-trigger exclusion | Policy rule: workers offline before trigger activates are ineligible |
| Zone-level payout cap | Total payouts per pin code per event capped at actuarial expected loss |
| Liquidity circuit breaker | If claims in any 4-hr window exceed 2× weekly premium pool, auto-payouts pause; all pending go to accelerated review |

---

## 12. System Architecture & Tech Stack

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        KaryaKavach ARCHITECTURE                                │
├─────────────────┬────────────────────────────────┬───────────────────────────┤
│   FRONTEND      │         BACKEND                │   EXTERNAL INTEGRATIONS   │
│  (React PWA)    │                                │                           │
│                 │  Node.js + Express REST API    │  OpenWeatherMap API        │
│  React 18+Vite  │  WebSocket (real-time alerts)  │  WAQI AQI API             │
│  Tailwind CSS   │                                │  CPCB CAAQMS (validation) │
│                 │  PostgreSQL                    │  IMD Open Data Portal     │
│  Worker App:    │  (Policies, Claims, Workers,   │  TomTom Traffic API       │
│  - Dashboard    │   Fraud flags, Audit logs)     │  BBMP/MCGM (mock)         │
│  - Policy Mgmt  │                                │  Razorpay Sandbox (UPI)   │
│  - Claim Status │  Redis                         │  Zepto/Blinkit API (mock) │
│  - Payout Hist  │  (Trigger cache, sessions,     │  Twilio WhatsApp API      │
│                 │   job queues)                  │  Google Maps + Geocoding  │
│  Admin Panel:   │                                │  Google Geolocation API   │
│  - Loss ratio   │  Python + FastAPI (ML Service) │  PIB/State gazette feeds  │
│  - Fraud queue  │  - XGBoost premium model       │                           │
│  - Zone heatmap │  - Fraud scoring model         │                           │
│  - Trigger log  │  - DistilBERT NLP classifier   │                           │
│  - Predictive   │  - Ring anomaly detection      │                           │
│    claims view  │                                │                           │
│                 │  node-cron (trigger polling    │                           │
│                 │   every 15 min, 3rd-party npm) │                           │
│                 │  Bull + Redis (payout job      │                           │
│                 │   queue, 3rd-party npm)        │                           │
└─────────────────┴────────────────────────────────┴───────────────────────────┘
```

### Tech Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS | Lightweight, PWA-capable, fast on 3G |
| **Backend API** | Node.js + Express | REST APIs + Socket.io for real-time admin dashboard alerts |
| **ORM** | Prisma | Type-safe DB access layer for Node.js + PostgreSQL |
| **ML Service** | Python + FastAPI | Standard for XGBoost / HuggingFace model serving |
| **Database** | PostgreSQL 15 (AWS RDS) | Reliable relational store for policies, claims, audit logs |
| **Cache** | Redis (AWS ElastiCache) | API response cache, session store, Bull job queue backing |
| **Job Queue** | Bull + Redis | Third-party npm async queue for payout processing (NOT Celery — that's Python-only) |
| **Trigger Monitor** | node-cron | Third-party npm cron job for 15-minute trigger polling (not part of Node.js stdlib) |
| **Authentication** | JWT + OTP (Twilio SMS) | Phone-number-first; no email required |
| **Payments** | Razorpay Sandbox (UPI) | Real API, sandbox mode, India-native rails |
| **Notifications** | Twilio WhatsApp Business API | Workers prefer WhatsApp; higher engagement than SMS |
| **Hosting — Frontend** | AWS Amplify | Free tier, HTTPS auto-provisioned, CDN included, ~$0 for hackathon scale |
| **Hosting — Backend (Node)** | AWS EC2 t3.micro | Free tier eligible (750 hrs/month for 12 months), HTTPS via ACM |
| **Hosting — ML Service** | EC2 t3.medium (4 GB RAM) + HuggingFace Hub | Models loaded sequentially on demand (DistilBERT, XGBoost, Isolation Forest not held in memory simultaneously); t3.small (2 GB) is insufficient for concurrent model loading |
| **Database Hosting** | AWS RDS PostgreSQL (db.t3.micro) | Free tier eligible (750 hrs/month), automated backups |
| **Storage** | AWS S3 | Audit logs, model artifacts, festival calendar JSONs — free tier 5GB |
| **Maps / Geo** | Google Maps Platform + Geolocation API | Zone selection UI + IP-based geo-validation for anti-spoofing |
| **ML Models** | XGBoost, DistilBERT, Isolation Forest | Open source, production-proven, Indian NLP support |

### AWS Infrastructure Map

| Service | AWS Product |
|---|---|
| Frontend hosting | AWS Amplify |
| Backend API (Node.js) | EC2 t3.micro |
| ML Service (FastAPI + models) | EC2 t3.medium — 4 GB RAM required for sequential DistilBERT / XGBoost / Isolation Forest loading |
| Database | RDS PostgreSQL db.t3.micro |
| Cache + Bull queue backing | ElastiCache Redis (cache.t3.micro) |
| Static assets + model files | S3 Standard |
| HTTPS certificates | ACM |
| Logs + monitoring | CloudWatch |



PWA eliminates app store friction — critical for low-digital-literacy workers. Works on budget Android devices with 2G/3G. Supports offline resilience during the very disruption events being insured. Workers already use browser-based tools in their Zepto/Blinkit workflow.

> **Critical:** Site MUST be served over HTTPS — browser blocks geolocation on HTTP. AWS Amplify (frontend) and ACM certificates on EC2 (backend) handle this automatically.

---

## 13. Real-Time Data Integration

### Integration 1: OpenWeatherMap API
**Status: ✅ Free, real-time**

- Free tier: 1,000 calls/day (One Call API 3.0)
- Provides: current weather, rainfall mm/hr, temperature, 48-hr forecast, government alerts
- Called from **Node.js backend only** — never from browser (protects API key, avoids CORS)
- Zone weather data cached in Redis for 14 minutes, refreshed on the 15th

```
GET https://api.openweathermap.org/data/3.0/onecall
  ?lat={zone_lat}&lon={zone_lng}&exclude=minutely,daily&appid={KEY}
```

**Threshold logic:** `rain["1h"] > 20` OR `temp > 44` → evaluate trigger

---

### Integration 2: AQICN (WAQI) API
**Status: ✅ Free, unlimited, real-time**

- Free token via aqicn.org — no credit card required
- Geo-query by lat/lng: returns AQI, PM2.5, dominant pollutant, city name

```
GET https://api.waqi.info/feed/geo:{lat};{lng}/?token={TOKEN}
```

**Threshold:** `aqi > 400` for ≥ 4 consecutive hours → T2 trigger evaluation

---

### Integration 3: CPCB CAAQMS
**Status: ✅ Public HTTP, free**

- Official Indian government AQI stations
- Used exclusively as **second-source validation** for T2 trigger
- Both WAQI AND CPCB must confirm AQI > 400 before payout fires

---

### Integration 4: NewsData.io / PIB Gazette
**Status: ✅ T5 curfew trigger implemented with mock NLP fallback — Phase 2**

- Free plan: 200 API credits/day, best India coverage (13 Indian languages)
- 12-hour delay is a real-time limitation — used for ML training data
- **Phase 2:** `checkCurfewTrigger()` implemented with mock curfew calendar (deterministic fallback); DistilBERT NLP scoring mocked at confidence ≥ 0.92 for demo
- **Production path:** PIB official gazette API (government domain feed) wired when API key is configured

---

### Integration 5: Browser Geolocation API
**Status: ✅ Free, built into browser — HTTPS mandatory**

```javascript
// Frontend — pings backend every 2 minutes while worker is active.
// 2-minute granularity is required to reconstruct a meaningful movement path
// (10-15 data points over 20-30 min) for anti-spoofing location-continuity checks.
useEffect(() => {
  const sendLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      api.post('/worker/location', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now()
      });
    });
  };
  const interval = setInterval(sendLocation, 2 * 60 * 1000); // 2-minute granularity
  return () => clearInterval(interval);
}, []);
```

**Privacy:** Raw GPS coordinates used only for zone matching, then discarded. Only zone ID (pin code level) is persisted. Stated explicitly in consent flow during onboarding.

---

### Integration 6: Razorpay Sandbox
**Status: ✅ Free sandbox, real API structure**

```javascript
const payout = await razorpay.payouts.create({
  account_number: process.env.RZP_ACCOUNT,
  fund_account_id: worker.razorpay_fund_account_id,
  amount: payoutAmount * 100, // paise
  currency: "INR",
  mode: "UPI",
  purpose: "payout",
  narration: `KaryaKavach Income Protection - ${eventId}`
});
```

---

### Integration Summary

| Trigger | API | Free? | Real-time? | How Called |
|---|---|---|---|---|
| Heavy Rain / Flooding | OpenWeatherMap + IMD | ✅ | ✅ Yes | Node backend |
| AQI / Pollution | AQICN + CPCB | ✅ | ✅ Yes | Node backend |
| Heatwave | OpenWeatherMap + IMD | ✅ | ✅ Yes | Node backend |
| Curfew / Strike / Local Disruption Evidence | NewsData.io + optional RSS feeds (PIB/state/city) | ✅ (free tier) | ⚠️ Near real-time (depends on source lag) | Node backend verifier + scored matching |
| Festival Blockage | Municipal calendar | ✅ | Pre-loaded | DB lookup |
| Worker Location | Browser Geolocation | ✅ | ✅ Yes | Frontend → HTTPS |
| Payments | Razorpay sandbox | ✅ | ✅ Yes | Node backend |

---

## 14. Onboarding Flow

### Design Principles
- Under 5 minutes end-to-end
- No documents required (Aadhaar/PAN optional for higher tiers)
- Mobile-first, budget Android optimised
- Hindi + English throughout

### Step-by-Step

```
STEP 1: Phone Number + OTP
→ Enter 10-digit mobile number
→ OTP verified → account created (30 seconds)

STEP 2: Platform Identity
→ Enter Blinkit / Zepto Delivery Partner ID
→ Select platform (Blinkit / Zepto / Both)
→ Cross-validated via mock platform API

STEP 3: Zone Selection
→ City selection
→ Primary dark store zone on Google Maps picker
→ Optionally enable browser location for auto-detection

STEP 4: Earnings Bracket
→ Select weekly earnings bracket (₹3,000 / ₹4,500 / ₹6,000+)
→ Bracket locked 30 days post-selection (anti-fraud)

STEP 5: Coverage Tier Selection
→ See all 3 tiers with weekly premium
→ ML Premium Engine calculates PERSONALISED premium in real-time via `POST /policy/ml-quote`
→ Worker sees: "Your premium for Koramangala this week: ₹105" with zone safety badge
→ Zone safety note displayed (e.g. "🛡️ Low disruption zone — you get a ₹12 safety discount")

STEP 6: UPI Linking + Payment
→ UPI ID entered for payouts
→ Weekly premium paid via Razorpay (UPI / card)
→ Coverage activates immediately

STEP 7: Dashboard
→ Active policy status, zone risk meter, payout history
```

---

## 15. Payout Processing

### End-to-End Payout Flow

```
Disruption detected by Trigger Monitor (every 15 min)
           ↓
Dual-source confidence validated (≥ 75?)
           ↓
8-signal fraud check (≥ 4 consistent?)
           ↓
Claim record created → status: APPROVED
           ↓
Payout job added to Bull queue (Redis-backed, third-party npm library)
           ↓
Razorpay Payout API called → UPI credit
           ↓
DB updated → status: COMPLETED
           ↓
WhatsApp + push notification sent to worker
           ↓
Admin dashboard updated in real-time
```

### Payout SLA Targets

| Stage | Target |
|---|---|
| Trigger detection → claim initiation | < 2 minutes |
| Fraud check | < 90 seconds |
| Razorpay API processing | < 3 minutes |
| Worker UPI credit | < 10 minutes from trigger |
| Notification delivery | < 11 minutes from trigger |

### Failed Payout Handling

Razorpay error → retry 3× with exponential backoff (1 min, 5 min, 15 min) → after 3 failures, flagged in admin dashboard → worker notified: *"Payout processing — will reflect within 24 hours."*

### Worker-Facing Claim Status UX

Workers navigating to `/claim-processing` see the 6-step animated zero-touch pipeline: trigger confirmed → zone match → eligibility check → fraud check (8 signals, < 90 sec) → UPI transfer (shimmer progress bar) → credited (confetti burst + payout breakdown card). No action required from the worker at any step.

---

## 23. Local Development (Monorepo)

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (for Prisma-backed API data)

### Install dependencies

From repo root:

```bash
pnpm install
```

### Run API server

```bash
cd apps/api-server
pnpm dev
```

Expected local API base URL:

- `http://localhost:8000`

### Run worker app

In another terminal:

```bash
cd apps/worker-pwa
pnpm dev
```

### Phase 2 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/triggers/status` | GET | Live trigger state for all 9 zones × 7 trigger types |
| `/triggers/simulate` | POST | Simulate any trigger: `{ type, zoneId, intensity: "low"\|"high" }` |
| `/triggers/types` | GET | Trigger type metadata |
| `/policy/ml-quote` | POST | ML-adjusted premium: `{ zoneId, tier }` → returns `weekly_premium`, `ml_adjustment`, `zone_safety_note` |
| `/claims/my` | GET | Authenticated claim history (requires Bearer token) |

### Common issue checklist

- If `EADDRINUSE` appears, another process is already using port `8000`.
- If dashboard does not reflect new zone/city, re-check onboarding save + token session.
- If frontend shows stale values, restart both API and worker app after config changes.
- ML service must be running on port 5001 for `/policy/ml-quote` to use live model; falls back to rule-based pricing if unavailable.
- Trigger mock fallbacks are active by default — no API keys needed for demo.

---

## 16. Dashboard Design

### Worker Dashboard

The worker-facing PWA dashboard gives every covered delivery partner full real-time visibility into their protection status:

| Panel | Content |
|---|---|
| **Policy Status** | ACTIVE / EXPIRED badge, current tier (Basic / Standard / Premium), zone name, policy expiry date |
| **Zone Risk Meter** | Colour-coded risk level for the worker's registered zone (green / amber / red) based on live trigger signals |
| **Active Disruption Alerts** | Live cards for any T1–T7 trigger currently active in the worker's zone |
| **Earnings Protected** | Total payout received this week; cumulative since enrollment |
| **Payout History** | List of past claims with trigger type, event date, amount, and UPI reference |
| **Next Week's Premium** | ML-estimated premium for the upcoming week with zone safety note |
| **Claim Status** | Animated 6-step pipeline (`/claim-processing`) shown immediately after a trigger fires in the worker's zone |

Authentication: JWT Bearer token from OTP onboarding session. Workers can only view their own data.

### Admin / Insurer Dashboard

The admin panel (`/admin-dashboard`) is the operations nerve centre:

| Panel | Content |
|---|---|
| **Live Overview** | Active policies, weekly premium pool total, claims auto-approved vs. flagged this week, current loss ratio |
| **Trigger Event Log** | Real-time feed of trigger activations by city and zone, with confidence score and dual-source status |
| **Zone Heatmap** | City-level map showing active trigger zones, claim density, and loss ratio per pin code |
| **Fraud Queue** | Claims flagged for manual review; 2-hour SLA; actions: approve / reject / escalate |
| **Loss Ratio Trend** | 12-week rolling loss ratio chart with IRDAI 70% cap reference line |
| **Predictive Alerts** | Next-week risk signals per zone (e.g., *"72% probability of T1 trigger in BLR_KOR_01 — monsoon forecast"*) |
| **Workers Table** | Search by worker ID, zone, tier, claim history, fraud flag status |

---

## 21. Worker Transparency Dashboard (2026)

**What:** A real-time dashboard for gig workers showing trigger status, payout pool, and risk signals for their zone.

**Why:** Empowers workers with full visibility into how/when payouts are triggered, their risk exposure, and the health of the payout pool. Builds trust and transparency.

**How:**
- `/api/worker-dashboard/overview` returns all relevant data for the logged-in worker.
- Strict authentication; only the worker can view their own dashboard.
- Powered by `/src/services/worker/worker-dashboard.service.ts`.

---

## 22. Community Voting for New Triggers (2026)

**What:** Workers can propose and vote on new parametric triggers (e.g., "Flooded Street", "Festival Blockage").

**Why:** Makes the platform participatory and adaptive to real-world, hyperlocal risks. Ensures only genuine, community-backed triggers are considered.

**How:**
- `/api/community-triggers/propose` — Propose a new trigger (one per worker per event)
- `/api/community-triggers/vote` — Vote for a trigger proposal (one vote per worker)
- `/api/community-triggers/list` — List all proposals
- Anti-fraud: Only authenticated workers can propose/vote; duplicate voting blocked
- Zone guard: workers can vote only on proposals in their own registered zone. *Edge case: a worker who changes their registered zone mid-week will be evaluated against their zone-at-vote-time; any zone change during an open proposal cycle is logged and flagged for review to prevent zone-hopping abuse.*
- News verification is executed immediately at post submission (no delayed check)
- Verifier is wording-agnostic and typo-tolerant (fuzzy token + n-gram scoring) to handle varied phrasing
- Community threshold: only news-verified proposals with **>50% area vote share** move to review
  : vote share = proposal votes / total eligible workers in that zone
  : configure `NEWSDATA_API_KEY` (and optional `PIB_RSS_URLS`) for richer external evidence
- Status flow:
  : `REJECTED` (no matching local/news evidence at submission time)
  : `LESS_VOTES` (news verified, but vote share ≤ 50%)
  : `UNDER_REVIEW` (news verified and vote share > 50%)
- Powered by `/src/services/worker/community-triggers.service.ts`

---

## 17. Non-Functional Requirements

### Security

| Requirement | Implementation |
|---|---|
| HTTPS mandatory | AWS Amplify (frontend) + AWS ACM certificate on EC2 (backend) — geolocation blocked on HTTP |
| Authentication | JWT (15-min expiry) + Refresh tokens (7-day) |
| OTP verification | Mobile OTP at signup and sensitive actions |
| API key protection | All keys in `.env`, never in frontend code |
| Location privacy | Raw GPS never stored; only zone ID persisted |
| Input validation | Zod schema validation on all API endpoints |
| Rate limiting | 100 req/min per IP via express-rate-limit |
| SQL injection prevention | Prisma ORM with parameterised queries |


### Reliability & Audit Logging

| Requirement | Implementation |
|---|---|
| Trigger monitor uptime | node-cron job with health check endpoint on EC2; auto-restart via PM2 process manager |
| API failure fallback | Redis (ElastiCache) cached last-known zone data used for up to 1 hour if API fails |
| Payout queue durability | Bull + Redis; jobs persist across server restarts, retried automatically on failure |
| Error logging | Winston structured logger — all trigger events, claim decisions, and payout outcomes logged to AWS CloudWatch |
| **Audit logging (IRDAI-aligned)** | Every policy and claim action (creation, approval, rejection, payout, rollback, fraud flag, admin review, appeal) is logged to `logs/audit.log` with timestamp, action, actor, entityId, and details. |

### Scalability

| Requirement | Implementation |
|---|---|
| Zone-based architecture | Each zone monitored independently; new city = new zone config |
| Stateless backend | JWT-based auth; any node can serve any request |
| ML service isolation | FastAPI on separate EC2 t3.medium — scales independently from Node backend |
| Database indexing | Indexes on `worker_id`, `zone_id`, `policy_status`, `claim_timestamp` on RDS |
| Phase 3 stream processing | AWS MSK (Managed Kafka) for real-time trigger streams at city scale |

### Performance Targets

| Metric | Target |
|---|---|
| API response time (P95) | < 300ms |
| Dashboard load time | < 2 seconds |
| Trigger detection latency | < 15 minutes (polling interval) |
| Payout processing time | < 10 minutes end-to-end |

---

## 18. Development Roadmap

### Phase 1 — Ideation & Foundation [March 4–20] ✅ Complete

| Task | Status |
|---|---|
| Persona research and market validation | ✅ Done |
| Weekly premium model design with competitor benchmarking | ✅ Done |
| Parametric trigger taxonomy with dual-source validation rules | ✅ Done |
| Anti-spoofing architecture design | ✅ Done |
| Policy logic and coverage boundaries defined | ✅ Done |
| Tech stack selection and architecture diagram | ✅ Done |
| GitHub repository + README.md | ✅ Done |
| 2-minute pitch video | ✅ Done |

### Phase 2 — Automation & Protection [March 21–April 4] ✅ Complete

| Task | Priority | Status |
|---|---|---|
| Worker onboarding PWA (React 18, Tailwind, Maps zone picker) | P0 | ✅ Done |
| JWT auth + OTP mock | P0 | ✅ Done |
| Policy creation + dynamic premium calculator (live XGBoost call via `POST /policy/ml-quote`) | P0 | ✅ Done |
| All 7 parametric triggers (T1–T7) implemented with mock fallbacks | P0 | ✅ Done |
| `GET /triggers/status` — live state for all 9 zones | P0 | ✅ Done |
| `POST /triggers/simulate` — test endpoint for any trigger/zone/intensity | P0 | ✅ Done |
| Zero-touch ClaimStatus UX pipeline (`/claim-processing`, 6-step animated) | P0 | ✅ Done |
| `GET /claims/my` — authenticated claim history | P0 | ✅ Done |
| XGBoost pricing model trained (RMSE ₹1.46, 764 KB artifact) | P0 | ✅ Done |
| RandomForest fraud classifier trained (AUC-ROC 1.0, 236 KB artifact) | P0 | ✅ Done |
| Razorpay sandbox UPI payout flow | P0 | ✅ Done |
| Mock Zepto/Blinkit API (worker ID, session, online/offline status) | P0 | ✅ Done |
| Basic fraud scoring (account age, velocity, platform cross-check) | P1 | ✅ Done |
| WhatsApp claim notifications via Twilio | P1 | ✅ Done |
| Worker dashboard (basic) | P1 | ✅ Done |

### Phase 3 — Scale & Optimise [April 5–17]

| Task | Priority |
|---|---|
| Full 8-signal anti-spoofing engine | P0 |
| Coordinated ring anomaly detection | P0 |
| DistilBERT NLP curfew classifier (replace mock) | P0 |
| Provisional payout UX (80/20 split) | P0 |
| Full admin analytics dashboard | P0 |
| TomTom traffic signal integration | P1 |
| Hindi + Kannada localisation | P1 |
| PWA install prompt + service worker | P1 |
| AWS MSK (Managed Kafka) stream architecture for real-time trigger processing at city scale | P2 |
| 5-minute demo video + final pitch deck (PDF) | P0 |

---

## 19. Business Viability & Regulatory Alignment

### Market Opportunity

India's Q-Commerce sector reached **> $10 billion GMV** with **30 million monthly transacting users** in 2025 (Redseer). Monthly active delivery partners: **450,000–500,000** (Economic Times, Nov 2025). Sector growing at 40–45% annually. Insurance penetration in this segment: **< 5%.**

### Proven Precedents

| Precedent | Relevance |
|---|---|
| **SEWA Parametric Heat Insurance (India, 2024)** | Automatic payouts to 50,000 informal workers; ₹2.92 crore disbursed on temperature threshold breach — direct proof of viability for India's informal workforce |
| **Bajaj Allianz ClimateSafe (2025)** | Gig-worker parametric product with automatic settlement; confirms IRDAI comfort with this structure |
| **AXA Climate India (AQI-linked)** | Automatic cash transfer on AQI breach — direct precedent for KaryaKavach's T2 trigger design |
| **GoDigit × Jan Sahas Delhi (2025)** | Live parametric pilot — auto UPI payouts when temp exceeded 42°C for 5 consecutive days; zero claims filing |
| **Acko + Ola (2019)** | Embedded insurance via B2B2C model achieved 60%+ attachment rate — validates KaryaKavach's GTM strategy |

### Unit Economics

| Metric | Value |
|---|---|
| Customer Acquisition Cost | ₹0 (embedded onboarding via platform partner app) |
| Avg. annual revenue per worker | ₹4,600–₹5,460 (₹89–₹105/week × 52 weeks) |
| Estimated 3-year worker LTV | ₹2,000–₹3,500 *(net of ~60% BCR claims payout, 15% platform revenue share, 20% reinsurer share, and operational costs — reflects net contribution margin over 3 years, not gross premium revenue)* |
| CAC payback period | < 4 weeks |
| Estimated weekly opt-out rate | 8–12% (mitigated by 4-week minimum commitment) |
| Platform revenue share | 15% of premiums collected |
| Reinsurer share | 20–25% of premiums (catastrophic event protection) |

### Go-to-Market Strategy: B2B2C Embedded Distribution

Direct-to-worker insurance sales fail in India — historical conversion rates for direct gig worker insurance are under 3%. KaryaKavach's GTM is **B2B2C embedded distribution:**

KaryaKavach approaches Zepto/Blinkit and frames the product as a **worker welfare initiative**. The platform embeds premium deduction into the weekly settlement cycle — the worker opts in once at onboarding, and ₹89/week is deducted from their Friday payout automatically. Platform receives a **15% revenue share** on collected premiums AND gets measurable worker retention benefit during monsoon season — reducing recruitment and retraining costs.

> **Conflict-of-interest mitigation:** A platform that earns revenue per premium could, in theory, benefit from more disruption events. KaryaKavach mitigates this structurally: (a) triggers are set and verified exclusively by third-party data sources (OWM, WAQI, PIB) with no platform input; (b) the revenue share is capped and paid on premiums collected — not on claims paid — so more disruptions do not increase the platform's share; (c) circuit-breaker and loss-ratio caps constrain any outsized payout scenario.

This is exactly the model Acko used with Ola in 2019 to achieve **60%+ insurance attachment rates.** Embedded financial products consistently outperform standalone products in this demographic.

| Phase | Timeline | Scope | Objective |
|---|---|---|---|
| **Pilot** | Q3 2026 | 5,000 Zepto partners, Bengaluru — HSR/Koramangala/Indiranagar | Real claims data to calibrate pricing before monsoon season |
| **City Scale** | Q4 2026 | Mumbai (MCGM flood zones) + Delhi NCR (November AQI season) | 50,000 workers, multi-city trigger validation |
| **Platform Embed** | 2027 | In-app distribution within Zepto/Blinkit partner apps | 200,000+ workers via platform embedding |
| **Pan-India** | 2028 | All Tier-1 + Tier-2 Q-Commerce markets | National parametric insurance product |

### Regulatory Alignment

KaryaKavach is designed as an **insurer-partnered parametric protection platform** distributed via a licensed intermediary / embedded distribution model. KaryaKavach does not hold or claim independent underwriting authority.

| Framework | Alignment |
|---|---|
| **IRDAI Bima Sugam** | Distribution via IRDAI's Bima Sugam API-compliant digital channel |
| **IRDAI Regulatory Sandbox** | Available for insurtech pilots; suitable for city-level launch phase |
| **Bima Vistaar** | IRDAI's gig and informal worker inclusion scheme — direct product alignment |
| **IRDAI 70% loss ratio cap** | Pricing model calibrated to maintain 55–65% loss ratio throughout pilot — 5–15% buffer |
| **DPDPA 2023** | Data minimisation, explicit consent, location data purged after 30 days — compliant by design |
| **Code on Social Security 2020** | Formal recognition of gig workers creates regulatory standing for income protection products |

---

## 20. Appendix: Data Sources

### Key Data Sources

| Source | URL | Usage |
|---|---|---|
| OpenWeatherMap | api.openweathermap.org | Weather triggers, premium modeling |
| WAQI / aqicn.org | api.waqi.info | AQI triggers |
| CPCB CAAQMS | app.cpcbccr.com/AQI_India | AQI second-source validation |
| IMD Open Data | imdpune.gov.in | Historical weather, ML training data |
| TomTom Traffic API | developer.tomtom.com | Zone accessibility signal |
| Razorpay Sandbox | razorpay.com/docs | UPI payout simulation |
| Google Maps + Geolocation | developers.google.com/maps | Zone selection, IP-based geo-validation |
| Twilio WhatsApp | twilio.com | Claim notifications |
| Redseer Q-Commerce 2025 | redseer.com | Market GMV and user sizing |
| Economic Times (Nov 2025) | economictimes.com | Active Q-Commerce rider count |
| SEWA Parametric Study | weforum.org | India parametric precedent (50K workers, 2024) |
| Bajaj Allianz ClimateSafe | — | Competitor benchmarking |
| IRDAI Bima Sugam | irdai.gov.in | Regulatory distribution framework |

---

> **KaryaKavach — Because the last mile deserves a safety net.**

**Phase 1 Demo Video:** https://www.youtube.com/watch?v=Q77hxJIc8bY

**Phase 2 Demo Video:** https://www.youtube.com/watch?v=Q77hxJIc8bY
**Team:** [Hackuracy] | Guidewire DEVTrails 2026

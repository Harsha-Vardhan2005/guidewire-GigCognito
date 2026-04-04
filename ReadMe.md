# GigCognito: AI-Powered Parametric Income Protection for India's Q-Commerce Delivery Partners

> **Guidewire DEVTrails 2026 | Phase 1 Submission**
> Protecting the Last Mile: Automated income insurance for Zepto / Blinkit delivery partners against uncontrollable external disruptions — zero paperwork, instant UPI payout.

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

---

## 1. Executive Summary

**GigShield** is an AI-powered, fully parametric income protection platform built exclusively for **Q-Commerce delivery partners** (Zepto, Blinkit) operating in Tier-1 Indian cities. When a verified weather, pollution, or civic disruption hits a worker's registered delivery zone, GigShield automatically pays them for lost earning hours via UPI — **zero forms, zero calls, zero waiting.** The worker never needs to file anything.

The platform runs on a **weekly premium model** (₹49–₹149/week) mirroring the weekly payout cycle of every major delivery platform — no annual lock-in, no paperwork, no bank visit required.

| Dimension | Value |
|---|---|
| Weekly premium | ₹49–₹149/week (ML-driven dynamic pricing) |
| Automated payout | ₹280–₹560/disruption day (within minutes) |
| Claim process | Zero-touch — worker never files anything |
| Coverage scope | Income loss ONLY from parametric disruption events |
| Fraud protection | Multi-signal, 7-layer adversarial defense |
| Platform | Mobile-first PWA (React + Node.js + AWS) |

**Real-world validation:** SEWA's parametric heat-insurance program in Ahmedabad triggered automatic payouts to 50,000 informal workers (₹2.92 crore disbursed in 2024). Bajaj Allianz's ClimateSafe (2025) extends this to gig workers with automatic settlement. GoDigit × Jan Sahas Delhi pilot (2025) delivered live UPI trigger payouts to migrant workers on temperature breach. GigShield operationalises this proven model for the digital-native Q-Commerce cohort.

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

Currently available products for gig workers address health, accident, and vehicle damage — partially. **Income loss from external disruptions: nobody covers this.** That is the gap GigShield fills.

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

| Attribute | Implication for GigShield |
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

**Addressable income-loss pool:** 475,000 workers × ₹5,000 avg. weekly earnings × 3.5 disruption-affected weeks/year × 38% avg. income loss = **~₹3,150 crore/year in direct income loss.** *(Pricing-model assumption for stress testing — to be calibrated against pilot data.)*

> **Affordability check:** Standard tier (₹89/week) = ~1.6–2.2% of avg. weekly earnings — below the 2% micro-insurance viability threshold (CGAP Microinsurance Guidelines, 2023).

---

## 4. Use Case Scenarios — Real India, Real Stories

### Scenario 1: 🌧️ The Bengaluru Monsoon Cloudburst

**Context:** July 14th, 11 AM. A sudden cloudburst hits Koramangala. Rainfall crosses 70mm/3hrs. Streets flood in 20 minutes. Rajan's bike cannot navigate.

**Without GigShield:** Rajan waits 4 hours. Loses ₹450 in missed deliveries. Eats into his weekly grocery budget.

**With GigShield:**
- 11:02 AM — OpenWeatherMap detects rainfall > 65mm/3hrs in Koramangala zone; IMD "extremely heavy rain" advisory cross-confirmed
- 11:03 AM — GigShield cross-checks Rajan's last GPS ping: confirmed in Koramangala at 10:58 AM
- 11:04 AM — Dual-source confidence confirmed (OWM ✅ + IMD ✅); 6 of 7 fraud signals consistent with genuine stranded worker
- 11:05 AM — Claim auto-initiated. Fraud score: clean. Payout approved.
- 11:07 AM — ₹416 credited to Rajan's PhonePe. Notification: *"GigShield ne aapka ₹416 bhej diya. Surakshit rahein."*

**Total time: ~5 minutes. Zero action required from Rajan.**

---

### Scenario 2: 😷 The Delhi AQI Crisis

**Context:** November 3rd, Delhi. AQI hits 420 (Severe+). Both WAQI and CPCB stations report above 400 for 5 consecutive hours. Priya cannot safely work outdoors.

**With GigShield:**
- WAQI API detects AQI = 420 in Dwarka; CPCB nearest station confirms 415 — dual-source validated
- Priya's zone GPS pinged at 8:45 AM (shift start); platform shows "active/available" status before trigger
- Claim auto-triggered. Payout: ₹280 (4 disrupted hours × ₹70/hr declared rate)
- Notification: *"Aaj Delhi ka AQI bahut kharab hai. ₹280 aapke account mein bheja gaya. Apna khayal rakhen."*

---

### Scenario 3: 🚫 The Mumbai Bandh

**Context:** August 20th, Mumbai. Sudden political bandh in Andheri. Official Section 144 gazette published. Dark store access blocked.

**With GigShield:**
- PIB gazette feed triggers NLP classifier (DistilBERT confidence: 0.95 ✅); geofence matches Ahmed's registered zone
- Ahmed (Swiggy Instamart, Andheri) — platform shows "active/available" pre-trigger ✅
- Payout of ₹500 auto-processed.
- Notification: *"Mumbai bandh detected in your area. ₹500 sent to your UPI. Stay safe."*

> **T5 Design Note:** Only official gazette and government sources trigger the curfew classifier — not social media or news aggregators. Single-source unverified alerts do NOT pay out.

---

### Scenario 4: 🎉 Ganesh Chaturthi — Pune Festival Blockage

**Context:** September 7th, Pune. PMC pre-announces Ganesh procession routes blocking Kasba Peth zone 6 PM–11 PM.

**With GigShield:**
- Festival calendar (updated weekly from PMC/municipal announcements) pre-flags Suresh's zone
- At 5:50 PM: system activates coverage for the disruption window
- Payout of ₹250 auto-processed at 6:01 PM
- Notification: *"Aaj aapke zone mein Ganesh procession hai. ₹250 aapke account mein bhej diya gaya."*

---

### Scenario 5: 🌡️ Rajasthan Heatwave

**Context:** May 18th, Jaipur. Temperature hits 46°C. IMD heat wave advisory active for 2+ consecutive days.

**With GigShield:**
- OpenWeatherMap confirms temp > 44°C; IMD advisory cross-validated
- Worker's zone confirmed active (GPS ping within 2 hours)
- ₹280 payout processed — covers peak heat window (11 AM–3 PM)

---

### Scenario 6: 📶 Network Drop During Active Weather *(Edge Case — Honest Worker Protected)*

Rajan is at a pickup point when a severe storm cuts mobile connectivity for 40 minutes. His GPS drops mid-shift.

**GigShield does NOT penalise him.** The system looks back 30 minutes: his pre-drop location is confirmed in the active disruption zone, and the weather trigger is already active. Claim processes without interruption — Rajan never sees a flag.

---

## 5. Solution Overview

GigShield is a **parametric income insurance platform** — payouts are triggered by measurable, pre-defined external events, not subjective claim assessments.

### How It Differs from Traditional Insurance

| Aspect | Traditional Insurance | GigShield (Parametric) |
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
│                         GIGSHIELD PLATFORM FLOW                             │
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
| **T7** | Platform App Outage | GigShield heartbeat monitor + platform status page | App unresponsive > 90 min during peak hours (8–11 AM or 6–10 PM) | 3 consecutive failed pings + status page confirms | 25% per hour, max 75% daily |

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

GigShield operates at **pin code / dark store zone level** — not city level. A trigger in Koramangala does NOT auto-pay a worker in Whitefield (same city, different zone). This precision is critical for accurate payouts, fraud prevention, and cost control.

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
- Target premium range: ₹20–₹750 per worker per week (see tier table below).
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
## 8. Weekly Premium Model & Business Viability

### Why Weekly?

Blinkit and Zepto release earnings every 7 days. A monthly premium requires saving across 4 weeks — an unrealistic ask for workers living week-to-week. GigShield mirrors the platform payout cadence exactly.

### Weekly Premium Tiers

| Tier | Weekly Premium | Hourly Payout Rate | Max Daily Payout | Max Weekly Payout |
|---|---|---|---|---|
| **Basic** | ₹49 | ₹35/hr | ₹280 | ₹1,120 |
| **Standard** | ₹89 | ₹52/hr | ₹416 | ₹1,664 |
| **Premium** | ₹149 | ₹70/hr | ₹560 | ₹2,240 |

> **Affordability check:** Standard tier (₹89/week) = ~1.6–2.2% of avg. weekly earnings (₹4,000–₹5,500). Below the 2% micro-insurance affordability threshold.

### Competitor Benchmarking

| Product | Weekly Premium Equiv. | Coverage | GigShield Differentiation |
|---|---|---|---|
| Bajaj Allianz ClimateSafe (2025) | ~₹69 base | Weather events only | Multi-trigger + AI dynamic pricing + zero-touch |
| SEWA Parametric Heat (2024) | ~₹35 equivalent | Heat events only | Zone-specific, real-time AQI + rain + social triggers |
| **GigShield Standard** | ₹89 (dynamic) | Weather + AQI + flood + curfew + festival | Platform-embedded, instant payout, fraud-defended |

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

**Model:** XGBoost Regression — chosen for interpretability and performance on tabular data

**Training data:** 3 years of IMD historical weather data, CPCB AQI historical records, SEWA/AXA Climate parametric pilot claims data, zone-level delivery density (simulated Phase 1)

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

**Output:** `weekly_premium` (₹49–₹149, tier-adjusted)

**Serving:** Python FastAPI microservice, called from Node backend at policy renewal

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

**Model:** Gradient Boosted Classifier + Isolation Forest

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
│                        GIGSHIELD ARCHITECTURE                                │
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
│                 │   every 15 min, Node-native)   │                           │
│                 │  Bull + Redis (payout job      │                           │
│                 │   queue, Node-native)          │                           │
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
| **Job Queue** | Bull + Redis | Node-native async queue for payout processing (NOT Celery — that's Python-only) |
| **Trigger Monitor** | node-cron | Node-native 15-minute cron job for polling all zone APIs |
| **Authentication** | JWT + OTP (Twilio SMS) | Phone-number-first; no email required |
| **Payments** | Razorpay Sandbox (UPI) | Real API, sandbox mode, India-native rails |
| **Notifications** | Twilio WhatsApp Business API | Workers prefer WhatsApp; higher engagement than SMS |
| **Hosting — Frontend** | AWS Amplify | Free tier, HTTPS auto-provisioned, CDN included, ~$0 for hackathon scale |
| **Hosting — Backend (Node)** | AWS EC2 t3.micro | Free tier eligible (750 hrs/month for 12 months), HTTPS via ACM |
| **Hosting — ML Service** | EC2 t3.small + HuggingFace Hub | Models downloaded from HuggingFace Hub, inference runs locally on EC2 |
| **Database Hosting** | AWS RDS PostgreSQL (db.t3.micro) | Free tier eligible (750 hrs/month), automated backups |
| **Storage** | AWS S3 | Audit logs, model artifacts, festival calendar JSONs — free tier 5GB |
| **Maps / Geo** | Google Maps Platform + Geolocation API | Zone selection UI + IP-based geo-validation for anti-spoofing |
| **ML Models** | XGBoost, DistilBERT, Isolation Forest | Open source, production-proven, Indian NLP support |

### AWS Infrastructure Map

| Service | AWS Product |
|---|---|
| Frontend hosting | AWS Amplify |
| Backend API (Node.js) | EC2 t3.micro |
| ML Service (FastAPI + models) | EC2 t3.small (models via HuggingFace Hub, inference runs locally) |
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
**Status: ⚠️ Free tier has 12-hour delay — mocked for Phase 1 demo**

- Free plan: 200 API credits/day, best India coverage (13 Indian languages)
- 12-hour delay is a real-time limitation — used for ML training data in Phase 1
- **Demo:** manually injected mock curfew event to simulate T5 trigger
- **Production path:** PIB official gazette API (government domain feed)

---

### Integration 5: Browser Geolocation API
**Status: ✅ Free, built into browser — HTTPS mandatory**

```javascript
// Frontend — pings backend every 15 minutes while worker is active
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
  const interval = setInterval(sendLocation, 15 * 60 * 1000);
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
  narration: `GigShield Income Protection - ${eventId}`
});
```

---

### Integration Summary

| Trigger | API | Free? | Real-time? | How Called |
|---|---|---|---|---|
| Heavy Rain / Flooding | OpenWeatherMap + IMD | ✅ | ✅ Yes | Node backend |
| AQI / Pollution | AQICN + CPCB | ✅ | ✅ Yes | Node backend |
| Heatwave | OpenWeatherMap + IMD | ✅ | ✅ Yes | Node backend |
| Curfew / Strike | NewsData.io / PIB | ⚠️ 12hr delay | ❌ Mocked | Mock for demo |
| Festival Blockage | Municipal calendar | ✅ | Pre-loaded | DB lookup |
| Worker Location | Browser Geolocation | ✅ | ✅ Yes | Frontend → HTTPS |
| Payments | Razorpay sandbox | ✅ | ✅ Yes | Node backend |

---

## 14. Onboarding Flow

### Design Principles
- Under 5 minutes end-to-end
- No documents required (Aadhaar/PAN optional for higher tiers)
- Mobile-first, budget Android optimised
- Hindi + English + Kannada throughout

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
→ ML Premium Engine calculates PERSONALISED premium in real-time
→ Worker sees: "Your premium for Koramangala this week: ₹105"

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
Payout job added to Bull queue (Redis-backed, Node-native)
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

---

## 16. Dashboard Design

### Worker Dashboard
- **At a glance:** Policy status (ACTIVE/EXPIRED), zone risk level (colour-coded), earnings protected this week, live disruption alerts in zone
- **Sections:** Payout history, policy details, zone map, next week's premium forecast

### Admin / Insurer Dashboard
- **Real-time:** Active policies, weekly premium pool, live trigger events firing by city, claims auto-approved vs. flagged, current loss ratio
- **Analytics:** City-wise disruption heatmap, 12-week loss ratio trend, fraud queue, top-5 claim zones
- **Predictive:** "Next week: 72% probability of T1 trigger in BLR_KOR_01 — monsoon forecast"

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
| ML service isolation | FastAPI on separate EC2 t3.small — scales independently from Node backend |
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

### Phase 1 — Ideation & Foundation [March 4–20] ✅ Current

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

### Phase 2 — Automation & Protection [March 21–April 4]

| Task | Priority |
|---|---|
| Worker onboarding PWA (React 18, Tailwind, Maps zone picker) | P0 |
| JWT auth + OTP mock | P0 |
| Policy creation + dynamic premium calculator (live XGBoost call) | P0 |
| OpenWeatherMap + WAQI + CPCB integrations (T1, T2, T3) | P0 |
| Claims auto-initiation on trigger | P0 |
| Razorpay sandbox UPI payout flow | P0 |
| Mock Zepto/Blinkit API (worker ID, session, online/offline status) | P0 |
| Basic fraud scoring (account age, velocity, platform cross-check) | P1 |
| WhatsApp claim notifications via Twilio | P1 |
| Worker dashboard (basic) | P1 |

### Phase 3 — Scale & Optimise [April 5–17]

| Task | Priority |
|---|---|
| XGBoost premium model trained on IMD/CPCB historical data | P0 |
| Full 8-signal anti-spoofing engine | P0 |
| Coordinated ring anomaly detection | P0 |
| T4 (heatwave) and T5 (curfew NLP) trigger implementation | P0 |
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
| **AXA Climate India (AQI-linked)** | Automatic cash transfer on AQI breach — direct precedent for GigShield's T2 trigger design |
| **GoDigit × Jan Sahas Delhi (2025)** | Live parametric pilot — auto UPI payouts when temp exceeded 42°C for 5 consecutive days; zero claims filing |
| **Acko + Ola (2019)** | Embedded insurance via B2B2C model achieved 60%+ attachment rate — validates GigShield's GTM strategy |

### Unit Economics

| Metric | Value |
|---|---|
| Customer Acquisition Cost | ₹0 (embedded onboarding via platform partner app) |
| Avg. annual revenue per worker | ₹4,600–₹5,460 (₹89–₹105/week × 52 weeks) |
| Estimated 3-year worker LTV | ₹2,000–₹3,500 |
| CAC payback period | < 4 weeks |
| Estimated weekly opt-out rate | 8–12% (mitigated by 4-week minimum commitment) |
| Platform revenue share | 15% of premiums collected |
| Reinsurer share | 20–25% of premiums (catastrophic event protection) |

### Go-to-Market Strategy: B2B2C Embedded Distribution

Direct-to-worker insurance sales fail in India — historical conversion rates for direct gig worker insurance are under 3%. GigShield's GTM is **B2B2C embedded distribution:**

GigShield approaches Zepto/Blinkit and frames the product as a **worker welfare initiative**. The platform embeds premium deduction into the weekly settlement cycle — the worker opts in once at onboarding, and ₹89/week is deducted from their Friday payout automatically. Platform receives a **15% revenue share** on collected premiums AND gets measurable worker retention benefit during monsoon season — reducing recruitment and retraining costs.

This is exactly the model Acko used with Ola in 2019 to achieve **60%+ insurance attachment rates.** Embedded financial products consistently outperform standalone products in this demographic.

| Phase | Timeline | Scope | Objective |
|---|---|---|---|
| **Pilot** | Q3 2026 | 5,000 Zepto partners, Bengaluru — HSR/Koramangala/Indiranagar | Real claims data to calibrate pricing before monsoon season |
| **City Scale** | Q4 2026 | Mumbai (MCGM flood zones) + Delhi NCR (November AQI season) | 50,000 workers, multi-city trigger validation |
| **Platform Embed** | 2027 | In-app distribution within Zepto/Blinkit partner apps | 200,000+ workers via platform embedding |
| **Pan-India** | 2028 | All Tier-1 + Tier-2 Q-Commerce markets | National parametric insurance product |

### Regulatory Alignment

GigShield is designed as an **insurer-partnered parametric protection platform** distributed via a licensed intermediary / embedded distribution model. GigShield does not hold or claim independent underwriting authority.

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

> **GigShield — Because the last mile deserves a safety net.**

**Phase 1 Demo Video:** https://www.youtube.com/watch?v=Q77hxJIc8bY
**Team:** [Hackuracy] | Guidewire DEVTrails 2026

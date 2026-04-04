# API Server

This service powers the backend for GigCognito's parametric insurance platform. It handles real-time trigger polling, claim pipeline, policy/pricing logic, audit logging, and participatory features for gig workers.

## Key Features
- Real-time parametric trigger logic (Rainfall, AQI, Heatwave, Curfew, Festival Blockage)
- Strict IRDAI-aligned policy logic and audit logging
- Worker Transparency Dashboard API
- Community Voting for New Triggers API (with anti-fraud protections)
- Razorpay payout integration
- PostgreSQL + Prisma ORM

## New Participatory Features (2026)

### Worker Transparency Dashboard
- **API Route:** `/api/worker-dashboard`
- Returns real-time trigger data, payout pool status, and worker risk signals for the dashboard UI.
- Authenticated access (worker only).

### Community Voting for New Triggers
- **API Route:** `/api/community-triggers`
- Workers can propose and vote on new parametric triggers.
- One vote per worker (anti-fraud logic enforced).
- News verification is run immediately at proposal submission.
- Only news-verified proposals with >50% zone voter support move to `UNDER_REVIEW`.
- News-verified proposals below the vote threshold remain tagged as `LESS_VOTES`.
- Proposals without news evidence are rejected.
- Authenticated access (worker only).

## Endpoints

### Worker Dashboard
- `GET /api/worker-dashboard/overview` — Real-time dashboard data for the worker

### Community Triggers
- `POST /api/community-triggers/propose` — Propose a new trigger (worker only)
- `POST /api/community-triggers/vote` — Vote for a trigger proposal (worker only)
- `GET /api/community-triggers/list` — List all proposals

## Development
- Node.js, Express, TypeScript
- Prisma ORM, PostgreSQL
- See `/src/services/worker/worker-dashboard.service.ts` and `/src/services/worker/community-triggers.service.ts` for logic

---

For full system context, see the root ReadMe.md.

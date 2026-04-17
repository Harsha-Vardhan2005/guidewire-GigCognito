# Admin Dashboard - Phase 3 Quick Start

## 🚀 Quick Start (2 minutes)

### Step 1: Install & Start Backend Admin APIs
```bash
cd apps/api-server
pnpm install  # (if not done)
pnpm dev      # Starts at http://localhost:8000
```

### Step 2: Install & Start Admin Dashboard
```bash
cd apps/admin-dashboard
pnpm install  # (only first time)
pnpm dev      # Starts at http://localhost:3000
```

### Step 3: Login
When dashboard loads, it will prompt for admin token.
- Enter: `dev-admin-token`
- Click Login

### ✅ You're in! 

The admin dashboard is now live with:
- ✅ Real-time dashboard stats
- ✅ Live trigger event monitor
- ✅ Fraud queue management
- ✅ 12-week loss ratio chart
- ✅ 7-day predictive alerts
- ✅ Workers table with pagination
- ✅ Zone disruption heatmap

---

## 📁 What Was Created

### Backend Files
```
apps/api-server/src/
├── services/admin/
│   ├── dashboard.service.ts (290 lines)
│   └── analytics.service.ts (75 lines)
├── controllers/
│   └── admin.controller.ts (180 lines)
├── routes/
│   └── admin.routes.ts (Update with admin imports)
├── middlewares/
│   └── auth.middleware.ts (authenticateAdmin)
└── app.ts (Added admin routes)
```

### Frontend Files
```
apps/admin-dashboard/src/
├── components/
│   ├── DashboardOverview.tsx
│   ├── LiveTriggerEvents.tsx
│   ├── FraudQueueManager.tsx
│   ├── LossRatioChart.tsx
│   ├── PredictiveAlerts.tsx
│   ├── WorkersTable.tsx
│   ├── ZoneHeatmap.tsx
│   └── Header.tsx
├── utils/api.ts (Axios client)
├── types/index.ts (TypeScript interfaces)
├── App.tsx (Main app with login)
├── main.tsx (Entry point)
├── index.css (Tailwind + custom)
├── package.json (All dependencies)
├── vite.config.ts
├── tsconfig.json
└── README.md (Full documentation)
```

---

## 🎨 UI/UX Features

### Dashboard Matches Image Exactly
- ✅ Dark theme (greyish blue)
- ✅ 4 stat cards (Policies, Pool, Claims, Loss Ratio)
- ✅ Glass morphism effect (backdrop-blur)
- ✅ Live trigger events (left side)
- ✅ Fraud queue manager (right side, with Approve/Reject buttons)
- ✅ Loss ratio 12-week chart
- ✅ Predictive alerts (7-day forecast)
- ✅ Workers table with pagination
- ✅ Zone heatmap

### Interactions
- Click **Approve/Reject** → One-click fraud resolution
- Auto-refresh → All components poll data every 15-60s
- Pagination → 50 workers per page, navigate with Previous/Next
- Login → Token-based auth (dev: `dev-admin-token`)

---

## 🔌 API Integration Complete

### Backend Response Flow
```
Frontend (React)
    ↓
HTTP Request (Axios)
    ↓
Backend (Node.js)
    ↓
Prisma ORM
    ↓
PostgreSQL
    ↓
Response (JSON)
    ↓
Frontend (Display in components)
```

### All 10 Endpoints Working
- `GET /admin/dashboard/stats` → DashboardOverview
- `GET /admin/dashboard/triggers` → LiveTriggerEvents
- `GET /admin/dashboard/fraud-queue` → FraudQueueManager
- `GET /admin/dashboard/loss-ratio` → LossRatioChart
- `GET /admin/dashboard/predictive-alerts` → PredictiveAlerts
- `GET /admin/dashboard/workers` → WorkersTable
- `GET /admin/dashboard/zone-heatmap` → ZoneHeatmap
- `PUT /admin/dashboard/fraud-claim/:id` → Fraud action
- `GET /admin/analytics/loss-metrics` → Backup analytics
- `GET /admin/analytics/triggers` → Backup analytics
- (And more...)

---

## 📊 Real-Time Updates

Every component auto-refreshes on intervals:
| Component | Interval | Reason |
|-----------|----------|--------|
| Dashboard Stats | 30s | Critical metrics need freshness |
| Triggers | 15s | Real-time event monitoring |
| Fraud Queue | 30s | Admin needs latest flags |
| Loss Ratio Chart | Manual | Expensive DB query, load once |
| Predictive Alerts | 60s | Forecasts don't change rapidly |
| Workers Table | Manual | Large dataset, explicit pagination |
| Zone Heatmap | 60s | Event counts update periodically |

---

## 🔐 Authentication

**Dev Mode** (currently):
- Token: `dev-admin-token` (hardcoded for convenience)
- No password required

**Production Mode**:
1. Set backend env var:
   ```
   ADMIN_TOKENS=token1,token2,token3
   ```
2. Users enter token when prompted
3. Token stored in `localStorage` (session only, cleared on logout)

---

## 🛠️ Customization

### Change Refresh Intervals
Edit component `useEffect`:
```typescript
// In LossRatioChart.tsx
const interval = setInterval(fetchData, 60000); // Change this (ms)
```

### Change Colors/Theme
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: "#0f172a",  // Dark blue
  secondary: "#1e293b", // Slate
  // ... add your colors
}
```

### Add New Analytics
1. Create service method in `admin/analytics.service.ts`
2. Create controller endpoint in `admin.controller.ts`
3. Add route in `admin.routes.ts`
4. Create React component in `components/`
5. Add to `App.tsx` grid

---

## 📝 Documentation

- **Backend**: See `apps/api-server/README.md` (existing)
- **Frontend**: See `apps/admin-dashboard/README.md` (new, detailed)
- **API Routes**: All endpoints documented in `admin.routes.ts`

---

## 🚨 Troubleshooting

### "Failed to fetch dashboard stats"
- Check backend is running (`pnpm dev` in api-server)
- Check token is correct
- Check CORS in backend

### "Invalid admin token"
- Use: `dev-admin-token` (dev mode)
- Or set `ADMIN_TOKENS` in `.env` (production)

### "Claim approval failed"
- Check database is running
- Check claim ID is valid
- Check worker has UPI ID in database

### Port already in use
```bash
# Frontend (port 3000)
pnpm dev -- --port 3001

# Backend (port 8000)
PORT=8001 pnpm dev
```

---

## ✨ Next Steps (Phase 3 Continued)

Potential enhancements:
- [ ] Export to CSV/PDF (loss metrics)
- [ ] Drill-down into claims by zone
- [ ] Manual trigger events (admin-created)
- [ ] Admin audit log viewer
- [ ] Performance dashboards
- [ ] Multi-language support
- [ ] Mobile responsive refinement
- [ ] Real-time WebSocket updates (instead of polling)

---

## 📞 Support

For issues, check:
1. Browser console (F12) for errors
2. Backend logs (`pnpm dev` output)
3. Database connection in `.env`
4. All dependencies installed (`pnpm install`)

---

**Admin Dashboard ready for Phase 3 testing!** 🎉

# KaryaKavach Admin Dashboard

Professional, real-time admin dashboard for KaryaKavach insurance operations.

## Features

### 📊 Dashboard Overview
- **Active Policies**: Real-time count of active worker policies
- **Weekly Pool**: Total premium pool amount collected
- **Claims This Week**: Weekly claims volume with review queue status
- **Loss Ratio**: Current loss ratio vs IRDAI 70% cap

### 🎯 Live Trigger Events
- Real-time monitoring of all active trigger events across zones
- Zone-wise trigger type distribution
- Workers affected per event
- Trigger confidence scoring
- Auto-refresh every 15 seconds

### ⚠️ Fraud Queue Management
- Manual review queue for flagged claims
- 8-signal fraud score display
- One-click approve/reject workflow
- Automatic payout initiation on approval
- Visual risk stratification

### 📈 Loss Ratio Chart
- 12-week loss ratio trend visualization
- IRDAI 70% regulatory cap indicator
- Real-time ratio monitoring
- Automatic enrollment suspension if cap exceeded

### 🔮 Predictive Alerts
- 7-day forward-looking disruption forecast
- ML-powered probability scoring
- Expected financial impact projection
- Zone-specific risk timeline

### 👥 Workers Table
- Comprehensive worker database with pagination
- Per-worker claims in last 30 days
- Fraud flag status
- Active policy status
- Filterable by zone, fraud flag, status

### 🔥 Zone Disruption Heatmap
- 24-hour zone disruption intensity visualization
- High/Medium/Low risk classification
- Event count per zone
- Risk percentage for capacity planning

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP**: Axios
- **Notifications**: React Hot Toast

## Setup

### 1. Install Dependencies
```bash
cd apps/admin-dashboard
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Update REACT_APP_API_URL if needed (default: http://localhost:8000)
```

### 3. Start Development Server
```bash
pnpm dev
```

The dashboard will be available at `http://localhost:3000`

### 4. Build for Production
```bash
pnpm build
```

Artifacts in `dist/` ready for deployment to AWS Amplify or any static host.

## Authentication

- Simple token-based authentication
- Default dev token: `dev-admin-token` (use prompt on login)
- Production: Update `ADMIN_TOKENS` env in backend for rotation

## API Integration

All endpoints prefixed with `/admin/` and require `Authorization: Bearer {token}` header.

### Dashboard Endpoints
- `GET /admin/dashboard/stats` - Overview metrics
- `GET /admin/dashboard/triggers` - Live trigger events
- `GET /admin/dashboard/fraud-queue` - Fraud review queue
- `GET /admin/dashboard/loss-ratio` - 12-week loss ratio
- `GET /admin/dashboard/predictive-alerts` - 7-day forecast
- `GET /admin/dashboard/workers` - Workers table with filters
- `GET /admin/dashboard/zone-heatmap` - Zone risk heatmap
- `PUT /admin/dashboard/fraud-claim/:claimId` - Review claim (approve/reject)

### Analytics Endpoints
- `GET /admin/analytics/loss-metrics` - Detailed loss analysis
- `GET /admin/analytics/triggers` - Trigger effectiveness
- `GET /admin/analytics/zones` - Zone performance

## Real-Time Updates

All components support automatic refresh:
- Dashboard stats: 30 seconds
- Triggers: 15 seconds
- Fraud queue: 30 seconds
- Predictive alerts: 60 seconds
- Zone heatmap: 60 seconds

Configure via interval in component useEffect hooks.

## Keyboard Shortcuts

- `Ctrl+L`: Logout (in header menu)
- `Ctrl+R`: Force refresh all data (upcoming)

## Data Visualization

### Loss Ratio Chart
- Line chart with historical trend
- Configurable 12-week lookback
- IRDAI regulatory cap overlay
- Hover tooltip for detailed values

### Zone Heatmap
- Visual intensity bars (High/Medium/Low)
- Percentage-based risk calculation
- Color-coded urgency (Red/Orange/Blue)
- Real-time event count

## Error Handling

- Toast notifications for all API errors
- Graceful fallbacks for failed requests
- Automatic retry on network failure (future)
- Admin console logging for debugging

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Code splitting via Vite
- Lazy-loaded components (future)
- Redis caching on backend for 5-60 min TTLs
- Responsive design optimized for 1920x1080 and up

## Contributing

- Follow existing component patterns
- Use TypeScript for type safety
- Add loading states and error boundaries
- Keep components under 300 lines

## License

MIT - Guidewire DEVTrails 2026

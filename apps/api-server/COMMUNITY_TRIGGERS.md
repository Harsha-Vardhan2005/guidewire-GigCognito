# Community Triggers with Live Photo Evidence + Ring Defense

## Overview
Workers can propose new parametric triggers for their delivery zones. All proposals are automatically verified using:
1. **Live Camera Evidence (Required on proposal)** - In-app rear camera capture only (`capture="environment"`)
2. **EXIF Time + GPS Validation** - Rejects evidence missing EXIF timestamp, stale capture (>90 sec), or GPS mismatch
3. **Duplicate Evidence Detection** - pHash + embedding similarity against zone photos in a 4-hour window
4. **Local News Corroboration (Optional Boost)** - Improves proposal confidence when external reports match
5. **Coordinated Ring Anomaly Check** - Flags temporal burst/device cluster/duplicate burst behavior

## How It Works

### Step 1: Proposal Submission
Worker submits a proposal via `POST /api/community-triggers/propose`:
```json
{
  "title": "Andheri East waterlogging disrupts deliveries",
  "description": "Heavy rain and stagnant water near SV Road affecting Q-commerce routes",
  "triggerType": "T3_FLOOD",
  "deviceFingerprint": "ua|lang|screen|dpr|platform",
  "evidencePhoto": {
    "imageDataUrl": "data:image/jpeg;base64,...",
    "captureMode": "environment",
    "clientCapturedAt": 1713361200000
  }
}
```

### Step 2: Live Evidence Guardrails
**Capture Guard:**
- Frontend uses rear camera capture mode
- Backend enforces EXIF timestamp presence and ±90s drift window

**Geo-bind Guard:**
- EXIF GPS must be within worker zone geofence radius
- Out-of-zone evidence is rejected before proposal creation

**Dedup Guard:**
- pHash distance < 10 OR embedding cosine similarity > 0.92 => duplicate
- Duplicate proposal attempt returns `409 DUPLICATE_EVIDENCE`
- Worker is redirected to vote on existing proposal instead of creating a clone

### Step 3: Combined Assessment
```
If (livePhotoUnique):
  → Status: LESS_VOTES (waiting for zone worker votes)
Else:
  → Status: REJECTED (invalid or duplicate evidence)
```

News corroboration boosts confidence score but is no longer a hard prerequisite when unique live photo evidence exists.

### Step 4: Community Voting
- Workers from that zone vote on the proposal
- Voters can optionally attach their own live photo evidence
- Unique vote evidence increments `evidenceSignals`
- Needs >50% of zone workers to vote in favor
- Moves to `UNDER_REVIEW` if threshold met

### Step 5: Coordinated Ring Anomaly Check
- Temporal spike monitoring in a 3-minute window
- Shared device fingerprint cluster detection
- Duplicate evidence burst detection
- IP prefix cluster ratio signal

If anomaly action is `CIRCUIT_BREAK`, proposal/vote flow is paused for investigation.

### Step 6: Admin Review
- Accepted proposals enter the trigger pipeline
- Can be deployed as official parametric triggers

## API Endpoints

### 1. Propose a Trigger
```
POST /api/community-triggers/propose
Authorization: Bearer {token}

Body:
{
  "title": "string",
  "description": "string",
  "triggerType": "string" (optional)
}

Response:
{
  "id": "uuid",
  "status": "LESS_VOTES | REJECTED",
  "newsVerified": true,
  "twitterVerified": true,
  "twitterConfidence": 0.65,
  "verificationEvidence": [...],
  "twitterEvidence": [...]
}
```

### 2. Vote on a Proposal
```
POST /api/community-triggers/vote
Authorization: Bearer {token}

Body:
{
  "proposalId": "uuid"
}
```

### 3. List All Proposals
```
GET /api/community-triggers/list
Authorization: Bearer {token}
```

### 4. Verify News Evidence
```
GET /feeds/local-news?zoneId=BLR_KOR_01&title=...&description=...
```

### 5. Verify Twitter Evidence
```
GET /feeds/twitter-verify?zoneId=BLR_KOR_01&title=...&description=...
```

## Configuration

### `.env` Setup
```
# News Verification
NEWSDATA_API_KEY=pub_7e32649016a94ef0ac87c5c369866875
NEWSDATA_BASE_URL=https://newsdata.io/api/1/news
```

### News Verification Scoring
Combines three signals:
- **Keyword Overlap** (55% weight) - How many proposal words match news text
- **N-gram Similarity** (25% weight) - Character-level fuzzy matching
- **Zone Keywords** (20% weight) - Does it mention the specific zone?

**Threshold:** Score ≥ 0.16 = Verified

### Live Evidence Scoring
- **Dedupe:** pHash distance < 10 OR cosine similarity > 0.92 => duplicate
- **Time-bind:** EXIF timestamp required and within ±90s of server receipt
- **Geo-bind:** EXIF GPS must fall within worker zone geofence
- **Evidence signals:** Proposal photo + each unique voter photo increments confidence

## Response Examples

### Proposal Accepted (Live Evidence + News)
```json
{
  "id": "prop_123",
  "title": "Andheri East waterlogging disrupts deliveries",
  "status": "LESS_VOTES",
  "newsVerified": true,
  "primaryEvidence": "NEWS_AND_PHOTO",
  "verificationSource": "local-verifier",
  "verificationEvidence": [
    "NewsData — https://news.example/mumbai-waterlogging",
    "Local Report — Heavy rain stagnant water SV Road"
  ],
  "evidenceSignals": 1,
  "confidenceScore": 0.33,
  "votes": 1,
  "voteShare": 0.05,
  "eligibleVoters": 20
}
```

### Duplicate Evidence Redirect
```json
{
  "error": "Similar disruption evidence already exists. Redirecting to vote on existing proposal.",
  "code": "DUPLICATE_EVIDENCE",
  "duplicateProposalId": "prop_123",
  "similarity": {
    "pHashDistance": 4,
    "cosineSimilarity": 0.956
  }
}
```

### Proposal Rejected (No Evidence)
```json
{
  "id": "prop_789",
  "title": "Random unverified event",
  "status": "REJECTED",
  "newsVerified": false,
  "primaryEvidence": "LIVE_PHOTO",
  "verificationEvidence": [
    "Photo rejected: capture time must be within 90 seconds of submission."
  ]
}
```

## Testing

### Mock Data (Dev Mode)
When no external feeds are configured:
- News verification uses local mock reports
- Live evidence checks still run using submitted image payload and EXIF metadata

Example test scenarios:
```bash
# Test 1: Live photo proposal (base64 truncated)
curl -X POST http://localhost:8000/api/community-triggers/propose \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Andheri East waterlogging disrupts deliveries",
    "description": "Heavy rain and stagnant water",
    "evidencePhoto": {
      "imageDataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "captureMode": "environment",
      "clientCapturedAt": 1713361200000
    }
  }'

# Test 2: Check verification
curl "http://localhost:8000/feeds/local-news?zoneId=MUM_ANH_01&title=Andheri%20waterlog"
```

## Anti-Fraud Features
1. **Live camera only** - No gallery bypass path in normal flow
2. **EXIF timestamp + GPS checks** - Rejects stale or out-of-zone evidence
3. **Photo deduplication** - Blocks coordinated image-copy fraud
4. **Ring anomaly detector** - Detects burst/fingerprint/IP cluster patterns
5. **Vote threshold** - Requires zone consensus (>50%)
6. **One vote per worker** - Prevents manipulation
7. **Role-based access** - Only authenticated workers can propose/vote

## Future Enhancements
- [ ] Add signed hardware attestation (SafetyNet / DeviceCheck)
- [ ] Move evidence embeddings to vector DB for long-window matching
- [ ] Add on-device blur detection before upload
- [ ] Real-time feed aggregation from state disaster management
- [ ] Payout history tied to each trigger

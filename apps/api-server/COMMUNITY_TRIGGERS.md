# Community Triggers with News & Twitter Verification

## Overview
Workers can propose new parametric triggers for their delivery zones. All proposals are automatically verified using:
1. **News Verification** - Cross-checks against NewsData API and local news feeds
2. **Twitter Verification** - Real-time validation from Twitter posts about the event
3. **Combined Scoring** - Accepts proposals if EITHER news OR Twitter provides strong evidence

## How It Works

### Step 1: Proposal Submission
Worker submits a proposal via `POST /api/community-triggers/propose`:
```json
{
  "title": "Andheri East waterlogging disrupts deliveries",
  "description": "Heavy rain and stagnant water near SV Road affecting Q-commerce routes",
  "triggerType": "T3_FLOOD"
}
```

### Step 2: Dual Verification
**News Verification:**
- Queries NewsData API with location + keywords
- Performs fuzzy text matching with local news reports
- Calculates confidence score (0-1) based on relevance

**Twitter Verification:**
- Searches recent tweets about the zone/event
- Scores by relevance and engagement (retweets > replies > likes)
- Calculates confidence based on tweet volume + engagement

### Step 3: Combined Assessment
```
If (newsVerified) OR (twitterVerified AND confidence >= 0.35):
  → Status: LESS_VOTES (waiting for zone worker votes)
Else:
  → Status: REJECTED (no evidence found)
```

### Step 4: Community Voting
- Workers from that zone vote on the proposal
- Needs >50% of zone workers to vote in favor
- Moves to `UNDER_REVIEW` if threshold met

### Step 5: Admin Review
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

# Twitter Verification (Optional)
TWITTER_BEARER_TOKEN=<your-twitter-api-v2-token>
```

### News Verification Scoring
Combines three signals:
- **Keyword Overlap** (55% weight) - How many proposal words match news text
- **N-gram Similarity** (25% weight) - Character-level fuzzy matching
- **Zone Keywords** (20% weight) - Does it mention the specific zone?

**Threshold:** Score ≥ 0.16 = Verified

### Twitter Verification Scoring
- **Relevance Score** - Semantic similarity between proposal & tweet
- **Engagement Score** - Weighted by retweets (2x), replies (1.5x), likes (1x)
- **Combined Confidence** = 0.3 + (tweet_count/50)*0.3 + (avg_engagement/10)*0.35
- **Threshold:** Confidence ≥ 0.35 = Verified

## Response Examples

### Proposal Accepted (News Verified)
```json
{
  "id": "prop_123",
  "title": "Andheri East waterlogging disrupts deliveries",
  "status": "LESS_VOTES",
  "newsVerified": true,
  "twitterVerified": false,
  "verificationSource": "news",
  "verificationEvidence": [
    "NewsData — https://news.example/mumbai-waterlogging",
    "Local Report — Heavy rain stagnant water SV Road"
  ],
  "votes": 1,
  "voteShare": 0.05,
  "eligibleVoters": 20
}
```

### Proposal Accepted (Twitter Verified)
```json
{
  "id": "prop_456",
  "title": "Section 144 traffic controls around Koramangala",
  "status": "LESS_VOTES",
  "newsVerified": false,
  "twitterVerified": true,
  "twitterConfidence": 0.68,
  "twitterEvidence": [
    "Twitter: Police route restrictions announced due to law-and-order deployment...",
    "Twitter: Section 144 imposed in Koramangala area..."
  ],
  "votes": 1
}
```

### Proposal Rejected (No Evidence)
```json
{
  "id": "prop_789",
  "title": "Random unverified event",
  "status": "REJECTED",
  "newsVerified": false,
  "twitterVerified": false,
  "twitterConfidence": 0,
  "verificationEvidence": [
    "Rejected: no matching local news evidence found at submission time"
  ]
}
```

## Testing

### Mock Data (Dev Mode)
When no API keys are configured:
- News verification uses local mock reports
- Twitter verification uses pre-loaded mock tweets

Example test scenarios:
```bash
# Test 1: News-verified proposal
curl -X POST http://localhost:8000/api/community-triggers/propose \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Andheri East waterlogging disrupts deliveries",
    "description": "Heavy rain and stagnant water"
  }'

# Test 2: Check verification
curl "http://localhost:8000/feeds/local-news?zoneId=MUM_ANH_01&title=Andheri%20waterlog"
curl "http://localhost:8000/feeds/twitter-verify?zoneId=MUM_ANH_01&title=Andheri%20waterlog"
```

## Anti-Fraud Features
1. **News Verification** - Prevents fake disruption claims
2. **Twitter Signal Validation** - Confirms real community activity
3. **Vote Threshold** - Requires zone consensus (>50%)
4. **One Vote Per Worker** - Prevents manipulation
5. **Role-Based Access** - Only authenticated workers can propose/vote

## Future Enhancements
- [ ] Add video feed verification
- [ ] Implement machine learning for fake disruption detection
- [ ] Real-time feed aggregation from state disaster management
- [ ] SMS alerts when high-confidence triggers detected
- [ ] Payout history tied to each trigger

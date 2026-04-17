COMMUNITY TRIGGERS - NEWS + TWITTER VERIFICATION - SYSTEM ARCHITECTURE

═══════════════════════════════════════════════════════════════════════════════
                          EXECUTION FLOW (SIMPLIFIED)
═══════════════════════════════════════════════════════════════════════════════

┌─ WORKER UI (React)
│
├─ [Report Disruption Form]
│    └─ title: "Waterlogging near Andheri"
│    └─ description: "Heavy flooding blocking deliveries"
│    └─ triggerType: "Waterlogging"
│
└─→ POST /api/community-triggers/propose
    (with auth token + form data)
    
    ↓ [API Server]
    
    │ authenticateWorker()
    │   └─ Extracts: workerId, zoneId (MUM_ANH_01)
    │
    └─→ proposeTrigger(workerId, title, description, triggerType)
        
        │ verifyWithLocalSources()
        │   └─ Input: { zoneId: "MUM_ANH_01", title, description }
        │
        ├─→ verifyLocalNewsEvidence()
        │   │
        │   ├─ Get zone: Mumbai
        │   ├─ Get keywords: ["andheri", "mumbai"]
        │   ├─ Call NewsData.io API (OR use mock)
        │   ├─ Score: keyword(55%) + ngram(25%) + zone(20%)
        │   └─ RESULT: newsVerified = true/false
        │       ✓ Threshold: score >= 0.16
        │
        └─→ verifyWithTwitter()
            │
            ├─ Get zone: Mumbai
            ├─ Build queries (city + zone keywords + words from title)
            ├─ Call Twitter API v2 (OR use MOCK_TWEETS if no API key)
            ├─ Filter by relevance: >= 0.15
            ├─ Score: relevance(60%) + engagement(40%)
            ├─ Calculate confidence: 0-0.95 range
            └─ RESULT: twitterVerified = true/false
                ✓ Threshold: confidence >= 0.35
        
        │ DUAL VERIFICATION (THE KEY LOGIC)
        │
        ├─ verified = newsVerified OR twitterVerified
        │   └─ ✅ ACCEPTS if EITHER source verifies
        │   └─ ❌ REJECTS if BOTH fail
        │
        └─ Create Proposal Object
            └─ id: UUID
            └─ newsVerified: boolean ← FROM NEWS SERVICE
            └─ twitterVerified: boolean ← FROM TWITTER SERVICE
            └─ twitterConfidence: number (0-0.95) ← FROM TWITTER SERVICE
            └─ status: "LESS_VOTES" if verified, "REJECTED" otherwise
            └─ createdAt: timestamp

    ↓ [API Response]
    
    └─→ Returns: Full Proposal Object
        ├─ id: "abc-123-def"
        ├─ title: "Waterlogging near Andheri"
        ├─ description: "Heavy flooding..."
        ├─ newsVerified: true ← SHOWS IN UI
        ├─ twitterVerified: false ← SHOWS IN UI
        ├─ twitterConfidence: 0.28 ← SHOWS IN UI (28%)
        ├─ status: "LESS_VOTES" ← User can now vote
        └─ ...other fields

    ↓ [Frontend]
    
    ├─ handlePropose() receives response
    │   └─ data.newsVerified = true
    │   └─ data.twitterVerified = false
    │   √ Show message: "Posted. Verified by News ✓"
    │
    ├─ Add proposal to list
    │   └─ setProposals(p => [data, ...p])
    │
    └─ Render Proposal Card
        │
        ├─ Title: "Waterlogging near Andheri"
        ├─ Description: "Heavy flooding..."
        │
        ├─ VERIFICATION BADGES:
        │   └─ IF newsVerified → Show green "✓ News verified" badge
        │   └─ IF twitterVerified → Show blue "✓ Twitter verified (X%)" badge
        │
        ├─ Status: "Less votes" (orange indicator)
        └─ Vote button (user can vote for it now)

═══════════════════════════════════════════════════════════════════════════════
                         DATA STRUCTURE FLOW
═══════════════════════════════════════════════════════════════════════════════

Frontend Request:
┌──────────────────────────────────┐
│ {                                │
│   title: "Waterlogging...",      │
│   description: "Heavy...",       │
│   triggerType: "Waterlogging"    │
│ }                                │
└──────────────────────────────────┘

Backend Processing:
┌──────────────────────────────────────────────────────┐
│ News Verification                                    │
│ ├─ Query: "Waterlogging Heavy flooding..."          │
│ ├─ Zone: MUM_ANH_01                                 │
│ ├─ Score: 0.62 (62%)                                │
│ ├─ Result: { verified: true, sources: [...] }      │
│ └─ newsVerified: TRUE ✓                             │
└──────────────────────────────────────────────────────┘

      OR (ONE IS ENOUGH)

┌──────────────────────────────────────────────────────┐
│ Twitter Verification                                 │
│ ├─ Query: "Waterlogging Heavy flooding..."          │
│ ├─ Zone: MUM_ANH_01                                 │
│ ├─ Matching tweets: 2                               │
│ ├─ Relevance: 0.45                                  │
│ ├─ Engagement: 234 retweets                         │
│ ├─ Confidence: 0.58 (58%)                           │
│ ├─ Result: { verified: true, confidence: 0.58 }   │
│ └─ twitterVerified: TRUE ✓                          │
└──────────────────────────────────────────────────────┘

API Response:
┌────────────────────────────────────────────────────────┐
│ {                                                      │
│   id: "abc-123-def",                                  │
│   title: "Waterlogging...",                           │
│   status: "LESS_VOTES",                               │
│                                                        │
│   ← THE CRITICAL FIELDS FOR UI:                       │
│   newsVerified: true,     ← Show NEWS badge ✓         │
│   twitterVerified: false, ← Don't show TWITTER badge  │
│   twitterConfidence: 0.28,                            │
│   verificationSource: "news",                         │
│   verificationEvidence: [                             │
│     "NewsData: 'Heavy rain in Mumbai cause...'",      │
│   ],                                                   │
│   ...                                                  │
│ }                                                      │
└────────────────────────────────────────────────────────┘

Frontend Display:
┌────────────────────────────────────────────────────────┐
│                                                        │
│ Waterlogging near Andheri                    LESS VOTES
│ Heavy flooding blocking deliveries...                 │
│                                                        │
│ ✓ News verified    ← ONLY THIS SHOWS                  │
│ (No Twitter badge because twitterVerified = false)   │
│                                                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 75% votes              │
│                                                        │
│                   [👆 Vote]                            │
│                                                        │
└────────────────────────────────────────────────────────┘

Success Message (Toast):
┌────────────────────────────────────────┐
│ Posted. Verified by News ✓            │
│ (Because newsVerified = true)          │
└────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                        SCORING DETAILS
═══════════════════════════════════════════════════════════════════════════════

NEWS VERIFICATION SCORING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input: "Waterlogging Heavy flooding blocking deliveries"
Query: Reports about "waterlogging" in "Mumbai/Andheri"

1. Keyword Overlap Score (55% weight)
   ├─ Match: "waterlogging", "flooding", "heavy rain"
   ├─ Found in news: ✓
   └─ Score: 0.75 × 0.55 = 0.41

2. N-gram Similarity (25% weight)
   ├─ 3-character chunks match between query and news
   ├─ Overlap: High (many common trigrams)
   └─ Score: 0.68 × 0.25 = 0.17

3. Zone Keywords (20% weight)
   ├─ Zone: Mumbai/Andheri
   ├─ Keywords: "andheri", "mumbai"
   ├─ Match: ✓ Found in news
   └─ Score: 1.00 × 0.20 = 0.20

TOTAL SCORE: 0.41 + 0.17 + 0.20 = 0.78

RESULT: 0.78 >= 0.16 ✓ → VERIFIED = TRUE

─────────────────────────────────────────

TWITTER VERIFICATION SCORING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input: "Waterlogging Heavy flooding blocking deliveries"
Query: Tweets about waterlogging in Mumbai/Andheri

Tweets Found: 3 relevant tweets

Tweet 1: "Heavy waterlogging in Andheri, deliveries affected"
├─ Relevance: 0.82 (84% token match)
├─ Retweets: 89 × 2 = 178
├─ Replies: 45 × 1.5 = 67.5
├─ Likes: 234 × 1 = 234
├─ Engagement Score: (178+67.5+234)/100 = 4.80
└─ Tweet Score: 0.82×0.6 + min(4.80,10)×0.4 = 0.49 + 1.92 = 2.41

Tweet 2: "Rains hit Mumbai northeast zone"
├─ Relevance: 0.45
├─ Engagement Score: 2.10
└─ Tweet Score: 0.27 + 0.84 = 1.11

Tweet 3: "Delivery delays from flooding"
├─ Relevance: 0.38
├─ Engagement Score: 1.80
└─ Tweet Score: 0.23 + 0.72 = 0.95

Top 3 Tweets Average: (2.41 + 1.11 + 0.95) / 3 = 1.49

Confidence Calculation:
├─ Base: 0.30
├─ Count factor: (3 tweets / 50 max) × 0.30 = 0.018
├─ Engagement factor: min(1.49, 10) × 0.40 = 0.596
└─ TOTAL CONFIDENCE: 0.30 + 0.018 + 0.596 = 0.914

RESULT: 0.914 >= 0.35 ✓ → VERIFIED = TRUE

═══════════════════════════════════════════════════════════════════════════════
                    DUAL ACCEPTANCE LOGIC
═══════════════════════════════════════════════════════════════════════════════

Situation 1: News ✓ Twitter ✗
    newsVerified: true
    twitterVerified: false
    Logic: true OR false = TRUE ✓
    Status: LESS_VOTES (proposal accepted)
    UI: Shows "News verified" badge
    Message: "Posted. Verified by News ✓"

Situation 2: News ✗ Twitter ✓
    newsVerified: false
    twitterVerified: true (confidence >= 0.35)
    Logic: false OR true = TRUE ✓
    Status: LESS_VOTES (proposal accepted)
    UI: Shows "Twitter verified (X%)" badge
    Message: "Posted. Verified by Twitter (Y%) ✓"

Situation 3: News ✓ Twitter ✓
    newsVerified: true
    twitterVerified: true
    Logic: true OR true = TRUE ✓
    Status: LESS_VOTES (proposal accepted)
    UI: Shows BOTH badges
    Message: "Posted. Verified by News & Twitter ✓"

Situation 4: News ✗ Twitter ✗
    newsVerified: false
    twitterVerified: false (confidence < 0.35)
    Logic: false OR false = FALSE ✗
    Status: REJECTED (proposal rejected)
    UI: No verification badges
    Message: "Posted. Under review."
    Worker Impact: Worker automatically votes for rejected proposal
                   but it won't move forward (rejected)

═══════════════════════════════════════════════════════════════════════════════
                      CONFIGURATION OPTIONS
═══════════════════════════════════════════════════════════════════════════════

DEVELOPMENT MODE (Default - No API Keys Needed)
┌──────────────────────────────────────────────┐
│ NEWSDATA_API_KEY: (not set)                  │
│   ↓ Falls back to MOCK_REPORTS               │
│                                              │
│ TWITTER_BEARER_TOKEN: (not set)             │
│   ↓ Falls back to MOCK_TWEETS (3 predefined) │
│                                              │
│ Result: Perfect for local testing            │
│ No external API dependencies                 │
└──────────────────────────────────────────────┘

PRODUCTION MODE (With Real APIs)
┌──────────────────────────────────────────────┐
│ NEWSDATA_API_KEY: pub_7e32...                │
│   ↓ Calls real NewsData.io API               │
│   ↓ ~10,000 global news sources              │
│                                              │
│ TWITTER_BEARER_TOKEN: AAAA_7Z8aB...        │
│   ↓ Calls real Twitter API v2                │
│   ↓ Real-time recent tweets                  │
│                                              │
│ Result: Full production verification         │
│ Real-world data + mock fallback              │
└──────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                    COMPONENT CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

BACKEND SERVICES:
✅ twitter-verification.service.ts - EXPORTS verifyWithTwitter()
✅ official-notice-feed.service.ts - EXPORTS verifyLocalNewsEvidence()
✅ community-triggers.service.ts - ORCHESTRATES dual verification
✅ community-triggers.service.ts - EXPORTS proposeTrigger()
✅ community-triggers.service.ts - EXPORTS listProposals()

API ROUTES:
✅ POST /api/community-triggers/propose
   └─ returns: Proposal with newsVerified, twitterVerified, twitterConfidence
✅ GET /api/community-triggers/list
   └─ returns: Array of Proposals with verification fields
✅ POST /api/community-triggers/vote
   └─ returns: Updated Proposal

FRONTEND COMPONENTS:
✅ CommunityTriggersPage.tsx - Proposal interface updated
✅ CommunityTriggersPage.tsx - Success message logic (4 scenarios)
✅ CommunityTriggersPage.tsx - Verification badges rendering
✅ CommunityTriggersPage.tsx - News badge (green)
✅ CommunityTriggersPage.tsx - Twitter badge (blue with %)
✅ CommunityTriggersPage.tsx - Footer explanation text

DATA FIELDS THROUGH COMPLETE CHAIN:
✅ Backend stores: newsVerified, twitterVerified, twitterConfidence
✅ API returns: All above fields
✅ Frontend receives: All above fields
✅ Frontend displays: All above via badges + messages

═══════════════════════════════════════════════════════════════════════════════

SYSTEM STATUS: ✅ FULLY INTEGRATED AND OPERATIONAL

All components verified. News + Twitter verification working end-to-end.
Ready for worker testing and production deployment.

═══════════════════════════════════════════════════════════════════════════════

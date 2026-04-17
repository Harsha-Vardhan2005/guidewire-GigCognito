/**
 * Twitter Verification Service
 * Fetches real-time tweets to verify disruption claims in zones
 */

import axios from "axios";

type TwitterSearchResult = {
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
};

type VerificationResult = {
  verified: boolean;
  tweets: TwitterSearchResult[];
  confidence: number;
  engagement: number;
  sources: string[];
};

const ZONE_CITY: Record<string, string> = {
  BLR_KOR_01: "Bengaluru",
  BLR_HSR_01: "Bengaluru",
  BLR_IND_01: "Bengaluru",
  DEL_DWK_01: "Delhi",
  DEL_NOR_01: "Delhi",
  MUM_ANH_01: "Mumbai",
  MUM_BAN_01: "Mumbai",
  PNE_KSB_01: "Pune",
  PNE_KHR_01: "Pune",
};

const ZONE_KEYWORDS: Record<string, string[]> = {
  BLR_KOR_01: ["koramangala", "bengaluru", "bangalore"],
  BLR_HSR_01: ["hsr", "hsr layout", "bengaluru", "bangalore"],
  BLR_IND_01: ["indiranagar", "bengaluru", "bangalore"],
  DEL_DWK_01: ["dwarka", "delhi"],
  DEL_NOR_01: ["noida", "sector 18", "delhi"],
  MUM_ANH_01: ["andheri", "mumbai"],
  MUM_BAN_01: ["bandra", "mumbai"],
  PNE_KSB_01: ["kasba", "pune"],
  PNE_KHR_01: ["kharadi", "pune"],
};

// Mock Twitter data for demonstration
const MOCK_TWEETS: TwitterSearchResult[] = [
  {
    text: "Heavy waterlogging in Andheri East near SV Road, deliveries affected #MumbaiRains",
    author_id: "user_123",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    public_metrics: { like_count: 234, retweet_count: 89, reply_count: 45 },
  },
  {
    text: "AQI in Dwarka crossed 450+, severe air quality warning issued #DelhiPollution",
    author_id: "user_456",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    public_metrics: { like_count: 567, retweet_count: 234, reply_count: 123 },
  },
  {
    text: "Section 144 imposed in Koramangala area, police deployment ongoing #BangaloreNews",
    author_id: "user_789",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    public_metrics: { like_count: 890, retweet_count: 345, reply_count: 167 },
  },
];

function buildTwitterQuery(zoneId: string, queryText: string): string[] {
  const cityHint = ZONE_CITY[zoneId] || "India";
  const zoneKeywords = ZONE_KEYWORDS[zoneId] || [];

  // Extract meaningful words from query
  const words = queryText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["been", "over", "have", "with", "from"].includes(w))
    .slice(0, 4);

  const queries = [
    [cityHint, ...zoneKeywords.slice(0, 2), ...words].join(" "),
    [cityHint, ...zoneKeywords.slice(0, 2)].join(" "),
    [cityHint, ...words.slice(0, 2)].join(" "),
  ];

  return queries.filter(Boolean);
}

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function calculateSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) intersection++;
  }

  const union = tokens1.size + tokens2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

async function fetchTwitterReports(zoneId: string, queryText: string): Promise<TwitterSearchResult[]> {
  const twitterApiKey = process.env.TWITTER_API_KEY || process.env.TWITTER_BEARER_TOKEN;

  // For dev/demo: return mock tweets
  if (!twitterApiKey) {
    console.log("[Twitter] No API key configured, using mock data");
    return MOCK_TWEETS.filter((tweet) => {
      const similarity = calculateSimilarity(tweet.text, queryText);
      const hasZoneKeywords = (ZONE_KEYWORDS[zoneId] || []).some((kw) =>
        tweet.text.toLowerCase().includes(kw.toLowerCase())
      );
      return similarity > 0.2 || hasZoneKeywords;
    });
  }

  try {
    const queries = buildTwitterQuery(zoneId, queryText);
    const headers = {
      Authorization: `Bearer ${twitterApiKey}`,
      "User-Agent": "GigCognito/1.0",
    };

    const allTweets: TwitterSearchResult[] = [];

    for (const query of queries) {
      try {
        const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
          params: {
            query: query + " -is:retweet lang:en",
            "tweet.fields": "created_at,public_metrics",
            "user.fields": "username",
            max_results: 100,
          },
          headers,
          timeout: 5000,
        });

        if (response.data?.data) {
          allTweets.push(...response.data.data);
        }

        if (allTweets.length >= 50) break;
      } catch (err) {
        console.error("[Twitter] Search failed for query:", query, err);
      }
    }

    return allTweets.slice(0, 50);
  } catch (err) {
    console.error("[Twitter] Fetch error:", err);
    return [];
  }
}

function calculateEngagementScore(tweet: TwitterSearchResult): number {
  const metrics = tweet.public_metrics || { like_count: 0, retweet_count: 0, reply_count: 0 };
  // Weighted engagement: retweets > replies > likes
  return (metrics.retweet_count * 2 + metrics.reply_count * 1.5 + metrics.like_count) / 100;
}

export async function verifyWithTwitter(zoneId: string, queryText: string): Promise<VerificationResult> {
  try {
    const tweets = await fetchTwitterReports(zoneId, queryText);

    if (!tweets.length) {
      return {
        verified: false,
        tweets: [],
        confidence: 0,
        engagement: 0,
        sources: [],
      };
    }

    // Score tweets by relevance and engagement
    const scoredTweets = tweets.map((tweet) => {
      const relevance = calculateSimilarity(tweet.text, queryText);
      const engagement = calculateEngagementScore(tweet);
      const score = relevance * 0.6 + Math.min(engagement, 10) * 0.4;

      return { ...tweet, relevance, engagement, score };
    });

    // Filter by minimum relevance threshold
    const relevantTweets = scoredTweets.filter((t) => t.relevance >= 0.15).slice(0, 10);

    if (!relevantTweets.length) {
      return {
        verified: false,
        tweets: [],
        confidence: 0,
        engagement: 0,
        sources: [],
      };
    }

    // Calculate overall confidence based on tweet count and engagement
    const avgEngagement = relevantTweets.reduce((sum, t) => sum + t.engagement, 0) / relevantTweets.length;
    const confidence = Math.min(0.95, 0.3 + (relevantTweets.length / 50) * 0.3 + (avgEngagement / 10) * 0.35);

    const sources = relevantTweets.map((t) => `Twitter: "${t.text.slice(0, 60)}..."`);

    return {
      verified: confidence >= 0.35,
      tweets: relevantTweets.map((t) => ({
        text: t.text,
        author_id: t.author_id,
        created_at: t.created_at,
        public_metrics: t.public_metrics,
      })),
      confidence,
      engagement: avgEngagement,
      sources,
    };
  } catch (err) {
    console.error("[Twitter] Verification error:", err);
    return {
      verified: false,
      tweets: [],
      confidence: 0,
      engagement: 0,
      sources: ["Twitter verification failed"],
    };
  }
}

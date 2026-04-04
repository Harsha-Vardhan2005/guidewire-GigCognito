import axios from "axios";

type FeedType = "curfew" | "festival";

type LocalNewsQuery = {
  zoneId: string;
  title: string;
  description: string;
};

type NoticeWindow = {
  zoneId: string;
  startsAt: string; // ISO timestamp
  endsAt: string;   // ISO timestamp
  official: boolean;
  source: string;
  message: string;
};

type ExternalReport = {
  title: string;
  body: string;
  source: string;
  sourceUrl: string;
};

const CURFEW_WINDOWS: NoticeWindow[] = [
  {
    zoneId: "MUM_ANH_01",
    startsAt: "2026-08-20T10:00:00+05:30",
    endsAt: "2026-08-20T23:00:00+05:30",
    official: true,
    source: "State Gazette",
    message: "Section 144 order reported for Andheri zone",
  },
];

const FESTIVAL_WINDOWS: NoticeWindow[] = [
  {
    zoneId: "PNE_KSB_01",
    startsAt: "2026-09-07T18:00:00+05:30",
    endsAt: "2026-09-07T23:00:00+05:30",
    official: true,
    source: "Municipal Traffic Bulletin",
    message: "Ganesh procession route closure for Kasba Peth",
  },
  {
    zoneId: "MUM_BAN_01",
    startsAt: "2026-09-10T17:00:00+05:30",
    endsAt: "2026-09-10T22:00:00+05:30",
    official: true,
    source: "City Police Traffic Update",
    message: "Festival traffic diversion in Bandra",
  },
];

const NEWSDATA_BASE_URL = process.env.NEWSDATA_BASE_URL || "https://newsdata.io/api/1/latest";
const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY;
const PIB_RSS_URLS = (process.env.PIB_RSS_URLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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
  DEL_NOR_01: ["noida", "sector 18", "delhi ncr", "delhi"],
  MUM_ANH_01: ["andheri", "mumbai"],
  MUM_BAN_01: ["bandra", "mumbai"],
  PNE_KSB_01: ["kasba", "kasba peth", "pune"],
  PNE_KHR_01: ["kharadi", "pune"],
};

const LOCAL_REPORTS: Array<{
  zoneId: string;
  title: string;
  body: string;
  source: string;
  sourceUrl: string;
}> = [
  {
    zoneId: "MUM_ANH_01",
    title: "Andheri East waterlogging disrupts deliveries",
    body: "Heavy rain and stagnant water reported near SV Road and subway sections.",
    source: "Mumbai City Bulletin",
    sourceUrl: "https://news.example/mumbai-waterlogging-andheri",
  },
  {
    zoneId: "DEL_DWK_01",
    title: "Dwarka AQI spike crosses severe band",
    body: "Multiple outdoor advisories issued for riders and field workers.",
    source: "Delhi Air Watch",
    sourceUrl: "https://news.example/delhi-dwarka-aqi-severe",
  },
  {
    zoneId: "BLR_KOR_01",
    title: "Section 144 traffic controls around Koramangala",
    body: "Police route restrictions announced due to law-and-order deployment.",
    source: "Bengaluru Metro Desk",
    sourceUrl: "https://news.example/bengaluru-koramangala-144",
  },
];

function isActiveWindow(window: NoticeWindow, at: Date): boolean {
  const start = new Date(window.startsAt).getTime();
  const end = new Date(window.endsAt).getTime();
  const ts = at.getTime();
  return ts >= start && ts <= end;
}

export function getOfficialNoticeFeed(type: FeedType, zoneId: string, at = new Date()) {
  const windows = type === "curfew" ? CURFEW_WINDOWS : FESTIVAL_WINDOWS;
  const matching = windows.find((w) => w.zoneId === zoneId && isActiveWindow(w, at));

  if (!matching) {
    return {
      active: false,
      official: false,
      zoneId,
      source: "No active notice",
      message: "No official disruption notice currently active for this zone",
      asOf: at.toISOString(),
    };
  }

  return {
    active: true,
    official: matching.official,
    zoneId,
    source: matching.source,
    message: matching.message,
    startsAt: matching.startsAt,
    endsAt: matching.endsAt,
    asOf: at.toISOString(),
  };
}

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeToken(token: string): string {
  let t = token.toLowerCase();
  if (t.length > 4 && t.endsWith("ing")) t = t.slice(0, -3);
  else if (t.length > 3 && (t.endsWith("ed") || t.endsWith("es"))) t = t.slice(0, -2);
  else if (t.length > 3 && t.endsWith("s")) t = t.slice(0, -1);
  return t;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

function fuzzyTokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length <= 3 || b.length <= 3) return false;
  return levenshtein(a, b) <= 1;
}

function charTrigrams(text: string): Set<string> {
  const compact = (text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const grams = new Set<string>();
  if (compact.length < 3) {
    if (compact) grams.add(compact);
    return grams;
  }
  for (let i = 0; i <= compact.length - 3; i += 1) {
    grams.add(compact.slice(i, i + 3));
  }
  return grams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function scoreKeywordOverlap(queryText: string, candidateText: string): number {
  const qTokens = tokenize(queryText).map(normalizeToken);
  if (!qTokens.length) return 0;
  const cTokens = tokenize(candidateText).map(normalizeToken);
  if (!cTokens.length) return 0;

  let overlap = 0;
  for (const q of qTokens) {
    if (cTokens.some((c) => fuzzyTokenMatch(q, c))) {
      overlap += 1;
    }
  }
  return overlap / qTokens.length;
}

function zoneKeywordScore(zoneId: string, candidateText: string): number {
  const kws = ZONE_KEYWORDS[zoneId] || [];
  if (!kws.length) return 0;
  const text = candidateText.toLowerCase();
  const matches = kws.filter((k) => text.includes(k.toLowerCase())).length;
  return matches / kws.length;
}

function parseSimpleRssItems(xml: string): Array<{ title: string; description: string; link: string }> {
  const items: Array<{ title: string; description: string; link: string }> = [];
  const chunks = xml.split("<item>").slice(1);
  for (const chunk of chunks) {
    const end = chunk.indexOf("</item>");
    const body = end >= 0 ? chunk.slice(0, end) : chunk;

    const title = (body.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "")
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .trim();
    const description = (body.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || "")
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/<[^>]+>/g, " ")
      .trim();
    const link = (body.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "").trim();

    if (title || description) {
      items.push({ title, description, link });
    }
  }
  return items;
}

async function fetchNewsDataReports(zoneId: string, queryText: string): Promise<ExternalReport[]> {
  if (!NEWSDATA_API_KEY) return [];

  const cityHint = ZONE_CITY[zoneId] || "India";
  const zoneHint = (ZONE_KEYWORDS[zoneId] || []).slice(0, 2).join(" ");
  const meaningful = tokenize(queryText)
    .map(normalizeToken)
    .filter((t) => t.length >= 4)
    .slice(0, 5)
    .join(" ");

  const queryVariants = [
    [cityHint, zoneHint, meaningful].filter(Boolean).join(" "),
    [cityHint, zoneHint].filter(Boolean).join(" "),
    cityHint,
  ].filter(Boolean);

  const collected: ExternalReport[] = [];
  try {
    for (const q of queryVariants) {
      const res = await axios.get(NEWSDATA_BASE_URL, {
        params: {
          apikey: NEWSDATA_API_KEY,
          q,
          language: "en",
          country: "in",
          size: 10,
        },
        timeout: 5000,
      });

      const results = Array.isArray(res.data?.results) ? res.data.results : [];
      const normalized = results.map((r: any) => ({
        title: String(r.title || ""),
        body: String(r.description || r.content || ""),
        source: String(r.source_id || "NewsData"),
        sourceUrl: String(r.link || ""),
      }));
      collected.push(...normalized);
      if (collected.length >= 15) break;
    }

    const uniqueByUrl = new Map<string, ExternalReport>();
    for (const report of collected) {
      const key = report.sourceUrl || `${report.source}:${report.title}`;
      if (!uniqueByUrl.has(key)) uniqueByUrl.set(key, report);
    }
    return Array.from(uniqueByUrl.values()).slice(0, 20);
  } catch {
    return [];
  }
}

async function fetchRssReports(): Promise<ExternalReport[]> {
  if (!PIB_RSS_URLS.length) return [];

  const jobs = PIB_RSS_URLS.map(async (url) => {
    try {
      const res = await axios.get(url, { timeout: 5000, responseType: "text" });
      const items = parseSimpleRssItems(String(res.data || ""));
      return items.slice(0, 15).map((i) => ({
        title: i.title,
        body: i.description,
        source: "RSS",
        sourceUrl: i.link,
      }));
    } catch {
      return [] as ExternalReport[];
    }
  });

  const all = await Promise.all(jobs);
  return all.flat();
}

async function fetchExternalReports(zoneId: string, queryText: string): Promise<ExternalReport[]> {
  const [newsData, rss] = await Promise.all([
    fetchNewsDataReports(zoneId, queryText),
    fetchRssReports(),
  ]);
  return [...newsData, ...rss];
}

export async function verifyLocalNewsEvidence(query: LocalNewsQuery) {
  const queryText = `${query.title} ${query.description}`.trim();
  const externalReports = await fetchExternalReports(query.zoneId, queryText);

  const inMemoryReports = LOCAL_REPORTS.filter((r) => r.zoneId === query.zoneId).map((r) => ({
    title: r.title,
    body: r.body,
    source: r.source,
    sourceUrl: r.sourceUrl,
  }));

  const candidates = externalReports.length ? externalReports : inMemoryReports;

  const scored = candidates.map((r) => {
    const overlap = scoreKeywordOverlap(queryText, `${r.title} ${r.body}`);
    const ngram = jaccardSimilarity(
      charTrigrams(queryText),
      charTrigrams(`${r.title} ${r.body}`),
    );
    const zoneScore = zoneKeywordScore(query.zoneId, `${r.title} ${r.body}`);
    const score = overlap * 0.55 + ngram * 0.25 + zoneScore * 0.2;
    return { ...r, score };
  });

  const matched = scored.filter((r) => r.score >= 0.16);

  if (!matched.length) {
    return {
      verified: false,
      zoneId: query.zoneId,
      reason: "No matching local report found for this proposal",
      sources: [],
      sourceMode: externalReports.length ? "external" : "fallback-mock",
      asOf: new Date().toISOString(),
    };
  }

  return {
    verified: true,
    zoneId: query.zoneId,
    reason: "Local report evidence found",
    sources: matched.slice(0, 5).map((m) => `${m.source} — ${m.sourceUrl}`),
    sourceMode: externalReports.length ? "external" : "fallback-mock",
    asOf: new Date().toISOString(),
  };
}

import axios from "axios";
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";

export type CurfewNlpInput = {
  text: string;
  sourceName?: string;
  sourceUrl?: string;
};

export type CurfewNlpResult = {
  isCurfew: boolean;
  confidence: number;
  threshold: number;
  label: "CURFEW" | "NOT_CURFEW";
  model: string;
  officialSource: boolean;
  sourceAttribution: "official-domain" | "official-keyword" | "unverified-source";
  reasons: string[];
};

const CURFEW_NLP_API_URL = process.env.CURFEW_NLP_API_URL;
const CURFEW_NLP_TIMEOUT_MS = Number(process.env.CURFEW_NLP_TIMEOUT_MS ?? "4500");

const OFFICIAL_SOURCE_KEYWORDS = [
  "gazette",
  "government",
  "govt",
  "police",
  "commissioner",
  "district magistrate",
  "collector",
  "pib",
  "ndma",
  "section 144",
  "crpc",
];

const CURFEW_POSITIVE_KEYWORDS = [
  "section 144",
  "curfew",
  "prohibitory order",
  "movement restricted",
  "public gathering prohibited",
  "law and order",
  "crpc 144",
  "night curfew",
  "district order",
  "police order",
  "magistrate order",
  "shutdown order",
  "bandh order",
];

const CURFEW_NEGATIVE_KEYWORDS = [
  "drill",
  "mock",
  "advisory only",
  "rumour",
  "unverified",
  "not imposed",
  "withdrawn",
  "revoked",
  "historic",
  "anniversary",
];

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function safeLower(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function detectOfficialSource(sourceName?: string, sourceUrl?: string): {
  official: boolean;
  attribution: CurfewNlpResult["sourceAttribution"];
  reason?: string;
} {
  const normalizedName = safeLower(sourceName);
  const normalizedUrl = safeLower(sourceUrl);

  if (normalizedUrl) {
    try {
      const host = new URL(normalizedUrl).hostname.toLowerCase();
      const officialDomain =
        host.endsWith(".gov.in") ||
        host.endsWith(".nic.in") ||
        host.endsWith("pib.gov.in") ||
        host.includes("police");

      if (officialDomain) {
        return {
          official: true,
          attribution: "official-domain",
          reason: `Official domain matched (${host})`,
        };
      }
    } catch {
      // Ignore malformed URLs and fall through to keyword checks.
    }
  }

  if (OFFICIAL_SOURCE_KEYWORDS.some((kw) => normalizedName.includes(kw))) {
    return {
      official: true,
      attribution: "official-keyword",
      reason: "Official source keywords matched",
    };
  }

  return {
    official: false,
    attribution: "unverified-source",
  };
}

function heuristicCurfewScore(text: string): {
  confidence: number;
  label: CurfewNlpResult["label"];
  reasons: string[];
} {
  const normalized = safeLower(text);
  const reasons: string[] = [];

  let score = 0.08;

  for (const kw of CURFEW_POSITIVE_KEYWORDS) {
    if (normalized.includes(kw)) {
      score += kw === "section 144" || kw === "crpc 144" ? 0.24 : 0.12;
      reasons.push(`Matched positive keyword: ${kw}`);
    }
  }

  for (const kw of CURFEW_NEGATIVE_KEYWORDS) {
    if (normalized.includes(kw)) {
      score -= 0.2;
      reasons.push(`Matched negative keyword: ${kw}`);
    }
  }

  // A source mentioning both section 144 and order semantics is very likely a true curfew order.
  if (normalized.includes("section 144") && (normalized.includes("order") || normalized.includes("imposed"))) {
    score += 0.18;
    reasons.push("Matched Section 144 + order context");
  }

  const confidence = clamp01(score);
  const label: CurfewNlpResult["label"] = confidence >= 0.5 ? "CURFEW" : "NOT_CURFEW";

  if (!reasons.length) {
    reasons.push("No strong curfew indicators in text");
  }

  return { confidence, label, reasons };
}

function parseRemoteCurfewResponse(data: unknown): { confidence: number; label: CurfewNlpResult["label"]; model: string } | null {
  if (!data) return null;

  // Common shape: [{ label: "CURFEW", score: 0.97 }]
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as { label?: string; score?: number };
    const label = String(first.label || "").toUpperCase().includes("CURFEW") ? "CURFEW" : "NOT_CURFEW";
    const confidence = typeof first.score === "number" ? clamp01(first.score) : 0;
    return { confidence, label, model: "distilbert-remote" };
  }

  // Flexible API contract for custom NLP service.
  if (typeof data === "object") {
    const payload = data as {
      confidence?: number;
      score?: number;
      isCurfew?: boolean;
      label?: string;
      model?: string;
    };

    const confidence = clamp01(Number(payload.confidence ?? payload.score ?? 0));
    const inferredCurfew = payload.isCurfew === true || String(payload.label || "").toUpperCase().includes("CURFEW");
    const label: CurfewNlpResult["label"] = inferredCurfew ? "CURFEW" : "NOT_CURFEW";
    return {
      confidence,
      label,
      model: String(payload.model || "distilbert-remote"),
    };
  }

  return null;
}

export async function classifyCurfewNotice(input: CurfewNlpInput): Promise<CurfewNlpResult> {
  const threshold = TRIGGER_THRESHOLDS.T5_NLP_CONFIDENCE;
  const sourceInfo = detectOfficialSource(input.sourceName, input.sourceUrl);
  const reasons: string[] = [];

  if (sourceInfo.reason) {
    reasons.push(sourceInfo.reason);
  }

  if (CURFEW_NLP_API_URL) {
    try {
      const response = await axios.post(
        CURFEW_NLP_API_URL,
        {
          text: input.text,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
        },
        {
          timeout: CURFEW_NLP_TIMEOUT_MS,
        },
      );

      const parsed = parseRemoteCurfewResponse(response.data);
      if (parsed) {
        const gatedConfidence = sourceInfo.official ? parsed.confidence : Math.min(parsed.confidence, 0.89);
        const isCurfew = parsed.label === "CURFEW" && gatedConfidence >= threshold && sourceInfo.official;

        reasons.push("Remote DistilBERT inference used");
        if (!sourceInfo.official) {
          reasons.push("Source not official; confidence gated below trigger threshold");
        }

        return {
          isCurfew,
          confidence: gatedConfidence,
          threshold,
          label: parsed.label,
          model: parsed.model,
          officialSource: sourceInfo.official,
          sourceAttribution: sourceInfo.attribution,
          reasons,
        };
      }

      reasons.push("Remote NLP response unparseable; falling back to local heuristic scorer");
    } catch {
      reasons.push("Remote NLP request failed; falling back to local heuristic scorer");
    }
  }

  const local = heuristicCurfewScore(input.text);

  // Keep fallback conservative for untrusted sources.
  const sourceAdjustedConfidence = sourceInfo.official
    ? clamp01(local.confidence + 0.1)
    : clamp01(local.confidence - 0.08);

  const isCurfew = local.label === "CURFEW" && sourceAdjustedConfidence >= threshold && sourceInfo.official;

  reasons.push(...local.reasons);
  if (!sourceInfo.official) {
    reasons.push("Official-source attribution missing; trigger blocked");
  }

  return {
    isCurfew,
    confidence: sourceAdjustedConfidence,
    threshold,
    label: local.label,
    model: "distilbert-heuristic-fallback",
    officialSource: sourceInfo.official,
    sourceAttribution: sourceInfo.attribution,
    reasons,
  };
}
import { TRIGGER_THRESHOLDS } from "@gigshield/shared-config";
import { evaluateTrigger } from "./trigger-engine.service";
import { getOfficialNoticeFeed } from "../feeds/official-notice-feed.service";
import { classifyCurfewNotice } from "./curfew-nlp-classifier.service";

const CURFEW_API_URL = process.env.CURFEW_FEED_URL ?? "MOCK";

/**
 * Mock curfew calendar keyed by zone → array of month-days (day-of-month) that
 * have active curfew orders in the simulation window (April 2025).
 */
const MOCK_CURFEW_CALENDAR: Record<string, number[]> = {
  DEL_DWK_01: [10, 11, 12], // communal tension simulation
  DEL_NOR_01: [10, 11],
  BLR_KOR_01: [14], // election eve restriction
  BLR_HSR_01: [],
  BLR_IND_01: [],
  PNE_KSB_01: [],
  PNE_KHR_01: [],
  MUM_ANH_01: [],
  MUM_BAN_01: [],
};

function isMockCurfewActive(zoneId: string): boolean {
  const today = new Date().getDate();
  return (MOCK_CURFEW_CALENDAR[zoneId] ?? []).includes(today);
}

function mockCurfewDecision(zone: { id: string }) {
  const active = isMockCurfewActive(zone.id);
  const fallbackConfidence = active ? TRIGGER_THRESHOLDS.T5_NLP_CONFIDENCE : 0;

  return evaluateTrigger({
    type: "T5_CURFEW",
    zoneId: zone.id,
    source1Value: fallbackConfidence >= TRIGGER_THRESHOLDS.T5_NLP_CONFIDENCE ? 1 : 0,
    source2Value: active ? 1 : 0,
    officialAdvisory: active,
    historicalPattern: active ? 0.7 : 0,
  });
}

type CurfewStatusPayload = {
  active: boolean;
  advisory?: boolean;
  official?: boolean;
  source?: string;
  sourceUrl?: string;
  message?: string;
};

async function fetchCurfewStatus(zone: { id: string }): Promise<CurfewStatusPayload> {
  if (CURFEW_API_URL === "MOCK") {
    const feed = getOfficialNoticeFeed("curfew", zone.id);
    return {
      active: feed.active,
      advisory: feed.official,
      official: feed.official,
      source: feed.source,
      message: feed.message,
    };
  }

  const res = await fetch(`${CURFEW_API_URL}/status?zone=${zone.id}`, {
    signal: AbortSignal.timeout(5000),
  });

  const data = (await res.json()) as CurfewStatusPayload;
  return {
    active: Boolean(data.active),
    advisory: data.advisory,
    official: data.official,
    source: data.source,
    sourceUrl: data.sourceUrl,
    message: data.message,
  };
}

export async function checkCurfewTrigger(zone: { id: string; lat: number; lng: number }) {
  try {
    const status = await fetchCurfewStatus(zone);
    if (!status.active && CURFEW_API_URL === "MOCK") {
      return mockCurfewDecision(zone);
    }

    const classifier = await classifyCurfewNotice({
      text: `${status.message || ""} ${status.source || ""}`.trim(),
      sourceName: status.source,
      sourceUrl: status.sourceUrl,
    });

    const nlpGatePass = classifier.isCurfew && classifier.confidence >= TRIGGER_THRESHOLDS.T5_NLP_CONFIDENCE;
    const officialSignal = Boolean(status.official ?? status.advisory ?? false) && classifier.officialSource;

    const decision = evaluateTrigger({
      type: "T5_CURFEW",
      zoneId: zone.id,
      source1Value: nlpGatePass ? 1 : 0,
      source2Value: officialSignal ? 1 : 0,
      officialAdvisory: officialSignal,
      historicalPattern: status.active ? 0.7 : 0,
    });

    return {
      ...decision,
      nlp: {
        label: classifier.label,
        confidence: classifier.confidence,
        threshold: classifier.threshold,
        model: classifier.model,
        officialSource: classifier.officialSource,
        sourceAttribution: classifier.sourceAttribution,
        reasons: classifier.reasons,
      },
      source: {
        official: officialSignal,
        source: status.source,
        sourceUrl: status.sourceUrl,
      },
    };
  } catch {
    return mockCurfewDecision(zone);
  }
}

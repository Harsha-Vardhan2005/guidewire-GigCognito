export interface DashboardStats {
  activePolicies: number;
  weeklyPoolAmount: number;
  thisWeekClaims: number;
  thisWeekClaimsAmount: number;
  reviewClaims: number;
  lossRatio: number;
  lossRatioCap: number;
  triggerEventsCount: number;
  uniqueZonesAffected: number;
}

export interface TriggerEvent {
  id: string;
  zone: string;
  type: string;
  status: "AUTO" | "PENDING" | "DENIED";
  confidence: string;
  workersAffected: number;
}

export interface FraudClaim {
  id: string;
  workerId: string;
  workerName: string;
  zone: string;
  claimAmount: number;
  fraudScore: string;
  triggerType: string;
  createdAt: string;
  flags: string[];
}

export interface FraudQueue {
  items: FraudClaim[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LossRatioPoint {
  week: string;
  loss_ratio: number;
  cap: number;
}

export interface PredictiveAlert {
  zone: string;
  event: string;
  probability: string;
  impact: string;
  daysOut: number;
}

export interface WorkerRow {
  workerId: string;
  zone: string;
  tier: string;
  claims: number;
  fraudFlag: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ZoneHeatmapData {
  zone: string;
  eventCount: number;
  intensity: "HIGH" | "MEDIUM" | "LOW";
  risk: number;
}

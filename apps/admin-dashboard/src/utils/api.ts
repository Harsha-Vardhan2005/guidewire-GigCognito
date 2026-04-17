import axios, { AxiosInstance } from "axios";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class AdminAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "/admin",  // Use Vite proxy instead of direct URL
      timeout: 30000,
    });

    // Add auth token to all requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("admin_token");
      console.log("[AdminAPI] Request to", config.url, "with token:", token ? "✓" : "✗");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Log responses and errors
    this.client.interceptors.response.use(
      (response) => {
        console.log("[AdminAPI] Response OK:", response.config.url, response.status);
        return response;
      },
      (error) => {
        console.error("[AdminAPI] Error:", error.config?.url, error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Dashboard Stats
  async getDashboardStats() {
    const res = await this.client.get<ApiResponse<any>>(
      "dashboard/stats"
    );
    return res.data;
  }

  // Triggers
  async getLiveTriggers() {
    const res = await this.client.get<ApiResponse<any>>(
      "dashboard/triggers"
    );
    return res.data;
  }

  // Fraud Queue
  async getFraudQueue(limit = 20, offset = 0) {
    const res = await this.client.get<ApiResponse<any>>(
      "dashboard/fraud-queue",
      { params: { limit, offset } }
    );
    return res.data;
  }

  // Loss Ratio Trend
  async getLossRatioTrend() {
    const res = await this.client.get<ApiResponse<any>>(
      "dashboard/loss-ratio"
    );
    return res.data;
  }

  // Predictive Alerts
  async getPredictiveAlerts() {
    const res = await this.client.get<ApiResponse<any>>(
      "dashboard/predictive-alerts"
    );
    return res.data;
  }

  // Workers
  async getWorkers(limit = 50, offset = 0, filters?: any) {
    const res = await this.client.get<ApiResponse<any>>(
      "dashboard/workers",
      { params: { limit, offset, ...filters } }
    );
    return res.data;
  }

  // Zone Heatmap
  async getZoneHeatmap() {
    const res = await this.client.get<ApiResponse<any>>(
      "dashboard/zone-heatmap"
    );
    return res.data;
  }

  // Update Fraud Claim
  async updateFraudClaim(
    claimId: string,
    action: "APPROVE" | "REJECT",
    notes?: string
  ) {
    const res = await this.client.put<ApiResponse<any>>(
      `dashboard/fraud-claim/${claimId}`,
      { action, notes }
    );
    return res.data;
  }

  // Analytics
  async getLossMetrics(timeframe = "week") {
    const res = await this.client.get<ApiResponse<any>>(
      "analytics/loss-metrics",
      { params: { timeframe } }
    );
    return res.data;
  }

  async getTriggerAnalytics() {
    const res = await this.client.get<ApiResponse<any>>(
      "analytics/triggers"
    );
    return res.data;
  }

  async getZoneAnalytics() {
    const res = await this.client.get<ApiResponse<any>>(
      "analytics/zones"
    );
    return res.data;
  }
}

export const adminAPI = new AdminAPI();

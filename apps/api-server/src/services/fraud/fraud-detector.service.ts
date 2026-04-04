/**
 * GigShield — 8-Signal GPS Anti-Spoofing Engine
 * Uses real IP geolocation, OpenWeatherMap, and WAQI to cross-validate claims.
 */

import axios from "axios";

const OWM_KEY  = process.env.OWM_API_KEY  || "MOCK";
const WAQI_TOKEN = process.env.WAQI_TOKEN || "MOCK";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LocationPing {
  workerId: string;
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;          // GPS accuracy metres — low accuracy = suspicious
  ipAddress: string;          // Real IP from express req.ip
  userAgent: string;          // Browser UA string
  deviceMotion?: boolean;     // Is accelerometer showing movement?
  batteryLevel?: number;      // 0–1, outdoor workers drain faster
  platformStatus?: "online" | "offline"; // Mock Zepto/Blinkit API status
}

export interface FraudSignal {
  name: string;
  passed: boolean;            // true = consistent with genuine worker
  score: number;              // 0–1 contribution to fraud score
  detail: string;
}

export interface FraudResult {
  workerId: string;
  fraudScore: number;         // 0–1, higher = more suspicious
  signalsPassed: number;      // out of 8
  decision: "AUTO_APPROVE" | "PROVISIONAL" | "MANUAL_REVIEW" | "AUTO_REJECT";
  signals: FraudSignal[];
  recommendation: string;
  payoutPercent: number;      // 100 / 80 / 0
}

// ─── Zone registry ────────────────────────────────────────────────────────────

const ZONES: Record<string, { lat: number; lng: number; radiusKm: number; city: string }> = {
  BLR_KOR_01: { lat: 12.9352,  lng: 77.6245, radiusKm: 2.5, city: "Bengaluru" },
  BLR_HSR_01: { lat: 12.9116,  lng: 77.6389, radiusKm: 2.5, city: "Bengaluru" },
  BLR_IND_01: { lat: 12.9784,  lng: 77.6408, radiusKm: 2.5, city: "Bengaluru" },
  DEL_DWK_01: { lat: 28.5921,  lng: 77.0460, radiusKm: 3.0, city: "Delhi"     },
  DEL_NOR_01: { lat: 28.5355,  lng: 77.3910, radiusKm: 3.0, city: "Delhi"     },
  MUM_ANH_01: { lat: 19.1136,  lng: 72.8697, radiusKm: 2.5, city: "Mumbai"    },
  MUM_BAN_01: { lat: 19.0596,  lng: 72.8295, radiusKm: 2.5, city: "Mumbai"    },
  PNE_KSB_01: { lat: 18.5167,  lng: 73.8562, radiusKm: 2.5, city: "Pune"      },
  PNE_KHR_01: { lat: 18.5512,  lng: 73.9343, radiusKm: 2.5, city: "Pune"      },
};

// ─── In-memory location history ───────────────────────────────────────────────

interface PingRecord {
  lat: number;
  lng: number;
  timestamp: number;
  ipAddress: string;
}

const locationHistory = new Map<string, PingRecord[]>(); // workerId → last 10 pings

export function recordPing(ping: LocationPing): void {
  const history = locationHistory.get(ping.workerId) || [];
  history.push({ lat: ping.lat, lng: ping.lng, timestamp: ping.timestamp, ipAddress: ping.ipAddress });
  if (history.length > 10) history.shift(); // keep last 10
  locationHistory.set(ping.workerId, history);
}

// ─── Haversine distance ───────────────────────────────────────────────────────

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Signal 1: GPS in zone ────────────────────────────────────────────────────

function checkGPSInZone(ping: LocationPing, zoneId: string): FraudSignal {
  const zone = ZONES[zoneId];
  if (!zone) return { name: "GPS In Zone", passed: false, score: 0.15, detail: "Unknown zone" };
  const dist = distanceKm(ping.lat, ping.lng, zone.lat, zone.lng);
  const passed = dist <= zone.radiusKm;
  return {
    name: "GPS In Zone",
    passed,
    score: passed ? 0 : 0.2,
    detail: passed
      ? `Worker is ${dist.toFixed(2)}km from zone centre — within ${zone.radiusKm}km radius`
      : `Worker is ${dist.toFixed(2)}km from zone — outside ${zone.radiusKm}km radius`,
  };
}

// ─── Signal 2: Location continuity ───────────────────────────────────────────

function checkLocationContinuity(ping: LocationPing): FraudSignal {
  const history = locationHistory.get(ping.workerId) || [];
  if (history.length < 2) {
    return { name: "Location Continuity", passed: true, score: 0, detail: "Insufficient history — giving benefit of doubt" };
  }
  const prev = history[history.length - 1];
  const timeDiffMin = (ping.timestamp - prev.timestamp) / 60000;
  const distKm = distanceKm(ping.lat, ping.lng, prev.lat, prev.lng);
  const speedKmh = timeDiffMin > 0 ? (distKm / timeDiffMin) * 60 : 0;

  // Teleportation: > 5km in < 2 min = suspicious
  const teleported = distKm > 5 && timeDiffMin < 2;
  // Impossible speed: > 120 km/h on a delivery bike
  const impossibleSpeed = speedKmh > 120;

  const passed = !teleported && !impossibleSpeed;
  return {
    name: "Location Continuity",
    passed,
    score: passed ? 0 : 0.2,
    detail: passed
      ? `Moved ${distKm.toFixed(2)}km in ${timeDiffMin.toFixed(1)} min (${speedKmh.toFixed(0)} km/h) — normal`
      : `Suspicious: ${distKm.toFixed(2)}km in ${timeDiffMin.toFixed(1)} min (${speedKmh.toFixed(0)} km/h)`,
  };
}

// ─── Signal 3: IP Geolocation (real — ip-api.com, free, no key) ──────────────

async function checkIPGeolocation(ping: LocationPing, zoneId: string): Promise<FraudSignal> {
  const zone = ZONES[zoneId];
  try {
    // Skip for localhost/private IPs
    const isPrivate = /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|::1$)/.test(ping.ipAddress);
    if (isPrivate) {
      return { name: "IP Geolocation", passed: true, score: 0, detail: "Private/local IP — skipped (dev mode)" };
    }

    const res = await axios.get(`http://ip-api.com/json/${ping.ipAddress}?fields=lat,lon,city,status`, { timeout: 3000 });
    const { lat, lon, city, status } = res.data;

    if (status !== "success") {
      return { name: "IP Geolocation", passed: true, score: 0, detail: "IP lookup failed — giving benefit of doubt" };
    }

    const ipDistFromZone = distanceKm(lat, lon, zone.lat, zone.lng);
    // Allow up to 50km — mobile data towers can be far
    const passed = ipDistFromZone < 50;

    return {
      name: "IP Geolocation",
      passed,
      score: passed ? 0 : 0.15,
      detail: passed
        ? `IP resolves to ${city} — ${ipDistFromZone.toFixed(0)}km from zone (within 50km threshold)`
        : `IP resolves to ${city} — ${ipDistFromZone.toFixed(0)}km from zone — possible home network`,
    };
  } catch {
    return { name: "IP Geolocation", passed: true, score: 0, detail: "IP check timed out — skipped" };
  }
}

// ─── Signal 4: GPS Accuracy ───────────────────────────────────────────────────

function checkGPSAccuracy(ping: LocationPing): FraudSignal {
  if (ping.accuracy === undefined) {
    return { name: "GPS Accuracy", passed: true, score: 0, detail: "Accuracy not reported — skipped" };
  }
  // Real outdoor GPS: 5–30m. Spoofing apps often report suspiciously perfect accuracy (0–3m)
  // or very poor accuracy (>500m = not actually using GPS)
  const suspiciouslyPerfect = ping.accuracy < 3;
  const suspiciouslyPoor    = ping.accuracy > 500;
  const passed = !suspiciouslyPerfect && !suspiciouslyPoor;

  return {
    name: "GPS Accuracy",
    passed,
    score: passed ? 0 : 0.1,
    detail: passed
      ? `GPS accuracy ${ping.accuracy}m — consistent with real outdoor device`
      : suspiciouslyPerfect
        ? `GPS accuracy ${ping.accuracy}m — suspiciously perfect (possible emulator)`
        : `GPS accuracy ${ping.accuracy}m — too poor (device may not have GPS fix)`,
  };
}

// ─── Signal 5: Device Motion ──────────────────────────────────────────────────

function checkDeviceMotion(ping: LocationPing): FraudSignal {
  if (ping.deviceMotion === undefined) {
    return { name: "Device Motion", passed: true, score: 0, detail: "Motion data not available — skipped" };
  }
  // Genuine outdoor worker = phone moving. Spoofer at home = stationary.
  return {
    name: "Device Motion",
    passed: ping.deviceMotion,
    score: ping.deviceMotion ? 0 : 0.1,
    detail: ping.deviceMotion
      ? "Device showing movement — consistent with active delivery"
      : "Device stationary — inconsistent with outdoor delivery work",
  };
}

// ─── Signal 6: Platform Status ────────────────────────────────────────────────

function checkPlatformStatus(ping: LocationPing): FraudSignal {
  // In production: call Zepto/Blinkit partner API to verify online status
  // For demo: use the platformStatus field from frontend
  const passed = ping.platformStatus === "online";
  return {
    name: "Platform Status",
    passed,
    score: passed ? 0 : 0.25, // High weight — offline before trigger = auto disqualify signal
    detail: passed
      ? "Worker was online/available on platform before trigger — eligible"
      : "Worker was offline on platform before trigger — policy exclusion applies",
  };
}

// ─── Signal 7: Real Weather at Location (OpenWeatherMap) ─────────────────────

async function checkRealWeather(ping: LocationPing, triggerType: string): Promise<FraudSignal> {
  try {
    const res = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: { lat: ping.lat, lon: ping.lng, appid: OWM_KEY, units: "metric" },
      timeout: 4000,
    });

    const rain1h   = res.data.rain?.["1h"] ?? 0;
    const temp     = res.data.main?.temp ?? 25;
    const weather  = res.data.weather?.[0]?.description ?? "unknown";

    if (triggerType === "T1_RAINFALL") {
      const passed = rain1h > 5; // At least some rain at GPS location
      return {
        name: "Real Weather Match",
        passed,
        score: passed ? 0 : 0.15,
        detail: passed
          ? `OWM confirms ${rain1h.toFixed(1)}mm/hr rain at GPS location (${weather})`
          : `OWM shows only ${rain1h.toFixed(1)}mm/hr at GPS location — weather doesn't match claim`,
      };
    }

    if (triggerType === "T4_HEATWAVE") {
      const passed = temp > 40;
      return {
        name: "Real Weather Match",
        passed,
        score: passed ? 0 : 0.15,
        detail: passed
          ? `OWM confirms ${temp.toFixed(1)}°C at GPS location`
          : `OWM shows ${temp.toFixed(1)}°C — below heatwave threshold at GPS location`,
      };
    }

    return { name: "Real Weather Match", passed: true, score: 0, detail: `OWM: ${weather}, ${temp.toFixed(1)}°C — not weather trigger` };
  } catch {
    return { name: "Real Weather Match", passed: true, score: 0, detail: "OWM check timed out — skipped" };
  }
}

// ─── Signal 8: Real AQI at Location (WAQI) ───────────────────────────────────

async function checkRealAQI(ping: LocationPing, triggerType: string): Promise<FraudSignal> {
  if (triggerType !== "T2_AQI") {
    return { name: "Real AQI Match", passed: true, score: 0, detail: "Not an AQI trigger — skipped" };
  }
  try {
    const res = await axios.get(
      `https://api.waqi.info/feed/geo:${ping.lat};${ping.lng}/`,
      { params: { token: WAQI_TOKEN }, timeout: 4000 }
    );
    const aqi = res.data?.data?.aqi ?? 0;
    const passed = aqi > 150; // At least unhealthy AQI at GPS location
    return {
      name: "Real AQI Match",
      passed,
      score: passed ? 0 : 0.15,
      detail: passed
        ? `WAQI confirms AQI ${aqi} at GPS location — hazardous conditions verified`
        : `WAQI shows AQI ${aqi} at GPS location — does not match AQI claim`,
    };
  } catch {
    return { name: "Real AQI Match", passed: true, score: 0, detail: "WAQI check timed out — skipped" };
  }
}

// ─── Main: Run all 8 signals ──────────────────────────────────────────────────

export async function runFraudDetection(
  ping: LocationPing,
  zoneId: string,
  triggerType: string
): Promise<FraudResult> {

  // Run all checks (parallel where possible)
  const [ipSignal, weatherSignal, aqiSignal] = await Promise.all([
    checkIPGeolocation(ping, zoneId),
    checkRealWeather(ping, triggerType),
    checkRealAQI(ping, triggerType),
  ]);

  const signals: FraudSignal[] = [
    checkGPSInZone(ping, zoneId),
    checkLocationContinuity(ping),
    ipSignal,
    checkGPSAccuracy(ping),
    checkDeviceMotion(ping),
    checkPlatformStatus(ping),
    weatherSignal,
    aqiSignal,
  ];

  // Record ping AFTER continuity check (so it uses previous history)
  recordPing(ping);

  const signalsPassed  = signals.filter(s => s.passed).length;
  const fraudScore     = parseFloat(signals.reduce((sum, s) => sum + s.score, 0).toFixed(2));

  let decision: FraudResult["decision"];
  let recommendation: string;
  let payoutPercent: number;

  if (signalsPassed >= 6) {
    decision        = "AUTO_APPROVE";
    recommendation  = "Strong behavioral match — auto-approve payout";
    payoutPercent   = 100;
  } else if (signalsPassed >= 4) {
    decision        = "PROVISIONAL";
    recommendation  = "Sufficient signals — release 80% now, hold 20% for 24hr verification";
    payoutPercent   = 80;
  } else if (signalsPassed >= 2) {
    decision        = "MANUAL_REVIEW";
    recommendation  = "Insufficient signals — queue for human review within 2 hours";
    payoutPercent   = 0;
  } else {
    decision        = "AUTO_REJECT";
    recommendation  = "High fraud probability — reject and flag account";
    payoutPercent   = 0;
  }

  // Hard override: platform offline before trigger = always reject
  const platformSignal = signals.find(s => s.name === "Platform Status");
  if (platformSignal && !platformSignal.passed) {
    decision       = "AUTO_REJECT";
    recommendation = "Worker was offline before trigger — policy exclusion. No payout.";
    payoutPercent  = 0;
  }

  return { workerId: ping.workerId, fraudScore, signalsPassed, decision, signals, recommendation, payoutPercent };
}

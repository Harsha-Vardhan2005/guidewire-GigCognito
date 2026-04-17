import { prisma } from "../config/db";

/**
 * Anti-Spoofing Service
 * Detects GPS spoofing, device manipulation, and behavioral anomalies
 * Contributes fraud scores to claim validation pipeline
 */

interface DeviceFingerprint {
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  isRooted?: boolean;
  isEmulator?: boolean;
  location?: { latitude: number; longitude: number };
  timestamp: number;
}

interface PhotoMetadata {
  exifGPS?: { latitude: number; longitude: number };
  exifTimestamp?: number;
  cameraModel?: string;
  imageTimestamp?: number;
}

interface SpoofingAnalysis {
  gpsScore: number;
  deviceScore: number;
  behavioralScore: number;
  photoScore: number;
  overallRisk: number; // 0-1, higher = more suspicious
  flags: string[];
  details: {
    gpsDetails: any;
    deviceDetails: any;
    behavioralDetails: any;
    photoDetails: any;
  };
}

export const antiSpoofingService = {
  /**
   * Comprehensive spoofing analysis for a claim
   */
  async analyzeClaimSpoofing(
    workerId: string,
    claimData: {
      claimId: string;
      deviceFingerprint: DeviceFingerprint;
      photoMetadata?: PhotoMetadata;
      claimLocation: { latitude: number; longitude: number };
      previousLocations?: Array<{ latitude: number; longitude: number; timestamp: number }>;
    }
  ): Promise<SpoofingAnalysis> {
    try {
      const gpsAnalysis = await this.detectGPSSpoofing(workerId, claimData);
      const deviceAnalysis = await this.analyzeDeviceFingerprint(
        workerId,
        claimData.deviceFingerprint
      );
      const behavioralAnalysis = await this.analyzeBehavioralPatterns(workerId, claimData);
      const photoAnalysis = claimData.photoMetadata
        ? await this.verifyPhotoMetadata(claimData.photoMetadata, claimData.claimLocation)
        : { score: 0, flags: [], details: {} };

      // Weighted score calculation
      const weights = { gps: 0.35, device: 0.25, behavioral: 0.25, photo: 0.15 };
      const overallRisk =
        gpsAnalysis.score * weights.gps +
        deviceAnalysis.score * weights.device +
        behavioralAnalysis.score * weights.behavioral +
        photoAnalysis.score * weights.photo;

      const allFlags = [
        ...gpsAnalysis.flags,
        ...deviceAnalysis.flags,
        ...behavioralAnalysis.flags,
        ...photoAnalysis.flags,
      ];

      return {
        gpsScore: gpsAnalysis.score,
        deviceScore: deviceAnalysis.score,
        behavioralScore: behavioralAnalysis.score,
        photoScore: photoAnalysis.score,
        overallRisk: Math.min(overallRisk, 1),
        flags: [...new Set(allFlags)],
        details: {
          gpsDetails: gpsAnalysis.details,
          deviceDetails: deviceAnalysis.details,
          behavioralDetails: behavioralAnalysis.details,
          photoDetails: photoAnalysis.details,
        },
      };
    } catch (error) {
      console.error("[AntiSpoofing] Analysis error:", error);
      return {
        gpsScore: 0.3,
        deviceScore: 0.2,
        behavioralScore: 0.2,
        photoScore: 0.1,
        overallRisk: 0.2,
        flags: ["ANALYSIS_ERROR"],
        details: { gpsDetails: {}, deviceDetails: {}, behavioralDetails: {}, photoDetails: {} },
      };
    }
  },

  /**
   * GPS Spoofing Detection
   * Detects impossible travel speeds, geofence violations, signal anomalies
   */
  async detectGPSSpoofing(
    workerId: string,
    claimData: {
      claimLocation: { latitude: number; longitude: number };
      previousLocations?: Array<{ latitude: number; longitude: number; timestamp: number }>;
      deviceFingerprint: DeviceFingerprint;
    }
  ) {
    const flags: string[] = [];
    let score = 0;
    const details: any = {};

    try {
      // Get worker's recent claim history
      const recentClaims = await prisma.claim.findMany({
        where: {
          workerId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // 1. Velocity Check - Impossible travel speed
      if (claimData.previousLocations && claimData.previousLocations.length > 0) {
        const lastLocation = claimData.previousLocations[claimData.previousLocations.length - 1];
        const distance = this.calculateDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          claimData.claimLocation.latitude,
          claimData.claimLocation.longitude
        );

        const timeDiffMinutes = (claimData.deviceFingerprint.timestamp - lastLocation.timestamp) / (1000 * 60);
        const speedKmh = (distance / timeDiffMinutes) * 60;

        details.velocityCheck = { distance, timeDiffMinutes, speedKmh };

        // Delivery workers typically max 50km/h, beyond 100km/h is suspicious
        if (speedKmh > 100 && timeDiffMinutes < 60) {
          flags.push(`IMPOSSIBLE_VELOCITY_${Math.round(speedKmh)}kmh`);
          score += 0.4;
        } else if (speedKmh > 80 && timeDiffMinutes < 30) {
          flags.push(`HIGH_VELOCITY_${Math.round(speedKmh)}kmh`);
          score += 0.2;
        }
      }

      // 2. Geofence Validation - Check if claim is within worker's zone
      const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        select: { zone: true },
      });

      if (worker) {
        const isInZone = this.isLocationInZone(
          claimData.claimLocation,
          worker.zone
        );
        details.geofenceCheck = { zone: worker.zone, isInZone };

        if (!isInZone) {
          flags.push("OUTSIDE_ASSIGNED_ZONE");
          score += 0.35;
        }
      }

      // 3. Signal Strength Analysis - Rapid location changes
      if (claimData.previousLocations && claimData.previousLocations.length >= 2) {
        const last2 = claimData.previousLocations.slice(-2);
        const dist1 = this.calculateDistance(
          last2[0].latitude,
          last2[0].longitude,
          last2[1].latitude,
          last2[1].longitude
        );
        const dist2 = this.calculateDistance(
          last2[1].latitude,
          last2[1].longitude,
          claimData.claimLocation.latitude,
          claimData.claimLocation.longitude
        );

        const timeDiff = (claimData.deviceFingerprint.timestamp - last2[0].timestamp) / 1000;
        const consistency = dist1 > 0 ? dist2 / dist1 : 0;

        details.signalStrength = { dist1, dist2, consistency };

        // Erratic movement pattern
        if (consistency > 3 || consistency < 0.1) {
          flags.push("ERRATIC_MOVEMENT_PATTERN");
          score += 0.3;
        }
      }

      // 4. Recurring Location Anomaly
      const sameLocationClaims = recentClaims.filter(
        (c) => 
          c.claimLocation && 
          this.calculateDistance(
            (c.claimLocation as any).latitude,
            (c.claimLocation as any).longitude,
            claimData.claimLocation.latitude,
            claimData.claimLocation.longitude
          ) < 0.5 // Within 500m
      );

      details.recurringLocation = { count: sameLocationClaims.length };
      if (sameLocationClaims.length > 10) {
        flags.push("RECURRING_LOCATION_PATTERN");
        score += 0.25;
      }

      // Normalize score
      score = Math.min(score, 1);
      details.normalizedScore = score;
    } catch (error) {
      console.error("[GPS Spoofing] Error:", error);
      score = 0.1;
      flags.push("GPS_CHECK_ERROR");
    }

    return { score, flags, details };
  },

  /**
   * Device Fingerprinting
   * Detects rooted devices, emulators, and integrity violations
   */
  async analyzeDeviceFingerprint(
    workerId: string,
    fingerprint: DeviceFingerprint
  ) {
    const flags: string[] = [];
    let score = 0;
    const details: any = { ...fingerprint };

    try {
      // 1. Rooted/Jailbroken Detection
      if (fingerprint.isRooted === true) {
        flags.push("ROOTED_DEVICE");
        score += 0.45;
      }

      // 2. Emulator Detection
      if (fingerprint.isEmulator === true) {
        flags.push("EMULATOR_DETECTED");
        score += 0.5;
      }

      // 3. Device Consistency Check
      const previousFingerprints = await prisma.claimEvent.findMany({
        where: { workerId, eventType: "DEVICE_FINGERPRINT" },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      const uniqueDevices = new Set(
        previousFingerprints.map((e) => (e.metadata as any)?.deviceId)
      );

      details.previousDeviceCount = uniqueDevices.size;
      if (uniqueDevices.size > 3) {
        flags.push(`MULTIPLE_DEVICES_${uniqueDevices.size}`);
        score += 0.25;
      }

      // 4. Suspicious Device Model Pattern
      const suspiciousModels = ["Unknown", "emulator", "simulator", "virtual"];
      const isSuspicious = suspiciousModels.some((model) =>
        fingerprint.deviceModel.toLowerCase().includes(model.toLowerCase())
      );

      if (isSuspicious) {
        flags.push(`SUSPICIOUS_DEVICE_MODEL_${fingerprint.deviceModel}`);
        score += 0.3;
      }

      // 5. OS/App Version Tampering
      if (fingerprint.osVersion && fingerprint.osVersion.includes("modified")) {
        flags.push("MODIFIED_OS_DETECTED");
        score += 0.35;
      }

      // Normalize score
      score = Math.min(score, 1);
      details.normalizedScore = score;
    } catch (error) {
      console.error("[Device Fingerprinting] Error:", error);
      score = 0.1;
      flags.push("DEVICE_CHECK_ERROR");
    }

    return { score, flags, details };
  },

  /**
   * Behavioral Pattern Analysis
   * Detects unusual claiming patterns, time-of-day exploits, frequency anomalies
   */
  async analyzeBehavioralPatterns(
    workerId: string,
    claimData: {
      claimId: string;
      deviceFingerprint: DeviceFingerprint;
    }
  ) {
    const flags: string[] = [];
    let score = 0;
    const details: any = {};

    try {
      // Get worker's historical claims
      const historicalClaims = await prisma.claim.findMany({
        where: {
          workerId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      // 1. Unusual Frequency Pattern
      const claimsLastDay = historicalClaims.filter(
        (c) => c.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      details.claimsLastDay = claimsLastDay;
      if (claimsLastDay > 15) {
        flags.push(`EXCESSIVE_CLAIMS_${claimsLastDay}_per_day`);
        score += 0.3;
      }

      // 2. Time-of-Day Exploitation
      const claimHour = new Date(claimData.deviceFingerprint.timestamp).getHours();
      const midnightClaims = historicalClaims.filter((c) => {
        const hour = new Date(c.createdAt).getHours();
        return hour >= 22 || hour < 5; // Off-hours: 10 PM - 5 AM
      }).length;

      details.midnightClaims = midnightClaims;
      if (claimHour >= 22 || claimHour < 5) {
        if (midnightClaims > historicalClaims.length * 0.15) {
          flags.push("MIDNIGHT_EXPLOITATION_PATTERN");
          score += 0.25;
        }
      }

      // 3. Claim Sequence Anomaly
      if (historicalClaims.length >= 3) {
        const recentClaims = historicalClaims.slice(0, 3);
        const timeBetweenClaims = recentClaims.map((c, i) => {
          if (i === 0) return null;
          return (recentClaims[i - 1].createdAt.getTime() - c.createdAt.getTime()) / (1000 * 60);
        });

        details.timeBetweenClaims = timeBetweenClaims.filter((t) => t !== null);

        // Extremely rapid claims
        if (timeBetweenClaims.some((t) => t && t < 5)) {
          flags.push("RAPID_CLAIM_SEQUENCE");
          score += 0.2;
        }
      }

      // 4. Historical Approval Rate
      const approvedClaims = historicalClaims.filter((c) => c.status === "APPROVED").length;
      const approvalRate = historicalClaims.length > 0 ? approvedClaims / historicalClaims.length : 0;

      details.approvalRate = approvalRate;
      if (approvalRate > 0.95 && historicalClaims.length >= 10) {
        flags.push("SUSPICIOUSLY_HIGH_APPROVAL");
        score += 0.15; // Slight flag, could be legitimate
      }

      // 5. Claim Amount Deviation
      if (historicalClaims.length >= 5) {
        const amounts = historicalClaims.map((c) => c.claimAmount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(
          amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) / amounts.length
        );

        details.claimAmountAnalysis = { avgAmount, stdDev };

        // If current claim deviates significantly
        const latestAmount = historicalClaims[0].claimAmount;
        if (Math.abs(latestAmount - avgAmount) > stdDev * 2.5) {
          flags.push("ANOMALOUS_CLAIM_AMOUNT");
          score += 0.2;
        }
      }

      // Normalize score
      score = Math.min(score, 1);
      details.normalizedScore = score;
    } catch (error) {
      console.error("[Behavioral Analysis] Error:", error);
      score = 0.1;
      flags.push("BEHAVIORAL_CHECK_ERROR");
    }

    return { score, flags, details };
  },

  /**
   * Photo Metadata Verification
   * Validates EXIF data, timestamps, GPS coordinates in photos
   */
  async verifyPhotoMetadata(
    photoMetadata: PhotoMetadata,
    claimLocation: { latitude: number; longitude: number }
  ) {
    const flags: string[] = [];
    let score = 0;
    const details: any = { ...photoMetadata };

    try {
      // 1. EXIF GPS Mismatch
      if (photoMetadata.exifGPS) {
        const gpsDistance = this.calculateDistance(
          photoMetadata.exifGPS.latitude,
          photoMetadata.exifGPS.longitude,
          claimLocation.latitude,
          claimLocation.longitude
        );

        details.gpsDistance = gpsDistance;

        if (gpsDistance > 1) {
          // More than 1km away
          flags.push(`GPS_MISMATCH_${(gpsDistance * 1000).toFixed(0)}m`);
          score += 0.35;
        } else if (gpsDistance > 0.1) {
          flags.push(`GPS_OFFSET_${(gpsDistance * 1000).toFixed(0)}m`);
          score += 0.15;
        }
      }

      // 2. Timestamp Inconsistency
      if (photoMetadata.exifTimestamp && photoMetadata.imageTimestamp) {
        const timeDiffMs = Math.abs(photoMetadata.exifTimestamp - photoMetadata.imageTimestamp);
        const timeDiffMinutes = timeDiffMs / (1000 * 60);

        details.timestampDiff = timeDiffMinutes;

        if (timeDiffMinutes > 60) {
          flags.push(`TIMESTAMP_MISMATCH_${Math.round(timeDiffMinutes)}min`);
          score += 0.25;
        }
      }

      // 3. Camera Model Verification
      if (photoMetadata.cameraModel) {
        const suspiciousModels = ["Unknown", "Modified", "Edited"];
        if (suspiciousModels.some((m) => photoMetadata.cameraModel?.includes(m))) {
          flags.push(`SUSPICIOUS_CAMERA_MODEL_${photoMetadata.cameraModel}`);
          score += 0.2;
        }
      }

      // 4. EXIF Data Stripping (Photos without metadata are suspicious)
      if (!photoMetadata.exifTimestamp && !photoMetadata.exifGPS) {
        flags.push("EXIF_DATA_STRIPPED");
        score += 0.25;
      }

      // Normalize score
      score = Math.min(score, 1);
      details.normalizedScore = score;
    } catch (error) {
      console.error("[Photo Verification] Error:", error);
      score = 0.1;
      flags.push("PHOTO_CHECK_ERROR");
    }

    return { score, flags, details };
  },

  /**
   * Helper: Calculate distance between two GPS coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Helper: Check if location is within assigned worker zone
   * Simple bounding box check (can be improved with polygon geofencing)
   */
  isLocationInZone(location: { latitude: number; longitude: number }, zone: string): boolean {
    // Simplified zone boundaries (should be in database in production)
    const zoneMap: any = {
      "BLR-Koramangala": { minLat: 12.93, maxLat: 12.96, minLon: 77.62, maxLon: 77.65 },
      "DEL-Dwarka": { minLat: 28.58, maxLat: 28.62, minLon: 77.04, maxLon: 77.08 },
      "MUM-Andheri": { minLat: 19.11, maxLat: 19.14, minLon: 72.82, maxLon: 72.86 },
      "PUN-Kasba Peth": { minLat: 18.51, maxLat: 18.54, minLon: 73.84, maxLon: 73.87 },
      "HYD-Banjara Hills": { minLat: 17.36, maxLat: 17.39, minLon: 78.43, maxLon: 78.46 },
    };

    const bounds = zoneMap[zone];
    if (!bounds) return true; // Unknown zone, pass

    return (
      location.latitude >= bounds.minLat &&
      location.latitude <= bounds.maxLat &&
      location.longitude >= bounds.minLon &&
      location.longitude <= bounds.maxLon
    );
  },
};

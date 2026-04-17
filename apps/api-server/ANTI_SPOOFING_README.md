# Anti-Spoofing Detection System

## Overview

The Anti-Spoofing Detection System is a comprehensive fraud prevention module that analyzes claims for GPS spoofing, device manipulation, behavioral anomalies, and photo tampering. It assigns a risk score to each claim (0-1, where 1 is highest risk).

## Architecture

- **Service**: `apps/api-server/src/services/anti-spoofing.service.ts`
- **Controller**: `apps/api-server/src/controllers/anti-spoofing.controller.ts`
- **Routes**: `apps/api-server/src/routes/anti-spoofing.routes.ts`
- **Integration**: Auto-integrated into claim processing pipeline

## Detection Methods

### 1. GPS Spoofing Detection (35% weight)

Detects falsified or forged GPS coordinates using multiple techniques:

#### Velocity Check
- Calculates impossible travel speeds between consecutive claim locations
- Flags speeds > 100 km/h consistently (~HIGH_VELOCITY flag)
- Red flag: speeds > 150 km/h (IMPOSSIBLE_VELOCITY flag)

#### Geofence Validation
- Verifies claim location is within worker's assigned zone
- Uses bounding box geofencing with pre-defined zone boundaries
- Flag: OUTSIDE_ASSIGNED_ZONE

#### Signal Strength Analysis
- Detects erratic movement patterns (rapid location changes)
- Identifies inconsistent movement trajectories
- Flag: ERRATIC_MOVEMENT_PATTERN

#### Recurring Location Anomaly
- Finds patterns of claiming from identical locations
- Flags > 10 claims from within 500m radius
- Flag: RECURRING_LOCATION_PATTERN

**Risk Score Calculation:**
- Base: 0.0
- +0.4 for impossible velocity
- +0.2 for high velocity
- +0.35 for geofence violation
- +0.3 for erratic movement
- +0.25 for recurring location

---

### 2. Device Fingerprinting (25% weight)

Identifies device tampering, emulators, and fake devices:

#### Rooted/Jailbroken Detection
- Checks if OS is rooted (Android) or jailbroken (iOS)
- Flag: ROOTED_DEVICE (+0.45 risk)

#### Emulator Detection
- Identifies emulated environments and simulators
- Flag: EMULATOR_DETECTED (+0.5 risk)

#### Device Consistency Check
- Tracks unique devices associated with worker
- Flags > 3 unique devices
- Flag: MULTIPLE_DEVICES_X (+0.25 risk)

#### Suspicious Device Model
- Checks for suspicious device models (Unknown, simulator, virtual)
- Flag: SUSPICIOUS_DEVICE_MODEL_X (+0.3 risk)

#### OS/App Tampering
- Detects modified OS versions
- Flag: MODIFIED_OS_DETECTED (+0.35 risk)

**Risk Score Calculation:**
- Base: 0.0
- +0.45 for rooted device
- +0.5 for emulator
- +0.25 for multiple devices
- +0.3 for suspicious model
- +0.35 for modified OS

---

### 3. Behavioral Pattern Analysis (25% weight)

Detects claiming patterns that indicate fraud:

#### Excessive Claim Frequency
- Flags > 15 claims per day
- Flag: EXCESSIVE_CLAIMS_X_per_day (+0.3 risk)

#### Time-of-Day Exploitation
- Detects claims during unusual hours (10 PM - 5 AM)
- Flags if > 15% of claims are off-hours
- Flag: MIDNIGHT_EXPLOITATION_PATTERN (+0.25 risk)

#### Rapid Claim Sequences
- Identifies claims within 5 minutes of each other
- Flag: RAPID_CLAIM_SEQUENCE (+0.2 risk)

#### Anomalous Approval Rate
- Flags workers with > 95% approval rate over 10+ claims
- Flag: SUSPICIOUSLY_HIGH_APPROVAL (+0.15 risk)

#### Claim Amount Deviation
- Detects claims deviating > 2.5 standard deviations from average
- Flag: ANOMALOUS_CLAIM_AMOUNT (+0.2 risk)

**Risk Score Calculation:**
- Base: 0.0
- +0.3 for excessive frequency
- +0.25 for midnight exploitation
- +0.2 for rapid sequences
- +0.15 for high approval rate
- +0.2 for anomalous amount

---

### 4. Photo Metadata Verification (15% weight)

Validates photo authenticity through EXIF data analysis:

#### EXIF GPS Mismatch
- Compares GPS in image metadata to claimed location
- Flags > 1 km distance: +0.35 risk
- Flags 100m - 1km distance: +0.15 risk

#### Timestamp Inconsistency
- Compares EXIF timestamp to image file timestamp
- Flags > 60 minute difference
- Flag: TIMESTAMP_MISMATCH_Xmin (+0.25 risk)

#### Camera Model Verification
- Identifies photos from suspicious camera models
- Flag: SUSPICIOUS_CAMERA_MODEL_X (+0.2 risk)

#### EXIF Data Stripping
- Detects photos with completely stripped metadata
- Flag: EXIF_DATA_STRIPPED (+0.25 risk)

**Risk Score Calculation:**
- Base: 0.0
- +0.35 for > 1km GPS mismatch
- +0.15 for 100m-1km offset
- +0.25 for timestamp mismatch
- +0.2 for suspicious camera
- +0.25 for stripped EXIF

---

## API Endpoints

### 1. Analyze Claim for Spoofing

**Endpoint**: `POST /api/anti-spoofing/analyze`

**Request Body:**
```json
{
  "claimId": "claim-12345",
  "workerId": "worker-001",
  "deviceFingerprint": {
    "deviceId": "device-xyz-789",
    "deviceModel": "Samsung Galaxy A12",
    "osVersion": "Android 11",
    "appVersion": "1.2.3",
    "isRooted": false,
    "isEmulator": false,
    "location": {
      "latitude": 12.9352,
      "longitude": 77.6245
    },
    "timestamp": 1713293400000
  },
  "photoMetadata": {
    "exifGPS": {
      "latitude": 12.9350,
      "longitude": 77.6244
    },
    "exifTimestamp": 1713293350000,
    "cameraModel": "Samsung Galaxy A12 Rear",
    "imageTimestamp": 1713293350000
  },
  "claimLocation": {
    "latitude": 12.9352,
    "longitude": 77.6245
  },
  "previousLocations": [
    {
      "latitude": 12.9300,
      "longitude": 77.6100,
      "timestamp": 1713290000000
    },
    {
      "latitude": 12.9340,
      "longitude": 77.6230,
      "timestamp": 1713292000000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gpsScore": 0.15,
    "deviceScore": 0.1,
    "behavioralScore": 0.2,
    "photoScore": 0.05,
    "overallRisk": 0.143,
    "flags": [
      "GPS_OFFSET_150m",
      "TIMESTAMP_MISMATCH_1min"
    ],
    "details": {
      "gpsDetails": {
        "velocityCheck": {
          "distance": 0.85,
          "timeDiffMinutes": 32,
          "speedKmh": 1.6
        },
        "geofenceCheck": {
          "zone": "BLR-Koramangala",
          "isInZone": true
        }
      },
      "deviceDetails": {},
      "behavioralDetails": {},
      "photoDetails": {
        "gpsDistance": 0.15,
        "timestampDiff": 1
      }
    }
  }
}
```

---

### 2. GPS Spoofing Report for Worker

**Endpoint**: `GET /api/anti-spoofing/gps-report/:workerId`

**Response:**
```json
{
  "success": true,
  "data": {
    "workerId": "worker-001",
    "totalAnalyses": 15,
    "highRiskCount": 2,
    "averageRiskScore": 0.24,
    "riskLevel": "LOW",
    "topFlags": [
      ["GPS_OFFSET_150m", 8],
      ["VELOCITY_CHECK_OK", 12],
      ["HIGH_VELOCITY_85kmh", 2]
    ],
    "detailedAnalyses": [
      {
        "claimId": "claim-12345",
        "claimAmount": 5000,
        "claimStatus": "APPROVED",
        "riskScore": 0.15,
        "flags": ["GPS_OFFSET_150m"],
        "createdAt": "2026-04-16T18:30:00Z"
      }
    ]
  }
}
```

---

### 3. Device Fingerprint History

**Endpoint**: `GET /api/anti-spoofing/devices/:workerId`

**Response:**
```json
{
  "success": true,
  "data": {
    "workerId": "worker-001",
    "uniqueDevices": 2,
    "devices": [
      {
        "deviceId": "device-xyz-789",
        "firstSeen": "2026-04-10T10:00:00Z",
        "lastSeen": "2026-04-16T18:30:00Z",
        "claimCount": 14,
        "metadata": {
          "deviceModel": "Samsung Galaxy A12",
          "osVersion": "Android 11",
          "appVersion": "1.2.3",
          "isRooted": false,
          "isEmulator": false
        }
      },
      {
        "deviceId": "device-abc-456",
        "firstSeen": "2026-04-15T09:00:00Z",
        "lastSeen": "2026-04-16T12:00:00Z",
        "claimCount": 3,
        "metadata": {
          "deviceModel": "iPhone 12",
          "osVersion": "iOS 15.2",
          "appVersion": "1.2.3",
          "isRooted": false,
          "isEmulator": false
        }
      }
    ]
  }
}
```

---

### 4. Worker Behavioral Analysis

**Endpoint**: `GET /api/anti-spoofing/behavior/:workerId`

**Response:**
```json
{
  "success": true,
  "data": {
    "workerId": "worker-001",
    "period": "Last 30 days",
    "metrics": {
      "totalClaims": 45,
      "approvedClaims": 42,
      "rejectedClaims": 1,
      "underReviewClaims": 2,
      "approvalRate": 0.933,
      "avgClaimAmount": 4850,
      "claimsByHour": {
        "8": 5,
        "9": 7,
        "10": 8,
        "14": 6,
        "15": 9,
        "16": 5
      },
      "dailyClaimsDistribution": [
        { "day": "04/10/2026", "count": 6 },
        { "day": "04/11/2026", "count": 7 },
        { "day": "04/12/2026", "count": 5 }
      ]
    },
    "redFlags": []
  }
}
```

---

## Risk Score Interpretation

| Score Range | Risk Level | Action |
|-------------|-----------|--------|
| 0.0 - 0.2  | LOW       | Auto-approve |
| 0.2 - 0.5  | MEDIUM    | Manual review recommended |
| 0.5 - 0.7  | HIGH      | Escalate for investigation |
| 0.7 - 1.0  | CRITICAL  | Reject/Block immediately |

---

## Integration with Claim Processing

When a claim is submitted:

1. **Extract device fingerprint** from request
2. **Call analyze endpoint** with claim data
3. **Get risk score** (0-1)
4. **Update claim fraud score**:
   - If risk > 0.5: Flag for manual review
   - If risk > 0.7: Auto-reject
   - Otherwise: Process normally
5. **Save analysis** in database for audit trail

---

## Example Curl Requests

### Analyze a Claim
```bash
curl -X POST http://localhost:8000/api/anti-spoofing/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "claim-001",
    "workerId": "worker-001",
    "deviceFingerprint": {
      "deviceId": "device-123",
      "deviceModel": "Samsung Galaxy A12",
      "osVersion": "Android 11",
      "appVersion": "1.2.3",
      "isRooted": false,
      "isEmulator": false,
      "location": {"latitude": 12.9352, "longitude": 77.6245},
      "timestamp": 1713293400000
    },
    "claimLocation": {"latitude": 12.9352, "longitude": 77.6245}
  }'
```

### Get GPS Report for Worker
```bash
curl http://localhost:8000/api/anti-spoofing/gps-report/worker-001
```

### Get Device History
```bash
curl http://localhost:8000/api/anti-spoofing/devices/worker-001
```

### Get Behavioral Analysis
```bash
curl http://localhost:8000/api/anti-spoofing/behavior/worker-001
```

---

## Future Enhancements

1. **ML Integration**: Feed risk scores to ML models for further refinement
2. **Real-time Geofencing**: Polygon-based geofencing instead of bounding boxes
3. **Network Verification**: Verify carrier/network consistency
4. **Advanced EXIF**: DNG/RAW file format validation
5. **Velocity Heatmaps**: Build historical velocity profiles per worker
6. **Behavioral Anomaly Detection**: Seasonal adjustments and trend analysis

---

## Testing

For testing purposes, the service gracefully handles missing database records and returns mock/empty data when necessary. All errors are caught and logged for debugging.


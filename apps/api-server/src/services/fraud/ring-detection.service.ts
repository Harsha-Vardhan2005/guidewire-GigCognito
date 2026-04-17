export interface ZoneClaimBurst {
  zoneId:         string;
  claimsInWindow: number;
  windowMinutes:  number;
  newAccounts7d:  number;
  sharedFingerprints: number;
  expectedRate:   number;
  ipGeoMismatchRate?: number;
  duplicatePhotoAttempts?: number;
}

export interface RingDecision {
  isRing:        boolean;
  flags:         string[];
  action:        "PASS" | "CIRCUIT_BREAK" | "INVESTIGATE";
}

export function detectRing(burst: ZoneClaimBurst): RingDecision {
  const flags: string[] = [];

  if (burst.claimsInWindow > 50 && burst.windowMinutes <= 3)
    flags.push(`Temporal spike: ${burst.claimsInWindow} claims in ${burst.windowMinutes} min`);

  if (burst.newAccounts7d >= 15 && burst.claimsInWindow > 10)
    flags.push(`New account burst: ${burst.newAccounts7d} accounts + immediate claims`);

  if (burst.sharedFingerprints >= 20)
    flags.push(`Device fingerprint ring: ${burst.sharedFingerprints} near-identical devices`);

  if (burst.claimsInWindow > burst.expectedRate * 2)
    flags.push(`Zone payout 2× expected (${burst.claimsInWindow} vs expected ${burst.expectedRate})`);

  if (typeof burst.ipGeoMismatchRate === "number" && burst.ipGeoMismatchRate >= 0.45 && burst.claimsInWindow >= 15)
    flags.push(`IP/GPS mismatch cluster ${(burst.ipGeoMismatchRate * 100).toFixed(0)}%`);

  if (typeof burst.duplicatePhotoAttempts === "number" && burst.duplicatePhotoAttempts >= 4)
    flags.push(`Duplicate evidence burst: ${burst.duplicatePhotoAttempts} attempts`);

  const isRing = flags.length >= 2;
  const action = flags.length >= 3 ? "CIRCUIT_BREAK"
               : flags.length >= 1 ? "INVESTIGATE"
               : "PASS";

  return { isRing, flags, action };
}

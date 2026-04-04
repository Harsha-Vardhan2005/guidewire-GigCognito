/**
 * OTP Service — in-memory store (no Redis/DB needed for demo)
 * Production: replace Map with Redis with TTL
 */

interface OTPRecord {
  otp: string;
  phone: string;
  createdAt: number;
  attempts: number;
  verified: boolean;
}

// In-memory OTP store — persists for process lifetime
const otpStore = new Map<string, OTPRecord>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

/**
 * Generate a random 4-digit OTP
 */
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Send OTP to phone number
 * Production: call Twilio SMS API here
 * Demo: returns OTP in response (remove in prod)
 */
export function sendOTP(phone: string): {
  success: boolean;
  message: string;
  otp?: string; // Only in dev mode
  expiresInSeconds: number;
} {
  if (!/^\d{10}$/.test(phone)) {
    return { success: false, message: "Invalid phone number — must be 10 digits", expiresInSeconds: 0 };
  }

  // Rate limit — don't resend if existing valid OTP < 30 seconds old
  const existing = otpStore.get(phone);
  if (existing && Date.now() - existing.createdAt < 30_000) {
    return {
      success: false,
      message: "OTP already sent. Please wait 30 seconds before requesting again.",
      expiresInSeconds: 300,
    };
  }

  const otp = generateOTP();

  otpStore.set(phone, {
    otp,
    phone,
    createdAt: Date.now(),
    attempts: 0,
    verified: false,
  });

  // TODO Production: await twilioClient.messages.create({ to: `+91${phone}`, body: `Your KaryaKavach OTP is ${otp}` })
  console.log(`[OTP] Generated for +91${phone}: ${otp}`); // Remove in prod

  return {
    success: true,
    message: `OTP sent to +91${phone}`,
    otp: process.env.NODE_ENV === "development" ? otp : undefined, // Expose only in dev
    expiresInSeconds: 300,
  };
}

/**
 * Verify OTP entered by user
 */
export function verifyOTP(phone: string, otp: string): {
  success: boolean;
  message: string;
  token?: string; // JWT placeholder
} {
  const record = otpStore.get(phone);

  if (!record) {
    return { success: false, message: "No OTP found for this number. Please request a new one." };
  }

  if (Date.now() - record.createdAt > OTP_EXPIRY_MS) {
    otpStore.delete(phone);
    return { success: false, message: "OTP has expired. Please request a new one." };
  }

  if (record.verified) {
    return { success: false, message: "OTP already used. Please request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(phone);
    return { success: false, message: "Too many incorrect attempts. Please request a new OTP." };
  }

  record.attempts += 1;

  if (record.otp !== otp) {
    return {
      success: false,
      message: `Incorrect OTP. ${MAX_ATTEMPTS - record.attempts} attempts remaining.`,
    };
  }

  // Mark as verified
  record.verified = true;

  // Generate a simple mock JWT token (replace with real JWT in production)
  const mockToken = Buffer.from(
    JSON.stringify({ phone, iat: Date.now(), exp: Date.now() + 7 * 86400_000 })
  ).toString("base64");

  console.log(`[OTP] Verified for +91${phone}`);

  return {
    success: true,
    message: "OTP verified successfully",
    token: mockToken,
  };
}

/**
 * Cleanup expired OTPs — call periodically
 */
export function cleanupExpiredOTPs(): void {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (now - record.createdAt > OTP_EXPIRY_MS) {
      otpStore.delete(phone);
    }
  }
}

// Auto cleanup every 10 minutes
setInterval(cleanupExpiredOTPs, 10 * 60 * 1000);
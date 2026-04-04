/**
 * Notification service — WhatsApp via Twilio (mocked if no credentials).
 * In demo: logs the message to console in exact worker-facing Hindi/English format.
 */

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID  ?? "MOCK";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN    ?? "MOCK";
const TWILIO_FROM  = process.env.TWILIO_WHATSAPP_FROM ?? "MOCK";
const IS_MOCK      = TWILIO_SID === "MOCK";

export interface NotifyParams {
  workerName: string;
  amount:     number;
  upiId:      string;
  status:     "APPROVED" | "PROVISIONAL" | "ROLLBACK" | "REJECTED";
  claimId:    string;
  heldAmt?:   number;
  phone?:     string;
}

function buildMessage(p: NotifyParams): string {
  switch (p.status) {
    case "APPROVED":
      return `KaryaKavach: Aapka ₹${p.amount} ${p.upiId} pe bhej diya gaya. Claim ID: ${p.claimId}. Surakshit rahein.`;
    case "PROVISIONAL":
      return `KaryaKavach: ₹${p.amount} abhi bheja gaya. ₹${p.heldAmt ?? 0} kal subah tak aa jayega. Claim ID: ${p.claimId}.`;
    case "ROLLBACK":
      return `KaryaKavach: Aapka ₹${p.amount} process ho raha hai — 24 ghante mein aa jayega. Claim ID: ${p.claimId}.`;
    case "REJECTED":
      return `KaryaKavach: Aapka claim verify nahi ho saka. Appeal karne ke liye app kholen. Claim ID: ${p.claimId}.`;
  }
}

export async function sendClaimNotification(p: NotifyParams): Promise {
  const message = buildMessage(p);

  if (IS_MOCK) {
    console.log(`\n[WhatsApp MOCK] → ${p.workerName} (${p.phone ?? p.upiId})`);
    console.log(`  "${message}"\n`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const body = new URLSearchParams({
    From: `whatsapp:${TWILIO_FROM}`,
    To:   `whatsapp:${p.phone ?? ""}`,
    Body: message,
  });

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[WhatsApp] Send failed:", err);
  }
}

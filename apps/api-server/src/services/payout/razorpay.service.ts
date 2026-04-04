import axios from "axios";

const RZP_KEY    = process.env.RAZORPAY_KEY_ID     ?? "MOCK_KEY";
const RZP_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "MOCK_SECRET";
const RZP_ACCT   = process.env.RAZORPAY_ACCOUNT_NO ?? "MOCK_ACCT";

export interface RZPPayoutResult {
  id:     string;
  status: string;
  utr?:   string;
}

export async function initiateUPIPayout(params: {
  amount:           number;
  upiId:            string;
  claimId:          string;
  fundAccountId?:   string;
}): Promise<RZPPayoutResult> {
  if (RZP_KEY === "MOCK_KEY" || RZP_SECRET === "MOCK_SECRET" || RZP_ACCT === "MOCK_ACCT") {
    throw new Error("Razorpay credentials are not configured");
  }

  const auth = Buffer.from(`${RZP_KEY}:${RZP_SECRET}`).toString("base64");
  const res = await axios.post(
    "https://api.razorpay.com/v1/payouts",
    {
      account_number:  RZP_ACCT,
      fund_account_id: params.fundAccountId,
      amount:          params.amount * 100,
      currency:        "INR",
      mode:            "UPI",
      purpose:         "payout",
      narration:       `KaryaKavach claim ${params.claimId}`,
    },
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return { id: res.data.id, status: res.data.status, utr: res.data.utr };
}

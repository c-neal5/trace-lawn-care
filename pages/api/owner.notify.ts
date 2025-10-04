
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { message } = req.body || {};
  console.log("[DEMO] Would notify Ace with message:", message || "(none)");
  res.status(200).json({ ok: true, sid: "demo_sms_sid" });
}

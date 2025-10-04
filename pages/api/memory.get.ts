
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { phone, email } = req.body || {};
  if (!phone && !email) return res.status(200).json({ found: false });

  const key = `cust:${(phone || email).toLowerCase()}`;
  const profile = await kv.get(key);
  res.status(200).json({ found: !!profile, profile: profile || null });
}

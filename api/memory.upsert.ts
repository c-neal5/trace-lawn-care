import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { phone, ...rest } = req.body || {};
  if (!phone) return res.status(400).json({ error: "missing_phone" });

  const key = `cust:${phone.toLowerCase()}`;
  const existing: any = (await kv.get<any>(key)) || { phone, created_at: new Date().toISOString(), last_services: [] };
  const merged: any = { ...existing, ...rest, phone, updated_at: new Date().toISOString() };

  if (rest && (rest as any).append_service) {
    merged.last_services = [ ...(existing.last_services || []), (rest as any).append_service ].slice(-20);
  }

  await kv.set(key, merged);
  res.status(200).json({ ok: true, profile: merged });
}
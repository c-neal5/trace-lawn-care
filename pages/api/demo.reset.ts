
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  await kv.del("cust:+14055550123");
  await kv.del("cust:+14055550999");
  res.status(200).json({ ok: true, cleared: 2 });
}

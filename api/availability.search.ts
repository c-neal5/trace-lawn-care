
import type { VercelRequest, VercelResponse } from "@vercel/node";
import dayjs from "dayjs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  // Demo: ignore incoming window and always return 3 nice slots
  const duration = Number(req.body?.duration_minutes || 60);
  const base = dayjs().add(1, "day").hour(9).minute(0).second(0);

  const s1 = base.toISOString();
  const e1 = base.add(duration, "minute").toISOString();
  const s2 = base.add(4, "hour").toISOString();
  const e2 = dayjs(s2).add(duration, "minute").toISOString();
  const s3 = dayjs().add(2, "day").hour(10).minute(0).second(0).toISOString();
  const e3 = dayjs(s3).add(duration, "minute").toISOString();

  return res.status(200).json({
    slots: [
      { start: s1, end: e1 },
      { start: s2, end: e2 },
      { start: s3, end: e3 }
    ]
  });
}

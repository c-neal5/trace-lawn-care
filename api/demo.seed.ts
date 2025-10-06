
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const profiles = [
    {
      phone: "+14055550123",
      name: "Jordan Oaks",
      addresses: [{ label: "home", address: "123 Oak St, Edmond, OK", gate_code: "#1234" }],
      preferences: "prefers mornings; large dog",
      recurrence: "biweekly",
      last_services: [{ date: new Date().toISOString(), service_type: "mow_edge_blow", notes: "front slope", price_low: 45, price_high: 65 }]
    },
    {
      phone: "+14055550999",
      name: "Mia Brook",
      addresses: [{ label: "home", address: "812 Brookside Dr, Edmond, OK" }],
      preferences: "afternoons only",
      recurrence: "one_time",
      last_services: []
    }
  ];
  for (const p of profiles) await kv.set(`cust:${p.phone.toLowerCase()}`, p);
  res.status(200).json({ ok: true, seeded: profiles.length });
}

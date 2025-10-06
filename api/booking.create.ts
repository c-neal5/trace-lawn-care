
import type { VercelRequest, VercelResponse } from "@vercel/node";
import dayjs from "dayjs";

const svcMap: Record<string, { label: string; est: [number, number] }> = {
  mow_edge_blow: { label: "Mow + Edge + Blow", est: [45, 65] },
  leaf_cleanup:  { label: "Leaf Cleanup",       est: [85, 140] },
  hedge_trim:    { label: "Hedge Trimming",     est: [70, 120] },
  beds_weed:     { label: "Beds & Weeding",     est: [60, 100] },
  fertilization: { label: "Fertilization",      est: [55, 85] }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { service_type, start, end, customer, job_meta } = req.body || {};
  if (!service_type || !start || !end || !customer?.name || !customer?.phone || !customer?.address) {
    return res.status(400).json({ error: "missing_params" });
  }

  const svc = svcMap[service_type] || svcMap.mow_edge_blow;
  const eta = `${dayjs(start).format("ddd MMM D, h:mm A")}–${dayjs(end).format("h:mm A")}`;

  const ownerMsg =
    `[DEMO] New job booked: ${eta}\n` +
    `${customer.name} (${customer.phone})\n` +
    `${svc.label} @ ${customer.address}\n` +
    `Lot: ${job_meta?.lot_size || "n/a"}; Notes: ${job_meta?.notes || "—"}\n` +
    `Est: $${svc.est[0]}–$${svc.est[1]}`;

  console.log(ownerMsg); // demo only — shows what Ace *would* receive

  const fakeId = `demo_${Math.random().toString(36).slice(2, 8)}`;
  return res.status(200).json({
    status: "confirmed",
    booking_id: fakeId,
    price_estimate_low: svc.est[0],
    price_estimate_high: svc.est[1],
    owner_notify_sms: false,
    htmlLink: `https://example.com/demo/booking/${fakeId}`
  });
}

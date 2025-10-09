import { auth, resolveCalendarId } from "./lib/calendar.js";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { customer_name, phone, address, service_list, start, staff } = req.body || {};

  return res.json({
    ok: true,
    booking_id: "TRC-" + Math.floor(Math.random() * 100000),
    ics_url: "https://calendar.google.com/"
  });
}

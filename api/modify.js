import { auth, resolveCalendarId } from "./lib/calendar.js";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { action, booking_id, new_start } = req.body || {};

  return res.json({ ok: true, action, booking_id, new_start });
}

import { auth, resolveCalendarId, isBusy, nextAlternatives } from "./lib/calendar.js";

import dayjs from "dayjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { service_list, address, requested_start, preferred_staff } = req.body || {};
  
  // For now, fake a 9am slot the next day
  const slot = {
    start: dayjs().add(1, "day").hour(9).minute(0).second(0).toISOString(),
    end: dayjs().add(1, "day").hour(10).minute(0).second(0).toISOString()
  };

  return res.json({
    ok: true,
    conflict: false,
    slot,
    staff: preferred_staff || "Crew 1",
    notes: service_list?.join(", ") || "General service"
  });
}

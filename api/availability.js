import { auth, resolveCalendarId, isBusy, nextAlternatives } from "./lib/calendar.js";

import dayjs from "dayjs";

async function readJson(req) {
  try {
    // If Retell sends JSON directly (already parsed)
    if (req.body) {
      if (typeof req.body === "string") return JSON.parse(req.body);
      return req.body;
    }

    // Otherwise, manually read the stream
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
    }

    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("Error parsing JSON body:", err);
    return {};
  }
}
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
 const { service_list, address, requested_start, preferred_staff } = await readJson(req);
  
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

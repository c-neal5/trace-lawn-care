// /api/book.js
import { google } from "googleapis";

const getArgs = (req) =>
  req.body?.args || req.body?.arguments || req.body?.parameters || req.body?.data || req.body || {};

export default async function handler(req, res) {
  try {
    const a = getArgs(req);

    // Required fields for booking
    const required = ["customer_name", "service_type", "preferred_date", "address_line"];
    const missing = required.filter((k) => !a?.[k] || String(a[k]).trim() === "");
    if (missing.length) {
      return res.status(200).json({ ok: false, message: `missing: ${missing.join(", ")}` });
    }

    // Auth + calendar
    const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
    const clientEmail = sa.client_email;
    const privateKey  = sa.private_key;
    const calendarId  = process.env.GOOGLE_CALENDAR_ID;

    if (!clientEmail || !privateKey || !calendarId) {
      return res.status(200).json({ ok: false, message: "missing_google_env" });
    }

    // WRITE scope (important)
    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ["https://www.googleapis.com/auth/calendar"]
    );
    const calendar = google.calendar({ version: "v3", auth });

    // Build event
    const tz = process.env.BUSINESS_TZ || "America/Chicago";
    const start = new Date(a.preferred_date);
    if (Number.isNaN(start.getTime())) {
      return res.status(200).json({ ok: false, message: "invalid_date" });
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const summary = `${a.service_type} — ${a.customer_name}`;
    const description = [
      `Service: ${a.service_type}`,
      `Customer: ${a.customer_name}`,
      a.contact_phone ? `Phone: ${a.contact_phone}` : null,
      a.contact_email ? `Email: ${a.contact_email}` : null,
      a.notes ? `Notes: ${a.notes}` : null
    ].filter(Boolean).join("\n");

    const event = {
      summary,
      description,
      location: a.address_line,
      start: { dateTime: start.toISOString(), timeZone: tz },
      end:   { dateTime: end.toISOString(),   timeZone: tz },
      attendees: a.contact_email ? [{ email: a.contact_email }] : undefined,
      reminders: { useDefault: true }
    };

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: event
    });

    const msg = `Booked ${a.service_type} for ${a.customer_name} on ${start.toLocaleString()} at ${a.address_line}. Link: ${data.htmlLink}`;
    return res.status(200).json({ ok: true, message: msg, eventId: data.id, link: data.htmlLink });
  } catch (e) {
    const status = e?.response?.status;
    const detail = e?.response?.data || e?.message || e;
    console.error("[book] insert error:", status, detail);
    let reason = "google_error";
    if (status === 403) reason = "forbidden_check_sharing_or_scope";
    if (status === 404) reason = "calendar_not_found_or_not_shared";
    return res.status(200).json({ ok: false, message: reason });
  }
}

// /api/book.js
import { google } from "googleapis";

const getArgs = (req) => (req.body?.args || req.body?.arguments || req.body?.parameters || req.body?.data || req.body || {});

export default async function handler(req, res) {
  try {
    const a = getArgs(req);
    const required = ["customer_name", "service_type", "preferred_date", "address_line"];
    const missing = required.filter(k => !a[k] || String(a[k]).trim() === "");
    if (missing.length) {
      return res.status(200).json({ ok: false, message: `missing: ${missing.join(", ")}` });
    }

    // ---- Google auth (use your existing JSON env) ----
    const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
    const clientEmail = sa.client_email;
    const privateKey  = sa.private_key;
    const calendarId  = process.env.GOOGLE_CALENDAR_ID;
    if (!clientEmail || !privateKey || !calendarId) {
      return res.status(200).json({ ok: false, message: "missing_google_env" });
    }

    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ["https://www.googleapis.com/auth/calendar"] // write access
    );
    const calendar = google.calendar({ version: "v3", auth });

    // ---- Build event ----
    const tz = process.env.BUSINESS_TZ || "America/Chicago";
    const start = new Date(a.preferred_date);
    if (Number.isNaN(start.getTime())) {
      return res.status(200).json({ ok: false, message: "invalid_date" });
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1h

    const summary = `${a.service_type} — ${a.customer_name}`;
    const description =
      `Service: ${a.service_type}\n` +
      `Customer: ${a.customer_name}\n` +
      (a.contact_phone ? `Phone: ${a.contact_phone}\n` : "") +
      (a.contact_email ? `Email: ${a.contact_email}\n` : "") +
      (a.notes ? `Notes: ${a.notes}\n` : "");

    const event = {
      summary,
      description,
      location: a.address_line,
      start: { dateTime: start.toISOString(), timeZone: tz },
      end:   { dateTime: end.toISOString(),   timeZone: tz },
      attendees: [
        ...(a.contact_email ? [{ email: a.contact_email }] : []),
      ],
      reminders: {
        useDefault: false,
        overrides: [{ method: "email", minutes: 24 * 60 }, { method: "popup", minutes: 60 }]
      }
    };

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: event
    });

    // ---- Friendly confirmation back to Retell ----
    const msg = `Booked ${a.service_type} for ${a.customer_name} on ${start.toLocaleString()} at ${a.address_line}. Link: ${data.htmlLink}`;
    return res.status(200).json({ ok: true, message: msg, eventId: data.id, link: data.htmlLink });
  } catch (e) {
    console.error("[book] error:", e?.response?.data || e);
    // Never 400 the bot
    return res.status(200).json({ ok: false, message: "google_error" });
  }
}

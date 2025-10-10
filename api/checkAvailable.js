import { google } from "googleapis";

function getArgs(req) {
  const b = req.body || {};
  return b.args || b.arguments || b.parameters || b.data || b; // support schema-only mode
}

export default async function handler(req, res) {
  try {
    const { service_type, preferred_date, address_line } = getArgs(req) || {};

    // Always 200 (never break Retell)
    if (!service_type || !preferred_date || !address_line) {
      return res.status(200).json({ status: "unavailable", reason: "missing_fields" });
    }

    const start = new Date(preferred_date);
    if (Number.isNaN(start.getTime())) {
      return res.status(200).json({ status: "unavailable", reason: "invalid_date" });
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    // Auth from env (prefer full JSON)
    let clientEmail, privateKey;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      clientEmail = sa.client_email;
      privateKey  = sa.private_key;
    } else {
      clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      privateKey  = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    }
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!clientEmail || !privateKey || !calendarId) {
      return res.status(200).json({ status: "unavailable", reason: "missing_google_env" });
    }

    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ["https://www.googleapis.com/auth/calendar.readonly"]
    );
    const calendar = google.calendar({ version: "v3", auth });

    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: calendarId }]
      }
    });

    const busy = (fb.data?.calendars?.[calendarId]?.busy || []).length > 0;
    return res.status(200).json({ status: busy ? "unavailable" : "available" });
  } catch (e) {
    console.error("[checkAvailable] error:", e?.response?.data || e);
    return res.status(200).json({ status: "unavailable", reason: "google_error" });
  }
}

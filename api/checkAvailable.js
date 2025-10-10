import { google } from "googleapis";

function getArgs(req) {
  const b = req.body || {};
  return b.args || b.arguments || b.parameters || b.data || b; // schema mode compatible
}

export default async function handler(req, res) {
  try {
    const a = getArgs(req) || {};
    const { service_type, preferred_date, address_line } = a;

    if (!service_type || !preferred_date || !address_line) {
      return res.status(200).json({ status: "unavailable", reason: "missing_fields" });
    }

    const start = new Date(preferred_date);
    if (Number.isNaN(start.getTime())) {
      return res.status(200).json({ status: "unavailable", reason: "invalid_date" });
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    // ---- load service account ----
    let clientEmail, privateKey;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      clientEmail = sa.client_email;
      privateKey  = sa.private_key; // already newline formatted
    } else {
      clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      privateKey  = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    }

    // ---- get calendar id ----
    let calendarId = process.env.GOOGLE_CALENDAR_ID || "";
    try {
      if (!calendarId && process.env.staff_to_calender) {
        const map = JSON.parse(process.env.staff_to_calender);
        calendarId = map["Trace"] || calendarId;
      }
    } catch {}

    const hasCreds = !!clientEmail && !!privateKey;
    const hasCal   = !!calendarId;
    console.log("[checkAvailable] envs:", { hasCreds, hasCal });

    if (!hasCreds || !hasCal) {
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

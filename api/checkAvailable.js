import { google } from "googleapis";

const getArgs = (req) => (req.body?.args || req.body?.arguments || req.body?.parameters || req.body?.data || req.body || {});

export default async function handler(req, res) {
  try {
    const { service_type, preferred_date, address_line } = getArgs(req);

    if (!service_type || !preferred_date || !address_line) {
      return res.status(200).json({ status: "unavailable", reason: "missing_fields" });
    }

    const start = new Date(preferred_date);
    if (Number.isNaN(start.getTime())) {
      return res.status(200).json({ status: "unavailable", reason: "invalid_date" });
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    // creds from full JSON
    const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
    const clientEmail = sa.client_email;
    const privateKey  = sa.private_key;

    const calendarId = process.env.GOOGLE_CALENDAR_ID; // explicit env

    const hasCreds = !!clientEmail && !!privateKey;
    const hasCal   = !!calendarId;
    console.log("[checkAvailable] hasCreds:", hasCreds, "hasCal:", hasCal);

    if (!hasCreds || !hasCal) {
      return res.status(200).json({ status: "unavailable", reason: "missing_google_env" });
    }

    const auth = new google.auth.JWT(clientEmail, undefined, privateKey, [
      "https://www.googleapis.com/auth/calendar.readonly",
    ]);
    const calendar = google.calendar({ version: "v3", auth });

    const fb = await calendar.freebusy.query({
      requestBody: { timeMin: start.toISOString(), timeMax: end.toISOString(), items: [{ id: calendarId }] },
    });

    const busy = (fb.data?.calendars?.[calendarId]?.busy || []).length > 0;
    return res.status(200).json({ status: busy ? "unavailable" : "available" });
  } catch (e) {
    console.error("[checkAvailable] error:", e?.response?.data || e);
    return res.status(200).json({ status: "unavailable", reason: "google_error" });
  }
}

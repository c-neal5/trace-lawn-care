// /api/book.js
import { google } from "googleapis";
import { sendSms } from "./sms.js";

const getArgs = (req) =>
  req.body?.args || req.body?.arguments || req.body?.parameters || req.body?.data || req.body || {};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    const a = getArgs(req);

    // REQUIRED FIELDS
    const required = ["customer_name", "customer_phone", "service_type", "preferred_date"];
    const missing = required.filter((k) => !a?.[k] || String(a[k]).trim() === "");
    if (missing.length) {
      return res.status(200).json({ ok: false, message: `missing: ${missing.join(", ")}` });
    }

    // GOOGLE AUTH (service account JSON + write scope)
    const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
    const clientEmail = sa.client_email;
    const privateKey = sa.private_key;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!clientEmail || !privateKey || !calendarId) {
      return res.status(200).json({ ok: false, message: "missing_google_env" });
    }

    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ["https://www.googleapis.com/auth/calendar"]
    );
    const calendar = google.calendar({ version: "v3", auth });

    // TIME BUILD
    const BUSINESS_TZ = "America/Chicago";                 // change if needed
    const DURATION_MINS = Number(process.env.DEFAULT_APPT_MINUTES || 30);
    const start = new Date(a.preferred_date);
    if (isNaN(start.getTime())) {
      return res.status(200).json({ ok: false, message: "invalid preferred_date" });
    }
    const end = new Date(start.getTime() + DURATION_MINS * 60 * 1000);

    // EVENT META
    const summary = `${a.service_type} with ${a.customer_name}${a.staff_name ? ` (Staff: ${a.staff_name})` : ""}`;
    const descriptionLines = [
      a.notes ? `Notes: ${a.notes}` : null,
      `Client: ${a.customer_name}`,
      `Phone: ${a.customer_phone}`,
      a.address_line ? `Address: ${a.address_line}` : null,
    ].filter(Boolean);

    // INSERT EVENT (no attendees → no email invites)
    const created = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description: descriptionLines.join("\n"),
        location: a.address_line || undefined,
        start: { dateTime: start.toISOString(), timeZone: BUSINESS_TZ },
        end: { dateTime: end.toISOString(), timeZone: BUSINESS_TZ },
      },
    });

    const eventId = created.data.id || "unknown";
    const whenLocal = start.toLocaleString("en-US", { timeZone: BUSINESS_TZ });

    // SMS NOTIFICATIONS (owner + client)
    const owner = process.env.OWNER_PHONE || process.env.VERIFIED_NUMBER; // your number from screenshot
    try {
      if (owner) {
        await sendSms(
          owner,
          `📅 New booking: ${summary}\nWhen: ${whenLocal} CT\nClient: ${a.customer_name} (${a.customer_phone})${
            a.address_line ? `\nAddress: ${a.address_line}` : ""
          }\nEvent ID: ${eventId}`
        );
      }
      await sendSms(
        a.customer_phone,
        `Thanks ${a.customer_name}! Your "${a.service_type}" is set for ${whenLocal} CT with Trace Lawn Care. Reply HELP for assistance.`
      );
    } catch (smsErr) {
      console.error("SMS error:", smsErr);
      // don't fail booking if SMS hiccups
    }

    return res.status(200).json({ ok: true, eventId });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: false, message: err?.message || "booking_failed" });
  }
}
}

// api/lib/calendar.js
import { google } from "googleapis";
import dayjs from "dayjs";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const STAFF_MAP = JSON.parse(process.env.STAFF_TO_CALENDAR || "{}");

export function auth() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const jwt = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES);
  return google.calendar({ version: "v3", auth: jwt });
}

export function resolveCalendarId(preferredStaff = "No preference") {
  return STAFF_MAP[preferredStaff] || Object.values(STAFF_MAP)[0];
}

export async function isBusy(calendar, calendarId, startISO, endISO) {
  const { data } = await calendar.freebusy.query({
    requestBody: { timeMin: startISO, timeMax: endISO, items: [{ id: calendarId }] },
  });
  return (data.calendars?.[calendarId]?.busy ?? []).length > 0;
}

export async function nextAlternatives(calendar, calendarId, startISO, minutes = 60, count = 3) {
  let t = dayjs(startISO);
  const alts = [];
  while (alts.length < count) {
    const tryStart = t.add(30, "minute");
    const tryEnd = tryStart.add(minutes, "minute");
    const busy = await isBusy(calendar, calendarId, tryStart.toISOString(), tryEnd.toISOString());
    if (!busy) alts.push(tryStart.toISOString());
    t = tryStart;
  }
  return alts;
}

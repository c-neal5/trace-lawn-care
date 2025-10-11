// /api/sms.js
import twilio from "twilio";

const sid = process.env.TWILIO_SID;
const token = process.env.TWILIO_TOKEN;
const FROM = process.env.FROM_NUMBER;

const client = sid && token ? twilio(sid, token) : null;

export async function sendSms(to, body) {
  if (!client) throw new Error("Twilio client not initialized (check TWILIO_SID/TWILIO_TOKEN)");
  if (!FROM) throw new Error("FROM_NUMBER not set");
  if (!to) throw new Error("Missing destination phone number");
  return client.messages.create({ to, from: FROM, body });
}

export default async function handler(req, res) {
  // optional direct SMS endpoint if you ever POST here
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });
  try {
    const { to, body } = req.body || {};
    const msg = await sendSms(to, body);
    res.status(200).json({ ok: true, sid: msg.sid });
  } catch (e) {
    console.error(e);
    res.status(200).json({ ok: false, message: e?.message || "sms_failed" });
  }
}

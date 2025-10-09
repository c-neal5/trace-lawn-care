export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { body, to } = req.body || {};
    const To = to || process.env.OWNER_NUMBER;
    if (!body || !To) return res.status(400).json({ ok:false, error:"Missing body or To" });

    const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`;
    const auth = Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_TOKEN}`).toString("base64");

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To,
        From: process.env.FROM_NUMBER,     // e.g. +14059134180
        Body: body,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ ok:false, error:data?.message || "Twilio error", twilio:data });
    return res.json({ ok:true, sid:data.sid });
  } catch (e) {
    return res.status(500).json({ ok:false, error:e.message });
  }
}

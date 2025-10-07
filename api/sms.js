export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { body } = req.body || {};
  console.log("SMS would be sent:", body);
  return res.json({ ok: true });
}

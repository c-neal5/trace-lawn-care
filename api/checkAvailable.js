// /api/checkAvailable.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET allowed' });
  }

  const key = process.env.RETELL_API_KEY;
  if (!key) {
    return res.status(500).json({ available: false, error: 'RETELL_API_KEY missing' });
  }

  const TRACE_NUMBER = '+14059146237'; // your Twilio number in E.164

  try {
    const r = await fetch('https://api.retellai.com/list-phone-numbers', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });

    const ct = r.headers.get('content-type') || '';
    const text = await r.text();
    const body = ct.includes('application/json') ? JSON.parse(text) : text;

    if (!r.ok) {
      return res.status(r.status).json({
        available: false,
        error: 'Upstream error from Retell',
        status: r.status,
        bodyPreview: typeof body === 'string' ? body.slice(0, 400) : body,
      });
    }

    const numbers = Array.isArray(body) ? body : (Array.isArray(body.phone_numbers) ? body.phone_numbers : []);
    const trace = numbers.find(n => n.phone_number === TRACE_NUMBER);

    if (!trace) {
      return res.status(404).json({
        available: false,
        message: 'Trace number not found in Retell account',
        found: numbers.map(n => n.phone_number),
      });
    }

    return res.status(200).json({
      available: true,
      number: trace.phone_number,
      agentBound: !!trace.outbound_agent_id,
      agentId: trace.outbound_agent_id || null,
    });
  } catch (err) {
    return res.status(500).json({ available: false, error: err?.message || 'Unknown server error' });
  }
}

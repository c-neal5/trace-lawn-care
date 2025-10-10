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

  const headers = {
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  };

  // Try a few known routes (underscore first), stop at first OK JSON
  const candidates = [
    'https://api.retellai.com/v2/phone_numbers',   // <-- correct v2
    'https://api.retellai.com/phone_numbers',      // legacy/global
    'https://api.retellai.com/v1/phone_numbers',   // older
  ];

  async function fetchJson(url) {
    const r = await fetch(url, { headers });
    const ct = r.headers.get('content-type') || '';
    const text = await r.text();
    const body = ct.includes('application/json') ? (() => { try { return JSON.parse(text); } catch { return text; } })() : text;
    return { ok: r.ok, status: r.status, url, ct, body };
  }

  try {
    let best = null;
    for (const url of candidates) {
      const resp = await fetchJson(url);
      // accept if OK and body has phone_numbers array
      if (resp.ok && resp.body && Array.isArray(resp.body.phone_numbers)) {
        best = resp;
        break;
      }
      // keep most recent response for diagnostics
      best = resp;
      if (resp.status === 401 || resp.status === 403) break; // bad auth; no need to try others
    }

    if (!best?.ok) {
      return res.status(best?.status || 502).json({
        available: false,
        error: 'Upstream error from Retell',
        status: best?.status,
        tried: candidates,
        url: best?.url,
        contentType: best?.ct,
        bodyPreview: typeof best?.body === 'string' ? best.body.slice(0, 400) : best?.body,
      });
    }

    const numbers = best.body.phone_numbers || [];
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
    return res.status(500).json({
      available: false,
      error: err?.message || 'Unknown server error',
    });
  }
}

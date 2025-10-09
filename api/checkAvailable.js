// /api/checkAvailable.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET allowed' });
  }

  const key = process.env.RETELL_API_KEY;
  if (!key) {
    return res.status(500).json({ available: false, error: 'RETELL_API_KEY missing' });
  }

  const TRACE_NUMBER = '+14059146237'; // your Trace/Twilio number

  // Helper: fetch then safely read json or text
  async function fetchJsonOrText(url, headers) {
    const r = await fetch(url, { method: 'GET', headers });
    const ct = r.headers.get('content-type') || '';
    const text = await r.text();
    let body = text;
    if (ct.includes('application/json')) {
      try { body = JSON.parse(text); } catch {}
    }
    return { ok: r.ok, status: r.status, ct, body, url };
  }

  try {
    const headers = {
      'Authorization': `Bearer ${key}`,
      'Accept': 'application/json',
    };

    // Try the expected v2 path first
    let resp = await fetchJsonOrText('https://api.retellai.com/v2/phone-numbers', headers);

    // If that wasn’t OK and body wasn’t JSON, try a fallback path once
    if (!resp.ok || typeof resp.body === 'string') {
      const fallback = await fetchJsonOrText('https://api.retellai.com/phone-numbers', headers);
      if (fallback.ok || typeof fallback.body !== 'string') resp = fallback;
    }

    // If still not OK, show diagnostics
    if (!resp.ok) {
      return res.status(resp.status || 502).json({
        available: false,
        error: 'Upstream error from Retell',
        status: resp.status,
        url: resp.url,
        contentType: resp.ct,
        bodyPreview: typeof resp.body === 'string' ? resp.body.slice(0, 400) : resp.body,
      });
    }

    const data = typeof resp.body === 'string' ? {} : resp.body;
    const numbers = Array.isArray(data.phone_numbers) ? data.phone_numbers : [];

    const traceNumber = numbers.find(n => n.phone_number === TRACE_NUMBER);

    if (!traceNumber) {
      return res.status(404).json({
        available: false,
        message: 'Trace number not found in Retell account',
        found: numbers.map(n => n.phone_number),
      });
    }

    return res.status(200).json({
      available: true,
      number: traceNumber.phone_number,
      agentBound: !!traceNumber.outbound_agent_id,
      agentId: traceNumber.outbound_agent_id || null,
    });

  } catch (err) {
    return res.status(500).json({
      available: false,
      error: err?.message || 'Unknown server error',
    });
  }
}

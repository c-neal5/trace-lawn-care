// /api/checkAvailable.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET allowed' });
  }

  try {
    if (!process.env.RETELL_API_KEY) {
      return res.status(500).json({ available: false, error: 'RETELL_API_KEY missing' });
    }

    // 1) Get your Retell numbers via REST (no SDK)
    const r = await fetch('https://api.retellai.com/v2/phone-numbers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ available: false, error: data || 'Retell error' });
    }

    // 2) Find your Trace number here (REPLACE with your real E.164 number)
    const TRACE_NUMBER = '+14059146237';
    const numbers = Array.isArray(data?.phone_numbers) ? data.phone_numbers : [];

    const traceNumber = numbers.find(n => n.phone_number === TRACE_NUMBER);

    if (!traceNumber) {
      return res.status(404).json({ available: false, message: 'Trace number not found' });
    }

    // 3) Return a clean status
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

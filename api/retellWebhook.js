// /api/retellWebhook.js
export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // simple health check
    return res.status(200).json({ ok: true, message: 'retell webhook ready' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Use POST' });
  }

  // --- Read payload safely ---
  const event = await readBody(req);
  console.log('[RetellWebhook] incoming:', JSON.stringify(event));

  // --- Extract/normalize booking data from Retell ---
  // We try common keys; adjust the mapping if your node names differ.
  const fields = normalizeBooking(event);

  // If we still don’t have a customer phone, we can’t text the customer.
  if (!fields.customer_phone) {
    console.log('[RetellWebhook] missing customer_phone, nothing sent.');
    return res.status(200).json({ ok: true, skipped: 'missing customer_phone', fields });
  }

  // --- Compose messages ---
  const confirmMsg =
    `Trace Lawn Care: ${fields.customer_name || 'Customer'}, your ${fields.service || 'service'}` +
    (fields.date ? ` is confirmed for ${fields.date}` : '') +
    (fields.time ? ` at ${fields.time}` : '') +
    (fields.address ? `. Address: ${fields.address}` : '') +
    `. Reply STOP to opt out.`;

  const traceMsg =
    `✅ Booking: ${fields.customer_name || 'Customer'} • ${fields.service || 'service'}` +
    (fields.date || fields.time ? ` • ${[fields.date, fields.time].filter(Boolean).join(' ')}` : '') +
    (fields.address ? ` • ${fields.address}` : '') +
    (fields.customer_phone ? ` • ${fields.customer_phone}` : '');

  // --- Send texts via Twilio ---
  const sid  = process.env.TWILIO_ACCOUNT_SID;
  const tok  = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const owner= process.env.TRACE_OWNER_PHONE;

  if (!sid || !tok || !from) {
    return res.status(500).json({ ok: false, error: 'Twilio env vars missing (SID/TOKEN/FROM)' });
  }

  const results = { ok: true, sent: {} };

  try {
    // Customer SMS
    const custTo = toE164(fields.customer_phone);
    if (custTo) {
      const r1 = await sendSMS({ sid, tok, from, to: custTo, body: confirmMsg });
      results.sent.customer = { sid: r1.sid || null, to: custTo };
    } else {
      results.sent.customer = { skipped: 'invalid customer_phone format' };
    }

    // Owner SMS (Trace)
    if (owner) {
      const ownerTo = toE164(owner);
      if (ownerTo) {
        const r2 = await sendSMS({ sid, tok, from, to: ownerTo, body: traceMsg });
        results.sent.trace = { sid: r2.sid || null, to: ownerTo };
      } else {
        results.sent.trace = { skipped: 'invalid TRACE_OWNER_PHONE format' };
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error('[RetellWebhook] Twilio send failed:', err?.message, err);
    return res.status(502).json({ ok: false, error: err?.message || 'Twilio send failed' });
  }
}

/* ---------------- helpers ---------------- */

async function readBody(req) {
  try {
    if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const bufs = [];
    for await (const c of req) bufs.push(c);
    const raw = Buffer.concat(bufs).toString('utf8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Normalize booking fields from varied Retell payloads.
 * Map your node/variable names here if different.
 */
function normalizeBooking(evt = {}) {
  const get = (...paths) => {
    for (const p of paths) {
      const v = pick(evt, p);
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return undefined;
  };

  // Try common places Retell might send them:
  const customer_phone = get(
    'customer_phone', 'phone', 'contact.phone', 'customer.phone',
    'data.customer_phone', 'data.phone', 'metadata.customer_phone'
  );
  const customer_name  = get(
    'customer_name', 'name', 'contact.name', 'customer.name',
    'data.customer_name', 'metadata.customer_name'
  );
  const service        = get('service', 'data.service', 'metadata.service');
  const date           = get('date', 'booking.date', 'data.date', 'metadata.date');
  const time           = get('time', 'booking.time', 'data.time', 'metadata.time');
  const address        = get('address', 'booking.address', 'data.address', 'metadata.address', 'location');

  return {
    customer_phone,
    customer_name,
    service,
    date,
    time,
    address
  };
}

function pick(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const k of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, k)) {
      cur = cur[k];
    } else {
      return undefined;
    }
  }
  return cur;
}

function toE164(val) {
  if (!val) return null;
  let s = String(val).trim();
  // Basic normalization: allow US numbers like 405..., add +1 if missing
  if (/^\+?\d{10,15}$/.test(s)) {
    if (!s.startsWith('+')) {
      // assume US if 10-11 digits without +
      if (s.length === 10) return '+1' + s;
      if (s.length === 11 && s.startsWith('1')) return '+' + s;
    }
    return s.startsWith('+') ? s : null;
  }
  return null;
}

async function sendSMS({ sid, tok, from, to, body }) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams({ From: from, To: to, Body: body });
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!r.ok) {
    const msg = typeof data === 'string' ? data : (data?.message || JSON.stringify(data).slice(0, 400));
    throw new Error(`Twilio ${r.status}: ${msg}`);
  }
  return data;
}

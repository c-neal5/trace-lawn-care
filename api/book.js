function getArgs(req) {
  const b = req.body || {};
  return b.args || b.arguments || b.parameters || b.data || b;
}

export default async function handler(req, res) {
  try {
    const a = getArgs(req) || {};
    const required = ["customer_name", "service_type", "preferred_date", "address_line"];
    const missing = required.filter(k => !a[k] || String(a[k]).trim() === "");
    if (missing.length) {
      return res.status(200).json({ ok: false, message: `missing: ${missing.join(", ")}` });
    }

    const msg =
      `Booked ${a.service_type} for ${a.customer_name} on ${a.preferred_date} at ${a.address_line}.` +
      (a.contact_phone ? ` Phone: ${a.contact_phone}.` : "") +
      (a.contact_email ? ` Email: ${a.contact_email}.` : "") +
      (a.notes ? ` Notes: ${a.notes}` : "");

    console.log("[book] confirmation:", msg);
    return res.status(200).json({ ok: true, message: msg });
  } catch (e) {
    console.error("[book] error:", e);
    return res.status(200).json({ ok: false, message: "server_error" });
  }
}

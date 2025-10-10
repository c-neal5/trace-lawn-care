// /api/book.js
export default async function handler(req, res) {
  try {
    const b = req.body || {};
    const required = ["customer_name", "service_type", "preferred_date", "address_line"];
    const missing = required.filter(k => !b[k] || String(b[k]).trim() === "");
    if (missing.length) {
      return res.status(200).json({ ok: false, message: `missing: ${missing.join(", ")}` });
    }

    // TODO: persist to DB / create Google event if you want
    const msg =
      `Booked ${b.service_type} for ${b.customer_name} on ${b.preferred_date} at ${b.address_line}.` +
      (b.contact_phone ? ` Phone: ${b.contact_phone}.` : "") +
      (b.contact_email ? ` Email: ${b.contact_email}.` : "") +
      (b.notes ? ` Notes: ${b.notes}` : "");

    console.log("[book] confirmation:", msg);
    return res.status(200).json({ ok: true, message: msg });
  } catch (e) {
    console.error("[book] error:", e);
    return res.status(200).json({ ok: false, message: "server_error" });
  }
}

const crypto = require("crypto");

async function supabaseRequest(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are not configured.");

  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Prefer": "return=representation",
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(data?.message || data?.hint || text || "Supabase request failed");
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      profile
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Missing Razorpay payment details." });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(500).json({ verified: false, error: "Razorpay secret is not configured." });

    // Razorpay signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(String(razorpay_signature), "utf8")
    );

    if (!valid) {
      return res.status(400).json({ verified: false, error: "Invalid Razorpay signature." });
    }

    // Find the order row created by /api/create-order.
    const existing = await supabaseRequest(
      `payments?select=id,profile_id,status,amount,currency&razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}&limit=1`,
      { method: "GET" }
    );

    if (!existing?.length) {
      return res.status(404).json({ verified: false, error: "Payment order was not found in Supabase." });
    }

    const payment = existing[0];
    if (payment.status === "paid" && payment.razorpay_payment_id === razorpay_payment_id) {
      return res.status(200).json({ verified: true, paymentId: payment.id, profileId: payment.profile_id });
    }

    let profileId = payment.profile_id || null;

    // Save the customer's biodata in profiles when supplied.
    if (!profileId && profile && typeof profile === "object") {
      const row = {
        name: profile.name || null,
        date_of_birth: profile.date_of_birth || null,
        height: profile.height || null,
        religion: profile.religion || null,
        caste: profile.caste || null,
        education: profile.education || null,
        profession: profile.profession || null,
        company: profile.company || null,
        father_name: profile.father_name || null,
        mother_name: profile.mother_name || null,
        city: profile.city || null,
        phone: profile.phone || null,
        about_me: profile.about_me || null,
        template_id: profile.template_id || "classic",
        premium: true
      };
      const inserted = await supabaseRequest("profiles", {
        method: "POST",
        body: JSON.stringify(row)
      });
      profileId = inserted?.[0]?.id || null;
    }

    const updated = await supabaseRequest(
      `payments?razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          profile_id: profileId,
          razorpay_payment_id,
          razorpay_signature,
          status: "paid",
          paid_at: new Date().toISOString()
        })
      }
    );

    if (profileId) {
      await supabaseRequest(`profiles?id=eq.${encodeURIComponent(profileId)}`, {
        method: "PATCH",
        body: JSON.stringify({ premium: true, updated_at: new Date().toISOString() })
      });
    }

    return res.status(200).json({
      verified: true,
      paymentId: updated?.[0]?.id || payment.id,
      profileId
    });
  } catch (err) {
    console.error("verify-payment:", err);
    return res.status(500).json({ verified: false, error: err.message || "Payment verification failed." });
  }
};

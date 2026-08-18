const crypto = require("crypto");

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing");
  return { url: url.replace(/\/$/, ""), key };
}

async function supabase(path, options = {}) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${text}`);
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ verified: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body || {});

    const orderId = String(body.razorpay_order_id || "");
    const paymentId = String(body.razorpay_payment_id || "");
    const signature = String(body.razorpay_signature || "");

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        verified: false,
        error: "Missing Razorpay payment details"
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({
        verified: false,
        error: "Razorpay secret is missing"
      });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({
        verified: false,
        error: "Invalid Razorpay signature"
      });
    }

    // Mark the exact order as paid.
    await supabase(
      `payments?razorpay_order_id=eq.${encodeURIComponent(orderId)}`,
      {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          status: "paid",
          paid_at: new Date().toISOString()
        })
      }
    );

    return res.status(200).json({
      verified: true,
      orderId,
      paymentId
    });
  } catch (error) {
    console.error("verify-payment:", error);
    return res.status(500).json({
      verified: false,
      error: error.message || "Payment verification failed"
    });
  }
};

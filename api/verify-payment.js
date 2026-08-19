const crypto = require("crypto");

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return { url: url.replace(/\/$/, ""), key };
}

async function supabase(path, options = {}) {
  const { url, key } = getConfig();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=representation",
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

function readBody(req) {
  return typeof req.body === "string"
    ? JSON.parse(req.body || "{}")
    : (req.body || {});
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      verified: false,
      error: "Method not allowed"
    });
  }

  try {
    const body = readBody(req);

    const orderId = String(body.razorpay_order_id || "");
    const paymentId = String(body.razorpay_payment_id || "");
    const signature = String(body.razorpay_signature || "");

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        verified: false,
        error: "Missing Razorpay payment details."
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({
        verified: false,
        error: "Razorpay secret is missing."
      });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({
        verified: false,
        error: "Invalid Razorpay signature."
      });
    }

    // Update the exact payment row using the Razorpay order ID.
    const rows = await supabase(
      `payments?razorpay_order_id=eq.${encodeURIComponent(orderId)}&limit=1`,
      {
        method: "PATCH",
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          status: "paid",
          paid_at: new Date().toISOString()
        })
      }
    );

    const paymentDbId = rows?.[0]?.id || null;

    return res.status(200).json({
      verified: true,
      orderId,
      paymentId: paymentDbId,
      razorpayPaymentId: paymentId
    });
  } catch (error) {
    console.error("verify-payment:", error);
    return res.status(500).json({
      verified: false,
      error: error.message || "Payment verification failed."
    });
  }
};

const crypto = require("crypto");

async function supabase(path, options = {}) {

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables are missing"
    );
  }

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/${path}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "return=representation",
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${text}`
    );
  }

  return data;
}

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      verified: false,
      error: "Method not allowed"
    });
  }

  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const orderId =
      String(body.razorpay_order_id || "");

    const razorpayPaymentId =
      String(body.razorpay_payment_id || "");

    const signature =
      String(body.razorpay_signature || "");

    if (
      !orderId ||
      !razorpayPaymentId ||
      !signature
    ) {
      return res.status(400).json({
        verified: false,
        error: "Missing Razorpay payment details"
      });
    }

    const secret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({
        verified: false,
        error: "Razorpay secret is missing"
      });
    }

    const expectedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(
          `${orderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    const expectedBuffer =
      Buffer.from(expectedSignature);

    const receivedBuffer =
      Buffer.from(signature);

    if (
      expectedBuffer.length !==
        receivedBuffer.length ||
      !crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      )
    ) {
      return res.status(400).json({
        verified: false,
        error: "Invalid Razorpay signature"
      });
    }

    const rows = await supabase(
      `payments?razorpay_order_id=eq.${encodeURIComponent(
        orderId
      )}&limit=1`,
      {
        method: "PATCH",

        body: JSON.stringify({
          razorpay_payment_id:
            razorpayPaymentId,

          razorpay_signature:
            signature,

          status: "paid",

          paid_at:
            new Date().toISOString()
        })
      }
    );

    const paymentUUID =
      rows?.[0]?.id || null;

    if (!paymentUUID) {
      return res.status(500).json({
        verified: false,
        error:
          "Payment verified but payment record ID was not returned"
      });
    }
// Mark profile as premium after successful payment
const paymentRecord = rows?.[0];

if (paymentRecord?.profile_id) {
  await supabase(
    `profiles?id=eq.${encodeURIComponent(paymentRecord.profile_id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        premium: true
      })
    }
  );
}
    return res.status(200).json({

      verified: true,

      orderId: orderId,

      paymentId: paymentUUID,

      razorpayPaymentId:
        razorpayPaymentId
    });

  } catch (error) {

    console.error(
      "verify-payment:",
      error
    );

    return res.status(500).json({
      verified: false,
      error:
        error.message ||
        "Payment verification failed"
    });
  }
};

const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: "Razorpay secret is missing" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Incomplete payment response" });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    const verified = crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(String(razorpay_signature), "utf8")
    );

    if (!verified) {
      return res.status(400).json({ verified: false, error: "Invalid payment signature" });
    }

    return res.status(200).json({ verified: true });
  } catch (error) {
    console.error("verify-payment:", error);
    return res.status(500).json({ verified: false, error: "Payment verification failed" });
  }
};

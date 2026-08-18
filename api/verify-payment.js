const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Missing payment verification data." });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const verified = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

    return res.status(200).json({ verified });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ verified: false, error: "Verification failed." });
  }
};

const Razorpay = require("razorpay");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const amount = 1900; // ₹19 in paise
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ error: "Razorpay environment variables are not configured." });
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: "vb_" + Date.now(),
      notes: { product: "VivahBio Premium Biodata", price: "19" }
    });

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Could not create Razorpay order." });
  }
};

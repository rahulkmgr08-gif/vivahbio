const Razorpay = require("razorpay");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: "Razorpay environment variables are missing" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const amount = Number(body.amount || 1900);

    if (!Number.isInteger(amount) || amount !== 1900) {
      return res.status(400).json({ error: "Invalid premium amount" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `vivahbio_${Date.now()}`,
      notes: { product: "VivahBio Premium Download" }
    });

    return res.status(200).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error("create-order:", error);
    return res.status(500).json({ error: "Could not create Razorpay order" });
  }
};

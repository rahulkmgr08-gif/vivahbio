const Razorpay = require("razorpay");

async function insertPayment(order) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing");
  }

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/payments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: "created"
      })
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Supabase payment insert failed: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({
        error: "Razorpay environment variables are missing"
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const amount = Number(body.amount || 1900);

    if (!Number.isInteger(amount) || amount !== 1900) {
      return res.status(400).json({
        error: "Invalid premium amount"
      });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret
    });

    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `vivahbio_${Date.now()}`,
      notes: {
        product: "VivahBio Premium Download"
      }
    });

    const paymentRows = await insertPayment(order);

    const paymentId =
      paymentRows?.[0]?.id || null;

    return res.status(200).json({
      keyId: key_id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: paymentId
    });

  } catch (error) {

    console.error("create-order:", error);

    return res.status(500).json({
      error:
        error.message ||
        "Could not create Razorpay order"
    });
  }
};

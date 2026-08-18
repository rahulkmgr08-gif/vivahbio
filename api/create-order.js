const Razorpay = require("razorpay");

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
  if (!res.ok) {
    throw new Error(data?.message || data?.hint || text || "Supabase request failed");
  }
  return data;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const amount = Number(body.amount || 1900);
    if (amount !== 1900) return res.status(400).json({ error: "Invalid premium amount" });

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      return res.status(500).json({ error: "Razorpay environment variables are not configured." });
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount: 1900,
      currency: "INR",
      receipt: `vivahbio_${Date.now()}`,
      notes: { product: "VivahBio Premium Biodata", price: "19" }
    });

    // Create the payment row immediately. It will be changed to "paid"
    // only after server-side Razorpay signature verification.
    await supabaseRequest("payments", {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: "created"
      })
    });

    return res.status(200).json({
      keyId: key_id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error("create-order:", err);
    return res.status(500).json({ error: err.message || "Could not create Razorpay order" });
  }
};

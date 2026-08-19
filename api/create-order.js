const Razorpay = require("razorpay");

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
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({
        error: "Razorpay environment variables are missing."
      });
    }

    const body = readBody(req);
    const amount = Number(body.amount || 1900);

    if (!Number.isInteger(amount) || amount !== 1900) {
      return res.status(400).json({ error: "Invalid premium amount." });
    }

    const profile = body.profile || {};

    // Create the profile first so the payment can be linked to it.
    const profileRows = await supabase("profiles", {
      method: "POST",
      body: JSON.stringify({
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
        template_id: profile.template_id || "classic"
      })
    });

    const profileId = profileRows?.[0]?.id || null;

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `vivahbio_${Date.now()}`,
      notes: {
        product: "VivahBio Premium Download",
        profile_id: profileId ? String(profileId) : ""
      }
    });

    const paymentRows = await supabase("payments", {
      method: "POST",
      body: JSON.stringify({
        profile_id: profileId,
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: "created"
      })
    });

    const paymentDbId = paymentRows?.[0]?.id || null;

    return res.status(200).json({
      keyId: razorpayKeyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: paymentDbId,
      profileId
    });
  } catch (error) {
    console.error("create-order:", error);
    return res.status(500).json({
      error: error.message || "Could not create Razorpay order."
    });
  }
};

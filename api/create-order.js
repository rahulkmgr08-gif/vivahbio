const Razorpay = require("razorpay");

async function supabase(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing");
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
    throw new Error(`Supabase ${response.status}: ${text}`);
  }

  return data;
}

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: "Razorpay environment variables are missing"
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const amount = Number(body.amount || 1900);

    if (amount !== 1900) {
      return res.status(400).json({
        error: "Invalid premium amount"
      });
    }

    const p = body.profile || {};

    // ---------- SAVE PROFILE ----------
    const profileRows = await supabase("profiles", {
      method: "POST",

      body: JSON.stringify({
        name: p.name || null,
        date_of_birth: p.date_of_birth || null,
        time_of_birth: p.time_of_birth || null,
        place_of_birth: p.place_of_birth || null,
        height: p.height || null,
        religion: p.religion || null,
        caste: p.caste || null,
        gotra: p.gotra || null,
        rashi: p.rashi || null,
        nakshatra: p.nakshatra || null,
        complexion: p.complexion || null,
        education: p.education || null,
        profession: p.profession || null,
        company: p.company || null,
        languages: p.languages || null,
        hobbies: p.hobbies || null,

        father_name: p.father_name || null,
        father_occupation: p.father_occupation || null,

        mother_name: p.mother_name || null,
        mother_occupation: p.mother_occupation || null,

        siblings: p.siblings || null,

        contact_person: p.contact_person || null,
        phone: p.phone || null,
        email: p.email || null,
        city: p.city || null,
        address: p.address || null,

        about_me: p.about_me || null,

        template_id: p.template_id || "classic",

        premium: false
      })
    });

    const profileId = profileRows?.[0]?.id;

    if (!profileId) {
      throw new Error("Profile could not be created");
    }

    // ---------- CREATE RAZORPAY ORDER ----------
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `vivahbio_${Date.now()}`,
      notes: {
        product: "VivahBio Premium Download",
        profile_id: profileId
      }
    });

    // ---------- SAVE PAYMENT ----------
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

    return res.status(200).json({
      keyId: keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: paymentRows?.[0]?.id || null,
      profileId: profileId
    });

  } catch (error) {

    console.error("create-order:", error);

    return res.status(500).json({
      error: error.message || "Could not create order"
    });
  }
};

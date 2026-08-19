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

async function saveProfile(profile) {
  const clean = profile || {};
  const phone = String(clean.phone || "").trim();

  // If the same phone already exists, update that profile instead of
  // creating a duplicate profile every time the user clicks Pay.
  if (phone) {
    const existing = await supabase(
      `profiles?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`
    );

    if (existing?.[0]?.id) {
      const profileId = existing[0].id;

      const rows = await supabase(
        `profiles?id=eq.${encodeURIComponent(profileId)}`,
        {
          method: "PATCH",
          headers: {
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            ...clean,
            updated_at: new Date().toISOString()
          })
        }
      );

      return rows?.[0]?.id || profileId;
    }
  }

  const rows = await supabase(
    "profiles",
    {
      method: "POST",
      headers: {
        "Prefer": "return=representation"
      },
      body: JSON.stringify(clean)
    }
  );

  if (!rows?.[0]?.id) {
    throw new Error("Profile was not created");
  }

  return rows[0].id;
}

async function insertPayment(order, profileId) {
  const rows = await supabase(
    "payments",
    {
      method: "POST",
      headers: {
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        profile_id: profileId,
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: "created"
      })
    }
  );

  if (!rows?.[0]?.id) {
    throw new Error("Payment record was not created");
  }

  return rows[0];
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

    if (!body.profile || typeof body.profile !== "object") {
      return res.status(400).json({
        error: "Profile data is required"
      });
    }

    // 1. Save/update profile first.
    const profileId = await saveProfile({
      name: body.profile.name || null,
      date_of_birth: body.profile.date_of_birth || null,
      time_of_birth: body.profile.time_of_birth || null,
      place_of_birth: body.profile.place_of_birth || null,

      height: body.profile.height || null,
      religion: body.profile.religion || null,
      caste: body.profile.caste || null,
      gotra: body.profile.gotra || null,
      rashi: body.profile.rashi || null,
      nakshatra: body.profile.nakshatra || null,
      complexion: body.profile.complexion || null,

      education: body.profile.education || null,
      profession: body.profile.profession || null,
      company: body.profile.company || null,

      languages: body.profile.languages || null,
      hobbies: body.profile.hobbies || null,

      father_name: body.profile.father_name || null,
      father_occupation: body.profile.father_occupation || null,

      mother_name: body.profile.mother_name || null,
      mother_occupation: body.profile.mother_occupation || null,

      siblings: body.profile.siblings || null,

      contact_person: body.profile.contact_person || null,
      phone: body.profile.phone || null,
      email: body.profile.email || null,
      city: body.profile.city || null,
      address: body.profile.address || null,

      about_me: body.profile.about_me || null,

      template_id: body.profile.template_id || "classic"
    });

    // 2. Create Razorpay order.
    const razorpay = new Razorpay({
      key_id,
      key_secret
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `vivahbio_${Date.now()}`,
      notes: {
        product: "VivahBio Premium Download",
        profile_id: String(profileId)
      }
    });

    // 3. Link payment to the exact profile.
    await insertPayment(order, profileId);

    return res.status(200).json({
      keyId: key_id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      profileId
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

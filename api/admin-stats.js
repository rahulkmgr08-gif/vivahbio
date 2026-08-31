/* =========================================================
   VIVAHBIO ADMIN STATS API
   Server-side Supabase access
   ========================================================= */

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

  if (req.method !== "GET") {

    return res.status(405).json({
      error: "Method not allowed"
    });

  }


  try {

    /* =====================================================
       PROFILES
    ===================================================== */

    const profiles =
      await supabase(
        "profiles?select=id,name,phone,email,template_id,premium,created_at,photo_url&order=created_at.desc"
      );


    /* =====================================================
       PAYMENTS
    ===================================================== */

    const payments =
      await supabase(
        "payments?select=id,profile_id,razorpay_order_id,razorpay_payment_id,amount,currency,status,created_at,paid_at&order=created_at.desc"
      );


    /* =====================================================
       DOWNLOADS
    ===================================================== */

    const downloads =
      await supabase(
        "downloads?select=id,profile_id,payment_id,file_type,created_at&order=created_at.desc"
      );


    /* =====================================================
       PAID PAYMENTS
    ===================================================== */

    const paidPayments =
      payments.filter(
        payment =>
          payment.status === "paid"
      );


    /* =====================================================
       REVENUE
       Razorpay amount is in paise
    ===================================================== */

    const revenuePaise =
      paidPayments.reduce(
        (total, payment) =>
          total +
          Number(
            payment.amount || 0
          ),
        0
      );


    const revenue =
      revenuePaise / 100;


    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(200).json({

      success: true,

      stats: {

        profiles:
          profiles.length,

        downloads:
          downloads.length,

        payments:
          payments.length,

        paidPayments:
          paidPayments.length,

        revenue:

          revenue

      },

      recentProfiles:
        profiles.slice(0, 10),

      recentPayments:
        paidPayments.slice(0, 10),

      recentDownloads:
        downloads.slice(0, 10)

    });


  } catch (error) {

    console.error(
      "admin-stats:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        error.message ||
        "Could not load admin statistics"

    });

  }

};

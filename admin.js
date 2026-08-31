/* =========================================================
   VIVAHBIO ADMIN STATS API
   SECURE SERVER-SIDE ADMIN ACCESS
   ========================================================= */


/* =========================================================
   SUPABASE SERVER HELPER
========================================================= */

async function supabase(path, options = {}) {

  const url =
    process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SECRET_KEY;


  if (!url || !key) {

    throw new Error(
      "Supabase environment variables are missing"
    );

  }


  const response =
    await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/${path}`,
      {

        ...options,

        headers: {

          "Content-Type":
            "application/json",

          "apikey":
            key,

          "Authorization":
            `Bearer ${key}`,

          "Prefer":
            "return=representation",

          ...(options.headers || {})

        }

      }
    );


  const text =
    await response.text();


  let data = null;


  try {

    data =
      text
        ? JSON.parse(text)
        : null;

  } catch {

    data = null;

  }


  if (!response.ok) {

    throw new Error(
      `Supabase ${response.status}: ${text}`
    );

  }


  return data;

}


/* =========================================================
   VERIFY LOGGED-IN USER
========================================================= */

async function getAuthenticatedUser(accessToken) {

  const url =
    process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SECRET_KEY;


  if (!url || !key) {

    throw new Error(
      "Supabase environment variables are missing"
    );

  }


  const response =
    await fetch(
      `${url.replace(/\/$/, "")}/auth/v1/user`,
      {

        method: "GET",

        headers: {

          "apikey":
            key,

          "Authorization":
            `Bearer ${accessToken}`

        }

      }
    );


  if (!response.ok) {

    return null;

  }


  const user =
    await response.json();


  return user || null;

}


/* =========================================================
   CHECK ADMIN USER
========================================================= */

async function checkAdminUser(user) {

  if (!user) {

    return false;

  }


  const email =
    String(
      user.email || ""
    )
      .trim()
      .toLowerCase();


  if (!email) {

    return false;

  }


  const rows =
    await supabase(
      `admin_users?select=id,email,active&email=eq.${encodeURIComponent(email)}&active=eq.true&limit=1`
    );


  return Boolean(
    rows &&
    rows.length > 0
  );

}


/* =========================================================
   MAIN API
========================================================= */

module.exports =
  async function handler(req, res) {


    /* =====================================================
       ONLY GET ALLOWED
    ===================================================== */

    if (req.method !== "GET") {

      return res.status(405).json({

        success: false,

        error:
          "Method not allowed"

      });

    }


    try {


      /* ===================================================
         GET AUTHORIZATION HEADER
      =================================================== */

      const authorization =
        req.headers.authorization ||
        "";


      if (
        !authorization.startsWith(
          "Bearer "
        )
      ) {

        return res.status(401).json({

          success: false,

          error:
            "Authentication required"

        });

      }


      const accessToken =
        authorization
          .replace(
            "Bearer ",
            ""
          )
          .trim();


      if (!accessToken) {

        return res.status(401).json({

          success: false,

          error:
            "Invalid authentication token"

        });

      }


      /* ===================================================
         VERIFY TOKEN WITH SUPABASE
      =================================================== */

      const user =
        await getAuthenticatedUser(
          accessToken
        );


      if (!user) {

        return res.status(401).json({

          success: false,

          error:
            "Invalid or expired session"

        });

      }


      /* ===================================================
         CHECK ADMIN_USERS TABLE
      =================================================== */

      const isAdmin =
        await checkAdminUser(
          user
        );


      if (!isAdmin) {

        return res.status(403).json({

          success: false,

          error:
            "You are not authorized to access admin data"

        });

      }


      /* ===================================================
         PROFILES
      =================================================== */

      const profiles =
        await supabase(
          "profiles?select=id,name,phone,email,template_id,premium,created_at,photo_url&order=created_at.desc"
        );


      /* ===================================================
         PAYMENTS
      =================================================== */

      const payments =
        await supabase(
          "payments?select=id,profile_id,razorpay_order_id,razorpay_payment_id,amount,currency,status,created_at,paid_at&order=created_at.desc"
        );


      /* ===================================================
         DOWNLOADS
      =================================================== */

      const downloads =
        await supabase(
          "downloads?select=id,profile_id,payment_id,file_type,created_at&order=created_at.desc"
        );


      /* ===================================================
         PAID PAYMENTS
      =================================================== */

      const paidPayments =
        payments.filter(
          payment =>
            payment.status === "paid"
        );


      /* ===================================================
         REVENUE
         Razorpay amount is stored in paise
      =================================================== */

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


      /* ===================================================
         SUCCESS RESPONSE
      =================================================== */

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
          profiles.slice(
            0,
            10
          ),

        recentPayments:
          paidPayments.slice(
            0,
            10
          ),

        recentDownloads:
          downloads.slice(
            0,
            10
          )

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

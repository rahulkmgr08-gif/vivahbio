/* =========================================================
   VIVAHBIO ADMIN STATS API
   Secure server-side admin access
   ========================================================= */


/* =========================================================
   SUPABASE SERVER HELPER
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
   VERIFY SUPABASE AUTH USER
========================================================= */

async function getAuthUser(accessToken) {

  const url =
    process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables are missing"
    );
  }

  const response = await fetch(
    `${url.replace(/\/$/, "")}/auth/v1/user`,
    {
      method: "GET",

      headers: {

        "apikey":
          process.env.SUPABASE_PUBLISHABLE_KEY,

        "Authorization":
          `Bearer ${accessToken}`

      }
    }
  );

  if (!response.ok) {
    return null;
  }

  return await response.json();
}


/* =========================================================
   VERIFY ADMIN
========================================================= */

async function verifyAdmin(accessToken) {

  if (!accessToken) {
    return null;
  }

  const user =
    await getAuthUser(
      accessToken
    );

  if (!user?.id) {
    return null;
  }

  /*
     IMPORTANT:
     admin_users.id must match Supabase Auth user UID
  */

  const admins =
    await supabase(
      `admin_users?id=eq.${encodeURIComponent(
        user.id
      )}&active=eq.true&select=id,email,active&limit=1`
    );

  if (!admins?.length) {
    return null;
  }

  return {
    user,
    admin: admins[0]
  };
}


/* =========================================================
   MAIN HANDLER
========================================================= */

module.exports =
  async function handler(req, res) {

    /* =====================================================
       ONLY GET
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
         AUTHORIZATION HEADER
      =================================================== */

      const authorization =
        req.headers.authorization || "";


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
         VERIFY ADMIN
      =================================================== */

      const admin =
        await verifyAdmin(
          accessToken
        );


      if (!admin) {

        return res.status(403).json({

          success: false,

          error:
            "Admin access denied"

        });

      }


      /* ===================================================
         GET PROFILES
      =================================================== */

      const profiles =
        await supabase(
          "profiles?select=id,name,phone,email,template_id,premium,created_at,photo_url&order=created_at.desc"
        );


      /* ===================================================
         GET PAYMENTS
      =================================================== */

      const payments =
        await supabase(
          "payments?select=id,profile_id,razorpay_order_id,razorpay_payment_id,amount,currency,status,created_at,paid_at&order=created_at.desc"
        );


      /* ===================================================
         GET DOWNLOADS
      =================================================== */

      const downloads =
        await supabase(
          "downloads?select=id,profile_id,payment_id,file_type,created_at&order=created_at.desc"
        );


      /* ===================================================
         CREATE PROFILE LOOKUP
      =================================================== */

      const profileMap =
        new Map();

      profiles.forEach(
        profile => {

          profileMap.set(
            String(profile.id),
            profile
          );

        }
      );


      /* ===================================================
         PAID PAYMENTS
      =================================================== */

      const paidPayments =
        payments.filter(
          payment =>
            String(
              payment.status || ""
            ).toLowerCase() === "paid"
        );


      /* ===================================================
         ENRICH PAYMENTS
         Add customer/profile information
      =================================================== */

      const enrichedPaidPayments =
        paidPayments.map(
          payment => {

            const profile =
              profileMap.get(
                String(
                  payment.profile_id || ""
                )
              );


            return {

              id:
                payment.id,

              profile_id:
                payment.profile_id,

              razorpay_order_id:
                payment.razorpay_order_id,

              razorpay_payment_id:
                payment.razorpay_payment_id,

              amount:
                Number(
                  payment.amount || 0
                ),

              currency:
                payment.currency || "INR",

              status:
                payment.status,

              created_at:
                payment.created_at,

              paid_at:
                payment.paid_at,

              profile:
                profile
                  ? {

                      id:
                        profile.id,

                      name:
                        profile.name,

                      phone:
                        profile.phone,

                      email:
                        profile.email,

                      template_id:
                        profile.template_id,

                      premium:
                        profile.premium,

                      created_at:
                        profile.created_at,

                      photo_url:
                        profile.photo_url

                    }

                  : null

            };

          }
        );


      /* ===================================================
         REVENUE
         Razorpay amount is stored in paise
      =================================================== */

      const revenuePaise =
        paidPayments.reduce(
          (
            total,
            payment
          ) => {

            return (
              total +
              Number(
                payment.amount || 0
              )
            );

          },
          0
        );


      const revenue =
        revenuePaise / 100;


      /* ===================================================
         DOWNLOADS WITH PROFILE DETAILS
      =================================================== */

      const enrichedDownloads =
        downloads.map(
          download => {

            const profile =
              profileMap.get(
                String(
                  download.profile_id || ""
                )
              );


            return {

              ...download,

              profile:
                profile
                  ? {

                      id:
                        profile.id,

                      name:
                        profile.name,

                      phone:
                        profile.phone,

                      email:
                        profile.email

                    }

                  : null

            };

          }
        );


      /* ===================================================
         SUCCESS RESPONSE
      =================================================== */

      return res.status(200).json({

        success: true,


        admin: {

          id:
            admin.admin.id,

          email:
            admin.admin.email

        },


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
          enrichedPaidPayments.slice(
            0,
            20
          ),


        recentDownloads:
          enrichedDownloads.slice(
            0,
            20
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

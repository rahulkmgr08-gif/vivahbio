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
  if (!res.ok) throw new Error(data?.message || data?.hint || text || "Supabase request failed");
  return data;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { payment_id, file_type } = body;

    if (!payment_id || !["pdf", "jpg"].includes(file_type)) {
      return res.status(400).json({ error: "payment_id and valid file_type are required." });
    }

    const payments = await supabaseRequest(
      `payments?select=id,profile_id,status&id=eq.${encodeURIComponent(payment_id)}&limit=1`,
      { method: "GET" }
    );

    if (!payments?.length || payments[0].status !== "paid") {
      return res.status(403).json({ error: "Paid payment required." });
    }

    const row = await supabaseRequest("downloads", {
      method: "POST",
      body: JSON.stringify({
        profile_id: payments[0].profile_id || null,
        payment_id: payments[0].id,
        file_type
      })
    });

    return res.status(200).json({ logged: true, downloadId: row?.[0]?.id || null });
  } catch (err) {
    console.error("log-download:", err);
    return res.status(500).json({ error: err.message || "Could not log download." });
  }
};

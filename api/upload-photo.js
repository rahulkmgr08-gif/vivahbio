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

async function uploadToStorage(path, buffer, contentType) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  const response = await fetch(
    `${url.replace(/\/$/, "")}/storage/v1/object/profile-photos/${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "x-upsert": "true"
      },
      body: buffer
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Storage upload failed ${response.status}: ${text}`
    );
  }

  return true;
}

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const profileId = String(body.profile_id || "");
    const imageData = String(body.image_data || "");

    if (!profileId || !imageData) {
      return res.status(400).json({
        error: "profile_id and image_data are required"
      });
    }

    // Accept only image data URLs
    const match = imageData.match(
      /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/
    );

    if (!match) {
      return res.status(400).json({
        error: "Invalid image format"
      });
    }

    const contentType = match[1];
    const base64Data = match[2];

    const buffer = Buffer.from(
      base64Data,
      "base64"
    );

    // Limit: 5 MB
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: "Image must be smaller than 5 MB"
      });
    }

    let extension = "jpg";

    if (contentType === "image/png") {
      extension = "png";
    }

    if (contentType === "image/webp") {
      extension = "webp";
    }

    const filePath =
      `${profileId}.${extension}`;

    // Upload image
    await uploadToStorage(
      filePath,
      buffer,
      contentType
    );

    // Save storage path in profiles table
    const profileRows = await supabase(
      `profiles?id=eq.${encodeURIComponent(profileId)}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          photo_url: filePath
        })
      }
    );

    return res.status(200).json({
      success: true,
      profileId: profileId,
      photoUrl: filePath
    });

  } catch (error) {

    console.error(
      "upload-photo:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Photo upload failed"
    });
  }
};

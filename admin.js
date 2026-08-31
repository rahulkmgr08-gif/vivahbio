/* =========================================================
   VIVAHBIO ADMIN PANEL
   Supabase connected version
   ========================================================= */

// ---------- SUPABASE CONFIG ----------
const SUPABASE_URL = "https://puljgsgaycutybhxwbbo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_BYdv27Q8icGmARWVLmta8A_zuuVH1WE";


// ---------- HELPERS ----------
const $ = (id) => document.getElementById(id);

async function supabaseFetch(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${text}`
    );
  }

  return {
    data,
    headers: response.headers
  };
}


// =========================================================
// TEMPLATE MANAGEMENT
// =========================================================

let templates =
  JSON.parse(
    localStorage.getItem("vivah_templates") || "null"
  ) ||
  [
    ["Elegant Gold", "traditional", "gold", false],
    ["Modern Rose", "modern", "rose", false],
    ["Royal Blue", "royal", "blue", false],
    ["Sage Garden", "floral", "green", false],
    ["Lavender Love", "floral", "purple", false],
    ["Sunset Marigold", "floral", "orange", true],
    ["Classic Cream", "traditional", "cream", true],
    ["Red Heritage", "traditional", "red", true],
    ["Minimal Pearl", "modern", "cream", true],
    ["Midnight Royal", "royal", "blue", true],
    ["Blush Bloom", "floral", "rose", true],
    ["Temple Gold", "traditional", "gold", true],
    ["Emerald Grace", "royal", "green", true],
    ["Dusty Rose", "modern", "rose", true],
    ["Regal Navy", "royal", "blue", true],
    ["Peach Petals", "floral", "orange", true],
    ["Vintage Ivory", "traditional", "cream", true],
    ["Plum Elegance", "royal", "purple", true],
    ["Garden Sage", "floral", "green", true],
    ["Ruby Classic", "traditional", "red", true]
  ];


function saveTemplates() {
  localStorage.setItem(
    "vivah_templates",
    JSON.stringify(templates)
  );
}


function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[char]
  );
}


function renderTemplates() {

  if ($("aTemplates")) {
    $("aTemplates").textContent = templates.length;
  }

  const container = $("adminTemplates");

  if (!container) return;

  container.innerHTML = "";

  templates.forEach((template, index) => {

    const row = document.createElement("div");

    row.className = "row";

    row.innerHTML = `
      <div>
        ${String(index + 1).padStart(2, "0")}
      </div>

      <div>
        <b>${esc(template[0])}</b>

        <small
          style="
            display:block;
            color:#8b7d7f;
            margin-top:4px;
          "
        >
          ${esc(template[1])}
        </small>
      </div>

      <span>
        ${template[3] ? "Premium" : "Free"}
      </span>

      <div class="admin-actions">

        <button onclick="editName(${index})">
          Edit
        </button>

        <button onclick="togglePremium(${index})">
          ${template[3] ? "Make Free" : "Make Premium"}
        </button>

        <button onclick="removeTemplate(${index})">
          Delete
        </button>

      </div>
    `;

    container.appendChild(row);
  });
}


function editName(index) {

  const newName = prompt(
    "Template name",
    templates[index][0]
  );

  if (
    newName &&
    newName.trim()
  ) {

    templates[index][0] =
      newName.trim();

    saveTemplates();

    renderTemplates();
  }
}


function togglePremium(index) {

  templates[index][3] =
    !templates[index][3];

  saveTemplates();

  renderTemplates();
}


function removeTemplate(index) {

  if (templates.length <= 1) {

    alert(
      "Keep at least one template."
    );

    return;
  }

  if (
    confirm(
      "Delete this template?"
    )
  ) {

    templates.splice(index, 1);

    saveTemplates();

    renderTemplates();
  }
}


if ($("addTemplate")) {

  $("addTemplate").onclick = () => {

    const name = prompt(
      "New template name",
      "My New Design"
    );

    if (
      name &&
      name.trim()
    ) {

      templates.push([
        name.trim(),
        "modern",
        "rose",
        true
      ]);

      saveTemplates();

      renderTemplates();
    }
  };
}


// =========================================================
// LOCAL PAYMENT SETTINGS
// =========================================================

const settings =
  JSON.parse(
    localStorage.getItem(
      "vivah_settings"
    ) || "{}"
  );


if ($("razorpayKey")) {

  $("razorpayKey").value =
    settings.key || "";
}


if ($("price")) {

  $("price").value =
    settings.price || 19;
}


if ($("saveSetup")) {

  $("saveSetup").onclick = () => {

    localStorage.setItem(
      "vivah_settings",
      JSON.stringify({
        key: $("razorpayKey").value,
        price: $("price").value
      })
    );

    alert(
      "Saved. Current premium price: ₹" +
      $("price").value
    );
  };
}


// =========================================================
// SUPABASE COUNTS
// =========================================================

async function getTableCount(table) {

  const result =
    await supabaseFetch(
      `${table}?select=id&limit=1`,
      {
        headers: {
          "Prefer":
            "count=exact"
        }
      }
    );

  const contentRange =
    result.headers.get(
      "content-range"
    );

  if (!contentRange) {
    return null;
  }

  const match =
    contentRange.match(
      /\/(\d+)$/
    );

  return match
    ? Number(match[1])
    : null;
}


// =========================================================
// LOAD DATABASE STATS
// =========================================================

async function loadDashboardStats() {

  // Templates
  if ($("aTemplates")) {
    $("aTemplates").textContent =
      templates.length;
  }


  // Profiles
  try {

    const profileCount =
      await getTableCount(
        "profiles"
      );

    if (
      profileCount !== null &&
      $("aUsers")
    ) {

      $("aUsers").textContent =
        profileCount;
    }

  } catch (error) {

    console.error(
      "Profiles count error:",
      error
    );

    if ($("aUsers")) {
      $("aUsers").textContent =
        "—";
    }
  }


  // Payments
  try {

    const paymentCount =
      await getTableCount(
        "payments"
      );

    console.log(
      "Payments:",
      paymentCount
    );

  } catch (error) {

    console.error(
      "Payments count error:",
      error
    );
  }


  // Downloads
  try {

    const downloadCount =
      await getTableCount(
        "downloads"
      );

    if (
      downloadCount !== null &&
      $("aDownloads")
    ) {

      $("aDownloads").textContent =
        downloadCount;
    }

  } catch (error) {

    console.log(
      "Downloads table not available yet."
    );

    // Fallback to old local count
    if ($("aDownloads")) {

      $("aDownloads").textContent =
        localStorage.getItem(
          "vivah_downloads"
        ) || "0";
    }
  }
}


// =========================================================
// RESET DEMO
// =========================================================

if ($("resetDemo")) {

  $("resetDemo").onclick = () => {

    if (
      confirm(
        "Reset demo data? This will clear local template/settings data from this browser."
      )
    ) {

      localStorage.clear();

      location.reload();
    }
  };
}


// =========================================================
// START ADMIN
// =========================================================

renderTemplates();

loadDashboardStats();

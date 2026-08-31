/* =========================================================
   VIVAHBIO ADMIN PANEL
   Supabase connected admin dashboard
   ========================================================= */


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


function esc(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]
  );

}


function money(value) {

  const number = Number(value || 0);

  return "₹" + number.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );

}


function formatDate(value) {

  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


/* =========================================================
   TEMPLATE MANAGEMENT
========================================================= */

const defaultTemplates = [

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


let templates =
  JSON.parse(
    localStorage.getItem(
      "vivah_templates"
    ) || "null"
  ) ||
  defaultTemplates.slice();


function saveTemplates() {

  localStorage.setItem(
    "vivah_templates",
    JSON.stringify(templates)
  );

}


function renderTemplates() {

  if ($("aTemplates")) {

    $("aTemplates").textContent =
      templates.length;

  }


  const container =
    $("adminTemplates");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  templates.forEach(
    (template, index) => {

      const row =
        document.createElement("div");


      row.className = "row";


      row.innerHTML = `

        <div>
          ${String(index + 1).padStart(2, "0")}
        </div>


        <div>

          <b>
            ${esc(template[0])}
          </b>

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
          ${
            template[3]
              ? "Premium"
              : "Free"
          }
        </span>


        <div class="admin-actions">

          <button
            onclick="editName(${index})"
          >
            Edit
          </button>


          <button
            onclick="togglePremium(${index})"
          >
            ${
              template[3]
                ? "Make Free"
                : "Make Premium"
            }
          </button>


          <button
            onclick="removeTemplate(${index})"
          >
            Delete
          </button>

        </div>

      `;


      container.appendChild(row);

    }
  );

}


function editName(index) {

  const newName =
    prompt(
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

  if (
    templates.length <= 1
  ) {

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

    templates.splice(
      index,
      1
    );

    saveTemplates();

    renderTemplates();

  }

}


if ($("addTemplate")) {

  $("addTemplate").onclick = () => {

    const name =
      prompt(
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


/* =========================================================
   PAYMENT SETTINGS
========================================================= */

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

        key:
          $("razorpayKey").value,

        price:
          $("price").value

      })
    );


    alert(
      "Saved. Current premium price: ₹" +
      $("price").value
    );

  };

}


/* =========================================================
   LOAD REAL ADMIN DATA
   Uses server-side /api/admin-stats
========================================================= */

async function loadDashboardStats() {

  try {

    const response =
      await fetch(
        "/api/admin-stats",
        {
          method: "GET",
          cache: "no-store"
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.error ||
        "Could not load dashboard data"
      );

    }


    /* =====================================================
       TEMPLATES
    ===================================================== */

    if ($("aTemplates")) {

      $("aTemplates").textContent =
        templates.length;

    }


    /* =====================================================
       SAVED PROFILES
    ===================================================== */

    if ($("aUsers")) {

      $("aUsers").textContent =
        result.stats.profiles;

    }


    /* =====================================================
       DOWNLOADS
    ===================================================== */

    if ($("aDownloads")) {

      $("aDownloads").textContent =
        result.stats.downloads;

    }


    /* =====================================================
       PAID PAYMENTS
    ===================================================== */

    if ($("aPaidPayments")) {

      $("aPaidPayments").textContent =
        result.stats.paidPayments;

    }


    /* =====================================================
       REVENUE
    ===================================================== */

    if ($("aRevenue")) {

      $("aRevenue").textContent =
        money(
          result.stats.revenue
        );

    }


    /* =====================================================
       RECENT PAYMENTS
    ===================================================== */

    renderRecentPayments(
      result.recentPayments || []
    );


    console.log(
      "VivahBio Admin Data:",
      result
    );


  } catch (error) {

    console.error(
      "Admin stats error:",
      error
    );


    if ($("aUsers")) {
      $("aUsers").textContent = "—";
    }


    if ($("aDownloads")) {
      $("aDownloads").textContent = "—";
    }


    if ($("aPaidPayments")) {
      $("aPaidPayments").textContent = "—";
    }


    if ($("aRevenue")) {
      $("aRevenue").textContent = "—";
    }


    console.error(
      "Dashboard data could not be loaded:",
      error.message
    );

  }

}


/* =========================================================
   EXTRA STAT CARDS
========================================================= */

function createExtraStatCards() {

  const stats =
    document.querySelector(
      ".admin-stats"
    );


  if (!stats) {
    return;
  }


  /* ---------- PAID PAYMENTS ---------- */

  let paymentCard =
    document.getElementById(
      "aPaidPaymentsCard"
    );


  if (!paymentCard) {

    paymentCard =
      document.createElement("div");


    paymentCard.id =
      "aPaidPaymentsCard";


    paymentCard.innerHTML = `

      <b id="aPaidPayments">
        —
      </b>

      <span>
        Paid Payments
      </span>

    `;


    stats.appendChild(
      paymentCard
    );

  }


  /* ---------- REVENUE ---------- */

  let revenueCard =
    document.getElementById(
      "aRevenueCard"
    );


  if (!revenueCard) {

    revenueCard =
      document.createElement("div");


    revenueCard.id =
      "aRevenueCard";


    revenueCard.innerHTML = `

      <b id="aRevenue">
        —
      </b>

      <span>
        Revenue
      </span>

    `;


    stats.appendChild(
      revenueCard
    );

  }

}


/* =========================================================
   RECENT PAYMENTS SECTION
========================================================= */

function ensureRecentPaymentsSection() {

  let section =
    document.getElementById(
      "recentPaymentsSection"
    );


  if (section) {

    return section;

  }


  section =
    document.createElement(
      "section"
    );


  section.id =
    "recentPaymentsSection";


  section.className =
    "admin-card";


  section.innerHTML = `

    <div class="admin-card-head">

      <h2>
        Recent Paid Payments
      </h2>

    </div>


    <div
      id="recentPayments"
      class="admin-table"
    ></div>

  `;


  const cards =
    document.querySelectorAll(
      ".admin-card"
    );


  const templateCard =
    cards[0];


  if (
    templateCard &&
    templateCard.parentNode
  ) {

    templateCard.parentNode.insertBefore(
      section,
      templateCard.nextSibling
    );

  } else {

    const admin =
      document.querySelector(
        ".admin"
      );


    if (admin) {

      admin.appendChild(
        section
      );

    }

  }


  return section;

}


/* =========================================================
   RENDER RECENT PAYMENTS
========================================================= */

function renderRecentPayments(
  payments
) {

  const section =
    ensureRecentPaymentsSection();


  const container =
    section.querySelector(
      "#recentPayments"
    );


  if (!container) {
    return;
  }


  if (
    !payments ||
    !payments.length
  ) {

    container.innerHTML = `

      <div
        style="
          padding:20px;
          color:#8b7d7f;
          text-align:center;
        "
      >
        No paid payments yet.
      </div>

    `;


    return;

  }


  const latest =
    payments.slice(
      0,
      10
    );


  container.innerHTML =
    latest
      .map(
        (
          payment,
          index
        ) => `

          <div class="row">

            <div>
              ${index + 1}
            </div>


            <div>

              <b>
                ${esc(
                  payment.razorpay_payment_id ||
                  "Payment"
                )}
              </b>


              <small
                style="
                  display:block;
                  color:#8b7d7f;
                  margin-top:4px;
                "
              >
                ${formatDate(
                  payment.paid_at ||
                  payment.created_at
                )}
              </small>

            </div>


            <span>
              ${money(
                Number(
                  payment.amount || 0
                ) / 100
              )}
            </span>


            <div>

              <small>
                Profile:
                ${esc(
                  payment.profile_id ||
                  "—"
                )}
              </small>

            </div>

          </div>

        `
      )
      .join("");

}


/* =========================================================
   REFRESH BUTTON
========================================================= */

function addRefreshButton() {

  const header =
    document.querySelector(
      ".admin-head"
    );


  if (!header) {
    return;
  }


  if (
    document.getElementById(
      "refreshDashboard"
    )
  ) {

    return;

  }


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "refreshDashboard";


  button.className =
    "secondary-btn";


  button.textContent =
    "↻ Refresh Data";


  button.style.marginTop =
    "15px";


  button.onclick =
    async () => {

      button.disabled =
        true;


      button.textContent =
        "Refreshing…";


      try {

        await loadDashboardStats();

      } finally {

        button.disabled =
          false;

        button.textContent =
          "↻ Refresh Data";

      }

    };


  header.appendChild(
    button
  );

}


/* =========================================================
   RESET DEMO
========================================================= */

if ($("resetDemo")) {

  $("resetDemo").onclick = () => {

    if (
      confirm(
        "Reset demo data? This will clear local template/settings data from this browser. Supabase database data will NOT be deleted."
      )
    ) {

      localStorage.clear();

      location.reload();

    }

  };

}


/* =========================================================
   ADMIN STYLES
========================================================= */

function addAdminStyles() {

  if (
    document.getElementById(
      "admin-live-styles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "admin-live-styles";


  style.textContent = `

    .admin-stats > div {
      min-width: 130px;
    }


    #refreshDashboard {
      display: inline-block;
    }


    #recentPaymentsSection {
      margin-top: 20px;
    }


    #recentPayments .row {
      align-items: center;
    }


    #recentPayments small {
      word-break: break-word;
    }


    @media (max-width: 700px) {

      .admin-stats {
        grid-template-columns: repeat(2, 1fr);
      }


      #recentPayments .row {
        grid-template-columns: 35px 1fr;
        gap: 10px;
      }


      #recentPayments .row > span {
        grid-column: 2;
      }


      #recentPayments .row > div:last-child {
        grid-column: 2;
      }

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =========================================================
   START ADMIN
========================================================= */

async function startAdmin() {

  renderTemplates();

  createExtraStatCards();

  addAdminStyles();

  addRefreshButton();

  await loadDashboardStats();

}


startAdmin();

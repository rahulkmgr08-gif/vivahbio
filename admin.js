/* =========================================================
   VIVAHBIO ADMIN PANEL
   SECURE ADMIN AUTH + SUPABASE DASHBOARD
   ========================================================= */


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  "https://puljgsgaycutybhxwbbo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_BYdv27Q8icGmARWVLmta8A_zuuVH1WE";


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) =>
  document.getElementById(id);


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

  const number =
    Number(value || 0);

  return "₹" +
    number.toLocaleString(
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

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
   LOAD SUPABASE JS
========================================================= */

async function loadSupabaseLibrary() {

  if (window.vivahSupabase) {
    return window.vivahSupabase;
  }


  if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {

    window.vivahSupabase =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );

    return window.vivahSupabase;

  }


  await new Promise(
    (resolve, reject) => {

      const script =
        document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

      script.onload =
        resolve;

      script.onerror =
        () =>
          reject(
            new Error(
              "Could not load Supabase library"
            )
          );

      document.head.appendChild(script);

    }
  );


  if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {

    throw new Error(
      "Supabase library failed to load"
    );

  }


  window.vivahSupabase =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );


  return window.vivahSupabase;

}


/* =========================================================
   HIDE ADMIN PAGE INITIALLY
========================================================= */

function lockAdminPage() {

  document.body.classList.remove(
    "admin-authenticated"
  );

}


/* =========================================================
   LOGIN SCREEN
========================================================= */

function showLoginScreen(message = "") {

  lockAdminPage();


  let wrapper =
    document.getElementById(
      "vivahAdminLogin"
    );


  if (wrapper) {

    const errorBox =
      document.getElementById(
        "adminLoginError"
      );

    if (errorBox && message) {
      errorBox.textContent = message;
    }

    return;

  }


  wrapper =
    document.createElement("div");


  wrapper.id =
    "vivahAdminLogin";


  wrapper.innerHTML = `

    <div class="admin-login-box">

      <div class="admin-login-logo">
        ♡
      </div>

      <h1>
        Vivah Bio
      </h1>

      <h2>
        Admin Login
      </h2>

      <p>
        Login with your authorized admin account.
      </p>

      <form id="adminLoginForm">

        <input
          id="adminLoginEmail"
          type="email"
          placeholder="Admin email"
          autocomplete="username"
          required
        />

        <input
          id="adminLoginPassword"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          required
        />

        <button
          id="adminLoginButton"
          type="submit"
        >
          Login
        </button>

        <div
          id="adminLoginError"
        >${esc(message)}</div>

      </form>

    </div>

  `;


  document.body.appendChild(wrapper);


  addLoginStyles();


  const form =
    document.getElementById(
      "adminLoginForm"
    );


  form.addEventListener(
    "submit",
    handleAdminLogin
  );

}


/* =========================================================
   HIDE LOGIN
========================================================= */

function hideLoginScreen() {

  const login =
    document.getElementById(
      "vivahAdminLogin"
    );


  if (login) {
    login.remove();
  }

}


/* =========================================================
   ADMIN LOGIN
========================================================= */

async function handleAdminLogin(event) {

  event.preventDefault();


  const email =
    document
      .getElementById(
        "adminLoginEmail"
      )
      .value
      .trim()
      .toLowerCase();


  const password =
    document.getElementById(
      "adminLoginPassword"
    ).value;


  const button =
    document.getElementById(
      "adminLoginButton"
    );


  const errorBox =
    document.getElementById(
      "adminLoginError"
    );


  errorBox.textContent =
    "";


  button.disabled =
    true;


  button.textContent =
    "Logging in...";


  try {

    const supabase =
      await loadSupabaseLibrary();


    /* ===============================================
       SUPABASE LOGIN
    =============================================== */

    const result =
      await supabase.auth.signInWithPassword({

        email:
          email,

        password:
          password

      });


    if (result.error) {

      throw result.error;

    }


    const user =
      result.data?.user;


    if (!user) {

      throw new Error(
        "Login failed."
      );

    }


    /* ===============================================
       CHECK ADMIN_USERS
    =============================================== */

    const allowed =
      await checkAdminUser(
        user
      );


    if (!allowed) {

      await supabase.auth.signOut();


      throw new Error(
        "You are not authorized to access the Admin Panel."
      );

    }


    /* ===============================================
       AUTHENTICATION SUCCESS
    =============================================== */

    hideLoginScreen();


    document.body.classList.add(
      "admin-authenticated"
    );


    await startDashboard();


  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );


    errorBox.textContent =
      error.message ||
      "Login failed.";


  } finally {

    button.disabled =
      false;


    button.textContent =
      "Login";

  }

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


  const supabase =
    await loadSupabaseLibrary();


  const result =
    await supabase
      .from("admin_users")
      .select(
        "id,email,active"
      )
      .eq(
        "email",
        email
      )
      .eq(
        "active",
        true
      )
      .limit(1);


  if (result.error) {

    console.error(
      "Admin user check error:",
      result.error
    );


    return false;

  }


  return Boolean(
    result.data &&
    result.data.length > 0
  );

}


/* =========================================================
   PROTECT ADMIN PAGE
========================================================= */

async function protectAdminPage() {

  try {

    const supabase =
      await loadSupabaseLibrary();


    const sessionResult =
      await supabase.auth.getSession();


    const session =
      sessionResult
        .data
        ?.session;


    /* ===============================================
       NO LOGIN
    =============================================== */

    if (!session) {

      showLoginScreen();

      return false;

    }


    /* ===============================================
       CHECK CURRENT USER
    =============================================== */

    const user =
      session.user;


    const allowed =
      await checkAdminUser(
        user
      );


    /* ===============================================
       NOT ADMIN
    =============================================== */

    if (!allowed) {

      await supabase.auth.signOut();


      showLoginScreen(
        "You are not authorized to access the Admin Panel."
      );


      return false;

    }


    /* ===============================================
       ADMIN VERIFIED
    =============================================== */

    document.body.classList.add(
      "admin-authenticated"
    );


    addLogoutButton();


    return true;


  } catch (error) {

    console.error(
      "Admin protection error:",
      error
    );


    showLoginScreen(
      "Please login again."
    );


    return false;

  }

}


/* =========================================================
   LOGOUT BUTTON
========================================================= */

function addLogoutButton() {

  if (
    document.getElementById(
      "adminLogoutButton"
    )
  ) {
    return;
  }


  const header =
    document.querySelector(
      ".admin-head"
    );


  if (!header) {
    return;
  }


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "adminLogoutButton";


  button.className =
    "secondary-btn";


  button.textContent =
    "Logout";


  button.style.marginLeft =
    "10px";


  button.onclick =
    async () => {

      button.disabled =
        true;


      button.textContent =
        "Logging out...";


      try {

        const supabase =
          await loadSupabaseLibrary();


        await supabase.auth.signOut();


      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }


      location.reload();

    };


  header.appendChild(
    button
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
    JSON.stringify(
      templates
    )
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


  container.innerHTML =
    "";


  templates.forEach(
    (
      template,
      index
    ) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "row";


      row.innerHTML = `

        <div>
          ${String(
            index + 1
          ).padStart(
            2,
            "0"
          )}
        </div>

        <div>

          <b>
            ${esc(
              template[0]
            )}
          </b>

          <small
            style="
              display:block;
              color:#8b7d7f;
              margin-top:4px;
            "
          >
            ${esc(
              template[1]
            )}
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


      container.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   EDIT TEMPLATE
========================================================= */

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


/* =========================================================
   TOGGLE PREMIUM
========================================================= */

function togglePremium(index) {

  templates[index][3] =
    !templates[index][3];


  saveTemplates();


  renderTemplates();

}


/* =========================================================
   DELETE TEMPLATE
========================================================= */

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


/* =========================================================
   ADD TEMPLATE
========================================================= */

if ($("addTemplate")) {

  $("addTemplate").onclick =
    () => {

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


if ($("aPremiumPrice")) {

  $("aPremiumPrice").textContent =
    money(
      settings.price || 19
    );

}


if ($("saveSetup")) {

  $("saveSetup").onclick =
    () => {

      const price =
        $("price").value;


      localStorage.setItem(

        "vivah_settings",

        JSON.stringify({

          key:
            $("razorpayKey").value,

          price:
            price

        })

      );


      if ($("aPremiumPrice")) {

        $("aPremiumPrice").textContent =
          money(price);

      }


      alert(
        "Saved. Current premium price: ₹" +
        price
      );

    };

}


/* =========================================================
   LOAD DASHBOARD DATA
========================================================= */

async function loadDashboardStats() {

  try {

    const supabase =
      await loadSupabaseLibrary();


    /* ===============================================
       GET CURRENT SESSION
    =============================================== */

    const sessionResult =
      await supabase.auth.getSession();


    const session =
      sessionResult
        .data
        ?.session;


    if (!session?.access_token) {

      throw new Error(
        "Admin session expired. Please login again."
      );

    }


    /* ===============================================
       SECURE ADMIN API
    =============================================== */

    const response =
      await fetch(
        "/api/admin-stats",
        {

          method:
            "GET",

          cache:
            "no-store",

          headers: {

            "Authorization":
              `Bearer ${session.access_token}`,

            "Content-Type":
              "application/json"

          }

        }
      );


    let result;


    try {

      result =
        await response.json();

    } catch {

      throw new Error(
        "Invalid response from admin server."
      );

    }


    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.error ||
        "Could not load dashboard data."
      );

    }


    /* ===============================================
       TEMPLATES
    =============================================== */

    if ($("aTemplates")) {

      $("aTemplates").textContent =
        templates.length;

    }


    /* ===============================================
       SAVED PROFILES
    =============================================== */

    if ($("aUsers")) {

      $("aUsers").textContent =
        result.stats.profiles ?? 0;

    }


    /* ===============================================
       DOWNLOADS
    =============================================== */

    if ($("aDownloads")) {

      $("aDownloads").textContent =
        result.stats.downloads ?? 0;

    }


    /* ===============================================
       PAID PAYMENTS
    =============================================== */

    if ($("aPaidPayments")) {

      $("aPaidPayments").textContent =
        result.stats.paidPayments ?? 0;

    }


    /* ===============================================
       REVENUE
    =============================================== */

    if ($("aRevenue")) {

      $("aRevenue").textContent =
        money(
          result.stats.revenue
        );

    }


    /* ===============================================
       RECENT PAYMENTS
    =============================================== */

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

      $("aUsers").textContent =
        "—";

    }


    if ($("aDownloads")) {

      $("aDownloads").textContent =
        "—";

    }


    if ($("aPaidPayments")) {

      $("aPaidPayments").textContent =
        "—";

    }


    if ($("aRevenue")) {

      $("aRevenue").textContent =
        "—";

    }

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


  const templateCard =
    document.querySelector(
      ".admin-card"
    );


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


  /* ===============================================
     PAID PAYMENTS
  =============================================== */

  let paymentCard =
    document.getElementById(
      "aPaidPaymentsCard"
    );


  if (!paymentCard) {

    paymentCard =
      document.createElement(
        "div"
      );


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


  /* ===============================================
     REVENUE
  =============================================== */

  let revenueCard =
    document.getElementById(
      "aRevenueCard"
    );


  if (!revenueCard) {

    revenueCard =
      document.createElement(
        "div"
      );


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

    /* =============================================
       SECURITY
    ============================================= */

    .admin-protected {
      visibility: hidden;
    }

    body.admin-authenticated .admin-protected {
      visibility: visible;
    }


    /* =============================================
       DASHBOARD
    ============================================= */

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


    /* =============================================
       LOGIN SCREEN
    ============================================= */

    #vivahAdminLogin {

      position: fixed;

      inset: 0;

      z-index: 999999;

      display: flex;

      align-items: center;

      justify-content: center;

      background:
        linear-gradient(
          135deg,
          #f8efeb,
          #ffffff
        );

      padding: 20px;

    }


    .admin-login-box {

      width: 100%;

      max-width: 420px;

      background: #ffffff;

      padding: 40px;

      border-radius: 20px;

      box-shadow:
        0 20px 60px
        rgba(0,0,0,.12);

      text-align: center;

    }


    .admin-login-logo {

      width: 60px;

      height: 60px;

      margin:
        0 auto 15px;

      border-radius: 50%;

      display: flex;

      align-items: center;

      justify-content: center;

      background: #f9e8ec;

      color: #8b1e3f;

      font-size: 32px;

    }


    .admin-login-box h1 {

      margin: 0;

      color: #8b1e3f;

    }


    .admin-login-box h2 {

      margin-top: 25px;

      margin-bottom: 8px;

    }


    .admin-login-box p {

      color: #777;

      margin-bottom: 25px;

    }


    .admin-login-box input {

      width: 100%;

      box-sizing: border-box;

      padding: 14px;

      margin-bottom: 14px;

      border:
        1px solid #ddd;

      border-radius: 10px;

      font-size: 16px;

    }


    .admin-login-box button {

      width: 100%;

      padding: 14px;

      border: 0;

      border-radius: 10px;

      background: #8b1e3f;

      color: white;

      font-size: 16px;

      font-weight: 600;

      cursor: pointer;

    }


    .admin-login-box button:disabled {

      opacity: .6;

      cursor: not-allowed;

    }


    #adminLoginError {

      color: #c62828;

      margin-top: 15px;

      min-height: 20px;

      font-size: 14px;

    }


    /* =============================================
       MOBILE
    ============================================= */

    @media (max-width: 700px) {

      .admin-stats {

        grid-template-columns:
          repeat(2, 1fr);

      }


      #recentPayments .row {

        grid-template-columns:
          35px 1fr;

        gap: 10px;

      }


      #recentPayments .row > span {

        grid-column: 2;

      }


      #recentPayments
      .row > div:last-child {

        grid-column: 2;

      }


      .admin-login-box {

        padding:
          30px 20px;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =========================================================
   LOGIN STYLES
========================================================= */

function addLoginStyles() {

  addAdminStyles();

}


/* =========================================================
   START DASHBOARD
========================================================= */

async function startDashboard() {

  const allowed =
    await protectAdminPage();


  if (!allowed) {

    return;

  }


  /* ===============================================
     SHOW ADMIN PAGE
  =============================================== */

  document.body.classList.add(
    "admin-authenticated"
  );


  /* ===============================================
     RENDER
  =============================================== */

  renderTemplates();


 async function startDashboard() {

  const allowed =
    await protectAdminPage();

  if (!allowed) {
    return;
  }

  document.body.classList.add(
    "admin-authenticated"
  );

  renderTemplates();

  addAdminStyles();

  addRefreshButton();

  await loadDashboardStats();

}


  addAdminStyles();


  addRefreshButton();


  /* ===============================================
     LOAD DATABASE DATA
  =============================================== */

  await loadDashboardStats();

}


/* =========================================================
   INITIAL START
========================================================= */

(function initAdmin() {

  /* ===============================================
     LOCK PAGE IMMEDIATELY
  =============================================== */

  lockAdminPage();


  /* ===============================================
     ADD STYLES IMMEDIATELY
  =============================================== */

  addAdminStyles();


  /* ===============================================
     START AUTH CHECK
  =============================================== */

  startDashboard();

})();

/* =========================================================
   VIVAHBIO ADMIN PANEL
   Real Supabase Dashboard
   ========================================================= */


/* =========================================================
   SUPABASE CONFIG
   Publishable key only.
   NEVER put Supabase secret/service key here.
========================================================= */

const SUPABASE_URL =
  "https://puljgsgaycutybhxwbbo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_BYdv27Q8icGmARWVLmta8A_zuuVH1WE";


/* =========================================================
   HELPERS
========================================================= */

const $ = id =>
  document.getElementById(id);


function esc(value){

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      char =>
        ({
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#039;"
        })[char]
    );

}


function money(value){

  const number =
    Number(value || 0) / 100;

  return "₹" +
    number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    );

}


function formatDate(value){

  if(!value){

    return "—";

  }


  const date =
    new Date(value);


  if(
    Number.isNaN(
      date.getTime()
    )
  ){

    return "—";

  }


  return date.toLocaleString(
    "en-IN",
    {
      dateStyle:"medium",
      timeStyle:"short"
    }
  );

}


/* =========================================================
   SUPABASE REST API
========================================================= */

async function supabaseFetch(
  path,
  options = {}
){

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/${path}`,
      {

        ...options,

        headers: {

          "apikey":
            SUPABASE_PUBLISHABLE_KEY,

          "Authorization":
            `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,

          "Content-Type":
            "application/json",

          ...(options.headers || {})

        }

      }
    );


  const text =
    await response.text();


  let data =
    null;


  try{

    data =
      text
        ? JSON.parse(text)
        : null;

  }catch(error){

    data =
      null;

  }


  if(
    !response.ok
  ){

    throw new Error(
      `Supabase ${response.status}: ${text}`
    );

  }


  return {

    data,

    headers:
      response.headers

  };

}


/* =========================================================
   TEMPLATE MANAGEMENT
========================================================= */

const defaultTemplates = [

  ["Elegant Gold","traditional","gold",false],

  ["Modern Rose","modern","rose",false],

  ["Royal Blue","royal","blue",false],

  ["Sage Garden","floral","green",false],

  ["Lavender Love","floral","purple",false],

  ["Sunset Marigold","floral","orange",true],

  ["Classic Cream","traditional","cream",true],

  ["Red Heritage","traditional","red",true],

  ["Minimal Pearl","modern","cream",true],

  ["Midnight Royal","royal","blue",true],

  ["Blush Bloom","floral","rose",true],

  ["Temple Gold","traditional","gold",true],

  ["Emerald Grace","royal","green",true],

  ["Dusty Rose","modern","rose",true],

  ["Regal Navy","royal","blue",true],

  ["Peach Petals","floral","orange",true],

  ["Vintage Ivory","traditional","cream",true],

  ["Plum Elegance","royal","purple",true],

  ["Garden Sage","floral","green",true],

  ["Ruby Classic","traditional","red",true]

];


let templates =
  JSON.parse(
    localStorage.getItem(
      "vivah_templates"
    ) || "null"
  ) ||
  defaultTemplates.slice();


function saveTemplates(){

  localStorage.setItem(
    "vivah_templates",
    JSON.stringify(templates)
  );

}


function renderTemplates(){

  if($("aTemplates")){

    $("aTemplates").textContent =
      templates.length;

  }


  const container =
    $("adminTemplates");


  if(!container) return;


  container.innerHTML =
    "";


  templates.forEach(
    (template,index) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "row";


      row.innerHTML = `

        <div>
          ${String(index + 1).padStart(2,"0")}
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


      container.appendChild(
        row
      );

    }
  );

}


function editName(index){

  const newName =
    prompt(
      "Template name",
      templates[index][0]
    );


  if(
    newName &&
    newName.trim()
  ){

    templates[index][0] =
      newName.trim();


    saveTemplates();

    renderTemplates();

  }

}


function togglePremium(index){

  templates[index][3] =
    !templates[index][3];


  saveTemplates();

  renderTemplates();

}


function removeTemplate(index){

  if(
    templates.length <= 1
  ){

    alert(
      "Keep at least one template."
    );

    return;

  }


  if(
    confirm(
      "Delete this template?"
    )
  ){

    templates.splice(
      index,
      1
    );


    saveTemplates();

    renderTemplates();

  }

}


if(
  $("addTemplate")
){

  $("addTemplate").onclick =
    () => {

      const name =
        prompt(
          "New template name",
          "My New Design"
        );


      if(
        name &&
        name.trim()
      ){

        templates.push(
          [
            name.trim(),
            "modern",
            "rose",
            true
          ]
        );


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


if(
  $("razorpayKey")
){

  $("razorpayKey").value =
    settings.key || "";

}


if(
  $("price")
){

  $("price").value =
    settings.price || 19;

}


if(
  $("saveSetup")
){

  $("saveSetup").onclick =
    () => {

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
   DATABASE COUNT
========================================================= */

async function getTableCount(
  table,
  filter = ""
){

  const path =
    `${table}?select=id&limit=1${filter}`;


  const result =
    await supabaseFetch(
      path,
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


  if(
    !contentRange
  ){

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


/* =========================================================
   FETCH PAID PAYMENTS
========================================================= */

async function getPaidPayments(){

  const result =
    await supabaseFetch(
      "payments?select=id,profile_id,razorpay_order_id,razorpay_payment_id,amount,currency,status,created_at,paid_at&status=eq.paid&order=paid_at.desc"
    );


  return result.data || [];

}


/* =========================================================
   DASHBOARD STATS
========================================================= */

async function loadDashboardStats(){

  /*
    Templates
  */

  if(
    $("aTemplates")
  ){

    $("aTemplates").textContent =
      templates.length;

  }


  /*
    Profiles
  */

  try{

    const count =
      await getTableCount(
        "profiles"
      );


    if(
      count !== null &&
      $("aUsers")
    ){

      $("aUsers").textContent =
        count;

    }

  }catch(error){

    console.error(
      "Profiles count error:",
      error
    );


    if(
      $("aUsers")
    ){

      $("aUsers").textContent =
        "—";

    }

  }


  /*
    Downloads
  */

  try{

    const count =
      await getTableCount(
        "downloads"
      );


    if(
      count !== null &&
      $("aDownloads")
    ){

      $("aDownloads").textContent =
        count;

    }

  }catch(error){

    console.error(
      "Downloads count error:",
      error
    );


    if(
      $("aDownloads")
    ){

      $("aDownloads").textContent =
        "—";

    }

  }


  /*
    Paid payments
  */

  try{

    const paidPayments =
      await getPaidPayments();


    const paidCount =
      paidPayments.length;


    const revenue =
      paidPayments.reduce(
        (
          total,
          payment
        ) =>
          total +
          Number(
            payment.amount || 0
          ),
        0
      );


    /*
      Existing HTML does not have
      payment/revenue cards.
      We create them automatically.
    */

    createExtraStatCards(
      paidCount,
      revenue
    );


    renderRecentPayments(
      paidPayments
    );


  }catch(error){

    console.error(
      "Payment dashboard error:",
      error
    );


    createExtraStatCards(
      "—",
      null
    );

  }

}


/* =========================================================
   EXTRA ADMIN STAT CARDS
========================================================= */

function createExtraStatCards(
  paidCount,
  revenue
){

  const stats =
    document.querySelector(
      ".admin-stats"
    );


  if(!stats) return;


  /*
    Avoid duplicate cards.
  */

  let paymentCard =
    document.getElementById(
      "aPaidPaymentsCard"
    );


  let revenueCard =
    document.getElementById(
      "aRevenueCard"
    );


  if(!paymentCard){

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


  if(!revenueCard){

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


  if(
    $("aPaidPayments")
  ){

    $("aPaidPayments").textContent =
      paidCount;

  }


  if(
    $("aRevenue")
  ){

    $("aRevenue").textContent =
      revenue === null
        ? "—"
        : money(revenue);

  }

}


/* =========================================================
   RECENT PAYMENTS SECTION
========================================================= */

function ensureRecentPaymentsSection(){

  let section =
    document.getElementById(
      "recentPaymentsSection"
    );


  if(section){

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


  if(
    templateCard &&
    templateCard.parentNode
  ){

    templateCard.parentNode.insertBefore(
      section,
      templateCard.nextSibling
    );

  }else{

    document
      .querySelector(".admin")
      ?.appendChild(
        section
      );

  }


  return section;

}


function renderRecentPayments(
  payments
){

  const section =
    ensureRecentPaymentsSection();


  const container =
    section.querySelector(
      "#recentPayments"
    );


  if(!container) return;


  if(
    !payments.length
  ){

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


  /*
    Show latest 10.
  */

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
                payment.amount
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

function addRefreshButton(){

  const header =
    document.querySelector(
      ".admin-head"
    );


  if(!header) return;


  if(
    document.getElementById(
      "refreshDashboard"
    )
  ){

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


      try{

        await loadDashboardStats();

      }finally{

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

if(
  $("resetDemo")
){

  $("resetDemo").onclick =
    () => {

      if(
        confirm(
          "Reset demo data? This will clear local template/settings data from this browser. Supabase database data will NOT be deleted."
        )
      ){

        localStorage.clear();

        location.reload();

      }

    };

}


/* =========================================================
   ADMIN STYLING
========================================================= */

function addAdminStyles(){

  if(
    document.getElementById(
      "admin-live-styles"
    )
  ){

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

async function startAdmin(){

  renderTemplates();

  addAdminStyles();

  addRefreshButton();

  await loadDashboardStats();

}


startAdmin();

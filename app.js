/* =========================================================
   VIVAHBIO APP.JS
   Complete frontend
   - Templates
   - Live preview
   - Local draft
   - Razorpay payment
   - Profile saving through create-order
   - Photo upload
   - Exact preview JPG
   - Exact preview PDF
   - Download logging
========================================================= */


/* =========================================================
   TEMPLATE DATA
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


const $ = id => document.getElementById(id);

let selected = 0;
let profileDataUrl = "";


/* =========================================================
   TEMPLATE STORAGE
========================================================= */

function getTemplates(){

  try{

    const saved =
      JSON.parse(
        localStorage.getItem("vivah_templates")
      );

    if(
      Array.isArray(saved) &&
      saved.length
    ){

      return saved;
    }

  }catch(error){

    console.error(
      "Template load error:",
      error
    );
  }

  return defaultTemplates.slice();
}


let templates = getTemplates();


function saveTemplates(){

  localStorage.setItem(
    "vivah_templates",
    JSON.stringify(templates)
  );
}


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value){

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


function safeValue(id){

  const el = $(id);

  if(!el) return "";

  return String(el.value || "").trim();
}


function val(id){

  const value =
    safeValue(id);

  return value || "—";
}


function cap(value){

  if(!value) return "";

  return value.charAt(0).toUpperCase() +
    value.slice(1);
}


function toast(message){

  const box =
    $("toast");

  if(!box) return;

  box.textContent =
    message;

  box.style.display =
    "block";

  clearTimeout(
    window.__vivahToastTimer
  );

  window.__vivahToastTimer =
    setTimeout(
      () => {
        box.style.display =
          "none";
      },
      2800
    );
}


/* =========================================================
   TEMPLATE CARDS
========================================================= */

function artClass(index){

  const colors = [
    "gold",
    "rose",
    "blue",
    "green",
    "purple",
    "orange",
    "cream",
    "red"
  ];

  return colors[
    index % colors.length
  ];
}


function renderTemplates(
  filter = "all"
){

  const grid =
    $("templateGrid");

  if(!grid) return;

  grid.innerHTML = "";

  templates.forEach(
    (template,index) => {

      if(
        filter !== "all" &&
        template[1] !== filter
      ){

        return;
      }

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "template-card";

      card.setAttribute(
        "role",
        "button"
      );

      card.setAttribute(
        "tabindex",
        "0"
      );

      card.innerHTML = `
        <div class="template-art ${artClass(index)}">

          <div class="tp"></div>

          <div class="tt">
            ${escapeHtml(template[0])}
          </div>

          <div class="tl"></div>

          <div class="lines"></div>

        </div>

        <footer>

          <b>
            ${escapeHtml(template[0])}
          </b>

          <small>
            ${escapeHtml(cap(template[1]))}
            •
            ${template[3] ? "Premium" : "Free"}
          </small>

        </footer>
      `;

      card.onclick =
        () => selectTemplate(index);

      card.onkeydown =
        event => {

          if(
            event.key === "Enter" ||
            event.key === " "
          ){

            event.preventDefault();

            selectTemplate(index);
          }
        };

      grid.appendChild(card);

    }
  );
}


/* =========================================================
   MINI TEMPLATE SELECTOR
========================================================= */

function renderMini(){

  const box =
    $("miniTemplates");

  if(!box) return;

  box.innerHTML = "";

  templates.forEach(
    (template,index) => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "mini" +
        (
          index === selected
            ? " active"
            : ""
        );

      button.textContent =
        template[0];

      button.title =
        template[0];

      button.onclick =
        () => selectTemplate(index);

      box.appendChild(button);

    }
  );
}


/* =========================================================
   TEMPLATE SELECTION
========================================================= */

function selectTemplate(index){

  if(
    index < 0 ||
    index >= templates.length
  ){

    return;
  }

  selected =
    index;

  const selectedName =
    $("selectedName");

  if(selectedName){

    selectedName.textContent =
      templates[index][0];
  }

  const preview =
    $("preview");

  if(preview){

    preview.className =
      "bio-preview design-" +
      ((index % 10) + 1);
  }

  renderMini();

  updatePreview();

  saveDraftMeta();
}


/* =========================================================
   BIODATA PREVIEW
========================================================= */

function updatePreview(){

  const preview =
    $("preview");

  if(!preview) return;


  const designNumber =
    (selected % 10) + 1;


  preview.className =
    "bio-preview design-" +
    designNumber;


  const name =
    escapeHtml(
      val("name")
    );

  const profession =
    escapeHtml(
      val("profession")
    );

  const photoHtml = `
    <div class="profile">

      <img
        id="pimg"
        alt="Profile photo"
      >

      <span id="ph">
        PHOTO
      </span>

    </div>
  `;


  preview.innerHTML = `

    <div class="bio-ornament">
      ॥ श्री गणेशाय नमः ॥
    </div>


    <div class="bio-header">

      <div class="bio-header-text">

        <small>
          MARRIAGE BIODATA
        </small>

        <h2>
          ${name}
        </h2>

        <p>
          ${profession}
        </p>

      </div>

      ${photoHtml}

    </div>


    <div class="bio-section">

      <h5>
        PERSONAL DETAILS
      </h5>

      <div class="bio-section-body">

        ${bioRow(
          "Date of Birth",
          safeValue("dob")
        )}

        ${bioRow(
          "Time of Birth",
          safeValue("time_of_birth")
        )}

        ${bioRow(
          "Place of Birth",
          safeValue("place_of_birth")
        )}

        ${bioRow(
          "Height",
          safeValue("height")
        )}

        ${bioRow(
          "Religion",
          safeValue("religion")
        )}

        ${bioRow(
          "Caste / Community",
          safeValue("caste")
        )}

        ${bioRow(
          "Gotra",
          safeValue("gotra")
        )}

        ${bioRow(
          "Rashi",
          safeValue("rashi")
        )}

        ${bioRow(
          "Nakshatra",
          safeValue("nakshatra")
        )}

        ${bioRow(
          "Complexion",
          safeValue("complexion")
        )}

        ${bioRow(
          "Education",
          safeValue("education")
        )}

        ${bioRow(
          "Profession",
          safeValue("profession")
        )}

        ${bioRow(
          "Company",
          safeValue("company")
        )}

        ${bioRow(
          "Languages",
          safeValue("languages")
        )}

        ${bioRow(
          "Hobbies",
          safeValue("hobbies")
        )}

      </div>

    </div>


    <div class="bio-section">

      <h5>
        FAMILY DETAILS
      </h5>

      <div class="bio-section-body">

        ${bioRow(
          "Father's Name",
          safeValue("father")
        )}

        ${bioRow(
          "Father's Occupation",
          safeValue("father_occupation")
        )}

        ${bioRow(
          "Mother's Name",
          safeValue("mother")
        )}

        ${bioRow(
          "Mother's Occupation",
          safeValue("mother_occupation")
        )}

        ${bioRow(
          "Siblings",
          safeValue("siblings")
        )}

        ${bioRow(
          "Contact Person",
          safeValue("contact_person")
        )}

      </div>

    </div>


    <div class="bio-section">

      <h5>
        ABOUT ME
      </h5>

      <p class="bio-about">
        ${escapeHtml(
          safeValue("about") || "—"
        )}
      </p>

    </div>


    <div class="bio-section">

      <h5>
        CONTACT DETAILS
      </h5>

      <div class="bio-section-body">

        ${bioRow(
          "City",
          safeValue("city")
        )}

        ${bioRow(
          "Contact Number",
          safeValue("phone")
        )}

        ${bioRow(
          "Email",
          safeValue("email")
        )}

        ${bioRow(
          "Address",
          safeValue("address")
        )}

      </div>

    </div>


    <div class="bio-foot">

      📞 ${escapeHtml(
        safeValue("phone") || "—"
      )}

      &nbsp; • &nbsp;

      📍 ${escapeHtml(
        safeValue("city") || "—"
      )}

    </div>

  `;


  if(profileDataUrl){

    const image =
      $("pimg");

    const placeholder =
      $("ph");

    if(image){

      image.src =
        profileDataUrl;

      image.style.display =
        "block";
    }

    if(placeholder){

      placeholder.style.display =
        "none";
    }
  }
}


function bioRow(
  label,
  value
){

  return `
    <div class="bio-row">

      <span>
        ${escapeHtml(label)}
      </span>

      <b>
        ${escapeHtml(value || "—")}
      </b>

    </div>
  `;
}


/* =========================================================
   LOCAL DRAFT
========================================================= */

const formFields = [

  "name",
  "dob",
  "time_of_birth",
  "place_of_birth",
  "height",
  "religion",
  "caste",
  "gotra",
  "rashi",
  "nakshatra",
  "complexion",
  "education",
  "profession",
  "company",
  "languages",
  "hobbies",
  "father",
  "father_occupation",
  "mother",
  "mother_occupation",
  "siblings",
  "contact_person",
  "city",
  "phone",
  "email",
  "address",
  "about"

];


function loadDraft(){

  formFields.forEach(
    id => {

      const input =
        $(id);

      if(!input) return;

      const saved =
        localStorage.getItem(
          "vivah_" + id
        );

      if(saved !== null){

        input.value =
          saved;
      }

    }
  );


  const savedTemplate =
    localStorage.getItem(
      "vivah_selected_template"
    );

  if(savedTemplate !== null){

    const index =
      Number(savedTemplate);

    if(
      Number.isInteger(index) &&
      index >= 0 &&
      index < templates.length
    ){

      selected =
        index;
    }
  }


  /*
    Photo is intentionally not stored
    in localStorage because large images
    can exceed browser storage limits.
  */
}


function saveDraftMeta(){

  localStorage.setItem(
    "vivah_selected_template",
    String(selected)
  );
}


formFields.forEach(
  id => {

    const input =
      $(id);

    if(!input) return;

    input.addEventListener(
      "input",
      () => {

        localStorage.setItem(
          "vivah_" + id,
          input.value
        );

        updatePreview();

      }
    );

    input.addEventListener(
      "change",
      () => {

        localStorage.setItem(
          "vivah_" + id,
          input.value
        );

        updatePreview();

      }
    );

  }
);


/* =========================================================
   PHOTO
========================================================= */

$("photo")?.addEventListener(
  "change",
  event => {

    const file =
      event.target.files?.[0];

    if(!file) return;


    if(
      !file.type.startsWith("image/")
    ){

      toast(
        "Please choose an image file."
      );

      return;
    }


    if(
      file.size > 8 * 1024 * 1024
    ){

      toast(
        "Photo should be smaller than 8 MB."
      );

      return;
    }


    const reader =
      new FileReader();


    reader.onload =
      () => {

        profileDataUrl =
          reader.result;

        updatePreview();

        toast(
          "Photo added to biodata."
        );
      };


    reader.onerror =
      () => {

        toast(
          "Could not read photo."
        );
      };


    reader.readAsDataURL(
      file
    );

  }
);


/* =========================================================
   PROFILE DATA FOR BACKEND
========================================================= */

function getProfilePayload(){

  return {

    name:
      safeValue("name") || null,

    date_of_birth:
      safeValue("dob") || null,

    time_of_birth:
      safeValue("time_of_birth") || null,

    place_of_birth:
      safeValue("place_of_birth") || null,

    height:
      safeValue("height") || null,

    religion:
      safeValue("religion") || null,

    caste:
      safeValue("caste") || null,

    gotra:
      safeValue("gotra") || null,

    rashi:
      safeValue("rashi") || null,

    nakshatra:
      safeValue("nakshatra") || null,

    complexion:
      safeValue("complexion") || null,

    education:
      safeValue("education") || null,

    profession:
      safeValue("profession") || null,

    company:
      safeValue("company") || null,

    languages:
      safeValue("languages") || null,

    hobbies:
      safeValue("hobbies") || null,

    father_name:
      safeValue("father") || null,

    father_occupation:
      safeValue("father_occupation") || null,

    mother_name:
      safeValue("mother") || null,

    mother_occupation:
      safeValue("mother_occupation") || null,

    siblings:
      safeValue("siblings") || null,

    contact_person:
      safeValue("contact_person") || null,

    phone:
      safeValue("phone") || null,

    email:
      safeValue("email") || null,

    city:
      safeValue("city") || null,

    address:
      safeValue("address") || null,

    about_me:
      safeValue("about") || null,

    template_id:
      templates[selected]?.[0] ||
      "Elegant Gold"

  };

}


/* =========================================================
   PROFILE ID
========================================================= */

const PROFILE_ID_KEY =
  "vivah_profile_id";

const PAYMENT_ID_KEY =
  "vivah_payment_id";

const PREMIUM_UNLOCK_KEY =
  "vivah_premium_unlocked";


function getProfileId(){

  return localStorage.getItem(
    PROFILE_ID_KEY
  ) || "";
}


function setProfileId(id){

  if(id){

    localStorage.setItem(
      PROFILE_ID_KEY,
      String(id)
    );
  }
}


function getPaymentId(){

  return localStorage.getItem(
    PAYMENT_ID_KEY
  ) || "";
}


function setPaymentId(id){

  if(id){

    localStorage.setItem(
      PAYMENT_ID_KEY,
      String(id)
    );
  }
}


/* =========================================================
   PREMIUM
========================================================= */

function premiumUnlocked(){

  return (
    localStorage.getItem(
      PREMIUM_UNLOCK_KEY
    ) === "true" &&
    !!getPaymentId()
  );
}


function setPremiumUnlocked(
  paymentId
){

  localStorage.setItem(
    PREMIUM_UNLOCK_KEY,
    "true"
  );

  if(paymentId){

    setPaymentId(
      paymentId
    );
  }
}


/* =========================================================
   PHOTO UPLOAD API
========================================================= */

async function uploadProfilePhoto(
  profileId
){

  if(
    !profileId ||
    !profileDataUrl
  ){

    return null;
  }


  const response =
    await fetch(
      "/api/upload-photo",
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            profile_id:
              profileId,

            image_data:
              profileDataUrl

          })

      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if(
    !response.ok ||
    !data.success
  ){

    throw new Error(
      data.error ||
      "Photo upload failed."
    );
  }


  return (
    data.photoUrl ||
    null
  );

}


/* =========================================================
   RAZORPAY
========================================================= */

const PREMIUM_PRICE_PAISE =
  1900;


async function startRazorpayPayment(){

  if(
    premiumUnlocked()
  ){

    toast(
      "Premium already unlocked. You can download now."
    );

    return true;
  }


  if(
    typeof Razorpay ===
    "undefined"
  ){

    toast(
      "Payment system load nahi hua. Page refresh karke try karein."
    );

    return false;
  }


  const payBtn =
    $("payBtn");


  if(payBtn){

    payBtn.disabled =
      true;

    payBtn.textContent =
      "Opening payment…";
  }


  try{

    const orderRes =
      await fetch(
        "/api/create-order",
        {

          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              amount:
                PREMIUM_PRICE_PAISE,

              profile:
                getProfilePayload()

            })

        }
      );


    const orderData =
      await orderRes
        .json()
        .catch(
          () => ({})
        );


    if(
      !orderRes.ok ||
      !orderData.orderId ||
      !orderData.keyId
    ){

      throw new Error(
        orderData.error ||
        "Unable to create payment order."
      );
    }


    /*
      create-order.js already creates
      the profile and returns profileId.
    */

    if(
      orderData.profileId
    ){

      setProfileId(
        orderData.profileId
      );
    }


    const options = {

      key:
        orderData.keyId,

      amount:
        orderData.amount,

      currency:
        orderData.currency ||
        "INR",

      name:
        "VivahBio",

      description:
        "Premium Biodata Download",

      order_id:
        orderData.orderId,

      prefill: {

        name:
          safeValue("name"),

        contact:
          safeValue("phone"),

        email:
          safeValue("email")

      },

      theme: {
        color:
          "#7b2036"
      },


      handler:
        async function(
          response
        ){

          try{

            const verifyRes =
              await fetch(
                "/api/verify-payment",
                {

                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json"
                  },

                  body:
                    JSON.stringify({

                      razorpay_order_id:
                        response.razorpay_order_id,

                      razorpay_payment_id:
                        response.razorpay_payment_id,

                      razorpay_signature:
                        response.razorpay_signature

                    })

                }
              );


            const verifyData =
              await verifyRes
                .json()
                .catch(
                  () => ({})
                );


            if(
              !verifyRes.ok ||
              !verifyData.verified ||
              !verifyData.paymentId
            ){

              throw new Error(
                verifyData.error ||
                "Payment verification failed."
              );
            }


            /*
              IMPORTANT:
              paymentId returned by backend is
              the Supabase payments.id UUID.
              log-download.js expects this.
            */

            setPaymentId(
              verifyData.paymentId
            );


            setPremiumUnlocked(
              verifyData.paymentId
            );


            updatePremiumButtons();


            /*
              Upload photo after successful payment.
            */

            let photoSaved =
              false;


            try{

              const profileId =
                getProfileId() ||
                orderData.profileId ||
                "";


              if(
                profileId &&
                profileDataUrl
              ){

                const photoUrl =
                  await uploadProfilePhoto(
                    profileId
                  );


                if(photoUrl){

                  photoSaved =
                    true;
                }
              }

            }catch(photoError){

              console.error(
                "Photo upload:",
                photoError
              );

            }


            if(photoSaved){

              toast(
                "Payment successful! Photo saved. PDF/JPG unlocked."
              );

            }else{

              toast(
                "Payment successful! PDF/JPG unlocked."
              );
            }


          }catch(error){

            console.error(
              "Payment verification:",
              error
            );


            toast(
              error.message ||
              "Payment verification failed."
            );

          }finally{

            resetPayButton();

          }

        },


      modal: {

        ondismiss:
          function(){

            resetPayButton();

            toast(
              "Payment cancelled."
            );

          }

      }

    };


    const razorpay =
      new Razorpay(
        options
      );


    razorpay.on(
      "payment.failed",
      function(){

        resetPayButton();

        toast(
          "Payment failed. Please try again."
        );

      }
    );


    razorpay.open();


    return true;


  }catch(error){

    console.error(
      "Payment:",
      error
    );


    toast(
      error.message ||
      "Payment start nahi ho paya."
    );


    resetPayButton();

    return false;
  }

}


/* =========================================================
   PAYMENT BUTTON UI
========================================================= */

function resetPayButton(){

  const button =
    $("payBtn");

  if(!button) return;


  button.disabled =
    false;


  button.textContent =
    premiumUnlocked()
      ? "Premium Unlocked ✓"
      : "Unlock Premium ₹19";

}


function updatePremiumButtons(){

  const unlocked =
    premiumUnlocked();


  if($("pdfBtn")){

    $("pdfBtn").textContent =
      unlocked
        ? "Download PDF"
        : "Unlock to Download PDF";
  }


  if($("jpgBtn")){

    $("jpgBtn").textContent =
      unlocked
        ? "Download JPG"
        : "Unlock to Download JPG";
  }


  resetPayButton();
}


/* =========================================================
   DOWNLOAD LOGGING
========================================================= */

async function logDownload(
  fileType
){

  const paymentId =
    getPaymentId();


  if(!paymentId){

    console.warn(
      "No payment ID. Download not logged."
    );

    return false;
  }


  try{

    const response =
      await fetch(
        "/api/log-download",
        {

          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              payment_id:
                paymentId,

              file_type:
                fileType

            })

        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if(
      !response.ok ||
      !data.logged
    ){

      console.error(
        "Download logging failed:",
        data.error
      );

      return false;
    }


    return true;


  }catch(error){

    console.error(
      "Download logging error:",
      error
    );

    return false;
  }
}


/* =========================================================
   LOAD EXTERNAL LIBRARY
   html2canvas = exact preview image
   jsPDF = PDF generation
========================================================= */

function loadScript(
  src
){

  return new Promise(
    (resolve,reject) => {

      const existing =
        document.querySelector(
          `script[src="${src}"]`
        );

      if(existing){

        if(
          existing.dataset.loaded ===
          "true"
        ){

          resolve();

        }else{

          existing.addEventListener(
            "load",
            resolve,
            {once:true}
          );

          existing.addEventListener(
            "error",
            reject,
            {once:true}
          );
        }

        return;
      }


      const script =
        document.createElement(
          "script"
        );

      script.src =
        src;

      script.onload =
        () => {

          script.dataset.loaded =
            "true";

          resolve();

        };

      script.onerror =
        () => {

          reject(
            new Error(
              "Required download library could not be loaded."
            )
          );
        };


      document.head.appendChild(
        script
      );

    }
  );
}


async function ensureExportLibraries(){

  if(
    typeof html2canvas ===
    "undefined"
  ){

    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
    );
  }


  if(
    typeof window.jspdf ===
    "undefined"
  ){

    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    );
  }

}


/* =========================================================
   PREPARE PREVIEW FOR EXPORT
========================================================= */

async function createPreviewCanvas(){

  const preview =
    $("preview");

  if(!preview){

    throw new Error(
      "Biodata preview not found."
    );
  }


  /*
    Wait for browser fonts/images
    before capturing.
  */

  if(
    document.fonts &&
    document.fonts.ready
  ){

    await document.fonts.ready;
  }


  const images =
    Array.from(
      preview.querySelectorAll(
        "img"
      )
    );


  await Promise.all(
    images.map(
      image =>
        new Promise(
          resolve => {

            if(image.complete){

              resolve();

              return;
            }


            image.onload =
              resolve;

            image.onerror =
              resolve;

          }
        )
    )
  );


  /*
    Temporarily remove preview
    animation/transition effects.
  */

  const oldTransition =
    preview.style.transition;

  const oldTransform =
    preview.style.transform;


  preview.style.transition =
    "none";

  preview.style.transform =
    "none";


  let canvas;


  try{

    canvas =
      await html2canvas(
        preview,
        {

          scale:
            Math.min(
              3,
              Math.max(
                2,
                window.devicePixelRatio ||
                1
              )
            ),

          useCORS:
            true,

          allowTaint:
            false,

          backgroundColor:
            null,

          logging:
            false,

          imageTimeout:
            15000

        }
      );


  }finally{

    preview.style.transition =
      oldTransition;

    preview.style.transform =
      oldTransform;
  }


  return canvas;
}


/* =========================================================
   JPG DOWNLOAD
========================================================= */

async function downloadJpg(){

  toast(
    "Preparing JPG…"
  );


  await ensureExportLibraries();


  const canvas =
    await createPreviewCanvas();


  const link =
    document.createElement(
      "a"
    );


  link.download =
    "vivahbio-marriage-biodata.jpg";


  link.href =
    canvas.toDataURL(
      "image/jpeg",
      0.95
    );


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  await logDownload(
    "jpg"
  );


  toast(
    "JPG downloaded successfully."
  );

}


/* =========================================================
   PDF DOWNLOAD
========================================================= */

async function downloadPdf(){

  toast(
    "Preparing PDF…"
  );


  await ensureExportLibraries();


  const canvas =
    await createPreviewCanvas();


  const imageData =
    canvas.toDataURL(
      "image/jpeg",
      0.95
    );


  const jsPDF =
    window.jspdf?.jsPDF;


  if(!jsPDF){

    throw new Error(
      "PDF library could not be loaded."
    );
  }


  /*
    A4 dimensions in mm.
  */

  const pdf =
    new jsPDF({
      orientation:
        "portrait",

      unit:
        "mm",

      format:
        "a4",

      compress:
        true
    });


  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();


  /*
    Keep the entire biodata on one A4 page.
  */

  const margin =
    5;

  const availableWidth =
    pageWidth -
    margin * 2;

  const availableHeight =
    pageHeight -
    margin * 2;


  const imageRatio =
    canvas.width /
    canvas.height;


  let imageWidth =
    availableWidth;

  let imageHeight =
    imageWidth /
    imageRatio;


  if(
    imageHeight >
    availableHeight
  ){

    imageHeight =
      availableHeight;

    imageWidth =
      imageHeight *
      imageRatio;
  }


  const x =
    (pageWidth -
      imageWidth) / 2;


  const y =
    (pageHeight -
      imageHeight) / 2;


  pdf.addImage(
    imageData,
    "JPEG",
    x,
    y,
    imageWidth,
    imageHeight,
    undefined,
    "FAST"
  );


  pdf.save(
    "vivahbio-marriage-biodata.pdf"
  );


  await logDownload(
    "pdf"
  );


  toast(
    "PDF downloaded successfully."
  );

}


/* =========================================================
   PREMIUM GATE
========================================================= */

async function requirePremium(
  action
){

  if(
    premiumUnlocked()
  ){

    try{

      await action();

    }catch(error){

      console.error(
        "Download:",
        error
      );

      toast(
        error.message ||
        "Download failed."
      );
    }

    return;
  }


  toast(
    "Download ke liye pehle ₹19 Premium unlock karein."
  );


  await startRazorpayPayment();

}


/* =========================================================
   DOWNLOAD BUTTONS
========================================================= */

$("pdfBtn")?.addEventListener(
  "click",
  () => {

    requirePremium(
      downloadPdf
    );

  }
);


$("jpgBtn")?.addEventListener(
  "click",
  () => {

    requirePremium(
      downloadJpg
    );

  }
);


$("payBtn")?.addEventListener(
  "click",
  startRazorpayPayment
);


/* =========================================================
   FILTER BUTTONS
========================================================= */

document
  .querySelectorAll(
    ".filter"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".filter"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );


          renderTemplates(
            button.dataset.filter ||
            "all"
          );

        }
      );

    }
  );


/* =========================================================
   LANGUAGE BUTTON
========================================================= */

$("langBtn")?.addEventListener(
  "click",
  () => {

    toast(
      "Hindi/English UI localization is coming next."
    );

  }
);


/* =========================================================
   INITIALIZE
========================================================= */

loadDraft();

renderTemplates();

renderMini();

selectTemplate(
  selected
);

updatePreview();

updatePremiumButtons();

/* =========================================================
   FINAL CLICK FIX
   - Hero biodata clickable
   - Template cards clickable
   - Selected template opens maker
========================================================= */


/* ---------- HERO BIODATA CLICK ---------- */

const heroPaperFix =
  document.getElementById("heroPaper");

if (heroPaperFix) {

  heroPaperFix.style.cursor = "pointer";

  heroPaperFix.addEventListener(
    "click",
    function () {

      const maker =
        document.getElementById("maker");

      if (maker) {

        maker.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }

    }
  );

}


/* ---------- HERO STAGE CLICK ---------- */

const heroStageFix =
  document.querySelector(".hero-stage");

if (heroStageFix) {

  heroStageFix.style.cursor =
    "pointer";

}


/* ---------- TEMPLATE CARD CLICK ---------- */

function activateTemplateClickFix() {

  const cards =
    document.querySelectorAll(
      "#templateGrid .template-card"
    );

  cards.forEach(
    (card, index) => {

      /* remove old onclick if any */

      card.style.cursor =
        "pointer";

      card.setAttribute(
        "role",
        "button"
      );

      card.setAttribute(
        "tabindex",
        "0"
      );


      card.onclick =
        function (event) {

          event.preventDefault();

          event.stopPropagation();


          /* Select template */

          if (
            typeof selectTemplate ===
            "function"
          ) {

            selectTemplate(index);

          }


          /* Scroll to biodata maker */

          const maker =
            document.getElementById(
              "maker"
            );

          if (maker) {

            setTimeout(
              function () {

                maker.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });

              },
              100
            );

          }


          /* Visual feedback */

          cards.forEach(
            c =>
              c.classList.remove(
                "selected"
              )
          );


          card.classList.add(
            "selected"
          );

        };


      card.onkeydown =
        function (event) {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {

            event.preventDefault();

            card.click();

          }

        };

    }
  );

}


/* Run once */

activateTemplateClickFix();


/* Run again after template filtering */

document
  .querySelectorAll(".filter")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        function () {

          setTimeout(
            activateTemplateClickFix,
            50
          );

        }
      );

    }
  );


/* =========================================================
   SELECTED TEMPLATE VISUAL STYLE
========================================================= */

if (
  !document.getElementById(
    "template-click-fix-style"
  )
) {

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "template-click-fix-style";

  style.textContent = `

    #templateGrid .template-card {
      cursor: pointer !important;
      position: relative;
    }

    #templateGrid .template-card:hover {
      transform: translateY(-4px);
    }

    #templateGrid .template-card.selected {
      outline: 3px solid #7b2036;
      outline-offset: 4px;
    }

    #heroPaper {
      cursor: pointer !important;
    }

  `;

  document.head.appendChild(
    style
  );

}

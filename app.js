/* =========================================================
   VIVAHBIO APP.JS
   Complete frontend
   - Templates
   - Live preview
   - Local draft
   - Razorpay payment
   - Supabase profile saving
   - Supabase photo storage
   - PDF/JPG export
   - Download logging
   - PREMIUM RESET FIX
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

  return String(
    el.value || ""
  ).trim();

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

  if(!box){

    alert(message);

    return;

  }

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
      3000
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


function renderTemplates(filter = "all"){

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
        document.createElement("div");


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
        function(){

          selectTemplate(index);

          const maker =
            $("maker");

          if(maker){

            setTimeout(
              () => {

                maker.scrollIntoView({
                  behavior:"smooth",
                  block:"start"
                });

              },
              100
            );

          }

        };


      card.onkeydown =
        function(event){

          if(
            event.key === "Enter" ||
            event.key === " "
          ){

            event.preventDefault();

            card.click();

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
        document.createElement("button");


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
   PROFILE / PAYMENT STORAGE KEYS
========================================================= */

const PROFILE_ID_KEY =
  "vivah_profile_id";

const PAYMENT_ID_KEY =
  "vivah_payment_id";

const PREMIUM_UNLOCK_KEY =
  "vivah_premium_unlocked";

const PREMIUM_PROFILE_KEY =
  "vivah_premium_profile_id";

const PREMIUM_DRAFT_KEY =
  "vivah_premium_draft_signature";

const PHOTO_VERSION_KEY =
  "vivah_photo_version";

/*
  IMPORTANT:
  This flag is used only in browser localStorage.
  It does NOT delete anything from Supabase.
*/
const DOWNLOAD_COMPLETED_KEY =
  "vivah_download_completed";


/* =========================================================
   CLEAR LOCAL DRAFT AFTER DOWNLOAD
========================================================= */

function clearLocalDraftAfterDownload(){

  /*
    Clear all locally saved form fields.
  */

  formFields.forEach(
    id => {

      localStorage.removeItem(
        "vivah_" + id
      );

      const input =
        $(id);

      if(input){

        input.value =
          "";

      }

    }
  );


  /*
    Clear selected template.
  */

  localStorage.removeItem(
    "vivah_selected_template"
  );


  /*
    Clear current browser profile/payment state.
    Supabase data remains untouched.
  */

  localStorage.removeItem(
    PROFILE_ID_KEY
  );

  localStorage.removeItem(
    PAYMENT_ID_KEY
  );

  localStorage.removeItem(
    PREMIUM_UNLOCK_KEY
  );

  localStorage.removeItem(
    PREMIUM_PROFILE_KEY
  );

  localStorage.removeItem(
    PREMIUM_DRAFT_KEY
  );

  localStorage.removeItem(
    PHOTO_VERSION_KEY
  );


  /*
    Clear photo input.
  */

  const photoInput =
    $("photo");

  if(photoInput){

    photoInput.value =
      "";

  }


  /*
    Clear runtime photo.
  */

  profileDataUrl =
    "";


  /*
    Reset selected template.
  */

  selected =
    0;


  /*
    Remove completion flag after processing.
  */

  localStorage.removeItem(
    DOWNLOAD_COMPLETED_KEY
  );


  /*
    Refresh preview/buttons.
  */

  renderMini();

  updatePreview();

  updatePremiumButtons();

}


/* =========================================================
   CHECK COMPLETED DOWNLOAD ON PAGE LOAD
========================================================= */

function clearCompletedDownloadDraft(){

  const completed =
    localStorage.getItem(
      DOWNLOAD_COMPLETED_KEY
    ) === "true";


  if(!completed){

    return;

  }


  clearLocalDraftAfterDownload();

}


/* =========================================================
   PROFILE ID
========================================================= */

function getProfileId(){

  return localStorage.getItem(
    PROFILE_ID_KEY
  ) || "";

}


function setProfileId(id){

  if(!id) return;

  const newProfileId =
    String(id);

  const oldProfileId =
    getProfileId();


  /*
    If backend creates a new profile,
    old payment must NEVER unlock it.
  */

  if(
    oldProfileId &&
    oldProfileId !== newProfileId
  ){

    invalidatePremium(false);

  }


  localStorage.setItem(
    PROFILE_ID_KEY,
    newProfileId
  );

}


/* =========================================================
   PAYMENT ID
========================================================= */

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
   CURRENT DRAFT SIGNATURE
========================================================= */

const signatureFields = [

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


function getDraftSignature(){

  const data = {};

  signatureFields.forEach(
    id => {

      data[id] =
        safeValue(id);

    }
  );


  data.template =
    templates[selected]?.[0] ||
    "Elegant Gold";


  return JSON.stringify(data);

}


/* =========================================================
   INVALIDATE PREMIUM
========================================================= */

function invalidatePremium(showMessage = false){

  localStorage.removeItem(
    PREMIUM_UNLOCK_KEY
  );

  localStorage.removeItem(
    PAYMENT_ID_KEY
  );

  localStorage.removeItem(
    PREMIUM_PROFILE_KEY
  );

  localStorage.removeItem(
    PREMIUM_DRAFT_KEY
  );


  updatePremiumButtons();


  if(showMessage){

    toast(
      "Biodata change hua hai. New payment required."
    );

  }

}


/* =========================================================
   PREMIUM CHECK
========================================================= */

function premiumUnlocked(){

  const unlocked =
    localStorage.getItem(
      PREMIUM_UNLOCK_KEY
    ) === "true";


  const paymentId =
    getPaymentId();


  const paidProfileId =
    localStorage.getItem(
      PREMIUM_PROFILE_KEY
    ) || "";


  const currentProfileId =
    getProfileId();


  const paidDraftSignature =
    localStorage.getItem(
      PREMIUM_DRAFT_KEY
    ) || "";


  const currentDraftSignature =
    getDraftSignature();


  return (

    unlocked &&

    !!paymentId &&

    !!paidProfileId &&

    !!currentProfileId &&

    paidProfileId === currentProfileId &&

    !!paidDraftSignature &&

    paidDraftSignature === currentDraftSignature

  );

}


/* =========================================================
   SET PREMIUM
========================================================= */

function setPremiumUnlocked(paymentId){

  localStorage.setItem(
    PREMIUM_UNLOCK_KEY,
    "true"
  );


  if(paymentId){

    setPaymentId(
      paymentId
    );

  }


  const profileId =
    getProfileId();


  if(profileId){

    localStorage.setItem(
      PREMIUM_PROFILE_KEY,
      String(profileId)
    );

  }


  localStorage.setItem(
    PREMIUM_DRAFT_KEY,
    getDraftSignature()
  );

}


/* =========================================================
   BIODATA PREVIEW
========================================================= */

function bioRow(label,value){

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


      <div class="profile">

        <img
          id="pimg"
          alt="Profile photo"
        >

        <span id="ph">
          PHOTO
        </span>

      </div>

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

}


function saveDraftMeta(){

  localStorage.setItem(
    "vivah_selected_template",
    String(selected)
  );

}


/* =========================================================
   FORM CHANGE HANDLERS
========================================================= */

formFields.forEach(
  id => {

    const input =
      $(id);

    if(!input) return;


    const handleChange =
      () => {

        localStorage.setItem(
          "vivah_" + id,
          input.value
        );


        if(
          localStorage.getItem(
            PREMIUM_UNLOCK_KEY
          ) === "true"
        ){

          invalidatePremium();

        }


        updatePreview();

      };


    input.addEventListener(
      "input",
      handleChange
    );


    input.addEventListener(
      "change",
      handleChange
    );

  }
);


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


  const previous =
    selected;


  selected =
    index;


  if(
    previous !== index &&
    localStorage.getItem(
      PREMIUM_UNLOCK_KEY
    ) === "true"
  ){

    invalidatePremium();

  }


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

      event.target.value =
        "";

      return;

    }


    if(
      file.size > 12 * 1024 * 1024
    ){

      toast(
        "Photo should be smaller than 12 MB."
      );

      event.target.value =
        "";

      return;

    }


    let photoVersion =
      Number(
        localStorage.getItem(
          PHOTO_VERSION_KEY
        ) || "0"
      );


    photoVersion++;


    localStorage.setItem(
      PHOTO_VERSION_KEY,
      String(photoVersion)
    );


    invalidatePremium();


    compressPhoto(file)
      .then(
        compressedData => {

          profileDataUrl =
            compressedData;


          updatePreview();


          toast(
            "Photo added successfully."
          );

        }
      )
      .catch(
        error => {

          console.error(
            "Photo processing:",
            error
          );


          toast(
            "Photo could not be processed."
          );

        }
      );

  }
);


/* =========================================================
   COMPRESS PHOTO
========================================================= */

function compressPhoto(file){

  return new Promise(
    (resolve,reject) => {

      const reader =
        new FileReader();


      reader.onload =
        function(){

          const img =
            new Image();


          img.onload =
            function(){

              const maxSize =
                1600;


              let width =
                img.width;


              let height =
                img.height;


              if(
                width > maxSize ||
                height > maxSize
              ){

                if(width > height){

                  height =
                    Math.round(
                      height *
                      maxSize /
                      width
                    );

                  width =
                    maxSize;

                }else{

                  width =
                    Math.round(
                      width *
                      maxSize /
                      height
                    );

                  height =
                    maxSize;

                }

              }


              const canvas =
                document.createElement(
                  "canvas"
                );


              canvas.width =
                width;


              canvas.height =
                height;


              const ctx =
                canvas.getContext(
                  "2d"
                );


              if(!ctx){

                reject(
                  new Error(
                    "Canvas not supported"
                  )
                );

                return;

              }


              ctx.drawImage(
                img,
                0,
                0,
                width,
                height
              );


              const dataUrl =
                canvas.toDataURL(
                  "image/jpeg",
                  0.82
                );


              resolve(
                dataUrl
              );

            };


          img.onerror =
            () => reject(
              new Error(
                "Invalid image"
              )
            );


          img.src =
            reader.result;

        };


      reader.onerror =
        () => reject(
          new Error(
            "Could not read image"
          )
        );


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================================
   PROFILE PAYLOAD
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
   PHOTO UPLOAD API
========================================================= */

async function uploadProfilePhoto(profileId){

  if(!profileId){

    throw new Error(
      "Profile ID missing."
    );

  }


  if(!profileDataUrl){

    return null;

  }


  const response =
    await fetch(
      "/api/upload-photo",
      {

        method:
          "POST",

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


  const rawText =
    await response.text();


  let data = {};


  try{

    data =
      rawText
        ? JSON.parse(rawText)
        : {};

  }catch(error){

    console.error(
      "Photo API invalid response:",
      rawText
    );

  }


  if(
    !response.ok ||
    !data.success
  ){

    throw new Error(
      data.error ||
      `Photo upload failed (${response.status})`
    );

  }


  return data.photoUrl;

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

    saveDraftMeta();


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
        async function(response){

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


            setPaymentId(
              verifyData.paymentId
            );


            setPremiumUnlocked(
              verifyData.paymentId
            );


            updatePremiumButtons();


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

            }catch(error){

              console.error(
                "Photo upload error:",
                error
              );

            }


            if(photoSaved){

              toast(
                "Payment successful! Photo saved. PDF/JPG unlocked."
              );

            }else if(profileDataUrl){

              toast(
                "Payment successful, but photo could not be saved."
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

async function logDownload(fileType){

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
   LOAD EXPORT LIBRARIES
========================================================= */

function loadScript(src){

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
   CREATE PREVIEW CANVAS
========================================================= */

async function createPreviewCanvas(){

  const preview =
    $("preview");


  if(!preview){

    throw new Error(
      "Biodata preview not found."
    );

  }


  if(
    document.fonts &&
    document.fonts.ready
  ){

    await document.fonts.ready;

  }


  const images =
    Array.from(
      preview.querySelectorAll("img")
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


  /*
    First log the download.
    Only after successful logging,
    mark download as completed.
  */

  const logged =
    await logDownload(
      "jpg"
    );


  if(logged){

    localStorage.setItem(
      DOWNLOAD_COMPLETED_KEY,
      "true"
    );

  }


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


  /*
    First log the download.
    Only after successful logging,
    mark download as completed.
  */

  const logged =
    await logDownload(
      "pdf"
    );


  if(logged){

    localStorage.setItem(
      DOWNLOAD_COMPLETED_KEY,
      "true"
    );

  }


  toast(
    "PDF downloaded successfully."
  );

}


/* =========================================================
   PREMIUM GATE
========================================================= */

async function requirePremium(action){

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
  .querySelectorAll(".filter")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".filter")
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


          setTimeout(
            activateTemplateClickFix,
            50
          );

        }
      );

    }
  );


/* =========================================================
   LANGUAGE
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
   HERO BIODATA CLICK
========================================================= */

const heroPaper =
  document.getElementById(
    "heroPaper"
  );


if(heroPaper){

  heroPaper.style.cursor =
    "pointer";


  heroPaper.addEventListener(
    "click",
    function(){

      const maker =
        document.getElementById(
          "maker"
        );


      if(maker){

        maker.scrollIntoView({
          behavior:
            "smooth",

          block:
            "start"

        });

      }

    }
  );

}


/* =========================================================
   TEMPLATE CLICK FIX
========================================================= */

function activateTemplateClickFix(){

  const cards =
    document.querySelectorAll(
      "#templateGrid .template-card"
    );


  cards.forEach(
    card => {

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
        function(event){

          event.preventDefault();

          event.stopPropagation();


          const title =
            card.querySelector(
              "footer b"
            )?.textContent
              ?.trim();


          let templateIndex =
            templates.findIndex(
              template =>
                template[0] === title
            );


          if(
            templateIndex < 0
          ){

            const allCards =
              Array.from(
                document.querySelectorAll(
                  "#templateGrid .template-card"
                )
              );


            templateIndex =
              allCards.indexOf(card);

          }


          if(
            templateIndex >= 0
          ){

            selectTemplate(
              templateIndex
            );

          }


          const maker =
            document.getElementById(
              "maker"
            );


          if(maker){

            setTimeout(
              function(){

                maker.scrollIntoView({
                  behavior:
                    "smooth",

                  block:
                    "start"

                });

              },
              100
            );

          }


          document
            .querySelectorAll(
              "#templateGrid .template-card"
            )
            .forEach(
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
        function(event){

          if(
            event.key === "Enter" ||
            event.key === " "
          ){

            event.preventDefault();

            card.click();

          }

        };

    }
  );

}


/* =========================================================
   TEMPLATE STYLE
========================================================= */

if(
  !document.getElementById(
    "template-click-fix-style"
  )
){

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


/* =========================================================
   INITIALIZE
========================================================= */

/*
  IMPORTANT:
  Check whether a completed download happened
  before restoring old local draft.
*/

clearCompletedDownloadDraft();

loadDraft();

renderTemplates();

renderMini();

selectTemplate(
  selected
);

updatePreview();

updatePremiumButtons();

activateTemplateClickFix();

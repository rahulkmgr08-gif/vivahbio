const defaultTemplates = [
  ["Classic Gold", "traditional", "gold", false],
  ["Royal Maroon", "royal", "maroon", false],
  ["Royal Blue", "royal", "blue", false],
  ["Blush Floral", "floral", "blush", false],
  ["Elegant Cream", "traditional", "cream", false],
  ["Heritage Frame", "traditional", "heritage", true],
  ["Modern Burgundy", "modern", "burgundy", true],
  ["Golden Classic", "traditional", "mustard", true],
  ["Floral White", "floral", "floral", true],
  ["Modern Floral", "modern", "modern-floral", true]
];

const $ = id => document.getElementById(id);
let selected = 0;
let profileDataUrl = "";

function getTemplates(){
  // Force the new 10-design library so old localStorage template data
  // cannot keep the old generic designs on existing browsers.
  return defaultTemplates.slice();
}

let templates = getTemplates();

function saveTemplates(){
  localStorage.setItem("vivah_templates", JSON.stringify(templates));
}

function artClass(i){
  return [
    "gold", "maroon", "blue", "blush", "cream",
    "heritage", "burgundy", "mustard", "floral", "modern-floral"
  ][i % 10];
}

function renderTemplates(filter = "all"){
  const grid = $("templateGrid");
  if(!grid) return;

  grid.innerHTML = "";

  templates.forEach((t, i) => {
    if(filter !== "all" && t[1] !== filter) return;

    const card = document.createElement("div");
    card.className = "template-card";
    card.innerHTML = `
      <div class="template-art template-thumb design-${i+1}">
        <div class="thumb-photo"></div>
        <div class="thumb-title">${escapeHtml(t[0])}</div>
        <div class="thumb-section"></div>
        <div class="thumb-lines"></div>
      </div>
      <footer>
        <b>${escapeHtml(t[0])}</b>
        <small>${cap(t[1])} • ${t[3] ? "Premium" : "Free"}</small>
      </footer>`;
    card.onclick = () => selectTemplate(i);
    grid.appendChild(card);
  });
}

function renderMini(){
  const el = $("miniTemplates");
  if(!el) return;

  el.innerHTML = templates.map((t, i) => `
    <button class="mini ${i === selected ? "active" : ""}" data-i="${i}">
      ${i + 1}. ${escapeHtml(t[0])}
    </button>
  `).join("");

  el.querySelectorAll(".mini").forEach(b => {
    b.onclick = () => selectTemplate(+b.dataset.i);
  });
}

function selectTemplate(i){
  selected = Math.max(0, Math.min(i, templates.length - 1));

  if($("selectedName")){
    $("selectedName").textContent = templates[selected][0];
  }

  renderMini();
  updatePreview();
}

function val(id){
  return $(id)?.value || "—";
}

function safeValue(id){
  const value = val(id);
  return value === "—" ? "" : value;
}

function formatDate(value){
  if(!value || value === "—") return "—";
  const parts = value.split("-");
  if(parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(value){
  if(!value || value === "—") return "—";
  const [h, m] = value.split(":").map(Number);
  if(Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function row(label, value){
  return `
    <div class="bio-row">
      <span>${escapeHtml(label)}</span>
      <b>${escapeHtml(value || "—")}</b>
    </div>`;
}

function section(title, content){
  return `
    <section class="bio-section">
      <h5>${escapeHtml(title)}</h5>
      <div class="bio-section-body">${content}</div>
    </section>`;
}

function photoMarkup(){
  return `
    <div class="profile">
      <img id="pimg" alt="Profile photo">
      <span id="ph">PHOTO</span>
    </div>`;
}

function updatePreview(){
  const p = $("preview");
  if(!p) return;

  const design = selected + 1;

  const personal = [
    row("Name", safeValue("name")),
    row("Date of Birth", formatDate(safeValue("dob"))),
    row("Time of Birth", formatTime(safeValue("time_of_birth"))),
    row("Place of Birth", safeValue("place_of_birth")),
    row("Rashi", safeValue("rashi")),
    row("Nakshatra", safeValue("nakshatra")),
    row("Complexion", safeValue("complexion")),
    row("Height", safeValue("height")),
    row("Religion", safeValue("religion")),
    row("Caste", safeValue("caste")),
    row("Gotra", safeValue("gotra")),
    row("Education", safeValue("education")),
    row("Work", safeValue("profession")),
    row("Company", safeValue("company")),
    row("Languages", safeValue("languages")),
    row("Hobbies", safeValue("hobbies"))
  ].join("");

  const family = [
    row("Father's Name", safeValue("father")),
    row("Father's Occupation", safeValue("father_occupation")),
    row("Mother's Name", safeValue("mother")),
    row("Mother's Occupation", safeValue("mother_occupation")),
    row("Siblings", safeValue("siblings"))
  ].join("");

  const contact = [
    row("Contact Person", safeValue("contact_person")),
    row("Contact Number", safeValue("phone")),
    row("Email ID", safeValue("email")),
    row("Residential Address", safeValue("address") || safeValue("city"))
  ].join("");

  const about = safeValue("about");

  const header = `
    <div class="bio-ornament">ॐ</div>
    <div class="bio-header">
      <div class="bio-header-text">
        <small>MARRIAGE BIODATA</small>
        <h2>${escapeHtml(safeValue("name") || "Your Name")}</h2>
        <p>${escapeHtml(safeValue("profession") || "Profession")}</p>
        <div class="bio-location">${escapeHtml(safeValue("place_of_birth") || safeValue("city") || "India")}</div>
      </div>
      ${photoMarkup()}
    </div>`;

  const classic = `
    ${header}
    ${section("PERSONAL DETAILS", personal)}
    ${section("FAMILY DETAILS", family)}
    ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}
    ${section("CONTACT DETAILS", contact)}
    <div class="bio-foot">${escapeHtml(safeValue("phone") || "")}${safeValue("city") ? " • " + escapeHtml(safeValue("city")) : ""}</div>`;

  // Design-specific structure variations. All fields remain the same.
  let html = classic;

  if(design === 2){
    html = `
      <div class="bio-royal-pattern"></div>
      ${header}
      ${section("PERSONAL DETAILS", personal)}
      ${section("FAMILY DETAILS", family)}
      ${section("CONTACT DETAILS", contact)}
      ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}`;
  }

  if(design === 3){
    html = `
      <div class="bio-royal-pattern"></div>
      ${header}
      ${section("PERSONAL DETAILS", personal)}
      ${section("FAMILY DETAILS", family)}
      ${section("CONTACT DETAILS", contact)}
      ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}`;
  }

  if(design === 4){
    html = `
      <div class="bio-blush-top">
        ${photoMarkup()}
        <div><h2>${escapeHtml(safeValue("name") || "Your Name")}</h2>
        <p>Date of Birth : ${escapeHtml(formatDate(safeValue("dob")))}</p>
        <p>Place of Birth : ${escapeHtml(safeValue("place_of_birth") || safeValue("city"))}</p></div>
      </div>
      ${section("PERSONAL DETAILS", personal)}
      ${section("FAMILY DETAILS", family)}
      ${section("CONTACT DETAILS", contact)}
      ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}`;
  }

  if(design === 5){
    html = `
      <div class="bio-gold-symbol">ॐ श्री गणेशाय नमः</div>
      ${header}
      ${section("PERSONAL DETAILS", personal)}
      ${section("FAMILY DETAILS", family)}
      ${section("CONTACT DETAILS", contact)}
      ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}`;
  }

  if(design === 6){
    html = `
      <div class="bio-corner-ornaments">✦</div>
      ${header}
      ${section("PERSONAL DETAILS", personal)}
      ${section("FAMILY DETAILS", family)}
      ${section("CONTACT DETAILS", contact)}
      ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}`;
  }

  if(design === 7){
    html = `
      ${header}
      ${section("PERSONAL DETAILS", personal)}
      ${section("FAMILY DETAILS", family)}
      ${section("CONTACT DETAILS", contact)}
      ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}`;
  }

  if(design === 8){
    html = `
      <div class="bio-gold-symbol">ॐ श्री गणेशाय नमः</div>
      ${header}
      ${section("PERSONAL DETAILS", personal)}
      ${section("FAMILY DETAILS", family)}
      ${section("CONTACT DETAILS", contact)}
      ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}`;
  }

  if(design === 9){
    html = `
      <div class="bio-floral-watermark">❀</div>
      ${header}
      ${section("PERSONAL DETAILS", personal)}
      ${section("FAMILY DETAILS", family)}
      ${section("CONTACT DETAILS", contact)}
      ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}`;
  }

  if(design === 10){
    html = `
      <div class="bio-floral-watermark">❀</div>
      ${header}
      ${section("PERSONAL DETAILS", personal)}
      ${section("FAMILY DETAILS", family)}
      ${section("CONTACT DETAILS", contact)}
      ${about ? section("ABOUT ME", `<p class="bio-about">${escapeHtml(about)}</p>`) : ""}`;
  }

  p.className = `bio-preview design-${design}`;
  p.innerHTML = html;

  if(profileDataUrl && $("pimg")){
    $("pimg").src = profileDataUrl;
    $("pimg").style.display = "block";
    if($("ph")) $("ph").style.display = "none";
  }
}

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[c]));
}

function cap(s){
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

async function downloadJpg(){
  const W = 1400;
  const H = 1980;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");

  c.width = W;
  c.height = H;

  const themes = [
    ["#fffdfb","#9d712e","#e2c785"],
    ["#843b32","#f0c95c","#843b32"],
    ["#2e518f","#e7ba45","#2e518f"],
    ["#ead6dd","#9b6678","#ead6dd"],
    ["#faf1dc","#8b6a2f","#d9bf77"],
    ["#fffdf9","#8b5b2b","#b58a45"],
    ["#7f3030","#f0c95c","#7f3030"],
    ["#fff0bd","#a8482d","#d9bd69"],
    ["#fffefa","#8d7345","#d7d0c5"],
    ["#fffefa","#477e9e","#d0b35b"]
  ];

  const [background, accent, border] = themes[selected % themes.length];

  ctx.fillStyle = background;
  ctx.fillRect(0,0,W,H);

  ctx.strokeStyle = border;
  ctx.lineWidth = 24;
  ctx.strokeRect(35,35,W-70,H-70);

  if([1,2,6].includes(selected)){
    ctx.fillStyle = accent;
    ctx.globalAlpha = .12;
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.font = "26px Georgia";
  ctx.fillText("ॐ श्री गणेशाय नमः", W/2, 105);

  ctx.font = "bold 22px Arial";
  ctx.fillText("MARRIAGE BIODATA", W/2, 165);

  ctx.textAlign = "left";
  ctx.font = "bold 48px Georgia";
  ctx.fillText(safeValue("name") || "Your Name", 100, 250);

  ctx.font = "22px Arial";
  ctx.fillStyle = "#62595a";
  ctx.fillText(safeValue("profession") || "Profession", 100, 292);

  if(profileDataUrl){
    await drawImage(profileDataUrl, W-330, 140, 190, 235, ctx);
  }else{
    ctx.fillStyle = "#eee3df";
    ctx.fillRect(W-330,140,190,235);
    ctx.fillStyle = "#999";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PHOTO", W-235, 265);
  }

  ctx.strokeStyle = border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(100,345);
  ctx.lineTo(W-100,345);
  ctx.stroke();

  let y = 410;

  canvasSection("PERSONAL DETAILS");
  canvasRows([
    ["Name",safeValue("name")],
    ["Date of Birth",formatDate(safeValue("dob"))],
    ["Time of Birth",formatTime(safeValue("time_of_birth"))],
    ["Place of Birth",safeValue("place_of_birth")],
    ["Rashi",safeValue("rashi")],
    ["Nakshatra",safeValue("nakshatra")],
    ["Complexion",safeValue("complexion")],
    ["Height",safeValue("height")],
    ["Religion",safeValue("religion")],
    ["Caste",safeValue("caste")],
    ["Gotra",safeValue("gotra")],
    ["Education",safeValue("education")],
    ["Work",safeValue("profession")],
    ["Company",safeValue("company")]
  ]);

  canvasSection("FAMILY DETAILS");
  canvasRows([
    ["Father's Name",safeValue("father")],
    ["Father's Occupation",safeValue("father_occupation")],
    ["Mother's Name",safeValue("mother")],
    ["Mother's Occupation",safeValue("mother_occupation")],
    ["Siblings",safeValue("siblings")]
  ]);

  canvasSection("CONTACT DETAILS");
  canvasRows([
    ["Contact Person",safeValue("contact_person")],
    ["Contact Number",safeValue("phone")],
    ["Email ID",safeValue("email")],
    ["Address",safeValue("address") || safeValue("city")]
  ]);

  if(safeValue("about")){
    canvasSection("ABOUT ME");
    ctx.fillStyle = "#4f4748";
    ctx.font = "19px Arial";
    wrapCanvas(ctx,safeValue("about"),100,y,W-200,30);
    y += 120;
  }

  const a = document.createElement("a");
  a.download = `vivahbio-${(safeValue("name") || "biodata").replace(/\s+/g,"-")}.jpg`;
  a.href = c.toDataURL("image/jpeg",0.95);
  a.click();

  function canvasSection(title){
    ctx.fillStyle = accent;
    ctx.textAlign = "left";
    ctx.font = "bold 17px Arial";
    ctx.fillText(title,100,y);
    y += 42;
  }

  function canvasRows(arr){
    ctx.font = "17px Arial";
    for(const [label,value] of arr){
      if(!value) continue;

      ctx.fillStyle = "#777071";
      ctx.textAlign = "left";
      ctx.fillText(label,100,y);

      ctx.fillStyle = "#292425";
      ctx.textAlign = "right";
      ctx.fillText(String(value),W-100,y);

      ctx.textAlign = "left";
      ctx.strokeStyle = "#eee7e4";
      ctx.beginPath();
      ctx.moveTo(100,y+14);
      ctx.lineTo(W-100,y+14);
      ctx.stroke();

      y += 48;

      if(y > H-130) break;
    }

    y += 15;
  }
}

function drawImage(url,x,y,w,h,ctx){
  return new Promise(resolve => {
    const im = new Image();

    im.onload = () => {
      const r = Math.max(w/im.width,h/im.height);
      const nw = im.width*r;
      const nh = im.height*r;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x,y,w,h);
      ctx.clip();
      ctx.drawImage(
        im,
        x+(w-nw)/2,
        y+(h-nh)/2,
        nw,
        nh
      );
      ctx.restore();

      resolve();
    };

    im.src = url;
  });
}

function wrapCanvas(ctx,text,x,y,max,lh){
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";

  for(const w of words){
    const test = line ? line + " " + w : w;

    if(ctx.measureText(test).width > max && line){
      lines.push(line);
      line = w;
    }else{
      line = test;
    }
  }

  if(line) lines.push(line);

  for(const l of lines.slice(0,5)){
    ctx.fillText(l,x,y);
    y += lh;
  }
}

function toast(s){
  const t = $("toast");
  if(!t) return;

  t.textContent = s;
  t.style.display = "block";

  setTimeout(() => {
    t.style.display = "none";
  },2600);
}

const formIds = [
  "name","dob","time_of_birth","place_of_birth","height","religion",
  "caste","gotra","rashi","nakshatra","complexion","education",
  "profession","company","languages","hobbies","father",
  "father_occupation","mother","mother_occupation","siblings",
  "contact_person","city","phone","email","address","about"
];

formIds.forEach(id => {
  const el = $(id);
  if(!el) return;

  const saved = localStorage.getItem("vivah_" + id);

  if(saved !== null){
    el.value = saved;
  }

  el.addEventListener("input", () => {
    localStorage.setItem("vivah_" + id, el.value);
    updatePreview();
  });
});

$("photo")?.addEventListener("change",e => {
  const f = e.target.files[0];
  if(!f) return;

  const r = new FileReader();

  r.onload = () => {
    profileDataUrl = r.result;
    updatePreview();
  };

  r.readAsDataURL(f);
});

// ---------- Razorpay Premium Unlock ----------
const PREMIUM_PRICE_PAISE = 1900; // ₹19
const PREMIUM_UNLOCK_KEY = "vivah_premium_unlocked";
const PROFILE_ID_KEY = "vivah_profile_id";

function premiumUnlocked(){
  return localStorage.getItem(PREMIUM_UNLOCK_KEY) === "true";
}

function setPremiumUnlocked(){
  localStorage.setItem(PREMIUM_UNLOCK_KEY, "true");
}

function getProfileId(){
  return localStorage.getItem(PROFILE_ID_KEY) || "";
}

function setProfileId(id){
  if(id) localStorage.setItem(PROFILE_ID_KEY, id);
}

async function uploadProfilePhoto(profileId){
  if(!profileId || !profileDataUrl) return null;

  const response = await fetch("/api/upload-photo", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      profile_id: profileId,
      image_data: profileDataUrl
    })
  });

  const data = await response.json().catch(()=>({}));

  if(!response.ok || !data.success){
    throw new Error(data.error || "Photo upload failed");
  }

  return data.photoUrl || null;
}

async function startRazorpayPayment(){
  if(premiumUnlocked()){
    toast("Premium already unlocked. You can download now.");
    return true;
  }

  if(typeof Razorpay === "undefined"){
    toast("Payment system load nahi hua. Page refresh karke try karein.");
    return false;
  }

  const payBtn = $("payBtn");
  if(payBtn) {
    payBtn.disabled = true;
    payBtn.textContent = "Opening payment…";
  }

  try{
    const orderRes = await fetch("/api/create-order", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        amount: PREMIUM_PRICE_PAISE,

        profile: {
          name: safeValue("name"),
          date_of_birth: safeValue("dob"),
          time_of_birth: safeValue("time_of_birth"),
          place_of_birth: safeValue("place_of_birth"),

          height: safeValue("height"),
          religion: safeValue("religion"),
          caste: safeValue("caste"),
          gotra: safeValue("gotra"),
          rashi: safeValue("rashi"),
          nakshatra: safeValue("nakshatra"),
          complexion: safeValue("complexion"),

          education: safeValue("education"),
          profession: safeValue("profession"),
          company: safeValue("company"),

          languages: safeValue("languages"),
          hobbies: safeValue("hobbies"),

          father_name: safeValue("father"),
          father_occupation: safeValue("father_occupation"),

          mother_name: safeValue("mother"),
          mother_occupation: safeValue("mother_occupation"),

          siblings: safeValue("siblings"),

          contact_person: safeValue("contact_person"),
          phone: safeValue("phone"),
          email: safeValue("email"),
          city: safeValue("city"),
          address: safeValue("address"),

          about_me: safeValue("about"),

          template_id: templates[selected]?.[0] || "classic"
        }
      })
    });

    const orderData = await orderRes.json().catch(()=>({}));

    if(!orderRes.ok || !orderData.orderId || !orderData.keyId){
      throw new Error(orderData.error || "Unable to create payment order");
    }

    // create-order.js now creates/updates the profile before payment.
    // Keep the profile ID so the photo can be uploaded after successful payment.
    if(orderData.profileId){
      setProfileId(orderData.profileId);
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "VivahBio",
      description: "Premium Biodata Download",
      order_id: orderData.orderId,

      prefill: {
        name: val("name") === "—" ? "" : val("name"),
        contact: val("phone") === "—" ? "" : val("phone")
      },

      theme: {color:"#7b2036"},

      handler: async function(response){
        try{
          const verifyRes = await fetch("/api/verify-payment", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyRes.json().catch(()=>({}));

          if(!verifyRes.ok || !verifyData.verified){
            throw new Error(
              verifyData.error || "Payment verification failed"
            );
          }

          // Payment is verified first.
          setPremiumUnlocked();
          updatePremiumButtons();

          // Photo upload is separate from payment verification.
          // A photo upload failure must NOT turn a successful payment into
          // a payment failure.
          try{
            const profileId =
              getProfileId() ||
              orderData.profileId ||
              verifyData.profileId ||
              "";

            if(profileId && profileDataUrl){
              const photoUrl =
                await uploadProfilePhoto(profileId);

              if(photoUrl){
                toast("Payment successful! Photo saved. PDF/JPG unlocked.");
              }else{
                toast("Payment successful! PDF/JPG unlocked.");
              }
            }else{
              toast("Payment successful! PDF/JPG unlocked.");
            }
          }catch(photoError){
            console.error("photo upload:", photoError);
            toast(
              "Payment successful! PDF/JPG unlocked, but photo save failed."
            );
          }

        }catch(err){
          console.error(err);
          toast(
            "Payment hua, lekin verification fail hua. Please try again."
          );
        }finally{
          resetPayButton();
        }
      },

      modal: {
        ondismiss: function(){
          resetPayButton();
          toast("Payment cancelled.");
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function(){
      resetPayButton();
      toast("Payment failed. Please try again.");
    });

    rzp.open();
    return true;

  }catch(err){
    console.error(err);
    toast(err.message || "Payment start nahi ho paya.");
    resetPayButton();
    return false;
  }
}

function resetPayButton(){
  const payBtn = $("payBtn");

  if(payBtn){
    payBtn.disabled = false;

    payBtn.textContent =
      premiumUnlocked()
        ? "Premium Unlocked ✓"
        : "Unlock Premium ₹19";
  }
}

function updatePremiumButtons(){
  const unlocked = premiumUnlocked();

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

function requirePremium(action){
  if(premiumUnlocked()){
    action();
    return;
  }

  toast("Download ke liye pehle ₹19 Premium unlock karein.");
  startRazorpayPayment();
}

$("pdfBtn")?.addEventListener("click",()=>{
  requirePremium(()=>{
    localStorage.setItem(
      "vivah_downloads",
      +(localStorage.getItem("vivah_downloads")||0)+1
    );

    window.print();
  });
});

$("jpgBtn")?.addEventListener("click",async()=>{
  requirePremium(async()=>{
    await downloadJpg();

    localStorage.setItem(
      "vivah_downloads",
      +(localStorage.getItem("vivah_downloads")||0)+1
    );
  });
});

$("payBtn")?.addEventListener("click", startRazorpayPayment);
updatePremiumButtons();

document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderTemplates(b.dataset.filter)});
$("langBtn")?.addEventListener("click",()=>toast("Hindi/English UI toggle is ready; template text can be localized next."));
renderTemplates();renderMini();updatePreview();

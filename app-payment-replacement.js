// REPLACE the existing Razorpay Premium Unlock block in app.js
// starting at: "// ---------- Razorpay Premium Unlock ----------"
// and ending after the PDF/JPG click handlers.

const PREMIUM_PRICE_PAISE = 1900;
const PREMIUM_UNLOCK_KEY = "vivah_premium_unlocked";
const PAYMENT_ID_KEY = "vivah_payment_id";

function premiumUnlocked(){
  return localStorage.getItem(PREMIUM_UNLOCK_KEY) === "true";
}

function setPremiumUnlocked(paymentId){
  localStorage.setItem(PREMIUM_UNLOCK_KEY, "true");
  if(paymentId) localStorage.setItem(PAYMENT_ID_KEY, paymentId);
}

function getProfilePayload(){
  return {
    name: val("name") === "—" ? null : val("name"),
    date_of_birth: $("dob")?.value || null,
    height: $("height")?.value || null,
    religion: $("religion")?.value || null,
    caste: $("caste")?.value || null,
    education: $("education")?.value || null,
    profession: $("profession")?.value || null,
    company: $("company")?.value || null,
    father_name: $("father")?.value || null,
    mother_name: $("mother")?.value || null,
    city: $("city")?.value || null,
    phone: $("phone")?.value || null,
    about_me: $("about")?.value || null,
    template_id: templates[selected]?.[0] || "classic"
  };
}

async function logDownload(fileType){
  const paymentId = localStorage.getItem(PAYMENT_ID_KEY);
  if(!paymentId) return;

  try{
    await fetch("/api/log-download", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ payment_id: paymentId, file_type: fileType })
    });
  }catch(err){
    console.error("download log:", err);
  }
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
  if(payBtn){
    payBtn.disabled = true;
    payBtn.textContent = "Opening payment…";
  }

  try{
    const orderRes = await fetch("/api/create-order", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        amount: PREMIUM_PRICE_PAISE
      })
    });

    const orderData = await orderRes.json().catch(()=>({}));
    if(!orderRes.ok || !orderData.orderId || !orderData.keyId){
      throw new Error(orderData.error || "Unable to create payment order");
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
      theme:{color:"#7b2036"},

      handler: async function(response){
        try{
          const verifyRes = await fetch("/api/verify-payment", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              profile: getProfilePayload()
            })
          });

          const verifyData = await verifyRes.json().catch(()=>({}));

          if(!verifyRes.ok || !verifyData.verified){
            throw new Error(verifyData.error || "Payment verification failed");
          }

          setPremiumUnlocked(verifyData.paymentId);

          toast("Payment successful! PDF/JPG unlocked.");
          updatePremiumButtons();
        }catch(err){
          console.error(err);
          toast(err.message || "Payment verification failed.");
        }finally{
          resetPayButton();
        }
      },

      modal:{
        ondismiss:function(){
          resetPayButton();
          toast("Payment cancelled.");
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed",function(){
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
    payBtn.textContent = premiumUnlocked()
      ? "Premium Unlocked ✓"
      : "Unlock Premium ₹19";
  }
}

function updatePremiumButtons(){
  const unlocked = premiumUnlocked();

  if($("pdfBtn")){
    $("pdfBtn").textContent = unlocked
      ? "Download PDF"
      : "Unlock to Download PDF";
  }

  if($("jpgBtn")){
    $("jpgBtn").textContent = unlocked
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
  requirePremium(async()=>{
    localStorage.setItem(
      "vivah_downloads",
      +(localStorage.getItem("vivah_downloads") || 0) + 1
    );

    await logDownload("pdf");
    window.print();
  });
});

$("jpgBtn")?.addEventListener("click",async()=>{
  requirePremium(async()=>{
    await downloadJpg();

    localStorage.setItem(
      "vivah_downloads",
      +(localStorage.getItem("vivah_downloads") || 0) + 1
    );

    await logDownload("jpg");
  });
});

$("payBtn")?.addEventListener("click",startRazorpayPayment);

updatePremiumButtons();

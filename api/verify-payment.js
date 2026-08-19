const crypto=require("crypto");

async function supabase(path,options={}){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key) throw new Error("Supabase environment variables are missing.");

  const r=await fetch(`${url.replace(/\/$/,"")}/rest/v1/${path}`,{
    ...options,
    headers:{
      "Content-Type":"application/json",
      apikey:key,
      Authorization:`Bearer ${key}`,
      Prefer:"return=representation",
      ...(options.headers||{})
    }
  });
  const text=await r.text();
  let data=null;
  try{data=text?JSON.parse(text):null;}catch{}
  if(!r.ok) throw new Error(`Supabase ${r.status}: ${text}`);
  return data;
}

module.exports=async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({verified:false,error:"Method not allowed"});

  try{
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
    const orderId=String(body.razorpay_order_id||"");
    const paymentId=String(body.razorpay_payment_id||"");
    const signature=String(body.razorpay_signature||"");

    if(!orderId||!paymentId||!signature)
      return res.status(400).json({verified:false,error:"Missing Razorpay payment details."});

    const secret=process.env.RAZORPAY_KEY_SECRET;
    if(!secret) return res.status(500).json({verified:false,error:"Razorpay secret is missing."});

    const expected=crypto.createHmac("sha256",secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const a=Buffer.from(expected);
    const b=Buffer.from(signature);

    if(a.length!==b.length || !crypto.timingSafeEqual(a,b))
      return res.status(400).json({verified:false,error:"Invalid Razorpay signature."});

    const rows=await supabase(
      `payments?razorpay_order_id=eq.${encodeURIComponent(orderId)}&limit=1`,
      {
        method:"PATCH",
        body:JSON.stringify({
          razorpay_payment_id:paymentId,
          razorpay_signature:signature,
          status:"paid",
          paid_at:new Date().toISOString()
        })
      }
    );

    return res.status(200).json({
      verified:true,
      orderId,
      paymentId:rows?.[0]?.id||null,
      razorpayPaymentId:paymentId
    });
  }catch(e){
    console.error("verify-payment:",e);
    return res.status(500).json({verified:false,error:e.message||"Payment verification failed."});
  }
};

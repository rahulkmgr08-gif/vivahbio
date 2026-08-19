const Razorpay = require("razorpay");

function config(){
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if(!url || !key) throw new Error("Supabase environment variables are missing.");
  return {url:url.replace(/\/$/,""), key};
}

async function supabase(path, options={}){
  const {url,key}=config();
  const r=await fetch(`${url}/rest/v1/${path}`,{
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
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  try{
    const keyId=process.env.RAZORPAY_KEY_ID;
    const secret=process.env.RAZORPAY_KEY_SECRET;
    if(!keyId || !secret) return res.status(500).json({error:"Razorpay environment variables are missing."});

    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
    const amount=Number(body.amount||1900);
    if(amount!==1900) return res.status(400).json({error:"Invalid premium amount."});

    const p=body.profile||{};
    const rows=await supabase("profiles",{
      method:"POST",
      body:JSON.stringify({
        name:p.name||null,
        date_of_birth:p.date_of_birth||null,
        time_of_birth:p.time_of_birth||null,
        place_of_birth:p.place_of_birth||null,
        height:p.height||null,
        religion:p.religion||null,
        caste:p.caste||null,
        gotra:p.gotra||null,
        rashi:p.rashi||null,
        nakshatra:p.nakshatra||null,
        complexion:p.complexion||null,
        education:p.education||null,
        profession:p.profession||null,
        company:p.company||null,
        languages:p.languages||null,
        hobbies:p.hobbies||null,
        father_name:p.father_name||null,
        father_occupation:p.father_occupation||null,
        mother_name:p.mother_name||null,
        mother_occupation:p.mother_occupation||null,
        siblings:p.siblings||null,
        contact_person:p.contact_person||null,
        city:p.city||null,
        phone:p.phone||null,
        email:p.email||null,
        address:p.address||null,
        about_me:p.about_me||null,
        template_id:p.template_id||"classic"
      })
    });

    const profileId=rows?.[0]?.id||null;

    const razorpay=new Razorpay({key_id:keyId,key_secret:secret});
    const order=await razorpay.orders.create({
      amount,
      currency:"INR",
      receipt:`vivahbio_${Date.now()}`,
      notes:{product:"VivahBio Premium Download",profile_id:String(profileId||"")}
    });

    const payment=await supabase("payments",{
      method:"POST",
      body:JSON.stringify({
        profile_id:profileId,
        razorpay_order_id:order.id,
        amount:order.amount,
        currency:order.currency,
        status:"created"
      })
    });

    return res.status(200).json({
      keyId,
      orderId:order.id,
      amount:order.amount,
      currency:order.currency,
      paymentId:payment?.[0]?.id||null,
      profileId
    });
  }catch(e){
    console.error("create-order:",e);
    return res.status(500).json({error:e.message||"Could not create order."});
  }
};

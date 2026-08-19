async function supabase(path,options={}){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key) throw new Error("Supabase environment variables are not configured.");

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
  if(!r.ok) throw new Error(text||"Supabase request failed");
  return data;
}

module.exports=async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  try{
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
    const paymentId=String(body.payment_id||"");
    const fileType=String(body.file_type||"").toLowerCase();

    if(!paymentId || !["pdf","jpg"].includes(fileType))
      return res.status(400).json({error:"payment_id and valid file_type are required."});

    const payments=await supabase(
      `payments?select=id,profile_id,status&id=eq.${encodeURIComponent(paymentId)}&limit=1`,
      {method:"GET"}
    );

    if(!payments?.length || payments[0].status!=="paid")
      return res.status(403).json({error:"Paid payment required."});

    const row=await supabase("downloads",{
      method:"POST",
      body:JSON.stringify({
        profile_id:payments[0].profile_id||null,
        payment_id:payments[0].id,
        file_type:fileType
      })
    });

    return res.status(200).json({
      logged:true,
      downloadId:row?.[0]?.id||null
    });
  }catch(e){
    console.error("log-download:",e);
    return res.status(500).json({error:e.message||"Could not log download."});
  }
};

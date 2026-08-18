const defaultTemplates=[
["Elegant Gold","traditional","gold",false],["Modern Rose","modern","rose",false],["Royal Blue","royal","blue",false],["Sage Garden","floral","green",false],["Lavender Love","floral","purple",false],["Sunset Marigold","floral","orange",true],["Classic Cream","traditional","cream",true],["Red Heritage","traditional","red",true],["Minimal Pearl","modern","cream",true],["Midnight Royal","royal","blue",true],["Blush Bloom","floral","rose",true],["Temple Gold","traditional","gold",true],["Emerald Grace","royal","green",true],["Dusty Rose","modern","rose",true],["Regal Navy","royal","blue",true],["Peach Petals","floral","orange",true],["Vintage Ivory","traditional","cream",true],["Plum Elegance","royal","purple",true],["Garden Sage","floral","green",true],["Ruby Classic","traditional","red",true]
];
const $=id=>document.getElementById(id);
let selected=0, profileDataUrl="";

function getTemplates(){
  try { const x=JSON.parse(localStorage.getItem("vivah_templates")); if(Array.isArray(x)&&x.length) return x; } catch(e){}
  return defaultTemplates.slice();
}
let templates=getTemplates();

function saveTemplates(){localStorage.setItem("vivah_templates",JSON.stringify(templates));}
function artClass(i){return ["gold","rose","blue","green","purple","orange","cream","red"][i%8]}

function renderTemplates(filter="all"){
 const grid=$("templateGrid"); if(!grid)return; grid.innerHTML="";
 templates.forEach((t,i)=>{
   if(filter!=="all"&&t[1]!==filter)return;
   const card=document.createElement("div"); card.className="template-card";
   card.innerHTML=`<div class="template-art ${artClass(i)}"><div class="tp"></div><div class="tt">${escapeHtml(t[0])}</div><div class="tl"></div><div class="lines"></div></div><footer><b>${escapeHtml(t[0])}</b><small>${cap(t[1])} • ${t[3]?"Premium":"Free"}</small></footer>`;
   card.onclick=()=>selectTemplate(i); grid.appendChild(card);
 });
}
function renderMini(){
 const el=$("miniTemplates"); if(!el)return;
 el.innerHTML=templates.slice(0,8).map((t,i)=>`<button class="mini ${i===selected?'active':''}" data-i="${i}">${escapeHtml(t[0])}</button>`).join("");
 el.querySelectorAll(".mini").forEach(b=>b.onclick=()=>selectTemplate(+b.dataset.i));
}
function selectTemplate(i){
 selected=i; $("selectedName").textContent=templates[i][0]; renderMini();
 $("preview").className="bio-preview design-"+((i%3)+1); updatePreview();
}
function val(id){return $(id)?.value || "—";}
function updatePreview(){
 const p=$("preview"); if(!p)return;
 p.innerHTML=`<div class="bio-top">॥ श्री गणेशाय नमः ॥</div>
 <div class="bio-person"><div><small>MARRIAGE BIODATA</small><h2>${escapeHtml(val("name"))}</h2><p>${escapeHtml(val("profession"))}</p></div>
 <div class="profile"><img id="pimg"><span id="ph">PHOTO</span></div></div>
 <hr><h5>PERSONAL DETAILS</h5>
 <div class="bio-details"><div>Date of Birth <b>${escapeHtml(val("dob"))}</b></div><div>Height <b>${escapeHtml(val("height"))}</b></div>
 <div>Religion <b>${escapeHtml(val("religion"))}</b></div><div>Education <b>${escapeHtml(val("education"))}</b></div>
 <div>Caste <b>${escapeHtml(val("caste"))}</b></div><div>Company <b>${escapeHtml(val("company"))}</b></div></div>
 <h5>FAMILY DETAILS</h5><div class="bio-details"><div>Father <b>${escapeHtml(val("father"))}</b></div><div>Mother <b>${escapeHtml(val("mother"))}</b></div></div>
 <h5>ABOUT ME</h5><p class="bio-about">${escapeHtml(val("about"))}</p>
 <div class="bio-foot">📞 ${escapeHtml(val("phone"))} &nbsp; • &nbsp; 📍 ${escapeHtml(val("city"))}</div>`;
 if(profileDataUrl){$("pimg").src=profileDataUrl;$("pimg").style.display="block";$("ph").style.display="none";}
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function cap(s){return s? s[0].toUpperCase()+s.slice(1):s}

async function downloadJpg(){
 const W=1400,H=1980, c=document.createElement("canvas"),ctx=c.getContext("2d");
 c.width=W;c.height=H;
 ctx.fillStyle="#fffdfb";ctx.fillRect(0,0,W,H);
 const theme=[["#7b2036","#e2c785"],["#8f3150","#dca9b3"],["#23495f","#9db9c8"]][selected%3];
 ctx.strokeStyle=theme[1];ctx.lineWidth=24;ctx.strokeRect(36,36,W-72,H-72);
 ctx.fillStyle=theme[0];ctx.textAlign="center";ctx.font="26px Georgia";ctx.fillText("॥ श्री गणेशाय नमः ॥",W/2,105);
 ctx.font="bold 22px Arial";ctx.letterSpacing="6px";ctx.fillText("MARRIAGE BIODATA",W/2,175);
 ctx.textAlign="left";ctx.font="bold 52px Georgia";ctx.fillText(val("name"),100,265);
 ctx.font="22px Arial";ctx.fillStyle="#6f6565";ctx.fillText(val("profession"),100,305);
 if(profileDataUrl){
   await drawImage(profileDataUrl, W-330, 145, 190, 235, ctx);
 } else {
   ctx.fillStyle="#eee3df";ctx.fillRect(W-330,145,190,235);ctx.fillStyle="#999";ctx.font="18px Arial";ctx.textAlign="center";ctx.fillText("PHOTO",W-235,270);
 }
 ctx.strokeStyle=theme[1];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(100,350);ctx.lineTo(W-100,350);ctx.stroke();
 let y=415; section("PERSONAL DETAILS"); rows([
 ["Date of Birth",val("dob")],["Height",val("height")],["Religion",val("religion")],["Education",val("education")],
 ["Caste",val("caste")],["Company",val("company")]
 ]);
 section("FAMILY DETAILS");rows([["Father",val("father")],["Mother",val("mother")]]);
 section("ABOUT ME"); ctx.fillStyle="#4f4748";ctx.font="21px Arial";wrapCanvas(ctx,val("about"),100,y, W-200,32);
 y+=120;
 ctx.strokeStyle="#e8ddd8";ctx.beginPath();ctx.moveTo(100,y);ctx.lineTo(W-100,y);ctx.stroke();y+=55;
 ctx.fillStyle=theme[0];ctx.font="20px Arial";ctx.textAlign="left";ctx.fillText("☎ "+val("phone")+"    •    📍 "+val("city"),100,y);
 const a=document.createElement("a");a.download="vivahbio-marriage-biodata.jpg";a.href=c.toDataURL("image/jpeg",0.95);a.click();
 function section(title){ctx.fillStyle=theme[0];ctx.textAlign="left";ctx.font="bold 17px Arial";ctx.fillText(title,100,y);y+=45}
 function rows(arr){ctx.font="18px Arial";for(const [a,b] of arr){ctx.fillStyle="#7a7071";ctx.fillText(a,100,y);ctx.fillStyle="#292425";ctx.textAlign="right";ctx.fillText(b,W-100,y);ctx.textAlign="left";ctx.strokeStyle="#eee7e4";ctx.beginPath();ctx.moveTo(100,y+15);ctx.lineTo(W-100,y+15);ctx.stroke();y+=52}y+=18}
}
function drawImage(url,x,y,w,h,ctx){return new Promise(resolve=>{const im=new Image();im.onload=()=>{const r=Math.max(w/im.width,h/im.height),nw=im.width*r,nh=im.height*r;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(im,x+(w-nw)/2,y+(h-nh)/2,nw,nh);ctx.restore();resolve()};im.src=url})}
function wrapCanvas(ctx,text,x,y,max,lh){const words=String(text).split(/\s+/),lines=[];let line="";for(const w of words){const t=line?line+" "+w:w;if(ctx.measureText(t).width>max&&line){lines.push(line);line=w}else line=t}if(line)lines.push(line);for(const l of lines.slice(0,5)){ctx.fillText(l,x,y);y+=lh}}
function toast(s){const t=$("toast");if(!t)return;t.textContent=s;t.style.display="block";setTimeout(()=>t.style.display="none",2600)}

["name","dob","height","religion","caste","education","profession","company","father","mother","city","phone","about"].forEach(id=>{
 const el=$(id); if(!el)return;
 const saved=localStorage.getItem("vivah_"+id); if(saved!==null)el.value=saved;
 el.addEventListener("input",()=>{localStorage.setItem("vivah_"+id,el.value);updatePreview()});
});
$("photo")?.addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{profileDataUrl=r.result;updatePreview()};r.readAsDataURL(f)});
$("pdfBtn")?.addEventListener("click",()=>{localStorage.setItem("vivah_downloads",+(localStorage.getItem("vivah_downloads")||0)+1);window.print()});
$("jpgBtn")?.addEventListener("click",async()=>{await downloadJpg();localStorage.setItem("vivah_downloads",+(localStorage.getItem("vivah_downloads")||0)+1)});
$("payBtn")?.addEventListener("click",()=>toast("₹19 checkout demo: connect Razorpay Test Mode next."));
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderTemplates(b.dataset.filter)});
$("langBtn")?.addEventListener("click",()=>toast("Hindi/English UI toggle is ready; template text can be localized next."));
renderTemplates();renderMini();updatePreview();

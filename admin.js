let templates=JSON.parse(localStorage.getItem("vivah_templates")||"null")||[
["Elegant Gold","traditional","gold",false],["Modern Rose","modern","rose",false],["Royal Blue","royal","blue",false],["Sage Garden","floral","green",false],["Lavender Love","floral","purple",false],["Sunset Marigold","floral","orange",true],["Classic Cream","traditional","cream",true],["Red Heritage","traditional","red",true],["Minimal Pearl","modern","cream",true],["Midnight Royal","royal","blue",true],["Blush Bloom","floral","rose",true],["Temple Gold","traditional","gold",true],["Emerald Grace","royal","green",true],["Dusty Rose","modern","rose",true],["Regal Navy","royal","blue",true],["Peach Petals","floral","orange",true],["Vintage Ivory","traditional","cream",true],["Plum Elegance","royal","purple",true],["Garden Sage","floral","green",true],["Ruby Classic","traditional","red",true]
];
const $=id=>document.getElementById(id);
function save(){localStorage.setItem("vivah_templates",JSON.stringify(templates));}
function render(){
 $("aTemplates").textContent=templates.length;
 const t=$("adminTemplates");t.innerHTML="";
 templates.forEach((x,i)=>{
  const row=document.createElement("div");row.className="row";
  row.innerHTML=`<div>${String(i+1).padStart(2,"0")}</div><div><b>${esc(x[0])}</b><small style="display:block;color:#8b7d7f">${x[1]}</small></div><span>${x[3]?"Premium":"Free"}</span><div class="admin-actions"><button onclick="editName(${i})">Edit</button><button onclick="togglePremium(${i})">${x[3]?"Make Free":"Make Premium"}</button><button onclick="removeTemplate(${i})">Delete</button></div>`;
  t.appendChild(row);
 });
}
function editName(i){const n=prompt("Template name",templates[i][0]);if(n&&n.trim()){templates[i][0]=n.trim();save();render();}}
function togglePremium(i){templates[i][3]=!templates[i][3];save();render();}
function removeTemplate(i){if(templates.length<=1)return alert("Keep at least one template.");if(confirm("Delete this template?")){templates.splice(i,1);save();render();}}
$("addTemplate").onclick=()=>{const n=prompt("New template name","My New Design");if(n&&n.trim()){templates.push([n.trim(),"modern","rose",true]);save();render();}};
const settings=JSON.parse(localStorage.getItem("vivah_settings")||"{}");$("razorpayKey").value=settings.key||"";$("price").value=settings.price||19;
$("saveSetup").onclick=()=>{localStorage.setItem("vivah_settings",JSON.stringify({key:$("razorpayKey").value,price:$("price").value}));alert("Saved. Current premium price: ₹"+$("price").value);};
$("aDownloads").textContent=localStorage.getItem("vivah_downloads")||0;
$("resetDemo").onclick=()=>{if(confirm("Reset demo data?")){localStorage.clear();location.reload()}};
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
render();

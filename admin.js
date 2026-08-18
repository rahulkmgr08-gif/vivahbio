const templates=["Elegant Gold","Modern Rose","Royal Blue","Sage Garden","Lavender Love","Sunset Marigold","Classic Cream","Red Heritage","Minimal Pearl","Midnight Royal","Blush Bloom","Temple Gold","Emerald Grace","Dusty Rose","Regal Navy","Peach Petals","Vintage Ivory","Plum Elegance","Garden Sage","Ruby Classic"];
const table=document.getElementById("adminTemplates");
table.innerHTML=templates.map((n,i)=>`<div class="row"><div>${String(i+1).padStart(2,"0")}</div><b>${n}</b><span>${i<6?"Free":"Premium"}</span><button onclick="alert('Template editor placeholder — connect database for production.')">Edit</button></div>`).join("");
document.getElementById("aDownloads").textContent=localStorage.getItem("vivah_downloads")||0;
document.getElementById("aUsers").textContent=localStorage.getItem("vivah_users")||0;
const saved=JSON.parse(localStorage.getItem("vivah_settings")||"{}");document.getElementById("razorpayKey").value=saved.key||"";document.getElementById("price").value=saved.price||49;
document.getElementById("saveSetup").onclick=()=>{localStorage.setItem("vivah_settings",JSON.stringify({key:document.getElementById("razorpayKey").value,price:document.getElementById("price").value}));alert("Settings saved locally.");};
document.getElementById("addTemplate").onclick=()=>alert("Template upload UI is the next production step; this MVP includes 20 built-in templates.");

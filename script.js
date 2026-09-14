const KEY="stockify_inventory_v2", BACKUP_KEY="stockify_inventory_backup_v1";
let data=JSON.parse(localStorage.getItem(KEY)||"[]"), editingId=null, deferredPrompt=null;
const $=id=>document.getElementById(id);

function save(){localStorage.setItem(KEY,JSON.stringify(data));render();}
function showPage(id){document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));$(id).classList.remove("hidden");render();}
function openAdd(){showPage("form");resetForm();}
function resetForm(){editingId=null;$("formTitle").textContent="Tambah Inventaris";$("inventoryForm").reset();}
function esc(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

$("inventoryForm").addEventListener("submit",e=>{
 e.preventDefault();
 const item={id:editingId||Date.now().toString(),nama:$("nama").value.trim(),kode:$("kode").value.trim(),ruangan:$("ruangan").value.trim(),jumlah:Number($("jumlah").value),kondisi:$("kondisi").value};
 if(!item.nama||!item.kode||!item.ruangan||!Number.isInteger(item.jumlah)||item.jumlah<1)return alert("Lengkapi data dengan benar.");
 const duplicate=data.some(x=>x.kode.toLowerCase()===item.kode.toLowerCase()&&x.id!==item.id);
 if(duplicate)return alert("Kode inventaris sudah digunakan.");
 if(editingId)data=data.map(x=>x.id===editingId?item:x);else data.unshift(item);
 save();showPage("list");resetForm();
});

function editItem(id){const x=data.find(a=>a.id===id);if(!x)return;editingId=id;$("formTitle").textContent="Edit Inventaris";["nama","kode","ruangan","jumlah","kondisi"].forEach(k=>$(k).value=x[k]);showPage("form");}
function delItem(id){if(confirm("Apakah Anda yakin ingin menghapus data ini?")){data=data.filter(x=>x.id!==id);save();}}
function render(){
 const q=($("search")?.value||"").toLowerCase().trim(), room=$("filterRoom")?.value||"Semua", cond=$("filterCondition")?.value||"Semua";
 const total=data.reduce((s,x)=>s+x.jumlah,0), baik=data.filter(x=>x.kondisi==="Baik").reduce((s,x)=>s+x.jumlah,0), rr=data.filter(x=>x.kondisi==="Rusak Ringan").reduce((s,x)=>s+x.jumlah,0), rb=data.filter(x=>x.kondisi==="Rusak Berat").reduce((s,x)=>s+x.jumlah,0);
 $("total").textContent=total;$("baik").textContent=baik;$("rusak").textContent=rr+rb;$("statText").textContent=`${total} barang`;
 const rooms=["Semua",...new Set(data.map(x=>x.ruangan))], oldRoom=room;
 $("filterRoom").innerHTML=rooms.map(r=>`<option value="${esc(r)}">${esc(r==="Semua"?"Semua Ruangan":r)}</option>`).join("");
 $("filterRoom").value=rooms.includes(oldRoom)?oldRoom:"Semua";
 const pct=n=>total?Math.round(n/total*100):0;
 [["barBaik",baik],["barRR",rr],["barRB",rb]].forEach(([id,n])=>$(id).style.width=pct(n)+"%");
 $("pctBaik").textContent=pct(baik)+"%";$("pctRR").textContent=pct(rr)+"%";$("pctRB").textContent=pct(rb)+"%";
 const list=data.filter(x=>(!q||x.nama.toLowerCase().includes(q)||x.kode.toLowerCase().includes(q))&&($("filterRoom").value==="Semua"||x.ruangan===$("filterRoom").value)&&(cond==="Semua"||x.kondisi===cond));
 $("items").innerHTML=list.length?list.map(x=>`<article class="card"><div><h3>${esc(x.nama)}</h3><p><span class="badge">${esc(x.kondisi)}</span></p><p>Kode: <b>${esc(x.kode)}</b></p><p>Ruangan: ${esc(x.ruangan)} · Jumlah: ${x.jumlah}</p></div><div class="card-actions"><button class="edit" onclick="editItem('${esc(x.id)}')">✎ Edit</button><button class="delete" onclick="delItem('${esc(x.id)}')">🗑 Hapus</button></div></article>`).join(""):`<div class="panel empty">📦<br><b>Belum ada data inventaris</b><br><small>Tambahkan barang untuk mulai mengelola inventaris.</small></div>`;
}

["search","filterRoom","filterCondition"].forEach(id=>$(id).addEventListener("input",render));

$("darkBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("stockify_dark",document.body.classList.contains("dark"));};
if(localStorage.getItem("stockify_dark")==="true")document.body.classList.add("dark");

function download(filename,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"application/json"}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function exportData(){download(`stockify-inventaris-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({app:"Stockify",version:2,exportedAt:new Date().toISOString(),data},null,2));}
function backupData(){localStorage.setItem(BACKUP_KEY,JSON.stringify(data));alert("Backup LocalStorage berhasil disimpan.");}
function restoreData(){const b=localStorage.getItem(BACKUP_KEY);if(!b)return alert("Belum ada backup.");if(confirm("Pulihkan data dari backup terakhir?")){data=JSON.parse(b);save();alert("Data berhasil direstore.");}}
$("importFile").addEventListener("change",e=>{
 const file=e.target.files[0];if(!file)return;const r=new FileReader();
 r.onload=()=>{try{const obj=JSON.parse(r.result), incoming=Array.isArray(obj)?obj:obj.data;if(!Array.isArray(incoming))throw 0;
   if(confirm(`Import ${incoming.length} data inventaris? Data saat ini akan diganti.`)){data=incoming.map(x=>({id:String(x.id||Date.now()+Math.random()),nama:String(x.nama||""),kode:String(x.kode||""),ruangan:String(x.ruangan||""),jumlah:Number(x.jumlah||0),kondisi:["Baik","Rusak Ringan","Rusak Berat"].includes(x.kondisi)?x.kondisi:"Baik"})).filter(x=>x.nama&&x.kode&&x.ruangan&&x.jumlah>0);save();alert("Import berhasil.");}
 }catch(_){alert("File JSON tidak valid.");}e.target.value="";};r.readAsText(file);
});

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden");});
$("installBtn").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").classList.add("hidden");};
window.addEventListener("appinstalled",()=>{$("installBtn").classList.add("hidden");});

window.addEventListener("load",()=>{setTimeout(()=>{$("splash").style.display="none";render()},1800);});
if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js").catch(console.error);
render();

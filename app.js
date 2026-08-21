const D = window.VOLTER_DATA;
const KEY="volter40_parts_v1";
let state = JSON.parse(localStorage.getItem(KEY)||"null") || {parts:{}, annualHours:7200};

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function pstate(no){return state.parts[no] ||= {stock:0,reorder:1,lastIn:"",lastOut:"",location:""}}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

const views=["dashboard","parts","schedule","regular"];
function show(view){
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  document.getElementById(view).classList.add("active");
  document.querySelectorAll(".bottomnav button").forEach(x=>x.classList.toggle("navactive",x.dataset.view===view));
  window.scrollTo(0,0);
  if(view==="dashboard") renderDashboard();
  if(view==="parts") renderParts();
  if(view==="schedule") renderSchedule();
  if(view==="regular") renderRegular();
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{show(b.dataset.view);drawer.classList.remove("open")}));
menuBtn.onclick=()=>drawer.classList.add("open");
drawer.querySelector(".drawerbg").onclick=()=>drawer.classList.remove("open");

function counts(){
  const all=D.parts;
  countAll.textContent=all.length;
  countRegular.textContent=all.filter(p=>p.category==="定期交換品").length;
  countSpare.textContent=all.filter(p=>p.category==="常備予備品").length;
  countRepair.textContent=all.filter(p=>p.category==="故障・摩耗時のみ").length;
}
function renderDashboard(){
  counts();
  scheduleMini.innerHTML=D.schedule.slice(0,5).map(x=>`<div class="cycle"><small>${esc(x.label)}</small><b>${esc(x.hours)}h</b></div>`).join("");
  const alerts=D.parts.filter(p=>p.category!=="故障・摩耗時のみ").map(p=>[p,pstate(p.partNo)]).filter(([p,s])=>s.stock<=s.reorder).slice(0,6);
  alertsEl = document.getElementById("alerts");
  alertsEl.innerHTML=alerts.length?alerts.map(([p,s])=>`<div class="alert"><div><b>${esc(p.name)}</b><div class="meta">${esc(p.partNo)}</div></div><span class="badge red">在庫 ${s.stock} / 発注点 ${s.reorder}</span></div>`).join(""):`<div class="empty">発注アラートはありません。</div>`;
}
document.querySelectorAll(".stat").forEach(b=>b.onclick=()=>{show("parts");category.value=b.dataset.filter==="all"?"all":b.dataset.filter;renderParts()});

function partCard(p){
  const s=pstate(p.partNo), alert=s.stock<=s.reorder;
  return `<article class="partcard">
    <div class="parttop"><div><div class="partname">${esc(p.name)}</div><div class="partno">${esc(p.partNo)}</div></div><span class="badge ${alert?"red":""}">${esc(p.category)}</span></div>
    <div class="meta">${p.sourceName?esc(p.sourceName):""}${p.page?`　資料p.${esc(p.page)}`:""}</div>
    <div class="stockgrid">
      <div><label>現在庫</label><input id="stock-${css(p.partNo)}" type="number" min="0" value="${s.stock}"></div>
      <div><label>発注点</label><input id="reorder-${css(p.partNo)}" type="number" min="0" value="${s.reorder}"></div>
      <div><label>最終入庫</label><input id="in-${css(p.partNo)}" type="date" value="${s.lastIn}"></div>
      <div><label>最終交換</label><input id="out-${css(p.partNo)}" type="date" value="${s.lastOut}"></div>
    </div>
    <div class="stockgrid">
      <div style="grid-column:1/3"><label>保管場所</label><input id="loc-${css(p.partNo)}" value="${esc(s.location)}" placeholder="例：倉庫A-03"></div>
      <div><label>発注必要数</label><input disabled value="${Math.max(0,s.reorder-s.stock)}"></div>
      <div class="actions"><button class="savebtn" onclick="savePart('${esc(p.partNo)}')">保存</button></div>
    </div>
    <div class="actions"><button class="textbtn" onclick="detail('${esc(p.partNo)}')">詳細を見る →</button></div>
  </article>`;
}
function css(s){return String(s).replace(/[^a-zA-Z0-9_-]/g,"_")}
function savePart(no){
  const id=css(no),s=pstate(no);
  s.stock=Number(document.getElementById("stock-"+id).value||0);
  s.reorder=Number(document.getElementById("reorder-"+id).value||0);
  s.lastIn=document.getElementById("in-"+id).value;
  s.lastOut=document.getElementById("out-"+id).value;
  s.location=document.getElementById("loc-"+id).value;
  save(); renderParts(); renderDashboard();
}
function renderParts(){
  const q=(search.value||"").toLowerCase(), cat=category.value;
  let arr=D.parts.filter(p=>(cat==="all"||p.category===cat)&&[p.name,p.partNo,p.sourceName].join(" ").toLowerCase().includes(q));
  partsList.innerHTML=arr.length?arr.map(partCard).join(""):`<div class="empty">該当する部品がありません。</div>`;
}
search.oninput=renderParts; category.onchange=renderParts;

function regularAnnual(r){
  const h=state.annualHours||7200;
  const interval=Number(r.interval), base=Number(r.stockBase);
  if(!interval || !base || Number.isNaN(interval) || Number.isNaN(base)) return null;
  return Math.floor(h/interval)*base;
}
function renderRegular(){
  regularList.innerHTML=D.regular.map(r=>{
    const n=regularAnnual(r);
    const annualText=n===null?"—":`${n}${r.unit&&r.unit!=="—"?r.unit:""}`;
    return `<div class="partcard"><div class="parttop"><div><div class="partname">${esc(r.name)}</div><div class="partno">${esc(r.partNo)}</div></div><span class="badge">定期交換</span></div><div class="meta">${esc(r.spec)}　/　${r.interval?esc(r.interval)+"h":"補充・状態管理"}　/　年間予定 ${annualText}</div><div class="meta">${esc(r.note)}</div></div>`;
  }).join("");
}
function renderSchedule(){
  const h=Number(annualHours.value||7200);
  state.annualHours=h; save();
  scheduleList.innerHTML=D.schedule.map(x=>{
    const n=x.hours?Math.floor(h/x.hours):0;
    return `<div class="schedulecard"><div class="hours">${esc(x.hours)}h</div><h3>${esc(x.label)}　— ${n}回/年の目安</h3><p>${esc(x.tasks)}</p><p style="margin-top:7px">${esc(x.note)}</p></div>`;
  }).join("");
}
annualHours.oninput=renderSchedule;

function detail(no){
  const p=D.parts.find(x=>x.partNo===no),s=pstate(no);
  modalContent.innerHTML=`<div class="detail"><div class="eyebrow">PART DETAIL</div><h2>${esc(p.name)}</h2><div class="code">${esc(p.partNo)}</div>
  <div class="detailrow"><b>管理分類</b><span>${esc(p.category)}</span></div>
  <div class="detailrow"><b>原資料表記</b><span>${esc(p.sourceName)}</span></div>
  <div class="detailrow"><b>構成数量</b><span>${esc(p.qty)}</span></div>
  <div class="detailrow"><b>資料ページ</b><span>${esc(p.page)}</span></div>
  <div class="detailrow"><b>現在庫</b><span>${s.stock}</span></div>
  <div class="detailrow"><b>発注点</b><span>${s.reorder}</span></div>
  <div class="detailrow"><b>保管場所</b><span>${esc(s.location)||"未登録"}</span></div>
  <p class="meta">${esc(p.note)}</p></div>`;
  modal.classList.add("open");
}
modalClose.onclick=()=>modal.classList.remove("open");
document.querySelector(".modalbg").onclick=()=>modal.classList.remove("open");

exportBtn.onclick=()=>{
  const rows=[["管理分類","Volter品番","部品名","原資料表記","構成数量","現在庫","発注点","発注必要数","最終入庫日","最終交換日","保管場所"]];
  D.parts.forEach(p=>{let s=pstate(p.partNo);rows.push([p.category,p.partNo,p.name,p.sourceName,p.qty,s.stock,s.reorder,Math.max(0,s.reorder-s.stock),s.lastIn,s.lastOut,s.location])});
  const csv="\uFEFF"+rows.map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="Volter_部品在庫.csv";a.click();
};

backupBtn.onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Volter_部品管理バックアップ.json";a.click();
};
restoreInput.onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();location.reload()}catch{alert("バックアップファイルを読み込めませんでした。")}};r.readAsText(f);
};
resetBtn.onclick=()=>{if(confirm("この端末に保存した在庫・発注点などを初期化します。よろしいですか？")){localStorage.removeItem(KEY);location.reload()}};

renderDashboard();
show("dashboard");

const D = window.VOLTER_DATA;
const KEY="volter40_parts_v2";
let state = JSON.parse(localStorage.getItem(KEY)||"null") || {parts:{}, annualHours:7200, logs:[]};
if(!Array.isArray(state.logs)) state.logs=[];

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function pstate(no){return state.parts[no] ||= {stock:0,reorder:1,lastIn:"",lastOut:"",location:""}}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

const views=["dashboard","parts","schedule","regular","logs"];
function show(view){
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  document.getElementById(view).classList.add("active");
  document.querySelectorAll(".bottomnav button").forEach(x=>x.classList.toggle("navactive",x.dataset.view===view));
  window.scrollTo(0,0);
  if(view==="dashboard") renderDashboard();
  if(view==="parts") renderParts();
  if(view==="schedule") renderSchedule();
  if(view==="regular") renderRegular();
  if(view==="logs") renderLogs();
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
  scheduleList.innerHTML=D.schedule.map((x,i)=>{
    const n=x.hours?Math.floor(h/x.hours):0;
    const pct=x.hours?Math.min(100,Math.round(((h%x.hours)/x.hours)*100)):0;
    return `<div class="schedulecard"><div class="scheduletop"><div class="hours">${esc(x.hours)}<span>h</span></div><div class="freq">${n}<span>回/年の目安</span></div></div><h3>${esc(x.label)}</h3><div class="gauge"><div class="gaugefill" style="width:${pct}%"></div></div><p>${esc(x.tasks)}</p><p class="schedulenote">${esc(x.note)}</p><div class="actions"><button class="smallbtn logbtn" data-stage="${i}">📝 点検を記録</button></div></div>`;
  }).join("");
  scheduleList.querySelectorAll(".logbtn").forEach(b=>b.onclick=()=>openLogModal(Number(b.dataset.stage)));
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

/* ---- 点検記録 ---- */
const searchSource=(()=>{
  const seen=new Set(); const out=[];
  [...D.regular,...D.parts].forEach(p=>{
    if(p.partNo==="—"||seen.has(p.partNo)) return;
    seen.add(p.partNo); out.push({partNo:p.partNo,name:p.name});
  });
  return out;
})();
let logDraftParts=[];
function openLogModal(stageIdx){
  const st=D.schedule[stageIdx];
  logDraftParts=[];
  const today=new Date().toISOString().slice(0,10);
  modalContent.innerHTML=`<div class="detail">
    <div class="eyebrow">INSPECTION LOG</div>
    <h2>${esc(st.label)}</h2>
    <div class="code">${esc(st.hours)}h ステージ点検</div>
    <div class="detailrow"><b>実施日</b><span><input id="logDate" type="date" value="${today}"></span></div>
    <h3 style="margin:16px 0 8px">点検項目</h3>
    <div id="logChecklist">${st.checklist.map((item,i)=>`<label class="checkrow"><input type="checkbox" data-idx="${i}" checked><span>${esc(item)}</span></label>`).join("")||'<p class="meta">個別項目の登録なし</p>'}</div>
    <h3 style="margin:16px 0 8px">交換・使用した部品</h3>
    <div id="logPartsRows"></div>
    <div class="partsearchwrap">
      <input id="logPartSearch" type="search" placeholder="部品名・品番で検索して追加" autocomplete="off">
      <div id="logPartResults" class="searchresults"></div>
    </div>
    <h3 style="margin:16px 0 8px">備考</h3>
    <textarea id="logNote" rows="3" placeholder="気づいた点、次回への申し送りなど"></textarea>
    <div class="buttonrow" style="margin-top:16px">
      <button id="logSaveBtn" class="primary">記録を保存</button>
    </div>
  </div>`;
  const resultsBox=document.getElementById("logPartResults");
  const rowsBox=document.getElementById("logPartsRows");
  function renderDraftRows(){
    rowsBox.innerHTML=logDraftParts.map((r,i)=>`<div class="partrow"><div class="partrowname">${esc(r.name)}<span class="partno">${esc(r.partNo)}</span></div><input type="number" min="1" value="${r.qty}" data-i="${i}" class="qtyinput"><button data-i="${i}" class="rmbtn">×</button></div>`).join("");
    rowsBox.querySelectorAll(".qtyinput").forEach(el=>el.onchange=()=>{logDraftParts[Number(el.dataset.i)].qty=Number(el.value)||1;});
    rowsBox.querySelectorAll(".rmbtn").forEach(el=>el.onclick=()=>{logDraftParts.splice(Number(el.dataset.i),1);renderDraftRows();});
  }
  document.getElementById("logPartSearch").oninput=(e)=>{
    const q=e.target.value.trim().toLowerCase();
    if(!q){resultsBox.innerHTML="";return;}
    const hits=searchSource.filter(p=>p.name.toLowerCase().includes(q)||p.partNo.toLowerCase().includes(q)).slice(0,8);
    resultsBox.innerHTML=hits.map(p=>`<button class="resultitem" data-no="${esc(p.partNo)}">${esc(p.name)} <span class="partno">${esc(p.partNo)}</span></button>`).join("")||'<div class="meta" style="padding:8px">該当なし</div>';
    resultsBox.querySelectorAll(".resultitem").forEach(btn=>btn.onclick=()=>{
      const p=searchSource.find(x=>x.partNo===btn.dataset.no);
      const exist=logDraftParts.find(r=>r.partNo===p.partNo);
      if(exist) exist.qty+=1; else logDraftParts.push({partNo:p.partNo,name:p.name,qty:1});
      renderDraftRows();
      document.getElementById("logPartSearch").value="";resultsBox.innerHTML="";
    });
  };
  document.getElementById("logSaveBtn").onclick=()=>{
    const checks=[...document.querySelectorAll("#logChecklist input[type=checkbox]")].map((c,i)=>({item:st.checklist[i],checked:c.checked}));
    const entry={
      id:Date.now(),stage:st.stage,label:st.label,hours:st.hours,
      date:document.getElementById("logDate").value||today,
      checklist:checks,parts:logDraftParts.slice(),
      note:document.getElementById("logNote").value.trim(),
    };
    state.logs.unshift(entry); save();
    modal.classList.remove("open");
    if(document.getElementById("logs").classList.contains("active")) renderLogs();
  };
  modal.classList.add("open");
}

function renderLogs(){
  if(!state.logs.length){ logsList.innerHTML='<div class="empty">まだ点検記録がありません。「点検スケジュール」の各カードから「点検を記録」で登録できます。</div>'; return; }
  logsList.innerHTML=state.logs.map(l=>{
    const doneCount=l.checklist.filter(c=>c.checked).length;
    const partsText=l.parts.length?l.parts.map(p=>`${esc(p.name)}×${p.qty}`).join("、"):"なし";
    return `<div class="partcard logcard">
      <div class="parttop"><div><div class="partname">${esc(l.label)}</div><div class="partno">${esc(l.date)}　${esc(l.hours)}h相当</div></div><span class="badge">${doneCount}/${l.checklist.length}項目完了</span></div>
      <div class="meta"><b>交換・使用部品：</b>${partsText}</div>
      ${l.note?`<div class="meta"><b>備考：</b>${esc(l.note)}</div>`:""}
      <div class="actions"><button class="smallbtn dangerbtn" data-id="${l.id}">削除</button></div>
    </div>`;
  }).join("");
  logsList.querySelectorAll("button[data-id]").forEach(b=>b.onclick=()=>{
    if(!confirm("この点検記録を削除しますか？")) return;
    state.logs=state.logs.filter(l=>l.id!==Number(b.dataset.id));
    save(); renderLogs();
  });
}

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
const dataSourceEl=document.getElementById('dataSource');
if(dataSourceEl && D.source) dataSourceEl.textContent="出典: "+D.source;

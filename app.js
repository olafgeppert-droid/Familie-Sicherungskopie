// Familienringe – AES-verschlüsselt, Suche, Nachträgliche Partneranlage, Drucken (Tabelle/Baum), große Undo/Redo
const STORAGE_KEY = "familyRingVault_v1"; // verschlüsseltes JSON
let people = [];
let currentPassword = null;
let undoStack = []; let redoStack = [];
let currentFilter = "";

// ---- Seed (einfacher PartnerCode, kein Mehrfach-Partner) ----
const seed = [
  {Code:"1",   Name:"Olaf Geppert",    BirthDate:"13.01.1965", BirthPlace:"Chemnitz", Gender:"m", ParentCode:"", PartnerCode:"1x", Inherited:false, InheritedFromCode:"", Note:"Stammvater"},
  {Code:"1x",  Name:"Irina Geppert",   BirthDate:"13.01.1970", BirthPlace:"Berlin",   Gender:"w", ParentCode:"", PartnerCode:"1",  Inherited:false, InheritedFromCode:"", Note:"Ehefrau von Olaf"},
  {Code:"1A",  Name:"Mario Geppert",   BirthDate:"28.04.1995", BirthPlace:"Berlin",   Gender:"m", ParentCode:"1", PartnerCode:"1Ax", Inherited:false, InheritedFromCode:"", Note:"1. Sohn"},
  {Code:"1Ax", Name:"Kim",             BirthDate:"",           BirthPlace:"",         Gender:"w", ParentCode:"", PartnerCode:"1A",  Inherited:false, InheritedFromCode:"", Note:"Partnerin von Mario"},
  {Code:"1B",  Name:"Nicolas Geppert", BirthDate:"04.12.2000", BirthPlace:"Berlin",   Gender:"m", ParentCode:"1", PartnerCode:"1Bx", Inherited:false, InheritedFromCode:"", Note:"2. Sohn"},
  {Code:"1Bx", Name:"Annika",          BirthDate:"",           BirthPlace:"",         Gender:"w", ParentCode:"", PartnerCode:"1B",  Inherited:false, InheritedFromCode:"", Note:"Partnerin von Nicolas"},
  {Code:"1C",  Name:"Julienne Geppert",BirthDate:"26.09.2002", BirthPlace:"Berlin",   Gender:"w", ParentCode:"1", PartnerCode:"1Cx", Inherited:false, InheritedFromCode:"", Note:"Tochter"},
  {Code:"1Cx", Name:"Jonas",           BirthDate:"",           BirthPlace:"",         Gender:"m", ParentCode:"", PartnerCode:"1C",  Inherited:false, InheritedFromCode:"", Note:"Partner von Julienne"}
];

// ---------------- WebCrypto Helpers ----------------
async function deriveKey(password, saltB64){
  const enc = new TextEncoder();
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), c => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name:"PBKDF2", salt, iterations:120000, hash:"SHA-256" },
    keyMaterial,
    { name:"AES-GCM", length:256 },
    false,
    ["encrypt","decrypt"]
  );
  return {key, salt};
}
function b64FromBytes(bytes){ return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function bytesFromB64(b64){ return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }
async function encryptData(obj, password){
  const {key, salt} = await deriveKey(password, null);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, data);
  return { salt: b64FromBytes(salt), iv: b64FromBytes(iv), data: b64FromBytes(ct) };
}
async function decryptData(payload, password){
  const {key} = await deriveKey(password, payload.salt);
  const iv = bytesFromB64(payload.iv);
  const ct = bytesFromB64(payload.data);
  const pt = await crypto.subtle.decrypt({name:"AES-GCM", iv}, key, ct);
  const txt = new TextDecoder().decode(pt);
  return JSON.parse(txt);
}

// ---------------- Persistenz ----------------
function safeGetItem(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function safeSetItem(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

async function loadVault(password){
  const raw = safeGetItem(STORAGE_KEY);
  if(!raw){
    const payload = await encryptData({people: seed}, password);
    safeSetItem(STORAGE_KEY, JSON.stringify(payload));
    return seed.slice();
  }
  try{
    const payload = JSON.parse(raw);
    const data = await decryptData(payload, password);
    return (data.people||[]).map(migrateToSinglePartner);
  }catch(err){
    throw new Error("bad-password");
  }
}
async function saveVault(){
  if(!currentPassword) throw new Error("Kein Passwort im RAM");
  const payload = await encryptData({people}, currentPassword);
  safeSetItem(STORAGE_KEY, JSON.stringify(payload));
}

// ---------------- Login ----------------
const btnLogin = document.getElementById("btnLogin");
const pwdInput = document.getElementById("pwd");
const loginOverlay = document.getElementById("loginOverlay");
const loginMsg = document.getElementById("loginMsg");

if(btnLogin){
  const doLogin = async () => {
    const v = (pwdInput.value || "").trim();
    if(!v){ loginMsg.textContent = "Bitte Passwort eingeben."; pwdInput.focus(); return; }
    try{
      const loaded = await loadVault(v);
      currentPassword = v;
      people = loaded;
      loginOverlay.style.display = "none";
      renderAll();
    }catch(err){
      pwdInput.value = ""; // leeren bei falschem Passwort
      loginMsg.textContent = "Falsches Passwort.";
      pwdInput.focus();
    }
  };
  btnLogin.addEventListener("click", doLogin);
  if(pwdInput){
    pwdInput.addEventListener("keydown", (ev)=>{
      if(ev.key === "Enter"){ ev.preventDefault(); btnLogin.click(); }
    });
  }
}

// ---------------- Undo/Redo ----------------
function snapshot(){ return JSON.stringify(people); }
function pushUndo(){ undoStack.push(snapshot()); if(undoStack.length>50) undoStack.shift(); redoStack.length=0; }
function canUndo(){ return undoStack.length>0; }
function canRedo(){ return redoStack.length>0; }
function doUndo(){ if(!canUndo()) return; redoStack.push(snapshot()); people = JSON.parse(undoStack.pop()); renderAll(); }
function doRedo(){ if(!canRedo()) return; undoStack.push(snapshot()); people = JSON.parse(redoStack.pop()); renderAll(); }

document.getElementById('btnUndo').onclick = doUndo;
document.getElementById('btnRedo').onclick = doRedo;

// ---------------- Helpers ----------------
function migrateToSinglePartner(p){
  const q = {...p};
  if(Array.isArray(q.Partners) && q.Partners.length>0) q.PartnerCode = q.Partners[0];
  delete q.Partners; delete q.Separated; delete q.Divorced;
  return q;
}
function inferGeneration(code){
  if(!code) return 0;
  const digits = (code.match(/[0-9]/g)||[]).length;
  return digits + Math.max(0, (code.replace(/[0-9x]/g,'').length));
}
function byCode(code){ return people.find(p=>p.Code===code); }
function genOf(p){ return inferGeneration(p.Code); }
function sortPeople(){ people.sort((a,b)=> a.Code.localeCompare(b.Code)); }
function generatePartnerCode(code){ return code + "x"; }

// ---------------- Suche ----------------
const txtSearch = document.getElementById("txtSearch");
if(txtSearch){
  txtSearch.addEventListener("input", ()=>{
    currentFilter = (txtSearch.value||"").trim().toLowerCase();
    renderTable();
  });
}
function matchesFilter(p){
  if(!currentFilter) return true;
  const hay = [p.Code,p.Name,p.BirthDate,p.BirthPlace,p.Gender,p.ParentCode,p.PartnerCode,p.InheritedFromCode,p.Note].map(x=> (x||'').toLowerCase()).join(" ");
  return hay.includes(currentFilter);
}
function hl(text){
  if(!currentFilter || !text) return text||"";
  const re = new RegExp("(" + currentFilter.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + ")", "ig");
  return (text+"").replace(re, "<mark class='hl'>$1</mark>");
}

// ---------------- Tabelle ----------------
const tblBody = document.querySelector("#peopleTable tbody");
function renderTable(){
  tblBody.innerHTML = "";
  sortPeople();
  for(const p of people){
    if(!matchesFilter(p)) continue;
    const tr = document.createElement("tr");
    const gen = genOf(p);
    tr.innerHTML = `
      <td>${hl(p.Code)}</td>
      <td>${hl(p.Name||"")}</td>
      <td>${hl(p.BirthDate||"")}</td>
      <td>${hl(p.BirthPlace||"")}</td>
      <td>${hl(p.Gender||"")}</td>
      <td>${gen}</td>
      <td>${hl(p.ParentCode||"")}</td>
      <td>${hl(p.PartnerCode||"")}</td>
      <td>${p.Inherited?"ja":"nein"}</td>
      <td>${hl(p.InheritedFromCode||"")}</td>
      <td>${hl(p.Note||"")}</td>
      <td class="no-print">
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">🗑️</button>
        ${!p.PartnerCode?'<button class="partner-btn">➕ Partner</button>':''}
      </td>
    `;
    tr.querySelector(".edit-btn").onclick = ()=> openEdit(p.Code);
    tr.querySelector(".delete-btn").onclick = ()=> { if(confirm("Wirklich löschen?")){ pushUndo(); people = people.filter(x=>x.Code!==p.Code); saveVault(); renderAll(); } };
    const pb = tr.querySelector(".partner-btn");
    if(pb){ pb.onclick = ()=> createPartnerFor(p.Code); }
    tblBody.appendChild(tr);
  }
}

// ---------------- Partner nachträglich anlegen ----------------
async function createPartnerFor(code){
  const p = byCode(code);
  if(!p) return;
  if(p.PartnerCode){ alert("Partner bereits vorhanden."); return; }
  const newCode = generatePartnerCode(p.Code);
  if(people.some(x=>x.Code===newCode)){ alert("Automatischer Partnercode existiert bereits."); return; }
  pushUndo();
  p.PartnerCode = newCode;
  people.push({
    Code:newCode, Name:"", BirthDate:"", BirthPlace:"", Gender:"", ParentCode:"",
    PartnerCode: p.Code, Inherited:false, InheritedFromCode:"", Note:""
  });
  await saveVault();
  renderAll();
}

// ---------------- Bearbeiten ----------------
const dlgEdit = document.getElementById("dlgEdit");
const frmEdit = document.getElementById("frmEdit");
let editCode = null;

function openEdit(code){
  const p = {...byCode(code)};
  editCode = code;
  frmEdit.code.value = p.Code;
  frmEdit.name.value = p.Name||"";
  frmEdit.birthDate.value = p.BirthDate||"";
  frmEdit.birthPlace.value = p.BirthPlace||"";
  frmEdit.gender.value = p.Gender||"";
  frmEdit.parentCode.value = p.ParentCode||"";
  frmEdit.partnerCode.value = p.PartnerCode||"";
  frmEdit.inherited.value = p.Inherited ? "ja" : "nein";
  frmEdit.inheritedFrom.value = p.InheritedFromCode||"";
  frmEdit.note.value = p.Note||"";
  clearValidation();
  dlgEdit.showModal();
}

document.getElementById("btnAddTop").onclick = ()=>{
  editCode = null;
  frmEdit.reset();
  clearValidation();
  dlgEdit.showModal();
};

function clearValidation(){
  for(const el of frmEdit.querySelectorAll("[name]")) el.dataset.invalid = "false";
}
function validateForm(){
  let ok = true, msgs = [];
  const code = frmEdit.code.value.trim();
  const name = frmEdit.name.value.trim();
  const date = frmEdit.birthDate.value.trim();
  if(!code){ ok=false; frmEdit.code.dataset.invalid="true"; msgs.push("Code ist Pflicht."); }
  if(!name){ ok=false; frmEdit.name.dataset.invalid="true"; msgs.push("Name ist Pflicht."); }
  if(date && !/^\d{2}\.\d{2}\.\d{4}$/.test(date)){ ok=false; frmEdit.birthDate.dataset.invalid="true"; msgs.push("Datum bitte als TT.MM.JJJJ eingeben."); }
  if(!ok) alert("Bitte prüfen:\n• " + msgs.join("\n• "));
  return ok;
}
frmEdit.addEventListener("submit", async (ev)=>{
  ev.preventDefault();
  clearValidation();
  if(!validateForm()) return;
  const obj = {
    Code: frmEdit.code.value.trim(),
    Name: frmEdit.name.value.trim(),
    BirthDate: frmEdit.birthDate.value.trim(),
    BirthPlace: frmEdit.birthPlace.value.trim(),
    Gender: frmEdit.gender.value,
    ParentCode: frmEdit.parentCode.value.trim(),
    PartnerCode: frmEdit.partnerCode.value.trim(),
    Inherited: frmEdit.inherited.value==="ja",
    InheritedFromCode: frmEdit.inheritedFrom.value.trim(),
    Note: frmEdit.note.value.trim()
  };
  pushUndo();
  // Referenzen aktualisieren, falls Code geändert
  if(editCode && editCode!==obj.Code){
    for(const p of people){
      if(p.ParentCode===editCode) p.ParentCode = obj.Code;
      if(p.PartnerCode===editCode) p.PartnerCode = obj.Code;
    }
  }
  if(editCode){
    const i = people.findIndex(p=>p.Code===editCode);
    if(i>=0) people[i]=obj;
  }else{
    if(people.some(p=>p.Code===obj.Code)){ alert("Code existiert bereits."); return; }
    people.push(obj);
  }
  await saveVault();
  dlgEdit.close();
  renderAll();
});

// ---------------- Stammbaum (vertikal, einfacher Partner) ----------------
function groupByGeneration(){
  const gmap = new Map();
  for(const p of people){
    const g = genOf(p);
    if(!gmap.has(g)) gmap.set(g, []);
    gmap.get(g).push(p);
  }
  const gens = Array.from(gmap.keys()).sort((a,b)=>a-b);
  return gens.map(g=>({g, items: gmap.get(g).sort((a,b)=>a.Code.localeCompare(b.Code))}));
}
function personTooltip(p){
  const lines = [
    `Code: ${p.Code}`,
    `Name: ${p.Name||"-"}`,
    p.BirthDate? `Geboren: ${p.BirthDate}`:"",
    p.BirthPlace? `Ort: ${p.BirthPlace}`:"",
    p.Gender? `Geschlecht: ${p.Gender}`:"",
    p.ParentCode? `Eltern: ${p.ParentCode}`:"",
    p.PartnerCode? `Partner: ${p.PartnerCode}`:"",
    p.Inherited? `Geerbt von: ${p.InheritedFromCode||"-"}`:"",
    p.Note? `Notiz: ${p.Note}`:""
  ].filter(Boolean);
  return lines.join("\n");
}
function renderTree(){
  const host = document.getElementById("treeContainer");
  host.innerHTML = "";
  const gens = groupByGeneration();
  gens.forEach((row,i)=>{
    const div = document.createElement("div");
    div.className = `gen-row gen-${i%4}`;
    const label = document.createElement("div");
    label.className = "meta";
    label.style.minWidth = "110px";
    label.innerHTML = `<b>Generation ${row.g}</b>`;
    div.appendChild(label);
    row.items.forEach(p=>{
      const el = document.createElement("div");
      el.className = "person";
      el.dataset.tooltip = personTooltip(p);
      el.innerHTML = `
        <div class="code">${p.Code}</div>
        <div class="name">${p.Name||""} ${(p.Inherited?'<span class="badge inh" title="vererbt">vererbt</span>':"")}</div>
        <div class="meta">${p.PartnerCode?`Partner: ${p.PartnerCode}`:""}</div>
      `;
      div.appendChild(el);
    });
    host.appendChild(div);
  });
}

// ---------------- Statistiken ----------------
function buildStats(){
  const gens = groupByGeneration();
  const personsPerGen = gens.map(r=>({ Generation: r.g, Anzahl: r.items.length }));
  const inheritedCount = people.filter(p=>p.Inherited).length;
  return { personsPerGen, inheritedCount };
}
function renderStatsDialog(){
  const d = document.getElementById("dlgStats");
  const c = document.getElementById("statsContent");
  const s = buildStats();
  const lines = [];
  lines.push(`<h4>Anzahl Personen pro Generation</h4>`);
  lines.push(`<ul>${s.personsPerGen.map(x=>`<li>Generation ${x.Generation}: <b>${x.Anzahl}</b></li>`).join("")}</ul>`);
  lines.push(`<h4>Vererbungsstatistik</h4>`);
  lines.push(`<p>Personen mit Vererbung: <b>${s.inheritedCount}</b></p>`);
  c.innerHTML = lines.join("");
  d.showModal();
}
document.getElementById("btnStats").onclick = renderStatsDialog;
document.getElementById("btnStatsPrint").onclick = ()=>{ window.print(); };

// ---------------- Export / Import ----------------
const dlgExport = document.getElementById("dlgExport");
document.getElementById("btnExport").onclick = ()=> dlgExport.showModal();
document.getElementById("btnImport").onclick = ()=> document.getElementById("dlgImport").showModal();

function pickExportFmt(){ return (document.querySelector('input[name="exfmt"]:checked')||{}).value || "json"; }
function downloadBlob(blob, filename){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function toCsv(rows){ return rows.map(r=> r.map(v=> {
  const s = (v==null?"":String(v)).replace(/"/g,'""');
  return `"${s}"`;
}).join(",")).join("\n"); }
function asTableRows(){
  const header=['Personen-Code','Name','Geburtsdatum','Geburtsort','Geschlecht','Generation','Eltern-Code','Partner-Code','Vererbt','Geerbt von','Kommentar'];
  const rows = [header];
  for(const p of people){
    rows.push([p.Code,p.Name||'',p.BirthDate||'',p.BirthPlace||'',p.Gender||'', genOf(p), p.ParentCode||'', p.PartnerCode||'', p.Inherited?'ja':'nein', p.InheritedFromCode||'', p.Note||'']);
  }
  return rows;
}
async function exportNow(save=true, share=false){
  const fmt = pickExportFmt();
  if(fmt==="json"){
    const blob = new Blob([JSON.stringify(people, null, 2)], {type:"application/json"});
    if(share && navigator.share && navigator.canShare && navigator.canShare({files:[new File([blob],"familienringe_export.json",{type:"application/json"})]})){
      const file = new File([blob], "familienringe_export.json", {type:"application/json"});
      await navigator.share({ files:[file], title:"Familienringe", text:"Export (JSON)"});
    }else if(save){
      downloadBlob(blob, "familienringe_export.json");
    }
  }else if(fmt==="csv"){
    const csv = toCsv(asTableRows());
    const blob = new Blob([csv], {type:"text/csv"});
    if(share && navigator.share && navigator.canShare && navigator.canShare({files:[new File([blob],"familienringe_export.csv",{type:"text/csv"})]})){
      const file = new File([blob], "familienringe_export.csv", {type:"text/csv"});
      await navigator.share({ files:[file], title:"Familienringe", text:"Export (CSV)"});
    }else if(save){
      downloadBlob(blob, "familienringe_export.csv");
    }
  }else if(fmt==="pdf"){
    window.print();
  }
  dlgExport.close();
}
document.getElementById("btnExportSaveAs").onclick = ()=> exportNow(true,false);
document.getElementById("btnExportShare").onclick = ()=> exportNow(false,true);

// Import
document.getElementById("fileImport").addEventListener("change", async (ev)=>{
  const file = ev.target.files[0];
  if(!file) return;
  const text = await file.text();
  pushUndo();
  const lower = file.name.toLowerCase();
  if(lower.endsWith(".csv") || (file.type||"").includes("csv")){
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.map(l=> l.split(",").map(s=> s.replace(/^"|"$/g,"").replace(/""/g,'"')));
    const header = rows.shift().map(h=>h.trim().toLowerCase());
    const idx = (name)=> header.findIndex(h=>h.includes(name));
    const out = [];
    for(const r of rows){
      const p = {
        Code: r[idx("personen")],
        Name: r[idx("name")],
        BirthDate: r[idx("geburtsdatum")],
        BirthPlace: r[idx("geburtsort")],
        Gender: r[idx("geschlecht")],
        ParentCode: r[idx("eltern")],
        PartnerCode: r[idx("partner")],
        Inherited: (r[idx("vererbt")]||"").toLowerCase().includes("ja"),
        InheritedFromCode: r[idx("geerbt")],
        Note: r[idx("kommentar")]
      };
      out.push(p);
    }
    people = out;
  }else{
    people = JSON.parse(text).map(migrateToSinglePartner);
  }
  await saveVault();
  renderAll();
  ev.target.value = "";
});

// ---------------- Drucken (Tabelle/Baum gezielt) ----------------
document.getElementById("btnPrintTable").onclick = ()=>{
  document.body.classList.add("print-table-only");
  window.print();
  setTimeout(()=> document.body.classList.remove("print-table-only"), 300);
};
document.getElementById("btnPrintTree").onclick = ()=>{
  document.body.classList.add("print-tree-only");
  window.print();
  setTimeout(()=> document.body.classList.remove("print-tree-only"), 300);
};

// ---------------- UI & Sonstiges ----------------
function renderAll(){ renderTable(); renderTree(); updateUndoRedoButtons(); }
function updateUndoRedoButtons(){
  const bu=document.getElementById("btnUndo"), br=document.getElementById("btnRedo");
  if(bu) bu.disabled=!canUndo();
  if(br) br.disabled=!canRedo();
}
document.getElementById("btnRefreshTree").onclick = renderTree;

// Erste Render (nach Login)
if(!document.getElementById("loginOverlay") || document.getElementById("loginOverlay").style.display==="none"){
  renderAll();
}

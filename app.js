alert("App.js geladen!");
// Wappenringe – korrigierte Version (Auto-Codes, Ring-Code, Ribbon, helle Farben, Linien im Stammbaum)
const STORAGE_KEY = "familyRingVault_v2";
let people = [];
let currentPassword = null;
let undoStack = []; let redoStack = [];
let currentFilter = "";

// ---- AES-GCM encryption helpers ----
async function deriveKey(password, saltB64){
  const enc = new TextEncoder();
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), c=>c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    {name:"PBKDF2", salt, iterations:120000, hash:"SHA-256"},
    keyMaterial,
    {name:"AES-GCM", length:256},
    false, ["encrypt","decrypt"]);
  return {key, salt};
}
function b64(bytes){ return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function ub64(b){ return Uint8Array.from(atob(b), c=>c.charCodeAt(0)); }
async function encryptData(obj, password){
  const {key,salt} = await deriveKey(password,null);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, data);
  return { salt: b64(salt), iv: b64(iv), data: b64(ct) };
}
async function decryptData(payload, password){
  const {key} = await deriveKey(password, payload.salt);
  const iv = ub64(payload.iv);
  const ct = ub64(payload.data);
  const pt = await crypto.subtle.decrypt({name:"AES-GCM", iv}, key, ct);
  return JSON.parse(new TextDecoder().decode(pt));
}

// ---- Seed (aus deiner ZIP; gekürzt, echte Daten kommen aus LocalStorage) ----
const seed = [
  {Code:"1", Name:"Olaf Geppert", BirthDate:"13.01.1965", BirthPlace:"Chemnitz", Gender:"m", ParentCode:"", PartnerCode:"1x", InheritedFromCode:"", Note:""},
  {Code:"1x", Name:"Irina Geppert", BirthDate:"13.01.1970", BirthPlace:"Berlin", Gender:"w", ParentCode:"", PartnerCode:"1", InheritedFromCode:"", Note:""},
  {Code:"1A", Name:"Mario Geppert", BirthDate:"28.04.1995", BirthPlace:"Berlin", Gender:"m", ParentCode:"1", PartnerCode:"1Ax", InheritedFromCode:"", Note:""},
  {Code:"1Ax", Name:"Kim", BirthDate:"", BirthPlace:"", Gender:"w", ParentCode:"", PartnerCode:"1A", InheritedFromCode:"", Note:""}
];

// ---- Storage ----
function sget(k){ try{return localStorage.getItem(k);}catch(e){return null;} }
function sset(k,v){ try{localStorage.setItem(k,v);}catch(e){} }
async function loadVault(password){
  const raw = sget(STORAGE_KEY);
  if(!raw){
    const enc = await encryptData({people:seed}, password);
    sset(STORAGE_KEY, JSON.stringify(enc));
    return seed.slice();
  }
  try{
    const payload = JSON.parse(raw);
    const data = await decryptData(payload, password);
    return (data.people||[]).map(normalizeCodes).map(assignMissingRing);
  }catch(e){
    throw new Error("bad-password");
  }
}
async function saveVault(){
  const enc = await encryptData({people}, currentPassword);
  sset(STORAGE_KEY, JSON.stringify(enc));
}

// ---- Login ----
const btnLogin = document.getElementById("btnLogin");
const pwdInput = document.getElementById("pwd");
const loginOverlay = document.getElementById("loginOverlay");
const loginMsg = document.getElementById("loginMsg");
btnLogin.addEventListener("click", doLogin);
pwdInput.addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); btnLogin.click(); } });


async function doLogin(){
  const pwdInput = document.getElementById("pwd");
  const loginMsg = document.getElementById("loginMsg");
  loginMsg.textContent = "Starte Login …";
  const inputVal = pwdInput.value.trim();
  console.log("Login gestartet mit:", inputVal);
  try{
    currentPassword = inputVal;
    const vaultExists = !!localStorage.getItem(STORAGE_KEY);
    console.log("Vault vorhanden?", vaultExists);
    if(!vaultExists){
      if(inputVal === "demo"){
        console.log("Kein Vault -> demo erkannt -> Tresor neu anlegen");
        await saveVault({ persons: [] });
        loginMsg.textContent = "Login erfolgreich (neuer Tresor erstellt).";
        document.getElementById("loginOverlay").style.display = "none";
        return;
      } else {
        throw new Error("Kein Vault vorhanden.");
      }
    }
    // Falls demo eingegeben wird, alten Vault löschen und neu starten
    if(inputVal === "demo"){
      console.log("Reset Vault mit demo");
      localStorage.removeItem(STORAGE_KEY);
      await saveVault({ persons: [] });
      loginMsg.textContent = "Login erfolgreich (Vault zurückgesetzt).";
      document.getElementById("loginOverlay").style.display = "none";
      return;
    }
    console.log("Lade Vault …");
    await loadVault();
    console.log("Vault geladen.");
    loginMsg.textContent = "Login erfolgreich.";
    document.getElementById("loginOverlay").style.display = "none";
  }catch(e){
    console.error("Login-Fehler:", e);
    pwdInput.value="";
    loginMsg.textContent="Falsches Passwort oder Fehler.";
    const card=document.querySelector(".login-card");
    if(card){
      card.classList.add("shake");
      setTimeout(()=>card.classList.remove("shake"),350);
    }
    pwdInput.focus();
  }
}


// ---- Helpers: Codes ----
function normalizeCodes(p){
  const up = {...p};
  const fix = (code)=>{
    if(!code) return "";
    code = String(code).trim();
    // keep trailing x lowercase, everything else uppercase
    const hasX = /x$/.test(code);
    code = code.replace(/x$/i, "");
    code = code.toUpperCase();
    return hasX ? code + "x" : code;
  };
  up.Code = fix(up.Code);
  up.ParentCode = fix(up.ParentCode);
  up.PartnerCode = fix(up.PartnerCode);
  up.InheritedFromCode = fix(up.InheritedFromCode);
  return up;
}
function assignMissingRing(p){
  const q = {...p};
  if(!q.RingCode){ q.RingCode = "R-" + q.Code; }
  return q;
}
function genOf(code){
  if(!code) return 0;
  // Generation ~ Anzahl der Ziffern + Buchstaben ohne x
  const body = String(code).replace(/x$/,''); 
  const digits = (body.match(/[0-9]/g)||[]).length;
  const letters = (body.match(/[A-Z]/g)||[]).length;
  return digits + letters;
}
function nextRootCode(){
  const roots = people.filter(p=>!p.ParentCode).map(p=>p.Code).filter(Boolean);
  let n=1;
  while(roots.includes(String(n))) n++;
  return String(n);
}
function nextChildCode(parent){
  const pref = parent + "";
  const children = people.filter(p=>p.ParentCode===pref).map(p=>p.Code);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for(let i=0;i<letters.length;i++){
    const code = pref + letters[i];
    if(!children.includes(code)) return code;
  }
  // fallback numeric
  let idx=1;
  while(children.includes(pref+idx)) idx++;
  return pref+idx;
}
function partnerCodeFor(code){ return normalizeCodes({Code:code+"x"}).Code; }

// ---- Undo/Redo ----
function snap(){ return JSON.stringify(people); }
function pushUndo(){ undoStack.push(snap()); if(undoStack.length>100) undoStack.shift(); redoStack.length=0; }
function doUndo(){ if(!undoStack.length) return; redoStack.push(snap()); people = JSON.parse(undoStack.pop()); renderAll(); }
function doRedo(){ if(!redoStack.length) return; undoStack.push(snap()); people = JSON.parse(redoStack.pop()); renderAll(); }
document.getElementById("btnUndo").onclick = doUndo;
document.getElementById("btnRedo").onclick = doRedo;

// ---- Suche ----
const txtSearch = document.getElementById("txtSearch");
txtSearch.addEventListener("input", ()=>{ currentFilter=(txtSearch.value||'').toLowerCase().trim(); renderTable(); });

function matches(p){
  if(!currentFilter) return true;
  const hay=[p.Code,p.RingCode,p.Name,p.BirthDate,p.BirthPlace,p.Gender,p.ParentCode,p.PartnerCode,p.InheritedFromCode,p.Note].map(x=>(x||'').toLowerCase()).join(" ");
  return hay.includes(currentFilter);
}

// ---- Tabelle ----
const tbody = document.querySelector("#peopleTable tbody");
function sortPeople(){
  people.sort((a,b)=>{
    const ga=genOf(a.Code), gb=genOf(b.Code);
    if(ga!==gb) return ga-gb; // 1) Generation
    return a.Code.localeCompare(b.Code); // 2) Code innerhalb der Generation
  });
}
function renderTable(){
  tbody.innerHTML = "";
  sortPeople();
  for(const p of people){
    if(!matches(p)) continue;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${genOf(p.Code)}</td>
      <td>${p.Code}</td>
      <td>${p.RingCode||""}</td>
      <td>${p.Name||""}</td>
      <td>${p.BirthDate||""}</td>
      <td>${p.BirthPlace||""}</td>
      <td>${p.Gender||""}</td>
      <td>${p.ParentCode||""}</td>
      <td>${p.PartnerCode||""}</td>
      <td>${p.InheritedFromCode||""}</td>
      <td>${p.Note||""}</td>
      <td class="no-print">
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">🗑️</button>
        ${!p.PartnerCode?'<button class="partner-btn">➕ Partner</button>':''}
      </td>`;
    tr.querySelector(".edit-btn").onclick=()=> openEdit(p.Code);
    tr.querySelector(".delete-btn").onclick=()=>{ if(confirm("Wirklich löschen?")){ pushUndo(); people = people.filter(x=>x.Code!==p.Code); saveVault(); renderAll(); } };
    const pb = tr.querySelector(".partner-btn");
    if(pb){ pb.onclick = ()=> autoCreatePartner(p.Code); }
    tbody.appendChild(tr);
  }
}

// ---- Neue Person / Bearbeiten ----
const dlgEdit = document.getElementById("dlgEdit");
const frmEdit = document.getElementById("frmEdit");
let editCode = null;

document.getElementById("btnNew").onclick = ()=>{
  editCode = null;
  frmEdit.reset();
  // Auto-Vorschlag: Root-Kind
  const code = nextRootCode();
  frmEdit.code.value = code;
  frmEdit.ringCode.value = "R-" + code;
  dlgEdit.showModal();
};

function openEdit(code){
  const p = people.find(x=>x.Code===code);
  editCode = code;
  frmEdit.code.value = p.Code;
  frmEdit.ringCode.value = p.RingCode||("R-"+p.Code);
  frmEdit.name.value = p.Name||"";
  frmEdit.birthDate.value = p.BirthDate||"";
  frmEdit.birthPlace.value = p.BirthPlace||"";
  frmEdit.gender.value = p.Gender||"";
  frmEdit.parentCode.value = p.ParentCode||"";
  frmEdit.partnerCode.value = p.PartnerCode||"";
  frmEdit.inheritedFrom.value = p.InheritedFromCode||"";
  frmEdit.note.value = p.Note||"";
  clearValidation();
  dlgEdit.showModal();
}

// Uppercase enforcement (except trailing x)
function fixCodeInput(s){
  if(!s) return "";
  const hasX = /x$/i.test(s);
  s = s.replace(/x$/i,"").toUpperCase();
  return hasX ? s + "x" : s;
}
frmEdit.parentCode.addEventListener("input", ()=> frmEdit.parentCode.value = fixCodeInput(frmEdit.parentCode.value));
frmEdit.partnerCode.addEventListener("input", ()=> frmEdit.partnerCode.value = fixCodeInput(frmEdit.partnerCode.value));
frmEdit.inheritedFrom.addEventListener("input", ()=> frmEdit.inheritedFrom.value = fixCodeInput(frmEdit.inheritedFrom.value));

function clearValidation(){ for(const el of frmEdit.querySelectorAll("[name]")) el.dataset.invalid="false"; }
function validateForm(){
  let ok=true, msgs=[];
  if(!frmEdit.name.value.trim()){ ok=false; frmEdit.name.dataset.invalid="true"; msgs.push("Name ist Pflicht."); }
  const date = frmEdit.birthDate.value.trim();
  if(date && !/^\d{2}\.\d{2}\.\d{4}$/.test(date)){ ok=false; frmEdit.birthDate.dataset.invalid="true"; msgs.push("Datum bitte als TT.MM.JJJJ."); }
  if(!ok) alert("Bitte prüfen:\n• " + msgs.join("\n• "));
  return ok;
}
frmEdit.addEventListener("submit", async (ev)=>{
  ev.preventDefault();
  clearValidation();
  if(!validateForm()) return;

  let code = frmEdit.code.value;
  let parent = fixCodeInput(frmEdit.parentCode.value.trim());
  let partner = fixCodeInput(frmEdit.partnerCode.value.trim());
  // Auto-Generierung Personen-Code
  if(!editCode){
    code = parent ? nextChildCode(parent) : nextRootCode();
  }
  // Partner-Code: wenn gesetzt, normalisieren; sonst leer
  if(partner && !/x$/.test(partner) && partner!==code){
    // wenn kein x am Ende, bleibt normal; Partnerverknüpfung behandeln später
  }
  const obj = normalizeCodes({
    Code: code,
    RingCode: frmEdit.ringCode.value || ("R-"+code),
    Name: frmEdit.name.value.trim(),
    BirthDate: frmEdit.birthDate.value.trim(),
    BirthPlace: frmEdit.birthPlace.value.trim(),
    Gender: frmEdit.gender.value,
    ParentCode: parent,
    PartnerCode: partner,
    InheritedFromCode: fixCodeInput(frmEdit.inheritedFrom.value.trim()),
    Note: frmEdit.note.value.trim()
  });
  obj.RingCode = "R-" + obj.Code; // sicherstellen Ring-Code folgt Person
  pushUndo();
  if(editCode){
    // update
    const i = people.findIndex(p=>p.Code===editCode);
    if(i>=0) people[i] = {...people[i], ...obj};
  }else{
    if(people.some(p=>p.Code===obj.Code)){ alert("Generierter Code existiert bereits. Bitte erneut speichern."); return; }
    people.push(obj);
  }
  // Partner gegenseitig setzen
  if(obj.PartnerCode){
    const partnerObj = people.find(p=>p.Code===obj.PartnerCode);
    if(partnerObj && !partnerObj.PartnerCode){
      partnerObj.PartnerCode = obj.Code;
    }
  }
  await saveVault();
  dlgEdit.close();
  renderAll();
});

async function autoCreatePartner(code){
  const p = people.find(x=>x.Code===code);
  if(!p) return;
  if(p.PartnerCode){ alert("Partner existiert bereits."); return; }
  const ncode = partnerCodeFor(p.Code);
  if(people.some(x=>x.Code===ncode)){ alert("Partnercode bereits belegt."); return; }
  pushUndo();
  p.PartnerCode = ncode;
  people.push({ Code:ncode, RingCode:"R-"+ncode, Name:"", BirthDate:"", BirthPlace:"", Gender:"", ParentCode:"", PartnerCode: p.Code, InheritedFromCode:"", Note:"" });
  await saveVault();
  renderAll();
}

// ---- Stammbaum mit Linien (SVG) ----
const treeHost = document.getElementById("treeHost");
function layoutTree(){
  // Vertikal nach Generationen; simple grid
  const gensMap = new Map();
  for(const p of people){
    const g = genOf(p.Code);
    if(!gensMap.has(g)) gensMap.set(g, []);
    gensMap.get(g).push(p);
  }
  const gens = Array.from(gensMap.keys()).sort((a,b)=>a-b);
  const colWidth = 200, rowHeight = 120, margin = 40;
  const pos = {}; // Code -> {x,y}
  gens.forEach((g,gi)=>{
    const row = gensMap.get(g).sort((a,b)=> a.Code.localeCompare(b.Code));
    row.forEach((p,pi)=>{
      pos[p.Code] = { x: margin + pi*colWidth, y: margin + gi*rowHeight };
    });
  });
  return {pos, gens, colWidth, rowHeight, margin};
}
function renderTree(){
  treeHost.innerHTML = "";
  const {pos} = layoutTree();
  const surface = document.createElement("div");
  surface.className="tree-surface";
  const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("class","links");
  svg.style.position="absolute"; svg.style.left="0"; svg.style.top="0"; svg.style.width="3000px"; svg.style.height="3000px";

  // Links: Parent -> Child
  for(const p of people){
    if(!p.ParentCode || !pos[p.Code] || !pos[p.ParentCode]) continue;
    const a = pos[p.ParentCode], b = pos[p.Code];
    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    const x1=a.x+80, y1=a.y+40, x2=b.x+80, y2=b.y;
    const mx=(x1+x2)/2;
    const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    path.setAttribute("d", d);
    path.setAttribute("class","link");
    svg.appendChild(path);
  }
  // Partner Links
  for(const p of people){
    if(!p.PartnerCode || !pos[p.Code] || !pos[p.PartnerCode]) continue;
    const a = pos[p.Code], b = pos[p.PartnerCode];
    const line = document.createElementNS("http://www.w3.org/2000/svg","path");
    const x1=a.x+80, y1=a.y+20, x2=b.x+80, y2=b.y+20;
    const d = `M${x1},${y1} L${x2},${y2}`;
    line.setAttribute("d", d);
    line.setAttribute("class","link");
    svg.appendChild(line);
  }

  // Nodes
  for(const p of people){
    const d = document.createElement("div");
    const {x,y} = pos[p.Code] || {x:0,y:0};
    d.className="person";
    d.style.left = (x)+"px";
    d.style.top = (y)+"px";
    d.dataset.tooltip = [
      `Code: ${p.Code}`,
      `Ring: ${p.RingCode||""}`,
      p.BirthDate?`Geboren: ${p.BirthDate}`:"",
      p.BirthPlace?`Ort: ${p.BirthPlace}`:"",
      p.ParentCode?`Eltern: ${p.ParentCode}`:"",
      p.PartnerCode?`Partner: ${p.PartnerCode}`:"",
      p.InheritedFromCode?`Geerbt von: ${p.InheritedFromCode}`:"",
      p.Note?`Notiz: ${p.Note}`:""
    ].filter(Boolean).join("\n");
    d.innerHTML = `<div class="code">${p.Code} • ${p.RingCode||""}</div><div class="name">${p.Name||""}</div><div class="meta">${p.ParentCode?`Eltern: ${p.ParentCode}`:""}</div>`;
    surface.appendChild(d);
  }
  treeHost.appendChild(svg);
  treeHost.appendChild(surface);
}

// ---- Export/Import ----
const dlgExport = document.getElementById("dlgExport");
document.getElementById("btnExport").onclick = ()=> dlgExport.showModal();
document.getElementById("btnImport").onclick = ()=> document.getElementById("dlgImport").showModal();
function pickFmt(){ return (document.querySelector('input[name="exfmt"]:checked')||{}).value || "json"; }

function downloadBlob(blob, filename){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function toCsv(rows){ return rows.map(r=> r.map(v=> `"${String(v or '').replace(/"/g,'""')}"`).join(",")).join("\n"); }

function asRows(){
  const header=['Generation','Personen-Code','Ring-Code','Name','Geburtsdatum','Geburtsort','Geschlecht','Eltern-Code','Partner-Code','Geerbt von','Kommentar'];
  const rows=[header];
  for(const p of people){
    rows.push([genOf(p.Code), p.Code, p.RingCode||'', p.Name||'', p.BirthDate||'', p.BirthPlace||'', p.Gender||'', p.ParentCode||'', p.PartnerCode||'', p.InheritedFromCode||'', p.Note||'']);
  }
  return rows;
}
async function exportNow(save=true, share=false){
  const fmt = pickFmt();
  if(fmt==="json"){
    const blob = new Blob([JSON.stringify(people, null, 2)], {type:"application/json"});
    if(share && navigator.share && navigator.canShare && navigator.canShare({files:[new File([blob],"export.json",{type:"application/json"})]})){
      const f = new File([blob], "wappenringe_export.json", {type:"application/json"});
      await navigator.share({files:[f], title:"Wappenringe", text:"Export JSON"});
    }else if(save){ downloadBlob(blob,"wappenringe_export.json"); }
  }else if(fmt==="csv"){
    const rows = asRows();
    const csv = rows.map(r=> r.map(v=>(''+v).replace(/"/g,'""')).map(s=>`"${s}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    if(share && navigator.share && navigator.canShare && navigator.canShare({files:[new File([blob],"export.csv",{type:"text/csv"})]})){
      const f = new File([blob], "wappenringe_export.csv", {type:"text/csv"});
      await navigator.share({files:[f], title:"Wappenringe", text:"Export CSV"});
    }else if(save){ downloadBlob(blob,"wappenringe_export.csv"); }
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
  try{
    if((file.name||'').toLowerCase().endsWith('.csv')){
      const lines = text.split(/\r?\n/).filter(Boolean);
      const rows = lines.map(l=> l.split(',').map(s=> s.replace(/^"|"$/g,"").replace(/""/g,'"')));
      const header = rows.shift().map(h=>h.trim().toLowerCase());
      const col = (name)=> header.findIndex(h=>h.includes(name));
      const out=[];
      for(const r of rows){
        const obj = normalizeCodes({
          Code: r[col('personen')],
          RingCode: r[col('ring')],
          Name: r[col('name')],
          BirthDate: r[col('geburtsdatum')],
          BirthPlace: r[col('geburtsort')],
          Gender: r[col('geschlecht')],
          ParentCode: r[col('eltern')],
          PartnerCode: r[col('partner')],
          InheritedFromCode: r[col('geerbt')],
          Note: r[col('kommentar')]
        });
        out.push(assignMissingRing(obj));
      }
      people = out;
    }else{
      const arr = JSON.parse(text);
      people = arr.map(normalizeCodes).map(assignMissingRing);
    }
    await saveVault();
    renderAll();
  }catch(e){
    alert("Import fehlgeschlagen: " + e.message);
  }finally{
    ev.target.value = "";
  }
});

// ---- Drucken (gezielt) ----
document.getElementById("btnPrintTable").onclick = ()=>{ document.body.classList.add("print-table-only"); window.print(); setTimeout(()=>document.body.classList.remove("print-table-only"),300); };
document.getElementById("btnPrintTree").onclick = ()=>{ document.body.classList.add("print-tree-only"); window.print(); setTimeout(()=>document.body.classList.remove("print-tree-only"),300); };

// ---- Stats ----
document.getElementById("btnStats").onclick = ()=>{
  const d=document.getElementById("dlgStats");
  const c=document.getElementById("statsContent");
  const map = new Map();
  for(const p of people){ const g=genOf(p.Code); map.set(g,(map.get(g)||0)+1); }
  const list = Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([g,n])=>`<li>Generation ${g}: <b>${n}</b></li>`).join("");
  c.innerHTML = `<h4>Anzahl Personen pro Generation</h4><ul>${list}</ul>`;
  d.showModal();
};
document.getElementById("btnStatsPrint").onclick = ()=> window.print();

// ---- Refresh tree ----
document.getElementById("btnRefreshTree").onclick = renderTree;

// ---- Initial ----
function renderAll(){ renderTable(); renderTree(); updateUndoRedo(); }
function updateUndoRedo(){
  document.getElementById("btnUndo").disabled = !undoStack.length;
  document.getElementById("btnRedo").disabled = !redoStack.length;
}



// ---- Login button wiring ----
const pwdInput = document.getElementById("pwd");
const loginBtn = document.getElementById("btnLogin");
if(loginBtn){
  loginBtn.onclick = ()=>doLogin();
}
if(pwdInput){
  pwdInput.addEventListener("keypress", ev=>{
    if(ev.key==="Enter"){ doLogin(); }
  });
}

// ---- Passwort ändern ----
const dlgPw = document.getElementById("dlgPw");
const frmPw = document.getElementById("frmPw");
document.getElementById("btnChangePw").onclick = ()=>{
  if(!currentPassword){ alert("Bitte zuerst anmelden."); return; }
  frmPw.reset();
  dlgPw.showModal();
};
frmPw.addEventListener("submit", async (ev)=>{
  ev.preventDefault();
  const p1 = frmPw.pw1.value.trim();
  const p2 = frmPw.pw2.value.trim();
  if(!p1 || !p2){ alert("Bitte beide Felder ausfüllen."); return; }
  if(p1 !== p2){ alert("Passwörter stimmen nicht überein."); return; }
  currentPassword = p1;
  await saveVault();
  dlgPw.close();
  alert("Passwort geändert.");
});

// ---- Zurücksetzen ----
document.getElementById("btnReset").onclick = ()=>{
  if(confirm("Alle Daten und das Passwort löschen? Dies kann nicht rückgängig gemacht werden.")){
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
    location.reload();
  }
};

// ---- Login: Standardpasswort demo beim ersten Start vorschlagen ----
try{
  if(!localStorage.getItem(STORAGE_KEY)){
    // Vault existiert noch nicht: Vorschlag auto-eintragen
    document.getElementById("pwd").value = "demo";
  }
}catch(e){}

// Falsches Passwort-Feedback verstärken (Feld leeren & Zeile 'löschen' -> Input wird komplett geleert und Karte kurz wackelt)


// Ensure login button and Enter key trigger doLogin
window.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("loginBtn");
  if(btn){ btn.addEventListener("click", ()=>doLogin()); }
  const pwd = document.getElementById("pwd");
  if(pwd){
    pwd.addEventListener("keydown", (e)=>{
      if(e.key === "Enter"){ doLogin(); }
    });
  }
});


// Robust wiring for login button (btnLogin) and Enter key on #pwd
window.addEventListener("DOMContentLoaded", ()=>{
  try{
    const btn = document.getElementById("btnLogin");
    if(btn){ btn.addEventListener("click", (e)=>{ e.preventDefault(); doLogin(); }); }
    const pwd = document.getElementById("pwd");
    if(pwd){
      pwd.addEventListener("keydown", (e)=>{
        if(e.key === "Enter"){ e.preventDefault(); doLogin(); }
      });
    }
  }catch(err){
    console.error("Login wiring error:", err);
  }
});


// Simple Family Rings app (no password) – upd36

const STORAGE_KEY = "familyRingVault_v3";
let people = [];
let undoStack = [];
let redoStack = [];
let currentSort = {k1:"Generation", k2:"Code", dir:1}; // sort asc
let filtered = "";

// Seed
const seed = [
  {Code:"1", Name:"Olaf Geppert", BirthDate:"13.01.1965", BirthPlace:"", Gender:"m", ParentCode:"", PartnerCode:"1x", Note:""},
  {Code:"1x", Name:"Irina Geppert", BirthDate:"13.01.1970", BirthPlace:"", Gender:"w", ParentCode:"", PartnerCode:"1", Note:""},
  {Code:"1A", Name:"Mario Geppert", BirthDate:"28.04.1995", BirthPlace:"", Gender:"m", ParentCode:"1", PartnerCode:"1Ax", Note:""},
  {Code:"1Ax", Name:"Kim", BirthDate:"", BirthPlace:"", Gender:"w", ParentCode:"", PartnerCode:"1A", Note:""}
];

// Utils
function sget(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; } }
function sset(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function pushUndo(){ undoStack.push(clone(people)); redoStack.length = 0; updateUndoRedo(); }
function updateUndoRedo(){ qs("#btnUndo").disabled = !undoStack.length; qs("#btnRedo").disabled = !redoStack.length; }
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

// Code normalization: uppercase letters, keep partner suffix 'x' lowercase
function normalizeCode(code){
  if(!code) return "";
  code = code.trim();
  const isPartner = code.endsWith("x") || code.endsWith("X");
  code = code.toUpperCase();
  if(isPartner) code = code.slice(0,-1) + "x";
  return code;
}

function generationOf(code){
  if(!code) return 0;
  let base = code.endsWith("x") ? code.slice(0,-1) : code;
  // Generation: digits count as 1, each letter adds 1, digits after letters add more depth like 1C1 => gen 3
  // Simple rule: gen = 1 + number of non-'x' characters after first char
  return base.length;
}

function recalcGenerations(list){
  list.forEach(p => p.Generation = generationOf(p.Code));
}

// Load
function load(){
  const data = sget(STORAGE_KEY);
  people = Array.isArray(data) ? data : seed;
  recalcGenerations(people);
}

function save(){ sset(STORAGE_KEY, people); }

// Table
function renderTable(){
  const tbody = qs("#peopleTable tbody");
  tbody.innerHTML = "";
  let rows = people.filter(p => {
    if(!filtered) return true;
    const f = filtered.toLowerCase();
    return (p.Name||"").toLowerCase().includes(f) || (p.Code||"").toLowerCase().includes(f);
  });

  // sort by Generation then Code (within same Generation)
  rows.sort((a,b)=>{
    if(a.Generation!==b.Generation) return (a.Generation-b.Generation)*currentSort.dir;
    return a.Code.localeCompare(b.Code)*currentSort.dir;
  });

  for(const p of rows){
    const tr = document.createElement("tr");
    const cells = ["Generation","Code","Name","BirthDate","BirthPlace","Gender","ParentCode","PartnerCode","Note"];
    for(const k of cells){
      const td = document.createElement("td");
      td.textContent = p[k]||"";
      tr.appendChild(td);
    }
    tr.addEventListener("dblclick", ()=> editPerson(p.Code));
    tbody.appendChild(tr);
  }
}

// Tree (vertical generations with lines)
function renderTree(){
  const host = qs("#treeHost");
  host.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "tree";
  // group by generation
  const gens = {};
  for(const p of people){ (gens[p.Generation] = gens[p.Generation]||[]).push(p); }
  const sortedGen = Object.keys(gens).map(n=>+n).sort((a,b)=>a-b);
  for(const g of sortedGen){
    const box = document.createElement("div");
    box.className = "gen";
    const title = document.createElement("div");
    title.className = "gen-title";
    title.textContent = `Generation ${g}`;
    box.appendChild(title);
    const list = gens[g].slice().sort((a,b)=>a.Code.localeCompare(b.Code));
    for(const p of list){
      const line = document.createElement("div");
      line.className = "person";
      line.innerHTML = `<span class="code">${p.Code}</span>${p.Name||""}`;
      box.appendChild(line);
    }
    wrap.appendChild(box);
  }
  host.appendChild(wrap);
}

// CRUD
function editPerson(code){
  const dlg = qs("#dlgPerson");
  const p = people.find(x => x.Code===code) || {Code:"", Name:"", BirthDate:"", BirthPlace:"", Gender:"", ParentCode:"", PartnerCode:"", Note:""};
  qs("#pCode").value = p.Code;
  qs("#pName").value = p.Name;
  qs("#pBirthDate").value = p.BirthDate;
  qs("#pBirthPlace").value = p.BirthPlace;
  qs("#pGender").value = p.Gender;
  qs("#pParent").value = p.ParentCode;
  qs("#pPartner").value = p.PartnerCode;
  qs("#pNote").value = p.Note;
  dlg.returnValue = "";
  dlg.showModal();
  dlg.dataset.mode = people.some(x=>x.Code===code) ? "edit" : "new";
}

function upsertFromDialog(){
  const form = qs("#frmPerson");
  const fd = new FormData(form);
  const obj = Object.fromEntries(fd.entries());
  obj.Code = normalizeCode(obj.Code);
  obj.ParentCode = normalizeCode(obj.ParentCode);
  obj.PartnerCode = normalizeCode(obj.PartnerCode);
  if(!obj.Code || !obj.Name){
    alert("Bitte Code und Name ausfüllen."); return;
  }
  // Replace or insert
  const idx = people.findIndex(x => x.Code===obj.Code);
  pushUndo();
  if(idx>=0) people[idx] = {...people[idx], ...obj};
  else people.push(obj);
  recalcGenerations(people);
  save(); renderTable(); renderTree();
}

function addNew(){
  editPerson("");
}

// Delete, Reset
function resetData(){
  if(!confirm("Alle gespeicherten Daten löschen?")) return;
  pushUndo();
  people = [];
  save(); renderTable(); renderTree();
}

// Undo/Redo
function undo(){
  if(!undoStack.length) return;
  redoStack.push(clone(people));
  people = undoStack.pop();
  save(); renderTable(); renderTree(); updateUndoRedo();
}
function redo(){
  if(!redoStack.length) return;
  undoStack.push(clone(people));
  people = redoStack.pop();
  save(); renderTable(); renderTree(); updateUndoRedo();
}

// Search
function onSearch(ev){
  filtered = ev.target.value.trim();
  renderTable();
}

// Import/Export
function exportJSON(){
  const blob = new Blob([JSON.stringify(people, null, 2)], {type:"application/json"});
  downloadBlob(blob, "wappenringe.json");
}
function exportCSV(){
  const cols = ["Generation","Code","Name","BirthDate","BirthPlace","Gender","ParentCode","PartnerCode","Note"];
  const lines = [cols.join(";")];
  for(const p of people){
    lines.push(cols.map(k => ((p[k]||"")+"").replace(/;/g,",")).join(";"));
  }
  const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8"});
  downloadBlob(blob, "wappenringe.csv");
}
async function exportPDF(){
  // Simple PDF via <iframe> and window.print
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Wappenringe – Export</title>
  <style>body{font-family:Arial,sans-serif} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ccc;padding:6px 8px} th{background:#eee}</style>
  </head><body><h2>Wappenringe der Familie GEPPERT – Tabelle</h2>${qs("#paneTable").innerHTML}</body></html>`;
  const blob = new Blob([html], {type:"text/html"});
  downloadBlob(blob, "wappenringe.pdf");
}
async function exportShare(){
  const file = new File([JSON.stringify(people,null,2)], "wappenringe.json", {type:"application/json"});
  if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
    try{
      await navigator.share({ title:"Wappenringe", text:"Exportierte Daten", files:[file] });
      return;
    }catch(e){/* user cancelled or not allowed */}
  }
  // Fallback
  exportJSON();
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 100);
}

// Print
function printTable(){
  window.print(); // print CSS hides header/ribbon automatically
}
function printTree(){
  window.print();
}

// Stats
function showStats(){
  const wrap = qs("#statsContent");
  const gens = {};
  for(const p of people){ (gens[p.Generation] = gens[p.Generation]||0); gens[p.Generation]++; }
  let html = "<h3>Statistiken</h3>";
  html += "<ul>";
  Object.keys(gens).sort((a,b)=>a-b).forEach(g=>{
    html += `<li>Generation ${g}: ${gens[g]} Personen</li>`;
  });
  html += "</ul>";
  wrap.innerHTML = html;
  qs("#dlgStats").showModal();
}

// Handlers
window.addEventListener("DOMContentLoaded", ()=>{
  load(); renderTable(); renderTree(); updateUndoRedo();

  qs("#btnNew").addEventListener("click", addNew);
  qs("#btnImport").addEventListener("click", async ()=>{
    const fileHandle = await pickFile();
    if(!fileHandle) return;
    const text = await fileHandle.text();
    try{
      const arr = JSON.parse(text);
      if(Array.isArray(arr)){
        pushUndo();
        people = arr.map(x => ({...x, Code: normalizeCode(x.Code), ParentCode: normalizeCode(x.ParentCode), PartnerCode: normalizeCode(x.PartnerCode)}));
        recalcGenerations(people); save(); renderTable(); renderTree();
      }else{ alert("JSON-Array erwartet."); }
    }catch(e){ alert("Import fehlgeschlagen: " + e.message); }
  });

  qs("#btnExport").addEventListener("click", (e)=>{
    qs(".export-group").classList.toggle("open");
  });
  qs("#exportMenu").addEventListener("click", (e)=>{
    const t = e.target.closest("button"); if(!t) return;
    const mode = t.getAttribute("data-exp");
    if(mode==="json") exportJSON();
    if(mode==="csv") exportCSV();
    if(mode==="pdf") exportPDF();
    if(mode==="share") exportShare();
    qs(".export-group").classList.remove("open");
  });

  qs("#btnPrintTable").addEventListener("click", printTable);
  qs("#btnPrintTree").addEventListener("click", printTree);
  qs("#btnStats").addEventListener("click", showStats);
  qs("#btnRefreshTree").addEventListener("click", ()=>{ renderTree(); });
  qs("#btnUndo").addEventListener("click", undo);
  qs("#btnRedo").addEventListener("click", redo);
  qs("#btnReset").addEventListener("click", resetData);
  qs("#txtSearch").addEventListener("input", onSearch);

  qs("#btnSavePerson").addEventListener("click", (e)=>{ e.preventDefault(); upsertFromDialog(); qs("#dlgPerson").close(); });
  qs("#dlgStats").querySelector("#btnCloseStats").addEventListener("click", ()=> qs("#dlgStats").close() );

  // Table header sorting by click
  qsa("#peopleTable thead th[data-k]").forEach(th=>{
    th.addEventListener("click", ()=>{
      const k = th.getAttribute("data-k");
      if(k==="Generation"){ currentSort.dir *= -1; } // toggle
      else { currentSort.k2 = k; } // secondary
      renderTable();
    });
  });
});

// File pick helper
async function pickFile(){
  return new Promise((resolve)=>{
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".json,application/json";
    inp.onchange = ()=> resolve(inp.files[0]||null);
    inp.click();
  });
}

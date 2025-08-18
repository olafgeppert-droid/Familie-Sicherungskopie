
// Family Rings – upd37 (no login) with auto codes, ring code, "Geerbt von", SVG tree

const STORAGE_KEY = "familyRingVault_v4";
let people = [];
let undoStack = [];
let redoStack = [];
let filtered = "";
let currentSort = {dir:1};

// Seed minimal
const seed = [
  {Code:"1", RingCode:"1", Name:"Olaf Geppert", BirthDate:"13.01.1965", BirthPlace:"", Gender:"m", ParentCode:"", PartnerCode:"1x", InheritedFrom:"", Note:""},
  {Code:"1x", RingCode:"1", Name:"Irina Geppert", BirthDate:"13.01.1970", BirthPlace:"", Gender:"w", ParentCode:"", PartnerCode:"1", InheritedFrom:"1", Note:""},
  {Code:"1A", RingCode:"1", Name:"Mario Geppert", BirthDate:"28.04.1995", BirthPlace:"", Gender:"m", ParentCode:"1", PartnerCode:"1Ax", InheritedFrom:"1", Note:""},
  {Code:"1Ax", RingCode:"1", Name:"Kim", BirthDate:"", BirthPlace:"", Gender:"w", ParentCode:"", PartnerCode:"1A", InheritedFrom:"1A", Note:""}
];

// Helpers
function sget(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; } }
function sset(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function qs(s){ return document.querySelector(s); }
function qsa(s){ return Array.from(document.querySelectorAll(s)); }

function isPartner(code){ return code && code.endsWith("x"); }
function baseOf(code){ return isPartner(code) ? code.slice(0,-1) : code; }
function normalizeCode(code){
  if(!code) return "";
  code = code.trim();
  const partner = code.endsWith("x") || code.endsWith("X");
  code = code.toUpperCase();
  return partner ? code.slice(0,-1)+"x" : code;
}

// Generation = length of base (no 'x')
function generationOf(code){ if(!code) return 0; return baseOf(code).length; }

function recalcAll(){
  const byCode = Object.fromEntries(people.map(p => [p.Code, p]));
  for(const p of people){
    p.Generation = generationOf(p.Code);
  }
  for(const p of people){
    const base = baseOf(p.Code);
    if(isPartner(p.Code)){
      const b = byCode[base];
      p.RingCode = b ? (b.RingCode || base) : base;
      continue;
    }
    if(p.InheritedFrom){
      const donor = byCode[p.InheritedFrom];
      const donorChain = donor && donor.RingCode ? donor.RingCode : p.InheritedFrom;
      p.RingCode = donorChain + "→" + p.Code;
    } else {
      p.RingCode = base;
    }
  }
}

// Auto-generate next code given parent or partner
function nextRootNumber(){
  const roots = people.filter(p => !p.ParentCode && !isPartner(p.Code)).map(p => parseInt(baseOf(p.Code),10)).filter(n=>!isNaN(n));
  let n = 1; while(roots.includes(n)) n++;
  return String(n);
}
function nextChildCode(parentCode){
  const parentBase = baseOf(parentCode);
  const children = people.filter(p => p.ParentCode===parentBase && !isPartner(p.Code)).map(p => baseOf(p.Code));
  const last = parentBase.slice(-1);
  const wantLetter = /\d/.test(last);
  if(wantLetter){
    // add next letter A..Z
    const used = children.map(c => c.slice(parentBase.length, parentBase.length+1)).filter(Boolean);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for(const ch of alphabet){
      if(!used.includes(ch)) return parentBase + ch;
    }
    return parentBase + "A";
  }else{
    // add next digit 1..9 then 10+
    const usedNums = children.map(c => parseInt(c.slice(parentBase.length),10)).filter(n=>!isNaN(n));
    let k = 1; while(usedNums.includes(k)) k++;
    return parentBase + String(k);
  }
}
function partnerCodeOf(code){ return baseOf(code) + "x"; }

// CRUD
function addNew(){
  openDialogFor({}); // empty (root by default, can set Parent/Partner)
}
function openDialogFor(p){
  const dlg = qs("#dlgPerson");
  qs("#pCode").value = p.Code||"";
  qs("#pName").value = p.Name||"";
  qs("#pBirthDate").value = p.BirthDate||"";
  qs("#pBirthPlace").value = p.BirthPlace||"";
  qs("#pGender").value = p.Gender||"";
  qs("#pParent").value = p.ParentCode||"";
  qs("#pPartner").value = p.PartnerCode||"";
  qs("#pNote").value = p.Note||"";
  dlg.returnValue=""; dlg.showModal();
  dlg.dataset.mode = p.Code ? "edit" : "new";
}
function upsertFromDialog(){
  const fd = new FormData(qs("#frmPerson"));
  const obj = Object.fromEntries(fd.entries());
  obj.InheritedFrom = normalizeCode(obj.InheritedFrom);
  obj.ParentCode = normalizeCode(obj.ParentCode);
  obj.PartnerCode = normalizeCode(obj.PartnerCode);
  // Determine Code automatically
  let code = obj.Code ? normalizeCode(obj.Code) : "";
  if(!code){
    if(obj.PartnerCode){
      // this is a partner being added to an existing base
      code = partnerCodeOf(obj.PartnerCode);
    }else if(obj.ParentCode){
      code = nextChildCode(obj.ParentCode);
    }else{
      code = nextRootNumber();
    }
  }
  code = normalizeCode(code);
  const idx = people.findIndex(p => p.Code===code);
  const baseObj = {
    Code: code,
    Name: obj.Name||"",
    BirthDate: obj.BirthDate||"",
    BirthPlace: obj.BirthPlace||"",
    Gender: obj.Gender||"",
    ParentCode: obj.ParentCode||"",
    PartnerCode: obj.PartnerCode||"",
    InheritedFrom: obj.InheritedFrom||"",
    Note: obj.Note||""
  };
  pushUndo();
  if(idx>=0) people[idx] = {...people[idx], ...baseObj};
  else people.push(baseObj);
  recalcAll(); save(); renderTable(); renderTree();
}

function editPersonByCode(code){
  const p = people.find(x => x.Code===code);
  if(!p) return;
  openDialogFor(p);
}

function resetData(){
  if(!confirm("Alle gespeicherten Daten löschen?")) return;
  pushUndo();
  people = []; save(); renderTable(); renderTree(); updateUndoRedo();
}

// Undo/Redo
function pushUndo(){ undoStack.push(clone(people)); redoStack.length = 0; updateUndoRedo(); }
function undo(){ if(!undoStack.length) return; redoStack.push(clone(people)); people = undoStack.pop(); save(); renderTable(); renderTree(); updateUndoRedo(); }
function redo(){ if(!redoStack.length) return; undoStack.push(clone(people)); people = redoStack.pop(); save(); renderTable(); renderTree(); updateUndoRedo(); }
function updateUndoRedo(){ qs("#btnUndo").disabled = !undoStack.length; qs("#btnRedo").disabled = !redoStack.length; }

// Load/Save
function load(){ const d = sget(STORAGE_KEY); people = Array.isArray(d)?d:seed; recalcAll(); }
function save(){ sset(STORAGE_KEY, people); }

// Table
function renderTable(){
  const tbody = qs("#peopleTable tbody"); tbody.innerHTML = "";
  let rows = people.filter(p=>{
    if(!filtered) return true;
    const f = filtered.toLowerCase();
    return (p.Name||"").toLowerCase().includes(f) || (p.Code||"").toLowerCase().includes(f);
  });
  rows.sort((a,b)=>{
    if(a.Generation!==b.Generation) return a.Generation-b.Generation;
    return a.Code.localeCompare(b.Code);
  });
  const cols = ["Generation","Code","RingCode","Name","BirthDate","BirthPlace","Gender","ParentCode","PartnerCode","InheritedFrom","Note"];
  for(const p of rows){
    const tr = document.createElement("tr");
    for(const k of cols){
      const td = document.createElement("td");
      td.textContent = p[k]||""; tr.appendChild(td);
    }
    tr.addEventListener("dblclick", ()=> editPersonByCode(p.Code));
    tbody.appendChild(tr);
  }
}

// SVG Tree (vertical, parents below)
function renderTree(){
  const svg = qs("#treeSvg");
  const width = svg.clientWidth || 800;
  const height = svg.clientHeight || 600;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = "";

  // group by generation (ascending: 1..n), y positions stacked top->bottom
  const byGen = {};
  for(const p of people){ (byGen[p.Generation] = byGen[p.Generation]||[]).push(p); }
  const gens = Object.keys(byGen).map(n=>+n).sort((a,b)=>a-b);
  const rowH = Math.max(100, Math.floor(height / Math.max(1, gens.length)));
  const colW = 180, boxW=150, boxH=46;

  const pos = {}; // code -> {x,y}
  gens.forEach((g, gi)=>{
    const arr = byGen[g].slice().sort((a,b)=>a.Code.localeCompare(b.Code));
    arr.forEach((p, i)=>{
      const x = 40 + i*colW;
      const y = 20 + gi*rowH;
      pos[p.Code] = {x,y};
    });
  });

  // links parent->child
  for(const p of people){
    if(p.ParentCode){
      const parent = pos[p.ParentCode]; const child = pos[p.Code];
      if(parent && child){
        const x1 = parent.x + boxW/2, y1 = parent.y + boxH;
        const x2 = child.x + boxW/2, y2 = child.y;
        const path = `M${x1},${y1} V${(y1+y2)/2} H${x2} V${y2}`;
        drawPath(svg, path, "link");
      }
    }
    // partner line (short)
    if(isPartner(p.Code)){
      const a = pos[baseOf(p.Code)], b = pos[p.Code];
      if(a && b){
        const y = a.y + boxH/2;
        drawPath(svg, `M${a.x+boxW},${y} H${b.x}`, "link");
      }
    }
  }

  // nodes
  for(const p of people){
    const {x,y} = pos[p.Code] || {x:0,y:0};
    drawNode(svg, x, y, boxW, boxH, p);
  }
}

function drawPath(svg, d, cls){
  const el = document.createElementNS("http://www.w3.org/2000/svg","path");
  el.setAttribute("d", d);
  el.setAttribute("class", cls);
  el.setAttribute("fill", "none");
  svg.appendChild(el);
}
function drawNode(svg, x, y, w, h, p){
  const g = document.createElementNS("http://www.w3.org/2000/svg","g");
  const r = document.createElementNS("http://www.w3.org/2000/svg","rect");
  r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", w); r.setAttribute("height", h);
  r.setAttribute("rx", 6); r.setAttribute("class","node");
  g.appendChild(r);
  const t1 = document.createElementNS("http://www.w3.org/2000/svg","text");
  t1.setAttribute("x", x+8); t1.setAttribute("y", y+18); t1.setAttribute("class","label code");
  t1.textContent = p.Code + (p.RingCode ? ` · ${p.RingCode}` : "");
  g.appendChild(t1);
  const t2 = document.createElementNS("http://www.w3.org/2000/svg","text");
  t2.setAttribute("x", x+8); t2.setAttribute("y", y+36); t2.setAttribute("class","label");
  t2.textContent = p.Name||"";
  g.appendChild(t2);
  svg.appendChild(g);
}

// Search
function onSearch(e){ filtered = e.target.value.trim(); renderTable(); }

// Export/Import/Share
function exportJSON(){
  const blob = new Blob([JSON.stringify(people,null,2)], {type:"application/json"});
  downloadBlob(blob, "wappenringe.json");
}
function exportCSV(){
  const cols = ["Generation","Code","RingCode","Name","BirthDate","BirthPlace","Gender","ParentCode","PartnerCode","InheritedFrom","Note"];
  const lines = [cols.join(";")];
  for(const p of people){ lines.push(cols.map(k => ((p[k]||"")+"").replace(/;/g,",")).join(";")); }
  const blob = new Blob([lines.join("\\n")], {type:"text/csv;charset=utf-8"});
  downloadBlob(blob, "wappenringe.csv");
}
async function exportPDF(){
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Wappenringe – Export</title>
  <style>body{font-family:Arial,sans-serif} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ccc;padding:6px 8px} th{background:#eee}</style>
  </head><body><h2>Wappenringe der Familie GEPPERT – Tabelle</h2>${qs("#paneTable").innerHTML}</body></html>`;
  const blob = new Blob([html], {type:"text/html"});
  downloadBlob(blob, "wappenringe.pdf");
}
async function exportShare(){
  const file = new File([JSON.stringify(people,null,2)], "wappenringe.json", {type:"application/json"});
  if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({ title:"Wappenringe", text:"Exportierte Daten", files:[file] }); return; }catch(e){}
  }
  exportJSON();
}
function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 100);
}

// Print
function printTable(){ window.print(); }
function printTree(){ window.print(); }

// Stats
function showStats(){
  const wrap = qs("#statsContent");
  const gens = {};
  for(const p of people){ (gens[p.Generation]=gens[p.Generation]||0); gens[p.Generation]++; }
  let html = "<h3>Statistiken</h3><ul>";
  Object.keys(gens).sort((a,b)=>a-b).forEach(g=> html += `<li>Generation ${g}: ${gens[g]} Personen</li>` );
  html += "</ul>";
  wrap.innerHTML = html;
  qs("#dlgStats").showModal();
}

// Events
window.addEventListener("DOMContentLoaded", ()=>{
  load(); renderTable(); renderTree(); updateUndoRedo();

  qs("#btnNew").addEventListener("click", ()=> openDialogFor({}));
  qs("#btnDelete").addEventListener("click", ()=> qs("#dlgDelete").showModal());
  qs("#btnConfirmDelete").addEventListener("click", (e)=>{
    e.preventDefault();
    const q = (qs("#delQuery").value||"").trim();
    if(!q){ qs("#dlgDelete").close(); return; }
    const normQ = normalizeCode(q);
    const idx = people.findIndex(p => p.Code===normQ || (p.Name||"").toLowerCase()===q.toLowerCase());
    if(idx<0){ alert("Keine passende Person gefunden."); return; }
    pushUndo();
    people.splice(idx,1);
    save(); recalcAll(); renderTable(); renderTree(); updateUndoRedo();
    qs("#dlgDelete").close();
  });

  qs("#btnImport").addEventListener("click", async ()=>{
    const file = await pickFile(); if(!file) return;
    const text = await file.text();
    try{
      const arr = JSON.parse(text);
      if(Array.isArray(arr)){
        pushUndo();
        people = arr.map(p => ({...p, Code: normalizeCode(p.Code), ParentCode: normalizeCode(p.ParentCode), PartnerCode: normalizeCode(p.PartnerCode)}));
        recalcAll(); save(); renderTable(); renderTree();
      } else alert("JSON-Array erwartet.");
    }catch(e){ alert("Import fehlgeschlagen: " + e.message); }
  });
  qs("#btnExport").addEventListener("click", ()=> qs(".export-group").classList.toggle("open"));
  qs("#exportMenu").addEventListener("click", (e)=>{
    const b = e.target.closest("button"); if(!b) return;
    const mode = b.getAttribute("data-exp");
    if(mode==="json") exportJSON();
    if(mode==="csv") exportCSV();
    if(mode==="pdf") exportPDF();
    if(mode==="share") exportShare();
    qs(".export-group").classList.remove("open");
  });
  qs("#btnPrintTable").addEventListener("click", printTable);
  qs("#btnPrintTree").addEventListener("click", printTree);
  qs("#btnStats").addEventListener("click", showStats);
  qs("#btnRefreshTree").addEventListener("click", ()=> renderTree() );
  qs("#btnUndo").addEventListener("click", undo);
  qs("#btnRedo").addEventListener("click", redo);
  qs("#btnReset").addEventListener("click", resetData);
  qs("#txtSearch").addEventListener("input", onSearch);

  qs("#btnSavePerson").addEventListener("click", (e)=>{ e.preventDefault(); upsertFromDialog(); qs("#dlgPerson").close(); });
  qs("#dlgStats").querySelector("#btnCloseStats").addEventListener("click", ()=> qs("#dlgStats").close() );
});

// File helper
async function pickFile(){
  return new Promise((resolve)=>{
    const inp = document.createElement("input");
    inp.type="file"; inp.accept=".json,application/json";
    inp.onchange = ()=> resolve(inp.files[0]||null);
    inp.click();
  });
}

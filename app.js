/* app.js – Logik */
const STORAGE_KEY = "familyRing_upd56b";
let people = [];
const undoStack = []; const redoStack = [];
const MAX_UNDO_STEPS = 50; // Begrenzung für Undo-Stack

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* === Utility === */
function saveState(pushUndo=true){
  if(pushUndo) {
    undoStack.push(JSON.stringify(people));
    // Stack auf maximale Größe begrenzen
    if(undoStack.length > MAX_UNDO_STEPS) undoStack.shift();
  }
  redoStack.length = 0;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
}
function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){ people = JSON.parse(raw); }
  else { people = seedData(); saveState(false); }
  postLoadFixups();
}

function seedData(){
  return [
    {Gen:1, Code:"1", Name:"Olaf Geppert", Birth:"13.01.1965", BirthPlace:"Chemnitz", Gender:"m", ParentCode:"", PartnerCode:"1x", InheritedFrom:"", Note:"Stammvater"},
    {Gen:1, Code:"1x", Name:"Irina Geppert", Birth:"13.01.1970", BirthPlace:"Berlin", Gender:"w", ParentCode:"", PartnerCode:"1", InheritedFrom:"", Note:"Partnerin"},
    {Gen:2, Code:"1A", Name:"Mario Geppert", Birth:"28.04.1995", BirthPlace:"Berlin", Gender:"m", ParentCode:"1", PartnerCode:"1Ax", InheritedFrom:"", Note:"1. Sohn"},
    {Gen:2, Code:"1Ax", Name:"Kim", Birth:"", BirthPlace:"", Gender:"w", ParentCode:"", PartnerCode:"1A", InheritedFrom:"", Note:"Partnerin"},
    {Gen:2, Code:"1B", Name:"Nicolas Geppert", Birth:"04.12.2000", BirthPlace:"Berlin", Gender:"m", ParentCode:"1", PartnerCode:"1Bx", InheritedFrom:"", Note:"2. Sohn"},
    {Gen:2, Code:"1Bx", Name:"Annika", Birth:"", BirthPlace:"", Gender:"w", ParentCode:"", PartnerCode:"1B", InheritedFrom:"", Note:"Partnerin"},
    {Gen:2, Code:"1C", Name:"Julienne Geppert", Birth:"26.09.2002", BirthPlace:"Berlin", Gender:"w", ParentCode:"1", PartnerCode:"1Cx", InheritedFrom:"", Note:"Tochter"},
    {Gen:2, Code:"1Cx", Name:"Jonas", Birth:"", BirthPlace:"", Gender:"m", ParentCode:"", PartnerCode:"1C", InheritedFrom:"", Note:"Partner"},
    {Gen:3, Code:"1C1", Name:"Michael Geppert", Birth:"12.07.2025", BirthPlace:"Hochstätten", Gender:"m", ParentCode:"1C", PartnerCode:"", InheritedFrom:"1", Note:""}
  ];
}

/* Compute Gen if missing (based on code pattern / parent chain) */
function computeGenFromCode(code){
  if(!code) return 1;
  // Partner 'x' does not change generation
  const base = code.replace(/x$/,''); // drop trailing x
  // Gen 1: '1'
  if(base === "1") return 1;
  // direct children: 1A, 1B => Gen 2
  if(/^1[A-Z]$/.test(base)) return 2;
  // grandchildren: 1A1, 1B2, etc. => Gen 3
  if(/^1[A-Z]\d+$/.test(base)) return 3;
  // great-grandchildren: 1A1A, 1A1B, etc. => Gen 4
  if(/^1[A-Z]\d+[A-Z]$/.test(base)) return 4;
  // further generations: count segments
  let generation = 1;
  let current = base;
  
  while (current.length > 0) {
    if (current === "1") break;
    
    // Remove last character and check what type it was
    const lastChar = current.charAt(current.length - 1);
    if (/[A-Z]/.test(lastChar)) {
      generation++;
      current = current.slice(0, -1);
    } else if (/\d/.test(lastChar)) {
      generation++;
      // Remove all trailing digits
      current = current.replace(/\d+$/, '');
    } else {
      break;
    }
  }
  
  return Math.max(1, generation);
}

function postLoadFixups(){
  // Ensure Gen & RingCode are present after import
  for(const p of people){
    if(!p.Gen) p.Gen = computeGenFromCode(p.Code);
  }
  computeRingCodes();
}

/* Ring codes (partners keep own code, inheritance forms chain) */
function computeRingCodes(){
  const byCode = Object.fromEntries(people.map(p=>[p.Code,p]));
  
  // Reset all RingCodes first
  for(const p of people){
    p.RingCode = p.Code;
  }
  
  // Process inheritance chains (max depth to prevent circular references)
  const MAX_DEPTH = 20;
  let changed;
  let iterations = 0;
  
  do {
    changed = false;
    iterations++;
    
    for(const p of people){
      if(p.InheritedFrom && p.InheritedFrom !== ""){
        const donor = byCode[p.InheritedFrom];
        if(donor && donor.RingCode && !donor.RingCode.includes(p.Code)) {
          // Check for circular reference
          if(donor.RingCode.includes("→" + p.Code) || p.Code === donor.InheritedFrom) {
            console.warn("Circular inheritance detected:", p.Code, "->", donor.Code);
            continue;
          }
          
          const newRingCode = donor.RingCode + "→" + p.Code;
          if(p.RingCode !== newRingCode) {
            p.RingCode = newRingCode;
            changed = true;
          }
        }
      }
    }
    
    if(iterations >= MAX_DEPTH) {
      console.warn("Max inheritance depth reached, possible circular reference");
      break;
    }
  } while (changed);
}

/* Render Table (with filter & highlight) */
function renderTable(){
  computeRingCodes();
  const q = ($("#search").value||"").trim().toLowerCase();
  const tb = $("#peopleTable tbody"); tb.innerHTML="";
  const mark = (txt)=>{
    if(!q) return escapeHtml(String(txt||""));
    const s = String(txt||""); const i = s.toLowerCase().indexOf(q);
    if(i<0) return escapeHtml(s);
    return escapeHtml(s.slice(0,i)) + "<mark>" + escapeHtml(s.slice(i,i+q.length)) + "</mark>" + escapeHtml(s.slice(i+q.length));
  };
  
  // Escape HTML function to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // sort: Gen then Code
  people.sort((a,b)=> (a.Gen||0)-(b.Gen||0) || String(a.Code).localeCompare(String(b.Code)));
  for(const p of people){
    const hay = (p.Name||"") + " " + (p.Code||"");
    if(q && hay.toLowerCase().indexOf(q)===-1) continue; // FILTER: hide non-matches
    const tr=document.createElement("tr");
    const cols = ["Gen","Code","RingCode","Name","Birth","BirthPlace","Gender","ParentCode","PartnerCode","InheritedFrom","Note"];
    cols.forEach(k=>{
      const td=document.createElement("td");
      td.innerHTML = mark(p[k] ?? "");
      tr.appendChild(td);
    });
    tr.addEventListener("dblclick", ()=> openEdit(p.Code));
    tb.appendChild(tr);
  }
}

/* Render Tree (SVG), generations with background colors */
function genColor(gen){
  const c=[null,"#d8f5d0","#fff4c2","#ffd1d1","#ead3ff","#cfe9ff","#ffe0b3","#e0f7fa"];
  gen = parseInt(gen||1,10);
  return c[gen] || "#f0f0f0";
}

function renderTree(){
  computeRingCodes();
  const el=$("#tree"); el.innerHTML="";
  const svgNS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(svgNS,"svg");
  svg.setAttribute("width","100%");
  svg.setAttribute("height","100%");
  svg.setAttribute("viewBox","0 0 1600 800");
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  el.appendChild(svg);

  const gens = {};
  for(const p of people){
    (gens[p.Gen] ||= []).push(p);
  }
  Object.values(gens).forEach(arr => arr.sort((a,b)=> (a.ParentCode||"").localeCompare(b.ParentCode||"") || (a.Birth||"").localeCompare(b.Birth||"") || String(a.Code).localeCompare(String(b.Code))));

  const nodeW=180, nodeH=48, vGap=100, hGap=26, margin=20;
  const positions=new Map();

  const genKeys=Object.keys(gens).map(Number).sort((a,b)=>a-b);
  genKeys.forEach((g,gi)=>{
    const arr=gens[g]||[];
    arr.forEach((p,idx)=>{
      const x = margin + idx*(nodeW+hGap);
      const y = margin + gi*(nodeH+vGap);
      positions.set(p.Code, {x,y,p});
      const gEl=document.createElementNS(svgNS,"g"); gEl.setAttribute("class","node");
      gEl.setAttribute("transform",`translate(${x},${y})`);
      const rect=document.createElementNS(svgNS,"rect");
      rect.setAttribute("width",nodeW); rect.setAttribute("height",nodeH); rect.setAttribute("rx",8); rect.setAttribute("ry",8);
      rect.setAttribute("fill", genColor(p.Gen));
      rect.setAttribute("stroke","#cbd5e1");
      const t1=document.createElementNS(svgNS,"text");
      t1.setAttribute("x",8); t1.setAttribute("y",18); t1.textContent=`${p.Code} / ${p.Name||""}`;
      const t2=document.createElementNS(svgNS,"text");
      t2.setAttribute("x",8); t2.setAttribute("y",36); t2.textContent=`Generation: ${p.Gen||""} / ${p.Birth||""}`;
      [t1,t2].forEach(t=>{t.setAttribute("font-size","11"); t.setAttribute("fill","#111827");});
      svg.appendChild(gEl); gEl.appendChild(rect); gEl.appendChild(t1); gEl.appendChild(t2);
    });
  });

  // lines: partners (horizontal same level) + parent-child (vertical)
  for(const p of people){
    if(p.PartnerCode && positions.has(p.Code) && positions.has(p.PartnerCode)){
      const a=positions.get(p.Code), b=positions.get(p.PartnerCode);
      const y = a.y + nodeH/2;
      const x1 = Math.min(a.x,b.x)+nodeW; const x2 = Math.max(a.x,b.x);
      const line=document.createElementNS(svgNS,"line");
      line.setAttribute("x1", x1-nodeW); line.setAttribute("y1", y);
      line.setAttribute("x2", x2); line.setAttribute("y2", y);
      line.setAttribute("stroke","#9ca3af"); line.setAttribute("stroke-width","2");
      svg.appendChild(line);
    }
    // child vertical handled in bus pass
  }
}

/* Printing only selection */
function printHTML(inner){
  const w = window.open("", "_blank", "noopener,noreferrer");
  if(!w){ alert("Popup-Blocker aktiv. Bitte erlauben."); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Druck</title>
  <style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif;padding:12px}
  h1{text-align:center;font-size:20px;margin:12px 0}
  table{border-collapse:collapse;width:100%} th,td{border:1px solid #ddd;padding:6px;font-size:12px} th{background:#f4f6f8}
  svg{max-width:100%;height:auto}
  </style></head><body>${inner}</body></html>`);
  w.document.close(); w.focus();
  setTimeout(()=>w.print(), 300);
}

function printTable(){
  const dlg = $("#dlgPrint"); if(dlg.open) dlg.close();
  const el = resolvePrintableEl('#peopleTable');
  elementToPdfBlob(el, 'Tabelle').then(blob => shareOrDownloadPDF(blob, 'tabelle.pdf'));

}
function printTree(){
  const dlg = $("#dlgPrint"); if(dlg.open) dlg.close();
  const el = resolvePrintableEl('#tree');
  elementToPdfBlob(el, 'Stammbaum').then(blob => shareOrDownloadPDF(blob, 'stammbaum.pdf'));

}

/* Export with iOS Share Sheet when available */
async function shareOrDownload(filename, blob){
  const file = new File([blob], filename, {type: blob.type || "application/octet-stream"});
  if(navigator.canShare && navigator.canShare({ files:[file] }) && navigator.share){
    try{
      await navigator.share({ files:[file], title:"Export" });
      return;
    }catch(e){ /* user canceled => fallback to download */ }
  }
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(people,null,2)],{type:"application/json"});
  shareOrDownload("familie.json", blob);
}
function exportCSV(){
  const cols=["Gen","Code","RingCode","Name","Birth","BirthPlace","Gender","ParentCode","PartnerCode","InheritedFrom","Note"];
  const lines=[cols.join(";")];
  for(const p of people){ lines.push(cols.map(c=> String(p[c]??"").replace(/;/g,",")).join(";")); }
  const blob = new Blob([lines.join("\n")],{type:"text/csv"});
  shareOrDownload("familie.csv", blob);
}

/* CRUD */
function parseDate(d){
  const m = /^([0-3]?\d)\.([01]?\d)\.(\d{4})$/.exec((d||"").trim());
  if(!m) return "";
  return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
}


function normalizePersonCode(code){
  if(!code) return "";
  let s = String(code).trim();
  // Convert all letters to uppercase except trailing 'x'
  if(s.endsWith('x') || s.endsWith('X')) {
    s = s.slice(0, -1).toUpperCase() + 'x';
  } else {
    s = s.toUpperCase();
  }
  return s;
}

function nextChildCode(parent){
  const kids = people.filter(p=>p.ParentCode===parent && p.Code.startsWith(parent));
  const nums = kids.map(k=> {
    const numPart = k.Code.replace(parent, "").replace(/x$/, "");
    return parseInt(numPart, 10);
  }).filter(n=>!isNaN(n));
  let next=1; while(nums.includes(next)) next++;
  return parent + String(next);
}

function openNew(){
  $("#pName").value=""; $("#pBirth").value=""; $("#pPlace").value="";
  $("#pGender").value=""; $("#pParent").value=""; $("#pPartner").value=""; $("#pInherited").value=""; $("#pNote").value="";
  $("#dlgNew").showModal();
}

function addNew(){
  const name=$("#pName").value.trim();
  const birth=$("#pBirth").value.trim();
  const place=$("#pPlace").value.trim();
  const gender=$("#pGender").value;
  const parent=normalizePersonCode($("#pParent").value.trim());
  const partner=normalizePersonCode($("#pPartner").value.trim());
  const inherited=normalizePersonCode($("#pInherited").value.trim());
  const note=$("#pNote").value.trim();

  let gen=1, code="";
  if(parent){
    const parentP = people.find(p=>p.Code===parent);
    gen = parentP ? (parentP.Gen||1)+1 : 2;
    code = nextChildCode(parent);
  }else{
    if(partner==="1"){ code="1x"; gen=1; } else { code="1"; gen=1; }
  }
  const p={Gen:gen, Code:code, Name:name, Birth:birth, BirthPlace:place, Gender:gender, ParentCode:parent, PartnerCode:partner, InheritedFrom:inherited, Note:note};
  people.push(p);
  saveState(); renderTable(); renderTree();
}

let editCode=null;
function openEdit(code){
  const p=people.find(x=>x.Code===code); if(!p) return;
  editCode=code;
  $("#eName").value=p.Name||""; $("#eBirth").value=p.Birth||""; $("#ePlace").value=p.BirthPlace||"";
  $("#eGender").value=p.Gender||""; $("#eParent").value=p.ParentCode||""; $("#ePartner").value=p.PartnerCode||"";
  $("#eInherited").value=p.InheritedFrom||""; $("#eNote").value=p.Note||"";
  $("#dlgEdit").showModal();
}
function saveEditFn(){
  const p=people.find(x=>x.Code===editCode); if(!p) return;
  p.Name=$("#eName").value.trim();
  p.Birth=$("#eBirth").value.trim();
  p.BirthPlace=$("#ePlace").value.trim();
  p.Gender=$("#eGender").value;
  p.ParentCode=normalizePersonCode($("#eParent").value.trim());
  p.PartnerCode=normalizePersonCode($("#ePartner").value.trim());
  p.InheritedFrom=normalizePersonCode($("#eInherited").value.trim());
  p.Note=$("#eNote").value.trim();
  // Recompute gen if parent changed or code pattern changed
  p.Gen = computeGenFromCode(p.Code);
  saveState(); renderTable(); renderTree();
}

function deletePerson(){
  const id = prompt("Bitte Namen oder Personen-Code der zu löschenden Person eingeben:");
  if(!id) return;
  const idx = people.findIndex(p=> p.Code===id || (p.Name||"").toLowerCase()===id.toLowerCase());
  if(idx<0){ alert("Person nicht gefunden."); return; }
  const code = people[idx].Code;
  people.splice(idx,1);
  people.forEach(p=>{
    if(p.ParentCode===code) p.ParentCode="";
    if(p.PartnerCode===code) p.PartnerCode="";
    if(p.InheritedFrom===code) p.InheritedFrom="";
  });
  saveState(); renderTable(); renderTree();
}

/* Import */
function doImport(file){
  const r=new FileReader();
  r.onload=()=>{
    try{
      let data;
      if(file.name.toLowerCase().endsWith('.csv')) {
        data = parseCSV(r.result);
      } else {
        data = JSON.parse(r.result);
      }
      
      if(!Array.isArray(data)) throw new Error("Format");
      
      // Validierung der importierten Daten
      const validData = data.filter(item => 
        item && typeof item === 'object' && item.Code && typeof item.Code === 'string'
      );
      
      people = validData;
      postLoadFixups();
      saveState(false);
      renderTable(); renderTable(); // Doppelaufruf für sofortiges Update
    }catch(e){ 
      console.error("Import error:", e);
      alert("Ungültige Datei: " + e.message); 
    }
  };
  r.readAsText(file);
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(';').map(h => h.trim());
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map(v => v.trim());
    const obj = {};
    
    for (let j = 0; j < headers.length; j++) {
      if (j < values.length) {
        obj[headers[j]] = values[j] || '';
      }
    }
    
    if (obj.Code) {
      result.push(obj);
    }
  }
  
  return result;
}

/* Events */
function setupEventListeners() {
  $("#btnNew").addEventListener("click", openNew);
  $("#saveNew").addEventListener("click", (e)=>{ e.preventDefault(); addNew(); $("#dlgNew").close(); });
  $("#saveEdit").addEventListener("click", (e)=>{ e.preventDefault(); saveEditFn(); $("#dlgEdit").close(); });
  $("#btnDelete").addEventListener("click", deletePerson);
  $("#btnImport").addEventListener("click", ()=>{ 
    const inp=document.createElement("input"); 
    inp.type="file"; 
    inp.accept=".json,.csv,application/json,text/csv"; 
    inp.onchange=()=>{ if(inp.files[0]) doImport(inp.files[0]); }; 
    inp.click(); 
  });
  $("#btnExport").addEventListener("click", ()=> $("#dlgExport").showModal());
  $("#btnExportJSON").addEventListener("click", exportJSON);
  $("#btnExportCSV").addEventListener("click", exportCSV);
  $("#btnPrint").addEventListener("click", ()=> $("#dlgPrint").showModal());
  $("#btnPrintTable").addEventListener("click", ()=>{ printTable(); $("#dlgPrint").close(); });
  $("#btnPrintTree").addEventListener("click", ()=>{ printTree(); $("#dlgPrint").close(); });
  $("#btnStats").addEventListener("click", ()=>{ updateStats(); $("#dlgStats").showModal(); });
  $("#btnHelp").addEventListener("click", ()=>{ 
    fetch("help.html").then(r=>r.text()).then(html=>{ 
      $("#helpContent").innerHTML=html; 
      $("#dlgHelp").showModal(); 
    }).catch(() => {
      $("#helpContent").innerHTML = "<p>Hilfedatei konnte nicht geladen werden.</p>";
      $("#dlgHelp").showModal();
    });
  });
  $("#btnReset").addEventListener("click", ()=>{ if(confirm("Sollen wirklich alle Personen gelöscht werden?")){ people=[]; saveState(); renderTable(); renderTree(); }});
  $("#btnUndo").addEventListener("click", ()=>{ if(!undoStack.length) return; redoStack.push(JSON.stringify(people)); people=JSON.parse(undoStack.pop()); localStorage.setItem(STORAGE_KEY, JSON.stringify(people)); renderTable(); renderTree(); });
  $("#btnRedo").addEventListener("click", ()=>{ if(!redoStack.length) return; undoStack.push(JSON.stringify(people)); people=JSON.parse(redoStack.pop()); localStorage.setItem(STORAGE_KEY, JSON.stringify(people)); renderTable(); renderTree(); });

  $("#search").addEventListener("input", renderTable);
}

/* Stats */
function updateStats(){
  let total=0,m=0,w=0,d=0; const byGen={};
  for(const p of people){
    total++;
    const g=(p.Gender||"").toLowerCase();
    if(g==="m") m++; else if(g==="w") w++; else if(g==="d") d++;
    byGen[p.Gen] = (byGen[p.Gen]||0)+1;
  }
  let html = `<p>Gesamtanzahl Personen: <b>${total}</b></p>`;
  html += `<p>davon männlich: <b>${m}</b> — weiblich: <b>${w}</b> — divers: <b>${d}</b></p>`;
  html += `<ul>`; Object.keys(byGen).sort((a,b)=>a-b).forEach(k=> html += `<li>Generation ${k}: ${byGen[k]}</li>`); html += `</ul>`;
  $("#statsContent").innerHTML = html;
}

/* Init */
loadState(); 
setupEventListeners();
renderTable(); 
renderTree();

/* === PDF Export (Table or Tree) === */

// Fix: resolve printable element robustly
function resolvePrintableEl(sel, fallbackSel){
  let el = document.querySelector(sel);
  if(!el && fallbackSel) el = document.querySelector(fallbackSel);
  if(!el) { 
    // try to find by common ids/classes
    if(sel.includes('table')) {
      el = document.getElementById('peopleTable') || document.querySelector('table');
    } else if(sel.includes('tree')) {
      el = document.getElementById('tree') || document.querySelector('svg');
    }
  }
  return el;
}

async function elementToPdfBlob(el, title){
  if(!el) {
    console.error("Element for PDF not found:", title);
    alert("Element zum Drucken nicht gefunden.");
    return null;
  }
  
  // Clone to avoid layout shifts
  const clone = el.cloneNode(true);
  const wrapper = document.createElement('div');
  
  // Header with wappen & title - safely
  const titleWrap = document.querySelector('.ribbon .title-wrap');
  if(titleWrap) {
    const header = titleWrap.cloneNode(true);
    header.style.marginBottom = '12px';
    wrapper.appendChild(header);
  } else {
    // Fallback header
    const fallbackHeader = document.createElement('div');
    fallbackHeader.style.textAlign = 'center';
    fallbackHeader.style.marginBottom = '12px';
    fallbackHeader.innerHTML = '<h2>Wappenringe der Familie GEPPERT</h2>';
    wrapper.appendChild(fallbackHeader);
  }
  
  wrapper.appendChild(clone);
  wrapper.style.padding = '16px';
  wrapper.style.background = '#ffffff';
  document.body.appendChild(wrapper);
  
  try {
    // Render to canvas
    const canvas = await html2canvas(wrapper, {scale: 2, backgroundColor: '#ffffff', useCORS: true});
    const img = canvas.toDataURL('image/jpeg', 0.92);

    // Auto orientation
    const { jsPDF } = window.jspdf;
    const orientation = canvas.width > canvas.height ? 'l' : 'p';
    const doc = new jsPDF({orientation, unit:'pt', format:'a4'});
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 24;
    
    // Fit image into page while preserving aspect
    let w = pageW - margin*2;
    let h = canvas.height * (w / canvas.width);
    if(h > pageH - margin*2){ h = pageH - margin*2; w = canvas.width * (h / canvas.height); }
    const x = (pageW - w)/2, y = margin;
    
    doc.addImage(img, 'JPEG', x, y, w, h);
    const blob = doc.output('blob');
    return blob;
  } catch (error) {
    console.error("PDF generation error:", error);
    return null;
  } finally {
    wrapper.remove();
  }
}

async function shareOrDownloadPDF(blob, filename){
  if(!blob) return;
  
  try{
    const file = new File([blob], filename, {type:'application/pdf'});
    if(navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({ files:[file], title: 'Wappenringe der Familie GEPPERT' });
      return;
    }
  }catch(e){
    // fall through to download/print fallback
  }
  
  if(isIOS()){
    // iOS fallback: open a print window
    if(filename.includes('tabelle')) { printSection('table'); }
    else { printSection('tree'); }
    return;
  }
  
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

function printSection(what){
  const title = 'Wappenringe der Familie GEPPERT';
  const when = new Date().toLocaleString('de-DE');

  const content = document.createElement('div');
  content.style.padding = '16px';
  
  const h = document.createElement('div');
  h.style.display='flex'; h.style.justifyContent='center'; h.style.alignItems='center'; h.style.gap='12px';
  
  // Try to get wappen images safely
  const wappenImg = document.querySelector('.coa');
  if(wappenImg && wappenImg.src) {
    h.innerHTML = `<img src="${wappenImg.src}" style="height:40px"/><h2 style="margin:0">${title}</h2><img src="${wappenImg.src}" style="height:40px"/>`;
  } else {
    h.innerHTML = `<h2 style="margin:0">${title}</h2>`;
  }
  content.appendChild(h);

  const section = document.createElement('div');
  if(what==='table'){
    const tableWrap = document.querySelector('.table-wrap');
    if(tableWrap) {
      section.innerHTML = tableWrap.innerHTML;
    }
  }else{
    const treeEl = document.getElementById('tree');
    if(treeEl) {
      section.appendChild(treeEl.cloneNode(true));
    }
  }
  content.appendChild(section);

  const f = document.createElement('div');
  f.style.marginTop='12px'; f.style.fontSize='12px'; f.style.textAlign='right'; 
  f.textContent = `Stand: ${when}`;
  content.appendChild(f);

  const win = window.open('', '_blank');
  if(!win){ alert('Popup-Blocker verhindert den Druck. Bitte erlauben.'); return; }
  
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;padding:20px}
      table{width:100%;border-collapse:collapse;margin:10px 0}
      th,td{border:1px solid #ddd;padding:8px;font-size:14px}
      thead th{background:#f1f5f9;font-weight:bold}
      svg{width:100%;height:auto;max-height:600px}
      @media print{
        body{margin:0;padding:10px}
        table{font-size:12px}
      }
    </style>
  </head><body></body></html>`);
  
  win.document.body.appendChild(content);
  
  // wait for images to load
  const imgs = win.document.images;
  let pending = imgs.length;
  
  const go = () => {
    win.focus(); 
    win.print();
  };
  
  if(pending === 0){
    setTimeout(go, 100);
  }else{
    for(const im of imgs){
      im.addEventListener('load', ()=>{ if(--pending===0) setTimeout(go,100); });
      im.addEventListener('error', ()=>{ if(--pending===0) setTimeout(go,100); });
    }
  }
  
  // close after print
  win.addEventListener('afterprint', ()=> setTimeout(()=>win.close(), 200));
}
// Sicherstellen, dass die Version auf allen Geräten sichtbar ist
function ensureVersionVisibility() {
  const versionRibbon = document.getElementById('versionRibbon');
  if (versionRibbon) {
    // Styling direkt anwenden
    versionRibbon.style.position = 'absolute';
    versionRibbon.style.right = '12px';
    versionRibbon.style.bottom = '8px';
    versionRibbon.style.fontSize = '12px';
    versionRibbon.style.color = '#fff';
    versionRibbon.style.opacity = '0.9';
    versionRibbon.style.pointerEvents = 'none';
    versionRibbon.style.textAlign = 'right';
    versionRibbon.style.zIndex = '10';
    versionRibbon.style.display = 'block';
    
    // Für sehr kleine Bildschirme anpassen
    if (window.innerWidth <= 480) {
      versionRibbon.style.position = 'static';
      versionRibbon.style.textAlign = 'center';
      versionRibbon.style.padding = '4px 12px';
      versionRibbon.style.color = '#fff';
      versionRibbon.style.backgroundColor = 'rgba(0,0,0,0.2)';
      versionRibbon.style.marginTop = '4px';
    }
  }
}

// Beim Laden und bei Größenänderungen ausführen
window.addEventListener('load', ensureVersionVisibility);
window.addEventListener('resize', ensureVersionVisibility);

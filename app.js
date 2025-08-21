/* app.js – Logik */
const STORAGE_KEY = "familyRing_upd56b";
let people = [];
const undoStack = []; const redoStack = [];

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* === Utility === */
function saveState(pushUndo=true){
  if(pushUndo) undoStack.push(JSON.stringify(people));
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
  // great-grandchildren: 1[A-Z]\d+[A-Z] ... etc (fallback by transitions count)
  // heuristic: count of digits blocks + letters beyond first
  let g = 1;
  // Walk through: after base '1', every letter step adds a generation (children),
  // every trailing digit block adds another generation (grandchildren levels)
  const rest = base.slice(1);
  if(!rest) return 1;
  // If first char is letter => gen >=2
  if(/[A-Z]/.test(rest[0])) g=2;
  // Count digits groups -> each adds one
  const m = rest.match(/\d+/g);
  if(m) g += m.length;
  return Math.max(1,g);
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
  for(const p of people){
    if(p.InheritedFrom){
      const donor = byCode[p.InheritedFrom];
      const donorChain = donor && donor.RingCode ? donor.RingCode : p.InheritedFrom;
      p.RingCode = donorChain + "→" + p.Code;
    }else{
      p.RingCode = p.Code; // includes partner x as-is
    }
  }
}

/* Render Table (with filter & highlight) */
function renderTable(){
  computeRingCodes();
  const q = ($("#search").value||"").trim().toLowerCase();
  const tb = $("#peopleTable tbody"); tb.innerHTML="";
  const mark = (txt)=>{
    if(!q) return txt;
    const s = String(txt||""); const i = s.toLowerCase().indexOf(q);
    if(i<0) return s;
    return s.slice(0,i) + "<mark>" + s.slice(i,i+q.length) + "</mark>" + s.slice(i+q.length);
  };
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
  svg.setAttribute("width","1600"); svg.setAttribute("height","800");
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
  const el = document.querySelector('#tableWrap');
  elementToPdfBlob(el, 'Tabelle').then(blob => shareOrDownloadPDF(blob, 'tabelle.pdf'));

}
function printTree(){

  const dlg = $("#dlgPrint"); if(dlg.open) dlg.close();
  const el = document.querySelector('#treeWrap');
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
  s = s.replace(/[a-z]/g, ch => ch.toUpperCase());
  s = s.replace(/X$/, 'x');
  return s;
}

function nextChildCode(parent){
  const kids = people.filter(p=>p.ParentCode===parent && p.Code.startsWith(parent));
  const nums = kids.map(k=> parseInt(k.Code.replace(parent,""),10)).filter(n=>!isNaN(n));
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
    if(partner==="1"){ code="1x"; /* ensure x lowercase */ gen=1; } else { code="1"; gen=1; }
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
  p.ParentCode=$("#eParent").value.trim();
  p.PartnerCode=$("#ePartner").value.trim();
  p.InheritedFrom=$("#eInherited").value.trim();
  p.Note=$("#eNote").value.trim();
  // Recompute gen if parent changed or code pattern changed (we keep code as is; gen from code if missing)
  if(!p.Gen) p.Gen = computeGenFromCode(p.Code);
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
      const data = JSON.parse(r.result);
      if(!Array.isArray(data)) throw new Error("Format");
      people = data;
      postLoadFixups();
      saveState(false);
      renderTable(); renderTree();
    }catch(e){ alert("Ungültige JSON-Datei"); }
  };
  r.readAsText(file);
}

/* Events */
$("#btnNew").addEventListener("click", openNew);
$("#saveNew").addEventListener("click", (e)=>{ e.preventDefault(); addNew(); $("#dlgNew").close(); });
$("#saveEdit").addEventListener("click", (e)=>{ e.preventDefault(); saveEditFn(); $("#dlgEdit").close(); });
$("#btnDelete").addEventListener("click", deletePerson);
$("#btnImport").addEventListener("click", ()=>{ const inp=document.createElement("input"); inp.type="file"; inp.accept=".json,application/json"; inp.onchange=()=>{ if(inp.files[0]) doImport(inp.files[0]); }; inp.click(); });
$("#btnExport").addEventListener("click", ()=> $("#dlgExport").showModal());
$("#btnExportJSON").addEventListener("click", exportJSON);
$("#btnExportCSV").addEventListener("click", exportCSV);
$("#btnPrint").addEventListener("click", ()=> $("#dlgPrint").showModal());
$("#btnPrintTable").addEventListener("click", ()=>{ printTable(); $("#dlgPrint").close(); });
$("#btnPrintTree").addEventListener("click", ()=>{ printTree(); $("#dlgPrint").close(); });
$("#btnStats").addEventListener("click", ()=>{ updateStats(); $("#dlgStats").showModal(); });
$("#btnHelp").addEventListener("click", ()=>{ fetch("help.html").then(r=>r.text()).then(html=>{ $("#helpContent").innerHTML=html; $("#dlgHelp").showModal(); }); });
$("#btnReset").addEventListener("click", ()=>{ if(confirm("Sollen wirklich alle Personen gelöscht werden?")){ people=[]; saveState(); renderTable(); renderTree(); }});
$("#btnUndo").addEventListener("click", ()=>{ if(!undoStack.length) return; redoStack.push(JSON.stringify(people)); people=JSON.parse(undoStack.pop()); localStorage.setItem(STORAGE_KEY, JSON.stringify(people)); renderTable(); renderTree(); });
$("#btnRedo").addEventListener("click", ()=>{ if(!redoStack.length) return; undoStack.push(JSON.stringify(people)); people=JSON.parse(redoStack.pop()); localStorage.setItem(STORAGE_KEY, JSON.stringify(people)); renderTable(); renderTree(); });

$("#search").addEventListener("input", renderTable);

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
loadState(); renderTable(); renderTree();


/* === PDF Export (Table or Tree) === */
async function elementToPdfBlob(el, title){
  // Clone to avoid layout shifts
  const clone = el.cloneNode(true);
  const wrapper = document.createElement('div');
  // Header with wappen & title
  const header = document.querySelector('.ribbon .title-wrap').cloneNode(true);
  header.style.marginBottom = '12px';
  wrapper.appendChild(header);
  wrapper.appendChild(clone);
  wrapper.style.padding = '16px';
  wrapper.style.background = '#ffffff';
  document.body.appendChild(wrapper);
  // Render to canvas
  const canvas = await html2canvas(wrapper, {scale: 2, backgroundColor: '#ffffff', useCORS: true});
  wrapper.remove();
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
}

async function shareOrDownloadPDF(blob, filename){
  const file = new File([blob], filename, {type:'application/pdf'});
  // iOS / share sheet support
  if(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
    try{
      await navigator.share({ files: [file], title: filename, text: filename });
      return;
    }catch(e){ /* fall through to download */ }
  }
  // Fallback download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
}


// ---- v70 palette & tree helpers ----
const V70_VERSION = "Family-Ring v70";

function getGenColorClass(gen) {
  const n = Number(gen)||0;
  const idx = n <= 0 ? 1 : (n>10 ? ((n-1)%10)+1 : n);
  return `gen-band-${idx}`;
}
function normalizeRowColors() {
  try {
    const table = document.querySelector('table');
    if (!table) return;
    const genIdx = Array.from(table.querySelectorAll('thead th')).findIndex(th => /\bgen\b/i.test(th.textContent));
    if (genIdx === -1) return;
    table.querySelectorAll('tbody tr').forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells[genIdx]) {
        const g = (cells[genIdx].textContent||'').trim();
        tr.setAttribute('data-gen', g);
      }
    });
  } catch(e){ console.warn('normalizeRowColors error', e); }
}

function v70WrapRenderTree() {
  if (window._v70Wrapped) return;
  const orig = window.renderFamilyTree || window.renderTree || null;
  window._v70Wrapped = true;
  window.renderFamilyTree = function(...args){
    if (orig) orig.apply(this, args);
    try { v70EnhanceTree(); } catch(e){ console.warn('v70EnhanceTree failed', e); }
  };
  if (!orig) {
    // minimal fallback draws nothing; rely on existing implementation if any
    console.warn('No base tree renderer found, v70 only enhances.');
  }
}

function v70EnhanceTree(){
  const svg = document.querySelector('#treeSvg, svg#stammbaum, svg.family-tree');
  if (!svg) return;

  // add generation bands if not present: expect data-generation on node groups or y grid of 160px
  const height = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal.height : (svg.getAttribute('height')? parseFloat(svg.getAttribute('height')):600);
  const width  = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal.width  : (svg.getAttribute('width')?  parseFloat(svg.getAttribute('width')):1000);
  const levelH = 160; // heuristic
  const levels = Math.ceil(height/levelH);
  // clear old bands
  svg.querySelectorAll('rect[class^="gen-band-"]').forEach(el=>el.remove());
  for(let i=0;i<levels;i++){
    const cls = getGenColorClass(i+1);
    const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x','0'); r.setAttribute('y', String(i*levelH));
    r.setAttribute('width', String(width)); r.setAttribute('height', String(levelH));
    r.setAttribute('class', cls);
    r.setAttribute('data-v70','band');
    svg.insertBefore(r, svg.firstChild);
  }

  // Attempt to fix lines: remove old v70 lines then redraw minimal set based on data attributes
  svg.querySelectorAll('[data-v70="line"]').forEach(el=>el.remove());

  // Expect node groups with data like <g class="node" data-id="CODE" data-gen="N" transform="translate(x,y)">
  const nodes = Array.from(svg.querySelectorAll('g.node'));
  const byId = new Map(nodes.map(n=>[n.getAttribute('data-id'), n]));
  function getPos(g){
    const tr = g.getAttribute('transform')||"";
    const m = tr.match(/translate\(([-0-9\.]+),\s*([-0-9\.]+)\)/);
    return m ? {x:parseFloat(m[1]), y:parseFloat(m[2])} : {x:0,y:0};
  }
  function nodeBoxAnchor(g){
    // anchor at bottom center for parent bus connection
    const rect = g.querySelector('rect');
    const pos = getPos(g);
    const w = rect ? parseFloat(rect.getAttribute('width')||'120') : 120;
    const h = rect ? parseFloat(rect.getAttribute('height')||'50') : 50;
    return {top:{x:pos.x+w/2,y:pos.y}, mid:{x:pos.x+w/2,y:pos.y+h/2}, bottom:{x:pos.x+w/2,y:pos.y+h}};
  }

  // relations expected in a hidden JSON element or window.peopleData
  const rel = window.peopleData || window.persons || null;
  if (!rel || !Array.isArray(rel)) return;

  // Build quick index by code
  const idx = new Map(rel.map(p=>[p.code||p.personCode||p.id, p]));

  // Helper draw line
  function line(x1,y1,x2,y2, dashed=false){
    const L = document.createElementNS('http://www.w3.org/2000/svg','line');
    L.setAttribute('x1',x1); L.setAttribute('y1',y1);
    L.setAttribute('x2',x2); L.setAttribute('y2',y2);
    L.setAttribute('class','kinline'); L.setAttribute('data-v70','line');
    if (dashed) { L.setAttribute('class','busline dashed'); }
    svg.appendChild(L);
  }
  function hline(x1,y,x2,dashed=false){
    const L = document.createElementNS('http://www.w3.org/2000/svg','line');
    L.setAttribute('x1',x1); L.setAttribute('y1',y);
    L.setAttribute('x2',x2); L.setAttribute('y2',y);
    L.setAttribute('class', dashed ? 'busline dashed' : 'busline');
    L.setAttribute('data-v70','line');
    svg.appendChild(L);
    return L;
  }
  function vline(x,y1,y2){
    const L = document.createElementNS('http://www.w3.org/2000/svg','line');
    L.setAttribute('x1',x); L.setAttribute('y1',y1);
    L.setAttribute('x2',x); L.setAttribute('y2',y2);
    L.setAttribute('class','kinline');
    L.setAttribute('data-v70','line');
    svg.appendChild(L);
    return L;
  }

  // Draw partner buslines and child connectors
  rel.forEach(p=>{
    const code = p.code || p.personCode || p.id;
    if (!code) return;
    const g = byId.get(code);
    if (!g) return;
    // partner handling
    const partners = (p.partners || p.partner ? (Array.isArray(p.partners)? p.partners : [p.partner]) : [])
      .map(c=>typeof c==='string'? c : (c && (c.code||c.personCode||c.id)));
    partners.forEach(pc=>{
      if (!pc) return;
      const gp = byId.get(pc);
      if (!gp) return;
      const a = nodeBoxAnchor(g), b = nodeBoxAnchor(gp);
      const y = Math.min(a.mid.y, b.mid.y) + Math.abs(a.mid.y - b.mid.y)/2;
      const x1 = Math.min(a.mid.x, b.mid.x);
      const x2 = Math.max(a.mid.x, b.mid.x);
      // Determine dashed if no common children
      const kidsA = (p.children||[]).map(c=>typeof c==='string'?c:c.code);
      const partnerObj = idx.get(pc) || {};
      const kidsB = (partnerObj.children||[]).map(c=>typeof c==='string'?c:c.code);
      const common = kidsA.filter(k=>kidsB.includes(k));
      const dashed = common.length===0;
      hline(x1, y, x2, dashed);
      // if there are common children, draw vertical spine down to mid between parents then to each child
      if (common.length>0){
        const spineX = (a.mid.x + b.mid.x)/2;
        const spineTop = y;
        common.forEach(kc=>{
          const kidg = byId.get(kc);
          if (!kidg) return;
          const kb = nodeBoxAnchor(kidg);
          vline(spineX, spineTop, kb.top.y); // to top of child box
          // short horizontal from spine to child top center? not needed, since line ends at box top center
        });
      }
    });
    // single parent to children (if no partners listed)
    if ((!partners || partners.length===0) && Array.isArray(p.children)){
      const a = nodeBoxAnchor(g);
      p.children.forEach(kc=>{
        const key = typeof kc==='string'? kc : (kc && (kc.code||kc.personCode||kc.id));
        const kidg = byId.get(key);
        if (!kidg) return;
        const kb = nodeBoxAnchor(kidg);
        vline(a.mid.x, a.bottom.y, kb.top.y);
      });
    }
  });
}

function v70Init(){
  try { normalizeRowColors(); } catch(e){}
  try { v70WrapRenderTree(); } catch(e){}
  const sl = document.getElementById('statusline');
  if (sl) sl.textContent = V70_VERSION;
}

document.addEventListener('DOMContentLoaded', v70Init);


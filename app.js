const APP_VERSION = "v83a";
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

function genColor(gen) {
  const palette = [
    '#c8f7c1', // Gen1 green
    '#cfe8ff', // Gen2 blue
    '#ffc9c9', // Gen3 red
    '#fff3b0', // Gen4 yellow
    '#e5d0ff', // Gen5 violet
    '#b2f5ea', // Gen6 turquoise
    '#ffd1a8', // Gen7 orange
    '#e2e8f0', // Gen8 gray
    '#ffd6e7'  // Gen9 pink
  ];
  const i = Math.max(0, (Number(gen||1)-1) % palette.length);
  return palette[i];
}



function renderTree() {
  const container = document.getElementById('treeCanvas');
  if (!container) return;
  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','100%');
  svg.setAttribute('height','600');
  container.appendChild(svg);

  const NODE_W = 180;
  const NODE_H = 40;
  const GAP_X = 40;
  const GAP_Y = 100;

  // group people by generation
  const gens = {};
  (people || []).forEach(p=>{
    const g = Number(p.Gen || p.Generation || 0);
    if (!gens[g]) gens[g]=[];
    gens[g].push(p);
  });

  const positions = new Map(); // personCode -> {x,y}
  let y = 20;
  const orderedGenerations = Object.keys(gens).map(n=>Number(n)).sort((a,b)=>a-b);
  orderedGenerations.forEach(g=>{
    const row = gens[g];
    let x = 20;
    row.forEach(p=>{
      // generation band
      const band = document.createElementNS(svg.namespaceURI,'rect');
      band.setAttribute('x', x-10);
      band.setAttribute('y', y-10);
      band.setAttribute('width', NODE_W+20);
      band.setAttribute('height', NODE_H+20);
      band.setAttribute('rx','8'); band.setAttribute('ry','8');
      band.setAttribute('fill', genColor(g));
      band.setAttribute('opacity','0.6');
      svg.appendChild(band);

      // node rect
      const rect = document.createElementNS(svg.namespaceURI,'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', NODE_W);
      rect.setAttribute('height', NODE_H);
      rect.setAttribute('rx','8'); rect.setAttribute('ry','8');
      rect.setAttribute('fill','#fff');
      rect.setAttribute('stroke','#d0d7de');
      svg.appendChild(rect);

      // label lines
      const t1 = document.createElementNS(svg.namespaceURI,'text');
      t1.setAttribute('x', x+8);
      t1.setAttribute('y', y+16);
      t1.setAttribute('font-size','12');
      t1.textContent = (p.Code || '') + ' / ' + (p.Name || '');
      svg.appendChild(t1);

      const t2 = document.createElementNS(svg.namespaceURI,'text');
      t2.setAttribute('x', x+8);
      t2.setAttribute('y', y+32);
      t2.setAttribute('font-size','11');
      const birth = (p.Birth || p.BirthDate || p.Geburtsdatum || '')+'';
      t2.textContent = 'Generation: ' + (p.Gen || p.Generation || '') + ' / ' + birth;
      svg.appendChild(t2);

      positions.set(p.Code, {x,y});
      x += NODE_W + GAP_X;
    });
    y += NODE_H + GAP_Y;
  });

  function cx(code){ const pos = positions.get(code); return pos ? pos.x + NODE_W/2 : 0; }
  function leftX(code){ const pos = positions.get(code); return pos ? pos.x : 0; }
  function rightX(code){ const pos = positions.get(code); return pos ? pos.x + NODE_W : 0; }
  function midY(code){ const pos = positions.get(code); return pos ? pos.y + NODE_H/2 : 0; }
  function topY(code){ const pos = positions.get(code); return pos ? pos.y : 0; }
  function bottomY(code){ const pos = positions.get(code); return pos ? pos.y + NODE_H : 0; }

  // draw partner bus lines (solid if common children, dashed if none)
  const couplesDrawn = new Set();
  (people || []).forEach(p=>{
    const partner = p.PartnerCode || p.Partner || p['Partner-Code'];
    if (!partner) return;
    const key = [p.Code, partner].sort().join('-');
    if (couplesDrawn.has(key)) return;
    couplesDrawn.add(key);
    if (!positions.has(p.Code) || !positions.has(partner)) return;
    const ymid = (midY(p.Code) + midY(partner)) / 2;
    const x1 = rightX(p.Code) < leftX(partner) ? rightX(p.Code) : rightX(partner) < leftX(p.Code) ? rightX(partner) : Math.min(cx(p.Code), cx(partner));
    const x2 = rightX(p.Code) < leftX(partner) ? leftX(partner) : rightX(partner) < leftX(p.Code) ? leftX(p.Code) : Math.max(cx(p.Code), cx(partner));

    const line = document.createElementNS(svg.namespaceURI,'line');
    line.setAttribute('x1', x1);
    line.setAttribute('x2', x2);
    line.setAttribute('y1', ymid);
    line.setAttribute('y2', ymid);

    // detect common children
    const hasJointChild = (people || []).some(k => {
      const pc = (k.ParentCode || k['Eltern-Code'] || '') + '';
      return pc.includes(p.Code) && pc.includes(partner);
    });
    if (!hasJointChild) {
      line.setAttribute('stroke-dasharray','6,4');
    }
    line.setAttribute('stroke','#222');
    line.setAttribute('stroke-width','1.2');
    svg.appendChild(line);
  });

  // draw vertical child lines
  (people || []).forEach(kid => {
    const parentCode = (kid.ParentCode || kid['Eltern-Code'] || '') + '';
    if (!parentCode) return;
    // Try to find two parents first
    const parents = (parentCode.match(/[0-9A-Za-zx>]+/g) || []).filter(code => positions.has(code));
    if (parents.length === 0) return;
    let xSource, ySource;
    if (parents.length >= 2) {
      // from bus (mid between parents)
      xSource = (cx(parents[0]) + cx(parents[1]))/2;
      ySource = (midY(parents[0]) + midY(parents[1]))/2;
    } else {
      // single parent
      xSource = cx(parents[0]);
      ySource = bottomY(parents[0]);
    }
    const xTarget = cx(kid.Code);
    const yTarget = topY(kid.Code);
    if (!xTarget || !yTarget) return;

    const vline = document.createElementNS(svg.namespaceURI,'path');
    const d = `M ${xSource} ${ySource} V ${yTarget}`;
    vline.setAttribute('d', d);
    vline.setAttribute('fill','none');
    vline.setAttribute('stroke','#222');
    vline.setAttribute('stroke-width','1.2');
    svg.appendChild(vline);
  });
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

// Fix: resolve printable element robustly
function resolvePrintableEl(sel, fallbackSel){
  let el = document.querySelector(sel);
  if(!el && fallbackSel) el = document.querySelector(fallbackSel);
  if(!el) { 
    // try to find by common ids/classes
    el = document.getElementById('peopleTable') || document.querySelector('table');
  }
  return el;
}

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
    // iOS fallback: open a print window with the already-rendered element instead
    // Find what we intended to print based on filename
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
  // Create a print-only document with header + selected content + footer date
  const title = 'Wappenringe der Familie GEPPERT';
  const when = new Date().toLocaleString('de-DE');

  const content = document.createElement('div');
  content.style.padding = '16px';
  const h = document.createElement('div');
  h.style.display='flex'; h.style.justifyContent='center'; h.style.alignItems='center'; h.style.gap='12px';
  h.innerHTML = `<img src="wappen.jpeg" style="height:40px"/><h2 style="margin:0">${title}</h2><img src="wappen.jpeg" style="height:40px"/>`;
  content.appendChild(h);

  const section = document.createElement('div');
  if(what==='table'){
    section.innerHTML = document.querySelector('.table-wrap').innerHTML;
  }else{
    // clone current tree SVG
    section.appendChild(document.getElementById('treeContainer').cloneNode(true));
  }
  content.appendChild(section);

  const f = document.createElement('div');
  f.style.marginTop='12px'; f.style.fontSize='12px'; f.style.textAlign='right'; f.textContent = `Stand: ${when}`;
  content.appendChild(f);

  const win = window.open('', '_blank');
  if(!win){ alert('Popup-Blocker verhindert den Druck. Bitte erlauben.'); return; }
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:6px}
      thead th{background:#f1f5f9}
      #tree{height:auto;overflow:visible;border:none}
      svg{width:100%}
      @media print{body{margin:0}}
    </style>
  </head><body></body></html>`);
  win.document.body.appendChild(content);
  // wait for images to load
  const imgs = win.document.images;
  let pending = imgs.length;
  const go = () => {
    if(isIOS()){
      // iOS native print dialog (user can share as PDF)
      win.focus(); win.print();
    }else{
      // default print dialog
      win.focus(); win.print();
    }
  };
  if(pending===0){
    setTimeout(go, 100);
  }else{
    for(const im of imgs){
      im.addEventListener('load', ()=>{ if(--pending===0) setTimeout(go,100); });
      im.addEventListener('error', ()=>{ if(--pending===0) setTimeout(go,100); });
    }
  }
  // close after print (best-effort; some browsers ignore)
  win.addEventListener('afterprint', ()=> setTimeout(()=>win.close(), 200));
}


window.addEventListener("DOMContentLoaded", () => {
  const v = APP_VERSION;
  const r = document.getElementById("version-ribbon");
  if (r) r.textContent = v;
  const t = document.getElementById("version-table");
  if (t) t.textContent = v;
});

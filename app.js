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




function printData() {
    // Dialog anzeigen: Auswahl Tabelle oder Stammbaum
    const choice = prompt("Was möchten Sie drucken? (T für Tabelle, S für Stammbaum)", "T");
    if (!choice) return;

    let doc = new jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
    });

    // Kopfzeile mit Wappen + Titel
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const title = "Family Ring";
    const date = new Date().toLocaleDateString();

    // Wappen links und rechts (der Nutzer stellt wappen.jpeg bereit)
    const imgWidth = 40;
    const imgHeight = 40;
    doc.addImage('wappen.jpeg', 'JPEG', 30, 20, imgWidth, imgHeight);
    doc.addImage('wappen.jpeg', 'JPEG', pageWidth - 30 - imgWidth, 20, imgWidth, imgHeight);

    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 40, { align: 'center' });

    doc.setFontSize(10);
    doc.text("Datum: " + date, pageWidth - 80, pageHeight - 20);

    if (choice.toUpperCase() === "T") {
        // Tabelle
        const table = document.getElementById("dataTable");
        if (table) {
            const rows = [];
            for (let r of table.rows) {
                const rowData = [];
                for (let c of r.cells) {
                    rowData.push(c.innerText);
                }
                rows.push(rowData);
            }
            doc.autoTable({ head: [rows[0]], body: rows.slice(1), startY: 80 });
        }
    } else {
        // Stammbaum: Screenshot via html2canvas
        const tree = document.getElementById("tree");
        if (tree) {
            html2canvas(tree).then(canvas => {
                const imgData = canvas.toDataURL("image/png");
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = pageWidth - 60;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                doc.addImage(imgData, "PNG", 30, 80, pdfWidth, pdfHeight);
                finalizePDF(doc);
            });
            return;
        }
    }
    finalizePDF(doc);
}

function finalizePDF(doc) {
    // PDF als Blob erzeugen
    const pdfBlob = doc.output("blob");
    if (navigator.share) {
        const file = new File([pdfBlob], "Family-Ring.pdf", { type: "application/pdf" });
        navigator.share({
            files: [file],
            title: "Family Ring",
            text: "Family Ring PDF"
        }).catch(err => {
            console.log("Teilen fehlgeschlagen:", err);
            doc.save("Family-Ring.pdf");
        });
    } else {
        doc.save("Family-Ring.pdf");
    }
}

// ---- v68b: robuste Druck-Events + iOS-freundliches Drucken per IFRAME ----

// 1) Delegiertes Click-Handling für die zwei Auswahlknöpfe im Druck-Dialog
document.addEventListener('click', (ev) => {
  const t = ev.target;

  // a) neue Variante über data-print
  if (t && t.dataset && t.dataset.print) {
    ev.preventDefault();
    const what = t.dataset.print === 'table' ? 'table' : 'tree';
    closePrintDialogIfOpen();
    printSectionIFRAME(what);
    return;
  }

  // b) alte Variante über fixe IDs (falls dein Dialog so gebaut ist)
  if (t && (t.id === 'printTableBtn' || t.id === 'printTreeBtn')) {
    ev.preventDefault();
    const what = t.id === 'printTableBtn' ? 'table' : 'tree';
    closePrintDialogIfOpen();
    printSectionIFRAME(what);
  }
});

// 2) Hilfsfunktion: vorhandenen Print-Dialog schließen (kl. Schutzmaßnahme)
function closePrintDialogIfOpen() {
  const dlg = document.getElementById('printDialog') || document.querySelector('.print-dialog');
  if (dlg && dlg.parentElement) {
    // Falls du einen Overlay/Modal-Manager nutzt, rufe hier dessen close() auf.
    try { dlg.remove(); } catch(_) {}
  }
}

// 3) iOS-freundliches Drucken: Inhalt in unsichtbares IFRAME klonen und drucken
function printSectionIFRAME(what) {
  const title = 'Wappenringe der Familie GEPPERT';
  const dateStr = new Date().toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });

  // Quelle bestimmen
  const srcNode = (what === 'table')
    ? document.querySelector('#peopleTableWrapper') || document.querySelector('#peopleTable') || document.querySelector('.people-table')
    : document.querySelector('#treeContainer') || document.querySelector('#treeArea') || document.querySelector('.tree-area');

  if (!srcNode) {
    alert('Zu druckender Bereich wurde nicht gefunden.');
    return;
  }

  // IFRAME erstellen
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;

  // Minimales Druck-HTML (Wappen links/rechts, Überschrift, Inhalt, Fußzeile)
  doc.open();
  doc.write(`
    <!doctype html>
    <html lang="de">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
      <style>
        *{box-sizing:border-box;}
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Helvetica Neue",Arial,sans-serif;margin:24px;}
        .print-header{
          display:flex; align-items:center; justify-content:center; gap:12px;
          font-size:22px; font-weight:700; margin-bottom:16px;
        }
        .print-header img{ height:28px; width:auto; }
        .print-content{ page-break-inside:avoid; }
        .print-footer{
          margin-top:16px; text-align:center; font-size:12px; color:#555;
        }
        /* Falls deine Tabelle/Tree eigene Klassen braucht, etwas Grund-Layout mitgeben */
        table{ width:100%; border-collapse:collapse; }
        th, td{ border:1px solid #e5e7eb; padding:8px; }
      </style>
    </head>
    <body>
      <div class="print-header">
        <img src="wappen.jpeg" alt="">
        <span>${title}</span>
        <img src="wappen.jpeg" alt="">
      </div>
      <div class="print-content" id="printContent"></div>
      <div class="print-footer">Gedruckt am ${dateStr}</div>
      <script>
        // Schrift-Ladehilfe für iOS: erst drucken, wenn Fonts bereit
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){
          setTimeout(function(){ window.focus(); window.print(); }, 100);
        });
        window.onafterprint = function(){ setTimeout(function(){ window.close && window.close(); }, 50); };
      </script>
    </body>
    </html>
  `);
  doc.close();

  // Inhalt klonen
  const contentHolder = doc.getElementById('printContent');
  try {
    contentHolder.appendChild(srcNode.cloneNode(true));
  } catch(_){ /* falls Shadow/Canvas: alternativ innerHTML kopieren */ 
    contentHolder.innerHTML = srcNode.innerHTML;
  }

  // Sicherheitsfallback: falls onload/Fonts nicht feuern, nachkurz drucken
  setTimeout(() => {
    try { iframe.contentWindow && iframe.contentWindow.focus(); iframe.contentWindow && iframe.contentWindow.print(); } catch(_) {}
    // IFRAME später wegräumen
    setTimeout(() => { try { iframe.remove(); } catch(_) {} }, 2000);
  }, 800);
}

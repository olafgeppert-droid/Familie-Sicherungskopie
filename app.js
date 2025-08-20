/* Family-Ring v59r minimal patch: printing + tree lines */
(() => {

// ---------- Utilities ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || 
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function fmtDate(s){ // normalize TT.MM.JJJJ
  if(!s) return '';
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if(!m) return s;
  const [_,d,mo,y] = m;
  return `${d.padStart(2,'0')}.${mo.padStart(2,'0')}.${y.length===2?('19'+y):y}`;
}
function normalizeCode(code){
  if(!code) return '';
  let c = code.toString().trim();
  // letters uppercase, partner suffix x always lowercase
  // e.g. 1a -> 1A; 1bX -> 1Bx
  c = c.replace(/([a-zA-Z]+)/g, m => m.toUpperCase());
  c = c.replace(/X$/,'x');
  c = c.replace(/x+/,'x'); // single x
  return c;
}
function generationFromCode(code){
  if(!code) return 1;
  const core = code.replace(/x$/,''); // ignore partner suffix
  const count = (core.match(/[A-Z0-9]/g)||[]).length;
  // core like "1" -> 1; "1A" -> 2; "1A1" -> 3 etc.
  return count;
}

// ---------- Data (sample minimal set; real data persists in localStorage) ----------
const LS_KEY = 'family-ring-data-v59';
let people = load() || sample();

function sample(){
  return [
    { code:'1', name:'Geppert, Olaf', birth:'01.01.1960', gender:'m', father:'', mother:'', partners:['1x'], inheritedFrom:'' },
    { code:'1x', name:'Geppert, Irina', birth:'02.02.1962', gender:'w', father:'', mother:'', partners:['1'], inheritedFrom:'' },
    { code:'1A', name:'Geppert, Anna', birth:'03.03.1985', gender:'w', father:'1', mother:'1x', partners:[], inheritedFrom:'' },
    { code:'1B', name:'Geppert, Bernd', birth:'04.04.1988', gender:'m', father:'1', mother:'1x', partners:[], inheritedFrom:'' },
    { code:'1A1', name:'Muster, Clara', birth:'05.05.2010', gender:'w', father:'1A', mother:'', partners:[], inheritedFrom:'' },
  ];
}
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(people)); }
function load(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'null'); }catch{ return null; } }

function upsertPerson(p){
  // normalize codes
  p.code = normalizeCode(p.code);
  p.father = normalizeCode(p.father);
  p.mother = normalizeCode(p.mother);
  p.partners = (p.partners||[]).map(normalizeCode).filter(Boolean);
  p.birth = fmtDate(p.birth);

  const i = people.findIndex(x => x.code === p.code);
  if(i>=0) people[i] = p; else people.push(p);
  save();
  renderAll();
}

function deletePersonByQuery(q){
  const query = q.trim().toLowerCase();
  // find by code exact or by name contains
  const victim = people.find(p => p.code.toLowerCase() === query) || 
                 people.find(p => (p.name||'').toLowerCase().includes(query));
  if(!victim) return false;
  const code = victim.code;
  // remove person
  people = people.filter(p => p.code !== code);
  // remove references
  people.forEach(p => {
    if(p.father === code) p.father = '';
    if(p.mother === code) p.mother = '';
    p.partners = (p.partners||[]).filter(pc => pc !== code);
    if(p.inheritedFrom === code) p.inheritedFrom = '';
  });
  save();
  renderAll();
  return true;
}

// Ringcode: default = own person code; if inherits, append " -> {heirCode}"?
// Based on earlier rule: partner keeps x suffix in ring code
function computeRingCode(p){
  // own code by default
  let rc = p.code;
  // normalize x
  rc = rc.replace(/X$/,'x');
  // if inheritedFrom exists, append arrow + own code to erblasser code (erblasser already engraved)
  if(p.inheritedFrom){
    const e = people.find(x => x.code === normalizeCode(p.inheritedFrom));
    if(e){
      rc = `${e.code}→${p.code}`;
    }
  }
  return rc;
}

// ---------- Table ----------
function renderTable(){
  const tbody = $("#peopleTable tbody");
  tbody.innerHTML = '';
  const term = ($("#search").value||'').trim().toLowerCase();
  for(const p of peopleSorted()){
    const gen = generationFromCode(p.code);
    const row = document.createElement('tr');
    const fields = [
      gen,
      p.code,
      computeRingCode(p),
      p.name||'',
      p.birth||'',
      p.gender||'',
      p.inheritedFrom||'',
      p.father||'',
      p.mother||'',
      (p.partners||[]).join(', ')
    ];
    for(const f of fields){
      const td = document.createElement('td');
      const text = (f==null?'':String(f));
      if(term && text.toLowerCase().includes(term)){
        const re = new RegExp(`(${escapeRegExp(term)})`,'ig');
        td.innerHTML = text.replace(re, '<mark>$1</mark>');
      }else{
        td.textContent = text;
      }
      row.appendChild(td);
    }
    row.addEventListener('dblclick', () => openEdit(p.code));
    if(term){
      const inRow = fields.some(f => String(f||'').toLowerCase().includes(term));
      if(!inRow) row.style.display='none';
    }
    tbody.appendChild(row);
  }
}
function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function peopleSorted(){
  // sort by generation, then by code
  const arr = [...people];
  arr.sort((a,b)=>{
    const ga = generationFromCode(a.code), gb = generationFromCode(b.code);
    if(ga!==gb) return ga-gb;
    return a.code.localeCompare(b.code, 'de');
  });
  return arr;
}

// ---------- Tree (SVG) ----------
const TREE = { nodeW: 150, nodeH: 46, vGap: 90, hGap: 40, margin: 30 };

function buildIndex(){
  const idx = new Map(people.map(p => [p.code, p]));
  const childrenOf = new Map();
  for(const c of people){
    if(c.father) (childrenOf.get(c.father) || childrenOf.set(c.father,[]).get(c.father)).push(c.code);
    if(c.mother) (childrenOf.get(c.mother) || childrenOf.set(c.mother,[]).get(c.mother)).push(c.code);
  }
  return {idx, childrenOf};
}

function couples(){
  const seen = new Set();
  const cps = [];
  for(const p of people){
    for(const partner of (p.partners||[])){
      const pair = [p.code, partner].sort().join('|');
      if(seen.has(pair)) continue;
      seen.add(pair); cps.push([p.code, partner]);
    }
  }
  return cps;
}

function childrenOfCouple(a,b){
  // children where parents are exactly {a,b} in any order
  return people.filter(c => {
    const parents = [normalizeCode(c.father), normalizeCode(c.mother)].filter(Boolean).sort().join('|');
    const ab = [normalizeCode(a), normalizeCode(b)].sort().join('|');
    return parents && parents === ab;
  });
}

function layoutNodes(){
  // group by generation
  const byGen = new Map();
  for(const p of people){
    const g = generationFromCode(p.code);
    (byGen.get(g) || byGen.set(g,[]).get(g)).push(p);
  }
  // within each generation, stable sort by code
  for(const g of byGen.keys()){
    byGen.get(g).sort((a,b)=>a.code.localeCompare(b.code,'de'));
  }
  // positions
  const pos = new Map();
  let maxGen = 1;
  for(const g of [...byGen.keys()].sort((a,b)=>a-b)){
    maxGen = Math.max(maxGen,g);
    const row = byGen.get(g);
    row.forEach((p,i)=>{
      const x = TREE.margin + i*(TREE.nodeW+TREE.hGap);
      const y = TREE.margin + (g-1)*(TREE.nodeH+TREE.vGap);
      pos.set(p.code, {x,y,g});
    });
  }
  return {pos, maxGen};
}

function renderTree(){
  const svg = $("#treeSVG");
  svg.innerHTML = '';
  const {pos, maxGen} = layoutNodes();

  // resize svg
  const cols = Math.max(1, people.length);
  svg.setAttribute('width', Math.max(1600, TREE.margin*2 + cols*(TREE.nodeW+TREE.hGap)));
  svg.setAttribute('height', TREE.margin*2 + (maxGen)*(TREE.nodeH+TREE.vGap)+80);

  // generation bands
  for(let g=1; g<=maxGen; g++){
    const y = TREE.margin + (g-1)*(TREE.nodeH+TREE.vGap) - 12;
    const h = TREE.nodeH + 24;
    const band = document.createElementNS('http://www.w3.org/2000/svg','rect');
    band.setAttribute('x','0'); band.setAttribute('y', String(y));
    band.setAttribute('width', '100%'); band.setAttribute('height', String(h));
    band.setAttribute('class','gen-band');
    band.setAttribute('fill', ['var(--gen1)','var(--gen2)','var(--gen3)','var(--gen4)'][(g-1)%4]);
    svg.appendChild(band);
  }

  // draw partner bus lines for couples with children and without children
  const cps = couples();
  for(const [a,b] of cps){
    const pa = pos.get(a), pb = pos.get(b);
    if(!pa || !pb) continue;
    const y = (pa.y + pb.y)/2; // try align at same row; if not same row, draw at higher one
    const yLine = Math.min(pa.y, pb.y) + TREE.nodeH/2;
    const x1 = pa.x + TREE.nodeW; // right edge of a
    const x2 = pb.x;              // left edge of b
    const hx1 = Math.min(pa.x, pb.x) + TREE.nodeW/2;
    const hx2 = Math.max(pa.x, pb.x) + TREE.nodeW/2;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', String(hx1));
    line.setAttribute('x2', String(hx2));
    line.setAttribute('y1', String(pa.y + TREE.nodeH/2));
    line.setAttribute('y2', String(pb.y + TREE.nodeH/2));
    line.setAttribute('class','link bus');
    if(childrenOfCouple(a,b).length===0){
      line.classList.add('partner-only');
    }
    svg.appendChild(line);
  }

  // parent-child verticals (from couple-bus if exists, else from single parent)
  for(const child of people){
    const pCodes = [child.father, child.mother].filter(Boolean);
    if(pCodes.length===0) continue;
    const pc = pCodes.map(normalizeCode);
    let anchorX=null, anchorY=null;
    if(pc.length===2){
      const [paCode, pbCode] = pc;
      const pa = pos.get(paCode), pb = pos.get(pbCode);
      if(pa && pb){
        anchorX = (pa.x + pb.x)/2 + TREE.nodeW/2;
        anchorY = (pa.y + pb.y)/2 + TREE.nodeH/2;
        // ensure a horizontal bus between parents is visible (if not already exact row)
        // (already drawn above)
      }
    }
    if(anchorX==null){
      // single parent
      const p0 = pos.get(pc[0]);
      if(!p0) continue;
      anchorX = p0.x + TREE.nodeW/2;
      anchorY = p0.y + TREE.nodeH;
    }
    const cpos = pos.get(child.code);
    if(!cpos) continue;
    const vert = document.createElementNS('http://www.w3.org/2000/svg','line');
    vert.setAttribute('x1', String(anchorX));
    vert.setAttribute('x2', String(anchorX));
    vert.setAttribute('y1', String(anchorY));
    vert.setAttribute('y2', String(cpos.y));
    vert.setAttribute('class','line-vert');
    svg.appendChild(vert);
  }

  // draw nodes
  for(const p of peopleSorted()){
    const posP = pos.get(p.code); if(!posP) continue;
    const g = posP.g;
    const group = document.createElementNS('http://www.w3.org/2000/svg','g');
    const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x', String(posP.x));
    rect.setAttribute('y', String(posP.y));
    rect.setAttribute('width', String(TREE.nodeW));
    rect.setAttribute('height', String(TREE.nodeH));
    rect.setAttribute('rx','8'); rect.setAttribute('ry','8');
    rect.setAttribute('class','node');
    group.appendChild(rect);

    const t1 = document.createElementNS('http://www.w3.org/2000/svg','text');
    t1.setAttribute('x', String(posP.x+8));
    t1.setAttribute('y', String(posP.y+16));
    t1.textContent = `${p.code} / ${p.name||''}`;
    group.appendChild(t1);

    const t2 = document.createElementNS('http://www.w3.org/2000/svg','text');
    t2.setAttribute('x', String(posP.x+8));
    t2.setAttribute('y', String(posP.y+32));
    t2.textContent = `Gen ${generationFromCode(p.code)} / ${p.birth||''}`;
    group.appendChild(t2);

    svg.appendChild(group);
  }
}

// ---------- Printing (select table or tree) ----------
function openPrintDialog(){
  $("#dlgPrint").showModal();
}
function doPrint(){
  const what = ($("#formPrint input[name='what']:checked")?.value)||'table';
  printSection(what);
}

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
      #treeContainer{height:auto;overflow:visible;border:none}
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

// ---------- Import / Export ----------
function exportData(){
  $("#dlgExport").showModal();
}
function doExport(){
  const fmt = ($("#formExport input[name='fmt']:checked")?.value)||'json';
  const data = JSON.stringify(people, null, fmt==='json'?2:0);
  let blob, filename;
  if(fmt==='json'){
    blob = new Blob([data], {type:'application/json'});
    filename = 'family-ring.json';
  }else{
    // CSV
    const header = ['Gen','Code','Ringcode','Name','Geburtsdatum','Geschlecht','GeerbtVon','Vater','Mutter','Partner'];
    const rows = peopleSorted().map(p=>[
      generationFromCode(p.code), p.code, computeRingCode(p), p.name||'', p.birth||'', p.gender||'',
      p.inheritedFrom||'', p.father||'', p.mother||'', (p.partners||[]).join(' ; ')
    ]);
    const csv = [header, ...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    blob = new Blob([csv], {type:'text/csv'});
    filename = 'family-ring.csv';
  }
  const file = new File([blob], filename, {type: blob.type});
  if(isIOS() && navigator.share && navigator.canShare && navigator.canShare({ files:[file] })){
    navigator.share({ files:[file], title:'Family-Ring Export', text:'Sicherung der Datenbank' }).catch(()=>{});
  }else{
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
}

// ---------- Dialoge ----------
function openNew(){
  const dlg = $("#dlgNew");
  $("#formNew").reset();
  dlg.showModal();
}
function saveNew(e){
  e?.preventDefault();
  const fd = new FormData($("#formNew"));
  const name = (fd.get('name')||'').toString().trim();
  if(!name){
    // allow cancel even without name; but do not save
    $("#dlgNew").close(); 
    return;
  }
  const person = {
    code: suggestCode(fd),
    name,
    birth: fmtDate(fd.get('birth')),
    gender: fd.get('gender')||'',
    father: normalizeCode(fd.get('father')),
    mother: normalizeCode(fd.get('mother')),
    partners: (fd.get('partners')||'').toString().split(',').map(s=>normalizeCode(s.trim())).filter(Boolean),
    inheritedFrom: normalizeCode(fd.get('inheritedFrom'))
  };
  upsertPerson(person);
  $("#dlgNew").close();
}
function suggestCode(fd){
  // very simplified suggestion: inherit base line from father or mother, else "1"
  const f = normalizeCode(fd.get('father'));
  const m = normalizeCode(fd.get('mother'));
  if(f) return nextChildCode(f);
  if(m) return nextChildCode(m.replace(/x$/,''));
  // default first root child of Stammvater 1
  return nextChildCode('1');
}
function nextChildCode(parentCode){
  // children codes append incrementing number suffix within that line based on existing siblings' birthdate order
  const kids = people.filter(p => p.father===parentCode || p.mother===parentCode)
  .sort((a,b)=>((a.birth||'').localeCompare(b.birth||'')));
  // parent might be like 1A; first child 1A1, second 1A2, ...
  const used = new Set(kids.map(k => (k.code.match(/^(.+?)(\d+)$/)||[])[2]).filter(Boolean));
  let n=1; while(used.has(String(n))) n++;
  return normalizeCode(parentCode + String(n));
}
function openEdit(code){
  const p = people.find(x=>x.code===code); if(!p) return;
  const dlg = $("#dlgNew");
  $("#formNew").reset();
  dlg.querySelector("h3").textContent = "Person ändern";
  const f = $("#formNew");
  f.elements['name'].value = p.name||'';
  f.elements['birth'].value = p.birth||'';
  f.elements['gender'].value = p.gender||'';
  f.elements['father'].value = p.father||'';
  f.elements['mother'].value = p.mother||'';
  f.elements['partners'].value = (p.partners||[]).join(', ');
  f.elements['inheritedFrom'].value = p.inheritedFrom||'';
  dlg.showModal();
  // on save, keep existing code
  const oldSave = saveNew;
  $("#btnSaveNew").onclick = (ev)=>{
    ev?.preventDefault();
    const fd = new FormData($("#formNew"));
    const name = (fd.get('name')||'').toString().trim();
    if(!name){ $("#dlgNew").close(); return; }
    const updated = {
      code: p.code,
      name,
      birth: fmtDate(fd.get('birth')),
      gender: fd.get('gender')||'',
      father: normalizeCode(fd.get('father')),
      mother: normalizeCode(fd.get('mother')),
      partners: (fd.get('partners')||'').toString().split(',').map(s=>normalizeCode(s.trim())).filter(Boolean),
      inheritedFrom: normalizeCode(fd.get('inheritedFrom'))
    };
    upsertPerson(updated);
    $("#dlgNew").close();
    // restore default handler
    $("#btnSaveNew").onclick = saveNew;
  };
}

// ---------- Stats ----------
function openStats(){
  const total = people.length;
  const m = people.filter(p=>p.gender==='m').length;
  const w = people.filter(p=>p.gender==='w').length;
  const d = people.filter(p=>p.gender==='d').length;
  const byGen = {};
  for(const p of people){ const g=generationFromCode(p.code); byGen[g]=(byGen[g]||0)+1; }
  const lines = [
    `<h3>Statistik</h3>`,
    `<p><strong>Gesamtanzahl Personen:</strong> ${total}</p>`,
    `<p><strong>Davon männlich:</strong> ${m} &nbsp; <strong>weiblich:</strong> ${w} &nbsp; <strong>divers:</strong> ${d}</p>`,
    `<h4>Pro Generation</h4>`,
    `<ul>${Object.keys(byGen).sort((a,b)=>a-b).map(g=>`<li>Gen ${g}: ${byGen[g]}</li>`).join('')}</ul>`
  ].join('');
  $("#statsContent").innerHTML = lines;
  $("#dlgStats").showModal();
}

// ---------- Bindings ----------
function bind(){
  $("#btnNew").addEventListener('click', openNew);
  $("#btnSaveNew").addEventListener('click', saveNew);
  $("#btnCancelNew").addEventListener('click', (e)=>{ e.preventDefault(); $("#dlgNew").close(); }); // allow cancel any time
  $("#btnDelete").addEventListener('click', ()=>$("#dlgDelete").showModal());
  $("#btnConfirmDelete").addEventListener('click', (e)=>{
    e.preventDefault();
    const ok = deletePersonByQuery(new FormData($("#formDelete")).get('query')||'');
    $("#dlgDelete").close();
    if(!ok) alert('Keine passende Person gefunden.');
  });
  $("#btnExport").addEventListener('click', exportData);
  $("#btnDoExport").addEventListener('click', (e)=>{ e.preventDefault(); $("#dlgExport").close(); doExport(); });
  $("#btnPrint").addEventListener('click', openPrintDialog);
  $("#btnDoPrint").addEventListener('click', (e)=>{ e.preventDefault(); $("#dlgPrint").close(); doPrint(); });
  $("#btnStats").addEventListener('click', openStats);
  $("#btnCloseStats").addEventListener('click', ()=>$("#dlgStats").close());
  $("#btnHelp").addEventListener('click', ()=>$("#dlgHelp").showModal());
  $("#btnCloseHelp").addEventListener('click', ()=>$("#dlgHelp").close());
  $("#btnReset").addEventListener('click', ()=>{
    if(confirm("Sollen wirklich alle Personen gelöscht werden?")){
      people = []; save(); renderAll();
    }
  });
  $("#search").addEventListener('input', renderTable);
}
function renderAll(){
  renderTable();
  renderTree();
}
document.addEventListener('DOMContentLoaded', ()=>{
  bind();
  renderAll();
});

})();
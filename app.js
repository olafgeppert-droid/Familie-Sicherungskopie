/* family-ring-webapp-v3-upd49 (auf Basis upd46, nur gewünschte Änderungen) */

// ---- Persistenz ----
const LS_KEY = 'family_ring_persons_v1';
const HISTORY = { past: [], future: [] };

function saveState() {
  HISTORY.past.push(JSON.stringify(persons));
  if (HISTORY.past.length > 50) HISTORY.past.shift();
  HISTORY.future = [];
}
function undoAction() {
  if (!HISTORY.past.length) return;
  HISTORY.future.push(JSON.stringify(persons));
  persons = JSON.parse(HISTORY.past.pop());
  renderAll();
}
function redoAction() {
  if (!HISTORY.future.length) return;
  HISTORY.past.push(JSON.stringify(persons));
  persons = JSON.parse(HISTORY.future.pop());
  renderAll();
}

function saveToStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(persons));
}
function loadFromStorage() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return false;
  try { persons = JSON.parse(raw); return true; } catch(e){ return false; }
}

// ---- Datenmodell ----
/*
 Spalten: Code, Name, Geburtsdatum, Geschlecht, Partner, Eltern, Kinder, Ringcode, Geerbt von, Bemerkung, Sonstiges
 Interne Felder:
   code, name, birth(YYYY-MM-DD), gender, partnerCodes[], parentsCode?, childrenCodes[],
   ring, inheritedFrom, note, misc, created, updated
*/

let persons = [];

// --- Hilfsfunktionen ---
const CODE_RE = /^1([A-Z]+)?(\d+)?(x)?$/; // 1, 1x, 1A, 1Ax, 1A1, 1A1x ...
function isPartnerCode(code){ return /x$/.test(code); }
function baseCode(code){ return code.replace(/x$/,''); }
function partnerOf(code){ return baseCode(code)+'x'; }
function normalizeCode(code){
  if(!code) return '';
  let c = String(code).trim();
  c = c.replace(/[a-wyz]/g, ch => ch.toUpperCase()); // alle Buchstaben außer x -> Uppercase
  c = c.replace(/X$/,'x'); // Partnersuffix klein
  return c;
}
function birthToSort(b){ return b ? b : '9999-12-31'; }

function compareByBirth(a,b){
  // Leere Daten ans Ende
  if(!a.birth && !b.birth) return 0;
  if(!a.birth) return 1;
  if(!b.birth) return -1;
  return a.birth.localeCompare(b.birth);
}

function getByCode(code){ return persons.find(p => p.code === code); }
function ensureLinkages(){
  // Rebuild children from parentsCode
  persons.forEach(p => p.childrenCodes = []);
  persons.forEach(p => {
    if (p.parentsCode){
      const parent = getByCode(p.parentsCode);
      if (parent){
        parent.childrenCodes.push(p.code);
      }
    }
  });
}

// ---- Codevergabe nach Logik ----
// Kinder des Stammvaters (1/1x) bekommen 1A, 1B, ... basierend auf Geburtsdatum
// Kinder eines Kindes (z.B. 1A) bekommen 1A1, 1A2, ... nach Geburtsdatum
function assignChildCode(parentCode, childBirth){
  parentCode = normalizeCode(parentCode);
  const parent = getByCode(parentCode) || getByCode(baseCode(parentCode)) || getByCode(partnerOf(parentCode));
  if (!parent) return ''; // kann nicht vergeben werden

  if (baseCode(parent.code) === '1' && !/\w{2,}/.test(parent.code.replace('1',''))){ 
    // Kinder des Stammvaters (Gen 2): 1A,1B,...
    const siblings = persons.filter(p => p.parentsCode === '1' || baseCode(p.parentsCode) === '1');
    const sorted = [...siblings].sort(compareByBirth);
    // Finde Position des Kindes im sortierten Array wenn eingefügt
    const idx = [...sorted, {birth: childBirth}].sort(compareByBirth).findIndex(x => x.birth === childBirth);
    return '1' + String.fromCharCode(65 + idx); // 65 = 'A'
  }

  // Kinder eines Gen-2-Codes (z.B. 1A): -> 1A1,1A2,...
  const gen2Match = parent.code.match(/^1[A-Z]+(x)?$/);
  if (gen2Match){
    const parentBase = baseCode(parent.code);
    const siblings = persons.filter(p => p.parentsCode === parentBase);
    const sorted = [...siblings].sort(compareByBirth);
    const idx = [...sorted, {birth: childBirth}].sort(compareByBirth).findIndex(x => x.birth === childBirth);
    return parentBase + String(idx+1);
  }

  // Für tiefere Ebenen (Kind von 1A1) → wieder Buchstaben anhängen (A,B,...)
  const gen3Match = parent.code.match(/^1[A-Z]+\d+(x)?$/);
  if (gen3Match){
    const parentBase = baseCode(parent.code);
    const siblings = persons.filter(p => p.parentsCode === parentBase);
    const sorted = [...siblings].sort(compareByBirth);
    const idx = [...sorted, {birth: childBirth}].sort(compareByBirth).findIndex(x => x.birth === childBirth);
    return parentBase + String.fromCharCode(65 + idx);
  }
  return '';
}

function computeRingCode(code, inheritedFrom){
  code = normalizeCode(code);
  inheritedFrom = normalizeCode(inheritedFrom || '');
  if (inheritedFrom) return `${inheritedFrom}→${code}`;
  return code;
}

// ---- Rendering ----
function highlight(hay){
  const q = (document.getElementById('search').value || '').trim();
  if(!q) return hay;
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return String(hay).replace(re, m => `<mark>${m}</mark>`);
}
function renderTable(){
  const tb = document.getElementById('tbody');
  tb.innerHTML='';
  persons.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${highlight(p.code)}</td>
      <td>${highlight(p.name||'')}</td>
      <td>${highlight(p.birth||'')}</td>
      <td>${highlight(p.gender||'')}</td>
      <td>${highlight((p.partnerCodes||[]).join(', '))}</td>
      <td>${highlight(p.parentsCode||'-')}</td>
      <td>${highlight((p.childrenCodes||[]).join(', '))}</td>
      <td>${highlight(p.ring||'')}</td>
      <td>${highlight(p.inheritedFrom||'-')}</td>
      <td>${highlight(p.note||'')}</td>
      <td>${highlight(p.misc||'')}</td>
    `;
    tr.ondblclick = () => openEdit(p.code);
    tb.appendChild(tr);
  });
}

// Stammbaum (einfaches Layer-Layout)
function generationOf(code){
  code = normalizeCode(code);
  if (/^1x?$/.test(code)) return 1;
  if (/^1[A-Z]+x?$/.test(code)) return 2;
  if (/^1[A-Z]+\d+x?$/.test(code)) return 3;
  return 4;
}
function layoutTree(){
  const svg = document.getElementById('tree');
  while(svg.firstChild) svg.removeChild(svg.firstChild);
  const padX = 40, padY = 60, boxW = 180, boxH = 60, vGap = 100, hGap = 30;

  const gens = [1,2,3,4].map(g => persons.filter(p => generationOf(p.code)===g));
  gens.forEach(g => g.sort((a,b)=> (a.code>b.code?1:-1)));

  // x positions per gen
  const positions = new Map(); // code -> {x,y}
  gens.forEach((arr, gi) => {
    const y = padY + gi*(boxH+vGap);
    arr.forEach((p, idx) => {
      const x = padX + idx*(boxW+hGap);
      positions.set(p.code, {x,y});
    });
  });

  function rectWithText(p){
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    const pos = positions.get(p.code);
    const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x', pos.x);
    r.setAttribute('y', pos.y);
    r.setAttribute('rx','8'); r.setAttribute('ry','8');
    r.setAttribute('width', boxW); r.setAttribute('height', boxH);
    r.setAttribute('class','node');
    const t1 = document.createElementNS('http://www.w3.org/2000/svg','text');
    t1.setAttribute('x', pos.x+8); t1.setAttribute('y', pos.y+18);
    t1.textContent = `${p.code} — ${p.name||''}`;
    const t2 = document.createElementNS('http://www.w3.org/2000/svg','text');
    t2.setAttribute('x', pos.x+8); t2.setAttribute('y', pos.y+38);
    t2.textContent = p.birth ? `* ${p.birth}` : '';
    g.appendChild(r); g.appendChild(t1); g.appendChild(t2);
    svg.appendChild(g);
  }

  // draw nodes
  persons.forEach(rectWithText);

  // draw partner lines & child links
  persons.forEach(p => {
    const posP = positions.get(p.code);
    if (!posP) return;
    // partner line
    (p.partnerCodes||[]).forEach(pc => {
      const q = getByCode(pc);
      if (!q) return;
      const posQ = positions.get(q.code);
      if (!posQ) return;
      const y = posP.y + boxH/2;
      const x1 = posP.x + boxW;
      const x2 = posQ.x;
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', Math.min(x1,x2));
      line.setAttribute('y1', y);
      line.setAttribute('x2', Math.max(x1,x2));
      line.setAttribute('y2', y);
      line.setAttribute('class','partner');
      svg.appendChild(line);
    });

    // parent-child link
    if (p.parentsCode){
      const par = getByCode(p.parentsCode);
      if (par){
        const posPar = positions.get(par.code);
        if (posPar){
          const x = posP.x + boxW/2;
          const y1 = posPar.y + boxH;
          const y2 = posP.y;
          const v = document.createElementNS('http://www.w3.org/2000/svg','line');
          v.setAttribute('x1', x); v.setAttribute('y1', y1);
          v.setAttribute('x2', x); v.setAttribute('y2', y2);
          v.setAttribute('class','link');
          svg.appendChild(v);
        }
      }
    }
  });
}

function renderAll(){
  ensureLinkages();
  // Standard-Sort: Generation, dann Personencode innerhalb der Generation
  persons.sort((a,b)=>{
    const ga = generationOf(a.code), gb = generationOf(b.code);
    if (ga!==gb) return ga-gb;
    return a.code.localeCompare(b.code, 'de');
  });
  renderTable();
  layoutTree();
  saveToStorage();
}

// ---- UI Logik ----
const el = sel => document.querySelector(sel);
const btn = id => document.getElementById(id);

function openModal(m){ m.style.display='flex'; m.setAttribute('aria-hidden','false'); }
function closeModal(m){ m.style.display='none'; m.setAttribute('aria-hidden','true'); }

function openNewPerson(){
  el('#personModalTitle').textContent = 'Neue Person';
  el('#personForm').reset();
  el('#editCode').value = '';
  openModal(el('#personModal'));
}
function openEdit(code){
  const p = getByCode(code);
  if (!p) return;
  el('#personModalTitle').textContent = `Person ändern (${p.code})`;
  el('#editCode').value = p.code;
  el('#name').value = p.name || '';
  el('#birth').value = p.birth || '';
  el('#gender').value = p.gender || 'männlich';
  el('#parentsCode').value = p.parentsCode || '';
  el('#partnerCode').value = (p.partnerCodes||[]).join(', ');
  el('#inheritedFrom').value = p.inheritedFrom || '';
  el('#note').value = p.note || '';
  el('#misc').value = p.misc || '';
  openModal(el('#personModal'));
}

function computeNewCode(parentsCode, gender, birth){
  if (!parentsCode) {
    // Stammvater oder Partner?
    // Wenn es noch niemanden mit Code '1' gibt: nächste Person = Stammvater (1)
    const existsRoot = !!getByCode('1');
    if (!existsRoot) return '1';
    // Partner des Stammvaters -> 1x
    return '1x';
  }
  // Wenn Eltern '1' oder '1x' -> 1A,1B,...
  const p = normalizeCode(parentsCode);
  return assignChildCode(p, birth);
}

function upsertPartnerLink(aCode, bCode){
  if (!aCode || !bCode) return;
  const a = getByCode(aCode); const b = getByCode(bCode);
  if (!a || !b) return;
  a.partnerCodes = Array.from(new Set([...(a.partnerCodes||[]), b.code]));
  b.partnerCodes = Array.from(new Set([...(b.partnerCodes||[]), a.code]));
}

function onSubmitPerson(e){
  e.preventDefault();
  const editCode = el('#editCode').value.trim();
  const name = el('#name').value.trim();
  const birth = el('#birth').value || '';
  const gender = el('#gender').value || 'männlich';
  const parentsCode = normalizeCode(el('#parentsCode').value.trim());
  const partnerInput = normalizeCode(el('#partnerCode').value.trim());
  const inheritedFrom = normalizeCode(el('#inheritedFrom').value.trim());
  const note = el('#note').value.trim();
  const misc = el('#misc').value.trim();
  if (!name){ closeModal(el('#personModal')); return; } // Abbrechen ohne Name zulässig

  saveState();

  if (editCode){
    // Update bestehende Person
    const p = getByCode(editCode);
    if (!p) return;
    p.name = name; p.birth = birth; p.gender = gender;
    p.parentsCode = parentsCode || p.parentsCode || '';
    p.inheritedFrom = inheritedFrom || '';
    p.ring = computeRingCode(p.code, p.inheritedFrom);
    p.note = note; p.misc = misc; p.updated = new Date().toISOString().slice(0,10);
    // Partner ggf. verknüpfen
    if (partnerInput){
      partnerInput.split(',').map(s=>s.trim()).filter(Boolean).forEach(pc => upsertPartnerLink(p.code, pc));
    }
  } else {
    // Neue Person
    let code = computeNewCode(parentsCode, gender, birth);
    code = normalizeCode(code);
    // Wenn Partner eines Codes (x-Suffix) explizit angegeben -> sicherstellen
    if (partnerInput && !code){
      // Falls Partnercode existiert, und die neue Person soll der Partner sein -> Partnercode = base + x
      const target = getByCode(partnerInput);
      if (target) code = partnerOf(target.code);
    }
    if (!code){
      // Fallback: generiere eine temporäre ID
      let i=1; while(getByCode('TMP'+i)) i++; code='TMP'+i;
    }

    const ring = computeRingCode(code, inheritedFrom);
    const created = new Date().toISOString().slice(0,10);
    const p = { code, name, birth, gender,
      partnerCodes:[], parentsCode: parentsCode || '', childrenCodes:[],
      ring, inheritedFrom: inheritedFrom || '', note, misc, created, updated: created
    };
    persons.push(p);
    // Partnerverknüpfung (wenn existiert)
    if (partnerInput) {
      partnerInput.split(',').map(s=>s.trim()).filter(Boolean).forEach(pc => upsertPartnerLink(p.code, pc));
    }
  }

  ensureLinkages();
  closeModal(el('#personModal'));
  renderAll();
}

function deletePerson(){
  const key = prompt('Name ODER Personen-Code der zu löschenden Person eingeben:');
  if (!key) return;
  saveState();
  const norm = normalizeCode(key);
  // Suchen nach Code oder Name
  const toDelete = persons.find(p => p.code === norm || (p.name||'').toLowerCase() === key.toLowerCase());
  if (!toDelete) return;
  const code = toDelete.code;

  // Person entfernen
  persons = persons.filter(p => p.code !== code);

  // Verweise bereinigen
  persons.forEach(p => {
    p.partnerCodes = (p.partnerCodes||[]).filter(c => c !== code);
    if (p.parentsCode === code) p.parentsCode = '';
    p.childrenCodes = (p.childrenCodes||[]).filter(c => c !== code);
    if (p.inheritedFrom === code) { p.inheritedFrom = ''; p.ring = computeRingCode(p.code, ''); }
  });

  ensureLinkages();
  renderAll();
}

// ---- Import / Export ----
function exportJSON(){
  const blob = new Blob([JSON.stringify(persons, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'family-data.json';
  document.body.appendChild(a); a.click(); a.remove();
  if (navigator.share){
    try { navigator.share({ title:'Familienring Daten', text:'Export JSON', files:[new File([blob],'family-data.json',{type:'application/json'})]}); } catch(e){}
  }
}
function exportCSV(){
  const headers = ['Code','Name','Geburtsdatum','Geschlecht','Partner','Eltern','Kinder','Ringcode','Geerbt von','Bemerkung','Sonstiges'];
  const rows = persons.map(p => [
    p.code, p.name||'', p.birth||'', p.gender||'',
    (p.partnerCodes||[]).join('|'), p.parentsCode||'', (p.childrenCodes||[]).join('|'),
    p.ring||'', p.inheritedFrom||'', p.note||'', p.misc||''
  ]);
  let csv = headers.join(';') + '\n' + rows.map(r => r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download='family-data.csv'; document.body.appendChild(a); a.click(); a.remove();
  if (navigator.share){
    try { navigator.share({ title:'Familienring Daten', text:'Export CSV', files:[new File([blob],'family-data.csv',{type:'text/csv'})]}); } catch(e){}
  }
}

function importData(){
  const fi = document.getElementById('fileInput');
  fi.onchange = async (e)=>{
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    saveState();
    if (file.name.endsWith('.json')){
      try {
        const arr = JSON.parse(text);
        if (Array.isArray(arr)){
          persons = arr;
        } else if (Array.isArray(arr.persons)) {
          persons = arr.persons;
        }
      } catch(e){ alert('Ungültiges JSON'); }
    } else {
      // CSV ; getrennt
      const lines = text.split(/\r?\n/).filter(Boolean);
      const data = lines.slice(1).map(line => line.split(';').map(s=>s.replace(/^"|"$/g,'').replace(/""/g,'"')));
      persons = data.map(cols => ({
        code: cols[0], name: cols[1], birth: cols[2], gender: cols[3],
        partnerCodes: (cols[4]||'').split('|').filter(Boolean),
        parentsCode: cols[5]||'', childrenCodes:(cols[6]||'').split('|').filter(Boolean),
        ring: cols[7]||'', inheritedFrom: cols[8]||'',
        note: cols[9]||'', misc: cols[10]||'', created:'', updated:''
      }));
    }
    persons.forEach(p => { p.code = normalizeCode(p.code); if(p.parentsCode) p.parentsCode = normalizeCode(p.parentsCode); if(p.inheritedFrom) p.inheritedFrom = normalizeCode(p.inheritedFrom); p.ring = computeRingCode(p.code, p.inheritedFrom); });
    ensureLinkages();
    renderAll();
    fi.value='';
  };
  fi.click();
}

// ---- Drucken ----
function printTable(){
  const win = window.open('', '_blank');
  const html = `
  <html><head><meta charset="UTF-8">
  <title>Druck — Wappenringe der Familie GEPPERT</title>
  <style>
    body{font-family:Arial,sans-serif}
    h1{text-align:center;margin:0 0 10px 0}
    .head{display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #999;padding:4px}
    th{background:#0b4a8e;color:#fff}
  </style></head>
  <body>
    <div class="head">
      <img src="wappen.jpeg" style="height:48px" alt="Wappen"><h1>Wappenringe der Familie GEPPERT</h1><img src="wappen.jpeg" style="height:48px" alt="Wappen">
    </div>
    ${document.getElementById('personTable').outerHTML}
    <script>window.onload=()=>window.print()</script>
  </body></html>`;
  win.document.open(); win.document.write(html); win.document.close();
}

function printTree(){
  const win = window.open('', '_blank');
  const svg = document.getElementById('tree').outerHTML;
  const html = `
  <html><head><meta charset="UTF-8">
  <title>Druck — Stammbaum</title>
  <style>body{font-family:Arial,sans-serif}h1{text-align:center}.head{display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:10px}svg{width:100%}</style>
  </head><body>
    <div class="head">
      <img src="wappen.jpeg" style="height:48px" alt="Wappen"><h1>Wappenringe der Familie GEPPERT</h1><img src="wappen.jpeg" style="height:48px" alt="Wappen">
    </div>
    ${svg}
    <script>window.onload=()=>window.print()</script>
  </body></html>`;
  win.document.open(); win.document.write(html); win.document.close();
}

// ---- Statistik ----
function showStats(){
  const total = persons.length;
  const male = persons.filter(p=>p.gender==='männlich').length;
  const female = persons.filter(p=>p.gender==='weiblich').length;
  const divers = persons.filter(p=>p.gender==='divers').length;
  const byGen = {};
  persons.forEach(p => {
    const g = generationOf(p.code);
    byGen[g] = (byGen[g]||0)+1;
  });
  let msg = `Gesamt: ${total}\nMännlich: ${male}\nWeiblich: ${female}\nDivers: ${divers}\n`;
  msg += 'Personen je Generation:\n' + Object.keys(byGen).sort().map(g=>`Gen ${g}: ${byGen[g]}`).join('\n');
  alert(msg);
}

// ---- Suche ----
function onSearch(){ renderTable(); }

// ---- Init Beispiel-Daten (nur minimal, du pflegst selbst deine Tabelle) ----
function seedIfEmpty(){
  if (persons.length) return;
  const created = new Date().toISOString().slice(0,10);
  persons = [
    { code:'1', name:'Olaf Geppert', birth:'1960-01-01', gender:'männlich', partnerCodes:['1x'], parentsCode:'', childrenCodes:[], ring:'1', inheritedFrom:'', note:'Stammvater', misc:'', created, updated:created },
    { code:'1x', name:'Irina Geppert', birth:'1962-02-02', gender:'weiblich', partnerCodes:['1'], parentsCode:'', childrenCodes:[], ring:'1x', inheritedFrom:'', note:'Partnerin', misc:'', created, updated:created },
    { code:'1A', name:'Anna Muster', birth:'1990-05-01', gender:'weiblich', partnerCodes:['1Ax'], parentsCode:'1', childrenCodes:[], ring:'1A', inheritedFrom:'', note:'Tochter', misc:'', created, updated:created },
    { code:'1Ax', name:'Max Partner', birth:'1989-03-11', gender:'männlich', partnerCodes:['1A'], parentsCode:'', childrenCodes:[], ring:'1Ax', inheritedFrom:'', note:'Partner', misc:'', created, updated:created },
    { code:'1B', name:'Ben Muster', birth:'1992-07-07', gender:'männlich', partnerCodes:[], parentsCode:'1', childrenCodes:[], ring:'1B', inheritedFrom:'', note:'Sohn', misc:'', created, updated:created },
    { code:'1A1', name:'Clara Enkel', birth:'2018-08-08', gender:'weiblich', partnerCodes:[], parentsCode:'1A', childrenCodes:[], ring:'1A1', inheritedFrom:'', note:'Enkel', misc:'', created, updated:created }
  ];
}

// ---- Events & Start ----
function bindUI(){
  btn('btnNew').onclick = openNewPerson;
  btn('btnDelete').onclick = deletePerson;
  btn('btnImport').onclick = importData;
  btn('btnExportJSON').onclick = exportJSON;
  btn('btnExportCSV').onclick = exportCSV;
  btn('btnPrintTable').onclick = printTable;
  btn('btnPrintTree').onclick = printTree;
  btn('btnStats').onclick = showStats;
  btn('btnUndo').onclick = undoAction;
  btn('btnRedo').onclick = redoAction;
  btn('btnHelp').onclick = ()=>openModal(el('#helpModal'));
  el('#closeHelp').onclick = ()=>closeModal(el('#helpModal'));
  el('#closePersonModal').onclick = ()=>closeModal(el('#personModal'));
  el('#cancelPerson').onclick = ()=>closeModal(el('#personModal'));
  el('#personForm').onsubmit = onSubmitPerson;
  el('#search').oninput = onSearch;
}

// Start
(function init(){
  const hadStorage = loadFromStorage();
  if (!hadStorage) seedIfEmpty();
  ensureLinkages();
  bindUI();
  renderAll();
})();
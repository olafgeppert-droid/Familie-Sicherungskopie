/* Family-Ring v85 minimal app (ribbon from screenshot + tree from scratch) */
(() => {
  const VERSION = window.APP_VERSION || 'v??';
  document.getElementById('versionBelow').textContent = 'Softwareversion: ' + VERSION;

  // ---------- State ----------
  let db = loadDB();
  let undoStack = [];
  let redoStack = [];

  // ---------- Helpers ----------
  function saveDB() { localStorage.setItem('familyDB', JSON.stringify(db)); }
  function loadDB() {
    try {
      const raw = localStorage.getItem('familyDB');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    // seed with sample if missing
    return {
      people: [
        {code:"1", name:"Olaf Geppert", sex:"m", gen:1, birth:"13.01.1965"},
        {code:"1x", name:"Irina Geppert", sex:"w", gen:1, birth:"13.01.1970", partner:"1"},
        {code:"1A", name:"Mario Geppert", sex:"m", gen:2, birth:"28.04.1995", parents:["1","1x"]},
        {code:"1Ax", name:"Kim", sex:"w", gen:2, parents:["1","1x"]},
        {code:"1B", name:"Nicolas Geppert", sex:"m", gen:2, birth:"04.12.2000", parents:["1","1x"]},
        {code:"1Bx", name:"Annika", sex:"w", gen:2, parents:["1","1x"]},
        {code:"1C", name:"Julienne Geppert", sex:"w", gen:2, birth:"26.09.2002", parents:["1","1x"]},
        {code:"1Cx", name:"Jonas", sex:"m", gen:2},
        {code:"1C1", name:"Michael Geppert", sex:"m", gen:3, birth:"12.07.2025", parents:["1C","1Cx"]},
      ]
    };
  }
  function byCode(code){ return db.people.find(p => p.code === code); }
  function upcaseCode(c){ if(!c) return c; return c.replace(/[a-z]/g, ch => (ch==='x'? 'x' : ch.toUpperCase())); }

  // ---------- Table ----------
  function renderTable() {
    const tbody = document.querySelector('#peopleTable tbody');
    tbody.innerHTML = '';
    const filter = document.getElementById('search').value.trim().toLowerCase();
    db.people.sort((a,b) => (a.gen||99)-(b.gen||99) || a.code.localeCompare(b.code));
    for (const p of db.people) {
      const text = (p.name+' '+p.code).toLowerCase();
      if (filter && !text.includes(filter)) continue;
      const tr = document.createElement('tr');
      const parents = (p.parents||[]).join(' ');
      const partner = p.partner||'';
      const cells = [
        p.gen||'', p.code||'', p.code||'', p.name||'', p.birth||'',
        p.birthplace||'', p.sex||'', parents, partner, p.inheritedFrom||'', p.note||''
      ];
      for (const c of cells) {
        const td = document.createElement('td'); td.textContent = c; tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  // ---------- Tree (SVG) ----------
  const COLORS = {
    1:'#a7f3d0',  // green
    2:'#bfdbfe',  // blue
    3:'#fecaca',  // red
    4:'#fde68a',  // yellow
    5:'#e9d5ff',  // violet
    6:'#99f6e4',  // turquoise
    7:'#fed7aa',  // orange
    8:'#e5e7eb',  // gray
    9:'#fbcfe8',  // pink
  };
  const BOX = {w:170,h:38, rx:8};
  const GAPX = 40, GAPY = 80;

  function computeLayout() {
    // group by generation
    const gens = {};
    for (const p of db.people) {
      const g = p.gen||1;
      (gens[g] = gens[g] || []).push(p);
    }
    const sortedGenKeys = Object.keys(gens).map(n=>+n).sort((a,b)=>a-b);
    // sort within generations by code
    for (const g of sortedGenKeys) {
      gens[g].sort((a,b) => (a.code||'').localeCompare(b.code||''));
    }
    // compute positions linearly
    const pos = {};
    let y = 20;
    let maxX = 0;
    for (const g of sortedGenKeys) {
      const row = gens[g];
      let x = 20;
      for (const p of row) {
        pos[p.code] = {x, y};
        x += BOX.w + GAPX;
      }
      maxX = Math.max(maxX, x);
      y += BOX.h + GAPY;
    }
    return {pos, gens:sortedGenKeys, width: Math.max(900, maxX+20), height: y+20};
  }

  function renderTree() {
    const el = document.getElementById('treeCanvas');
    el.innerHTML = '';
    const {pos, gens, width, height} = computeLayout();
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    el.appendChild(svg);

    // draw parent-child links (vertical from bus or single parent down to child)
    function rectEdgeY(code){ return (pos[code].y + BOX.h); }
    function rectMidX(code){ return (pos[code].x + BOX.w/2); }

    // Build children per parent(s)
    const childrenByParents = new Map(); // key 'A|B' (sorted)
    const singles = []; // parent -> children

    for (const child of db.people) {
      if (child.parents && child.parents.length) {
        const key = [...child.parents].sort().join('|');
        const arr = childrenByParents.get(key) || [];
        arr.push(child.code);
        childrenByParents.set(key, arr);
      } else if (child.parents && child.parents.length===1){
        singles.push({parent:child.parents[0], child:child.code});
      }
    }

    const drawLine = (x1,y1,x2,y2, cls='link') => {
      const p = document.createElementNS(svg.namespaceURI,'path');
      // straight line with slight rounding near boxes
      const midY = (y1+y2)/2;
      const d = `M ${x1} ${y1} V ${midY} V ${y2} H ${x2}`; // simple polyline-like
      p.setAttribute('d', d);
      p.setAttribute('class', cls);
      p.setAttribute('stroke', '#334155');
      p.setAttribute('fill', 'none');
      svg.appendChild(p);
    };

    // partner bus lines
    const drawnBuses = new Set();
    function drawBus(a,b, dashed){
      const key = [a,b].sort().join('|');
      if (drawnBuses.has(key)) return;
      drawnBuses.add(key);
      const ax = rectMidX(a), ay = pos[a].y + BOX.h/2;
      const bx = rectMidX(b), by = pos[b].y + BOX.h/2;
      if (Math.abs(ay-by) > 1e-3) return; // only same row
      const y = ay;
      const x1 = Math.min(ax, bx) + 8;
      const x2 = Math.max(ax, bx) - 8;
      const l = document.createElementNS(svg.namespaceURI,'line');
      l.setAttribute('x1', x1); l.setAttribute('y1', y);
      l.setAttribute('x2', x2); l.setAttribute('y2', y);
      l.setAttribute('class','link bus'+(dashed?' dashed':''));
      l.setAttribute('stroke', '#334155');
      if (dashed) l.setAttribute('stroke-dasharray', '5 4');
      svg.appendChild(l);
      return {x1,x2,y};
    }

    // draw buses from explicit partner fields and inferred from parents pairings
    const partneredPairs = new Set();
    for (const p of db.people) {
      if (p.partner) {
        const key = [p.code, p.partner].sort().join('|');
        partneredPairs.add(key);
      }
    }
    // inferred from children
    for (const [key, childs] of childrenByParents.entries()) {
      if (key.includes('|')) partneredPairs.add(key);
    }

    // draw buses and vertical downlinks
    for (const pair of partneredPairs) {
      const [a,b] = pair.split('|');
      if (!pos[a] || !pos[b]) continue;
      const hasCommonKids = childrenByParents.get([a,b].sort().join('|'));
      const bus = drawBus(a,b, !hasCommonKids);
      if (!bus) continue;
      if (hasCommonKids) {
        // downlink from bus to each child top edge
        const kids = hasCommonKids.map(c => c);
        if (kids.length) {
          // common vertical stem from center of bus to top of level below, then horizontal to child centers
          const stemX = (bus.x1 + bus.x2)/2;
          const stemY1 = bus.y;
          for (const kc of kids) {
            if (!pos[kc]) continue;
            const xchild = rectMidX(kc);
            const yTop = pos[kc].y; // top edge of child box
            // vertical from bus to just above child's top
            const pth = document.createElementNS(svg.namespaceURI,'path');
            const d = `M ${stemX} ${stemY1} V ${yTop}`;
            pth.setAttribute('d', d);
            pth.setAttribute('class','link');
            pth.setAttribute('stroke', '#334155');
            pth.setAttribute('fill','none');
            svg.appendChild(pth);
            // horizontal to child's top center (short)
            // not needed if stemX aligned; draw small H if offset
            if (Math.abs(stemX - xchild) > 0.5) {
              const l = document.createElementNS(svg.namespaceURI,'line');
              l.setAttribute('x1', stemX); l.setAttribute('y1', yTop);
              l.setAttribute('x2', xchild); l.setAttribute('y2', yTop);
              l.setAttribute('class','link');
              l.setAttribute('stroke', '#334155');
              svg.appendChild(l);
            }
          }
        }
      }
    }

    // single-parent links
    for (const {parent, child} of singles) {
      if (!pos[parent] || !pos[child]) continue;
      const x1 = rectMidX(parent);
      const y1 = rectEdgeY(parent);
      const x2 = rectMidX(child);
      const y2 = pos[child].y;
      drawLine(x1, y1, x2, y2, 'link');
    }

    // ----- boxes -----
    for (const p of db.people) {
      const {x,y} = pos[p.code];
      const group = document.createElementNS(svg.namespaceURI,'g');
      svg.appendChild(group);

      // background band
      const band = document.createElementNS(svg.namespaceURI,'rect');
      band.setAttribute('x', x);
      band.setAttribute('y', y);
      band.setAttribute('width', BOX.w);
      band.setAttribute('height', BOX.h);
      band.setAttribute('rx', BOX.rx);
      band.setAttribute('fill', COLORS[p.gen] || '#fff');
      band.setAttribute('class','band');
      group.appendChild(band);

      const rect = document.createElementNS(svg.namespaceURI,'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', BOX.w);
      rect.setAttribute('height', BOX.h);
      rect.setAttribute('rx', BOX.rx);
      rect.setAttribute('class','box');
      group.appendChild(rect);

      const t1 = document.createElementNS(svg.namespaceURI,'text');
      t1.setAttribute('x', x+8);
      t1.setAttribute('y', y+14);
      t1.setAttribute('class','boxText');
      t1.textContent = `${upcaseCode(p.code||'')} / ${p.name||''}`;
      group.appendChild(t1);

      const t2 = document.createElementNS(svg.namespaceURI,'text');
      t2.setAttribute('x', x+8);
      t2.setAttribute('y', y+28);
      t2.setAttribute('class','boxText');
      t2.textContent = `Generation: ${p.gen||''} / ${p.birth||''}`;
      group.appendChild(t2);
    }
  }

  // ---------- Actions ----------
  function pushUndo() { undoStack.push(JSON.stringify(db)); redoStack.length = 0; }
  function addPerson(name, sex, parents, partner) {
    pushUndo();
    const code = generateCode();
    const gen = parents && parents.length ? Math.max(...parents.map(c => (byCode(c)||{}).gen||1))+1 : 1;
    db.people.push({code, name, sex, parents: parents||[], partner: partner||'', gen});
    saveDB(); refresh();
  }
  function generateCode(){
    // naive: next counter within top-level
    const nums = db.people.map(p => p.code).filter(Boolean);
    let idx = 1;
    while (nums.includes(String(idx))) idx++;
    return String(idx);
  }

  // ---------- Import/Export ----------
  document.getElementById('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'family-export.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('btnImport').addEventListener('click', () => {
    document.getElementById('fileImport').click();
  });
  document.getElementById('fileImport').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (!data.people) throw new Error('Keine Personenliste');
      pushUndo();
      db = data;
      saveDB(); refresh();
    } catch (e) {
      alert('Import fehlgeschlagen: ' + e.message);
    } finally {
      ev.target.value='';
    }
  });

  // ---------- Print (with iOS share if available) ----------
  const dlgPrint = document.getElementById('dlgPrint');
  document.getElementById('btnPrint').addEventListener('click', ()=> dlgPrint.showModal());
  document.getElementById('btnPrintClose').addEventListener('click', ()=> dlgPrint.close());

  async function printElement(el, filename) {
    // Try iOS share with a PDF snapshot (basic)
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${filename}</title></head>
    <body>${el.outerHTML}</body></html>`;
    const blob = new Blob([html], {type:'text/html'});
    if (navigator.share && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const file = new File([blob], filename+'.html', {type:'text/html'});
      try { await navigator.share({files:[file], title: filename}); return; } catch(e){ /* fallback */ }
    }
    // Desktop: open in print window
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    setTimeout(() => { if (win) win.print(); }, 350);
  }

  document.getElementById('btnPrintTable').addEventListener('click', () => {
    dlgPrint.close();
    const tbl = document.getElementById('peopleTable').cloneNode(true);
    printElement(tbl, 'Tabelle');
  });
  document.getElementById('btnPrintTree').addEventListener('click', () => {
    dlgPrint.close();
    const tree = document.getElementById('treeCanvas').cloneNode(true);
    printElement(tree, 'Stammbaum');
  });

  // ---------- Stats ----------
  const dlgStats = document.getElementById('dlgStats');
  document.getElementById('btnStats').addEventListener('click', () => {
    const male = db.people.filter(p=>p.sex==='m').length;
    const female = db.people.filter(p=>p.sex==='w').length;
    const gens = new Set(db.people.map(p=>p.gen)).size;
    document.getElementById('statsBody').innerHTML = `<p>Anzahl Personen: ${db.people.length}</p>
      <p>Männlich: ${male}, Weiblich: ${female}</p>
      <p>Generationen: ${gens}</p>`;
    dlgStats.showModal();
  });
  document.getElementById('btnStatsClose').addEventListener('click', ()=> dlgStats.close());

  // ---------- Add/Delete/Reset/Undo/Redo ----------
  const dlgAdd = document.getElementById('dlgAdd');
  document.getElementById('btnAdd').addEventListener('click', ()=> {
    document.getElementById('addName').value='';
    document.getElementById('addParents').value='';
    document.getElementById('addPartner').value='';
    dlgAdd.showModal();
  });
  document.getElementById('btnAddCancel').addEventListener('click', ()=> dlgAdd.close());
  document.getElementById('formAdd').addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('addName').value.trim();
    const sex = document.getElementById('addSex').value;
    const parents = document.getElementById('addParents').value.trim().split(/\s+/).filter(Boolean).map(upcaseCode);
    const partner = upcaseCode(document.getElementById('addPartner').value.trim());
    if (!name) { dlgAdd.close(); return; }
    addPerson(name, sex, parents, partner);
    dlgAdd.close();
  });

  document.getElementById('btnDelete').addEventListener('click', ()=>{
    const code = prompt('Code der Person, die gelöscht werden soll:');
    if (!code) return;
    pushUndo();
    db.people = db.people.filter(p=>p.code!==code);
    for (const p of db.people) {
      if (p.partner === code) delete p.partner;
      if (p.parents) p.parents = p.parents.filter(c=>c!==code);
    }
    saveDB(); refresh();
  });

  document.getElementById('btnReset').addEventListener('click', ()=>{
    if (!confirm('ACHTUNG: Wirklich alle Daten löschen?')) return;
    pushUndo();
    db = {people: []};
    saveDB(); refresh();
  });
  document.getElementById('btnUndo').addEventListener('click', ()=>{
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(db));
    db = JSON.parse(undoStack.pop());
    saveDB(); refresh();
  });
  document.getElementById('btnRedo').addEventListener('click', ()=>{
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(db));
    db = JSON.parse(redoStack.pop());
    saveDB(); refresh();
  });

  // ---------- Search Filter ----------
  document.getElementById('search').addEventListener('input', () => {
    renderTable();
  });

  // ---------- Init ----------
  function refresh() {
    renderTable();
    renderTree();
  }
  refresh();
})();
(() => {
  'use strict';

  // --- Utilities ---
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const byId = id => document.getElementById(id);

  const STORAGE_KEY = 'familyRingData.v61';
  const UNDO_MAX = 50;

  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const fmtDate = s => s || '';
  const parseDate = s => {
    // Expect TT.MM.JJJJ -> Date or null
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec((s||'').trim());
    if (!m) return null;
    const [_, d, mo, y] = m.map(Number);
    const dt = new Date(y, mo-1, d);
    return isNaN(dt) ? null : dt;
  };

  const upperCode = code => {
    if (!code) return '';
    let out = '';
    for (let i=0;i<code.length;i++) {
      const ch = code[i];
      out += (ch==='x' ? 'x' : ch.toUpperCase());
    }
    // ensure partner suffix x stays lower
    return out.replace(/X$/, 'x');
  };

  // --- Data Model ---
  let state = {
    people: [],
    lastCodeSeed: 1,
  };

  let undoStack = [];
  let redoStack = [];

  function pushUndo() {
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > UNDO_MAX) undoStack.shift();
    redoStack = [];
  }

  function undo() {
    if (!undoStack.length) return;
    const snap = undoStack.pop();
    redoStack.push(JSON.stringify(state));
    state = JSON.parse(snap);
    save();
    renderAll();
  }

  function redo() {
    if (!redoStack.length) return;
    const snap = redoStack.pop();
    undoStack.push(JSON.stringify(state));
    state = JSON.parse(snap);
    save();
    renderAll();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { state = JSON.parse(raw); }
      catch(e){ console.warn('load parse failed', e); }
    } else {
      // Seed with a minimal example (can be deleted by user)
      state.people = [
        { code: '1', name: 'Olaf Geppert', sex: 'm', dob: '01.01.1970', father: '', mother: '', partners: ['1x'], inheritedFrom: '', gen: 1 },
        { code: '1x', name: 'Irina', sex: 'w', dob: '01.06.1975', father: '', mother: '', partners: ['1'], inheritedFrom: '', gen: 1 },
        { code: '1A', name: 'Kind A', sex: 'w', dob: '03.05.2000', father: '1', mother: '1x', partners: [], inheritedFrom: '', gen: 2 },
        { code: '1B', name: 'Kind B', sex: 'm', dob: '07.07.2002', father: '1', mother: '1x', partners: [], inheritedFrom: '', gen: 2 }
      ];
      computeRingCodes();
      save();
    }
  }

  // --- Code & Ring logic ---
  function computeGen(p) {
    if (!p.father && !p.mother) return 1;
    const dad = state.people.find(x => x.code === p.father);
    const mom = state.people.find(x => x.code === p.mother);
    const g = Math.max(dad ? (dad.gen||1) : 1, mom ? (mom.gen||1) : 1) + 1;
    return g;
  }

  function computeRingCodes() {
    for (const p of state.people) {
      const base = upperCode(p.code || '');
      if (p.inheritedFrom) {
        p.ring = `${upperCode(p.inheritedFrom)} → ${base}`;
      } else {
        p.ring = base;
      }
    }
  }

  function normalizeCodes() {
    for (const p of state.people) {
      p.code = upperCode(p.code || '');
      p.father = upperCode(p.father || '');
      p.mother = upperCode(p.mother || '');
      p.partners = (p.partners||[]).map(upperCode);
      p.gen = p.gen || computeGen(p);
    }
    computeRingCodes();
  }

  // --- Rendering: Table ---
  function renderTable() {
    const tbody = byId('peopleTable').querySelector('tbody');
    tbody.innerHTML = '';
    const filter = byId('search').value.trim().toLowerCase();
    const highlight = (text) => {
      if (!filter) return text;
      const re = new RegExp(`(${filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
      return text.replace(re, '<mark>$1</mark>');
    };
    // sort: first gen, then person code lexicographically
    const data = [...state.people].sort((a,b) => (a.gen||99)-(b.gen||99) || a.code.localeCompare(b.code));
    for (const p of data) {
      const rowString = [p.gen??'', p.code??'', p.name??'', p.sex??'', p.dob??'', (p.partners||[]).join(', '), p.father??'', p.mother??'', p.inheritedFrom??'', p.ring??''];
      const rowText = rowString.join(' ').toLowerCase();
      if (filter && !rowText.includes(filter)) continue;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${highlight(String(p.gen??''))}</td>
        <td>${highlight(p.code||'')}</td>
        <td>${highlight(p.name||'')}</td>
        <td>${highlight(p.sex||'')}</td>
        <td>${highlight(p.dob||'')}</td>
        <td>${highlight((p.partners||[]).join(', '))}</td>
        <td>${highlight(p.father||'')}</td>
        <td>${highlight(p.mother||'')}</td>
        <td>${highlight(p.inheritedFrom||'')}</td>
        <td>${highlight(p.ring||'')}</td>
      `;
      tr.addEventListener('dblclick', () => openEditDialog(p.code));
      tbody.appendChild(tr);
    }
  }

  // --- Rendering: Tree (SVG) ---
  function renderTree() {
    const svg = byId('tree');
    const W = svg.clientWidth || svg.parentElement.clientWidth;
    const H = svg.clientHeight || 600;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // group by generation
    const byGen = new Map();
    for (const p of state.people) {
      const g = p.gen || computeGen(p);
      if (!byGen.has(g)) byGen.set(g, []);
      byGen.get(g).push(p);
    }
    const gens = Array.from(byGen.keys()).sort((a,b)=>a-b);
    if (!gens.length) return;

    // layout parameters
    const rowH = Math.max(120, Math.floor(H / (gens.length+0.3)));
    const colW = 180;
    const padX = 30;
    const nodeW = 150;
    const nodeH = 46;

    // x positions inside each gen row
    const positions = new Map(); // code -> {x,y}
    gens.forEach((g,i) => {
      const rowY = 20 + i * rowH;
      const arr = byGen.get(g).sort((a,b)=> (a.code||'').localeCompare(b.code||''));
      arr.forEach((p,idx) => {
        const x = padX + idx * colW;
        positions.set(p.code, {x, y: rowY});
      });
    });

    // helper to draw lines
    const addLine = (x1,y1,x2,y2) => {
      const l = document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',x1); l.setAttribute('y1',y1);
      l.setAttribute('x2',x2); l.setAttribute('y2',y2);
      l.setAttribute('class','link');
      svg.appendChild(l);
    };

    function midX(code){ const pos=positions.get(code); return pos?pos.x+nodeW/2:null; }
    function topY(code){ const pos=positions.get(code); return pos?pos.y:null; }
    function bottomY(code){ const pos=positions.get(code); return pos?pos.y+nodeH:null; }

    // draw parent-child: bus between parents, vertical up/down
    for (const child of state.people) {
      const f = child.father, m = child.mother;
      const posC = positions.get(child.code);
      if (!posC) continue;
      const cx = midX(child.code);
      const cyTop = posC.y;
      const busY = cyTop - 30;
      // up from child to bus
      addLine(cx, cyTop, cx, busY);
      const fx = f ? midX(f) : null;
      const mx = m ? midX(m) : null;
      if (fx!=null && mx!=null) {
        const left = Math.min(fx, mx);
        const right = Math.max(fx, mx);
        addLine(left, busY, right, busY);
        addLine(fx, busY, fx, topY(f));
        addLine(mx, busY, mx, topY(m));
      } else if (fx!=null) {
        addLine(fx, busY, fx, topY(f));
      } else if (mx!=null) {
        addLine(mx, busY, mx, topY(m));
      }
    }

    // partner bus-lines when no shared child
    function hasSharedChild(a,b) {
      return state.people.some(ch => (ch.father===a && ch.mother===b) || (ch.father===b && ch.mother===a));
    }
    for (const p of state.people) {
      (p.partners||[]).forEach(pc => {
        if (p.code < pc) {
          const posA = positions.get(p.code);
          const posB = positions.get(pc);
          const partner = state.people.find(x=>x.code===pc);
          if (posA && posB && partner && partner.gen===p.gen && !hasSharedChild(p.code, pc)) {
            const y = posA.y + nodeH + 12;
            addLine(posA.x + nodeW/2, y, posB.x + nodeW/2, y);
          }
        }
      });
    }

    // nodes
    for (const p of state.people) {
      const pos = positions.get(p.code);
      if (!pos) continue;
      const g = p.gen || 1;
      const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
      rect.setAttribute('x', pos.x);
      rect.setAttribute('y', pos.y);
      rect.setAttribute('width', nodeW);
      rect.setAttribute('height', nodeH);
      rect.setAttribute('rx', 6);
      rect.setAttribute('class', `node gen-${Math.min(g,4)}`);
      svg.appendChild(rect);

      const t1 = document.createElementNS('http://www.w3.org/2000/svg','text');
      t1.setAttribute('x', pos.x + 8);
      t1.setAttribute('y', pos.y + 18);
      t1.textContent = `${p.code || ''} / ${p.name || ''}`;
      svg.appendChild(t1);

      const t2 = document.createElementNS('http://www.w3.org/2000/svg','text');
      t2.setAttribute('x', pos.x + 8);
      t2.setAttribute('y', pos.y + 34);
      t2.textContent = `Generation: ${p.gen||''} / ${p.dob||''}`;
      svg.appendChild(t2);
    }
  }

  function renderAll() {
    normalizeCodes();
    renderTable();
    renderTree();
  }

  // --- Add / Edit person ---
  function openAddDialog() {
    byId('newName').value = '';
    byId('newSex').value = '';
    byId('newDob').value = '';
    byId('newFather').value = '';
    byId('newMother').value = '';
    byId('newPartners').value = '';
    byId('newInherited').value = '';
    byId('dlgNew').showModal();
    byId('btnSaveNew').onclick = addNewFromDialog;
  }

  function openEditDialog(code) {
    const p = state.people.find(x => x.code === code);
    if (!p) return;
    byId('newName').value = p.name || '';
    byId('newSex').value = p.sex || '';
    byId('newDob').value = p.dob || '';
    byId('newFather').value = p.father || '';
    byId('newMother').value = p.mother || '';
    byId('newPartners').value = (p.partners||[]).join(', ');
    byId('newInherited').value = p.inheritedFrom || '';
    byId('dlgNew').showModal();
    byId('btnSaveNew').onclick = (ev) => {
      ev.preventDefault();
      pushUndo();
      p.name = byId('newName').value.trim();
      p.sex = byId('newSex').value;
      p.dob = byId('newDob').value.trim();
      p.father = upperCode(byId('newFather').value.trim());
      p.mother = upperCode(byId('newMother').value.trim());
      p.partners = byId('newPartners').value.split(',').map(s=>upperCode(s.trim())).filter(Boolean);
      p.inheritedFrom = upperCode(byId('newInherited').value.trim());
      p.gen = computeGen(p);
      computeRingCodes();
      save();
      byId('dlgNew').close();
      renderAll();
    };
  }

  function addNewFromDialog(ev) {
    ev.preventDefault();
    const name = byId('newName').value.trim();
    if (!name) { byId('dlgNew').close(); return; } // Abbrechen erlaubt
    pushUndo();
    const sex = byId('newSex').value;
    const dob = byId('newDob').value.trim();
    const father = upperCode(byId('newFather').value.trim());
    const mother = upperCode(byId('newMother').value.trim());
    const partners = byId('newPartners').value.split(',').map(s=>upperCode(s.trim())).filter(Boolean);
    const inheritedFrom = upperCode(byId('newInherited').value.trim());

    // simplified code allocation following earlier logic
    let code = '';
    if (!father && !mother) {
      code = (sex==='w') ? '1x' : '1';
      if (state.people.some(p=>p.code===code)) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let idx = 0;
        while (state.people.some(p=>p.code===code)) {
          code = '1' + alphabet[idx++];
        }
      }
    } else {
      const parentCode = father || mother || '1';
      const siblings = state.people.filter(p => (p.father===father && p.mother===mother));
      const arr = siblings.concat([{code:'(new)', dob}]).sort((a,b)=> {
        const da = parseDate(a.dob) || new Date(0);
        const db = parseDate(b.dob) || new Date(0);
        return da - db;
      });
      const idx = arr.findIndex(x=>x.code==='(new)');
      const base = parentCode;
      const parent = state.people.find(p=>p.code===parentCode);
      if ((parent?.gen||1) === 1) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        code = base + (alphabet[idx] || 'A');
      } else {
        code = base + String(idx+1);
      }
    }
    code = upperCode(code);
    const gen = 1 + Math.max(
      father ? (state.people.find(x=>x.code===father)?.gen||1) : 0,
      mother ? (state.people.find(x=>x.code===mother)?.gen||1) : 0
    );
    const newP = { code, name, sex, dob, father, mother, partners, inheritedFrom, gen };
    state.people.push(newP);
    computeRingCodes();
    save();
    byId('dlgNew').close();
    renderAll();
  }

  // delete by code or name; also remove references
  function deleteByQuery(q) {
    q = (q||'').trim();
    if (!q) return;
    pushUndo();
    const codeTarget = state.people.find(p=>p.code === upperCode(q));
    const nameTargets = state.people.filter(p => p.name.toLowerCase() === q.toLowerCase());
    const toDelete = new Set();
    if (codeTarget) toDelete.add(codeTarget.code);
    for (const p of nameTargets) toDelete.add(p.code);
    if (!toDelete.size) return;

    state.people = state.people.filter(p => !toDelete.has(p.code));
    // remove references
    for (const p of state.people) {
      if (toDelete.has(p.father)) p.father='';
      if (toDelete.has(p.mother)) p.mother='';
      p.partners = (p.partners||[]).filter(c=>!toDelete.has(c));
      if (p.inheritedFrom && toDelete.has(p.inheritedFrom)) p.inheritedFrom='';
    }
    computeRingCodes();
    save();
    renderAll();
  }

  // --- Import / Export ---
  function exportSelected(opts) {
    const out = [];
    if (opts.json) {
      const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
      out.push({blob, name:'family-ring.json'});
    }
    if (opts.csv) {
      const header = ['code','name','sex','dob','father','mother','partners','inheritedFrom','gen','ring'];
      const rows = state.people.map(p=>[p.code,p.name,p.sex,p.dob,p.father,p.mother,(p.partners||[]).join('|'),p.inheritedFrom,p.gen,p.ring]);
      const csv = [header.join(';')].concat(rows.map(r=>r.map(x=>String(x??'').replace(/;/g,',')).join(';'))).join('\n');
      const blob = new Blob([csv], {type:'text/csv'});
      out.push({blob, name:'family-ring.csv'});
    }
    // share or download
    if (isIOS() && navigator.share) {
      const files = out.map(o => new File([o.blob], o.name, {type:o.blob.type}));
      navigator.share({ files, title: 'Family Ring Export' }).catch(()=>{
        for (const o of out) {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(o.blob);
          a.download = o.name;
          a.click();
          URL.revokeObjectURL(a.href);
        }
      });
    } else {
      for (const o of out) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(o.blob);
        a.download = o.name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    }
  }

  function importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        pushUndo();
        const text = String(reader.result);
        if (file.name.endsWith('.json')) {
          const obj = JSON.parse(text);
          if (obj.people) state = obj; else state.people = obj.people || obj;
        } else {
          const lines = text.split(/\r?\n/).filter(Boolean);
          const header = lines.shift().split(';');
          const idx = (k)=> header.indexOf(k);
          state.people = lines.map(line => {
            const c = line.split(';');
            return {
              code: c[idx('code')],
              name: c[idx('name')],
              sex: c[idx('sex')],
              dob: c[idx('dob')],
              father: c[idx('father')],
              mother: c[idx('mother')],
              partners: (c[idx('partners')]||'').split('|').filter(Boolean),
              inheritedFrom: c[idx('inheritedFrom')],
              gen: Number(c[idx('gen')])||undefined
            };
          });
        }
        normalizeCodes();
        save();
        renderAll();
      } catch(e) {
        alert('Import fehlgeschlagen: ' + e);
      }
    };
    reader.readAsText(file);
  }

  // --- Print (PDF via print dialog) ---
  function printWhat(kind) {
    const title = 'Wappenringe der Familie GEPPERT';
    const date = new Date().toLocaleString('de-DE');
    const printWin = window.open('', '_blank', 'width=900,height=700');
    const css = `
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        h1 { text-align: center; font-size: 20px; margin: 0 0 12px; }
        .footer { margin-top: 12px; font-size: 12px; color: #333; text-align: right; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 6px; }
        svg { width: 100%; height: 500px; }
        .row { display: block; width: 100%; }
      </style>
    `;
    let body = `<h1><img src="wappen.jpeg" style="height:28px;vertical-align:middle;margin-right:8px"> ${title} <img src="wappen.jpeg" style="height:28px;vertical-align:middle;margin-left:8px"></h1>`;

    if (kind==='table' || kind==='both') {
      body += '<div class="row">' + byId('peopleTable').outerHTML + '</div>';
    }
    if (kind==='tree' || kind==='both') {
      const svg = byId('tree').cloneNode(true);
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      body += '<div class="row">' + svgStr + '</div>';
    }
    body += `<div class="footer">Gedruckt am ${date}</div>`;

    printWin.document.write('<!doctype html><html><head><meta charset="utf-8">'+css+'</head><body>'+body+'</body></html>');
    printWin.document.close();
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 400);
  }

  // --- Stats ---
  function showStats() {
    const total = state.people.length;
    const male = state.people.filter(p=>p.sex==='m').length;
    const female = state.people.filter(p=>p.sex==='w').length;
    const diverse = state.people.filter(p=>p.sex==='d').length;
    const byGen = {};
    state.people.forEach(p => {
      const g = p.gen||1;
      byGen[g] = (byGen[g]||0)+1;
    });
    const lines = [`Gesamt: ${total}`, `männlich: ${male}`, `weiblich: ${female}`, `divers: ${diverse}`]
      .concat(Object.entries(byGen).sort((a,b)=>a[0]-b[0]).map(([g,c])=>`Generation ${g}: ${c}`));
    alert(lines.join('\n'));
  }

  // --- Help ---
  async function openHelp() {
    const overlay = byId('helpOverlay');
    const box = byId('helpContent');
    try {
      const html = await fetch('help.html').then(r=>r.text());
      box.innerHTML = html;
      overlay.hidden = false;
    } catch(e) {
      box.innerHTML = '<p>Hilfe konnte nicht geladen werden.</p>';
      overlay.hidden = false;
    }
  }
  function closeHelp() { byId('helpOverlay').hidden = true; }

  // --- Event wiring ---
  function wire() {
    byId('btnNew').addEventListener('click', openAddDialog);
    byId('btnCancelNew').addEventListener('click', () => byId('dlgNew').close());
    byId('formNew').addEventListener('submit', addNewFromDialog);

    byId('btnDeletePerson').addEventListener('click', () => byId('dlgDelete').showModal());
    byId('btnConfirmDelete').addEventListener('click', (ev) => {
      ev.preventDefault();
      const q = byId('deleteQuery').value;
      byId('dlgDelete').close();
      deleteByQuery(q);
    });

    byId('btnImport').addEventListener('click', () => byId('filePicker').click());
    byId('filePicker').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importFile(f);
      e.target.value = '';
    });

    byId('btnExport').addEventListener('click', () => byId('dlgExport').showModal());
    byId('btnDoExport').addEventListener('click', (ev) => {
      ev.preventDefault();
      const opts = { json: byId('expJSON').checked, csv: byId('expCSV').checked };
      byId('dlgExport').close();
      if (!opts.json && !opts.csv) { alert('Bitte mindestens ein Format wählen.'); return; }
      exportSelected(opts);
    });

    byId('btnPrint').addEventListener('click', () => byId('dlgPrint').showModal());
    byId('btnDoPrint').addEventListener('click', (ev) => {
      ev.preventDefault();
      const val = new FormData(byId('formPrint')).get('printWhat');
      byId('dlgPrint').close();
      printWhat(val);
    });

    byId('btnStats').addEventListener('click', showStats);
    byId('btnUndo').addEventListener('click', undo);
    byId('btnRedo').addEventListener('click', redo);

    byId('btnReset').addEventListener('click', () => {
      if (confirm('Sollen wirklich alle Personen gelöscht werden?')) {
        pushUndo();
        state.people = [];
        save();
        renderAll();
      }
    });

    byId('btnHelp').addEventListener('click', openHelp);
    byId('helpClose').addEventListener('click', closeHelp);

    byId('search').addEventListener('input', renderTable);
  }

  // --- Init ---
  load();
  normalizeCodes();
  window.addEventListener('DOMContentLoaded', () => { wire(); renderAll(); });

})();
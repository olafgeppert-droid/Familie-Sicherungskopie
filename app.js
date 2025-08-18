/* family-ring-webapp upd52-fixed
   - Basis: upd46  (ohne Passwort)
   - Änderungen: Hilfe-Popup schließbar, Export/Druck Auswahl, Gen-Spalte, Reset-Button,
                 Datum TT.MM.JJJJ, Ringcode- & Personencode-Logik, Stammbaum-Linien & Print fix,
                 Suche mit Markierung, Person löschen entfernt Verweise.
*/

const LS_KEY = "familyRingDataV2";
let persons = loadData();
let undoStack = [];
let redoStack = [];

// --- Utils ---
const U = {
  clone: (o)=>JSON.parse(JSON.stringify(o)),
  saveSnapshot(){ undoStack.push(U.clone(persons)); redoStack.length=0; },
  restore(state){ persons = U.clone(state); Data.persist(); UI.renderAll(); },
  parseDate(d){ // expects TT.MM.JJJJ
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d);
    if(!m) return null;
    const dd = +m[1], mm = +m[2]-1, yy=+m[3];
    const dt = new Date(yy,mm,dd);
    return (dt && dt.getMonth()===mm && dt.getDate()===dd && dt.getFullYear()===yy)? dt : null;
  },
  fmtDate(dt){
    if(!(dt instanceof Date)) return "";
    const dd = String(dt.getDate()).padStart(2,"0");
    const mm = String(dt.getMonth()+1).padStart(2,"0");
    const yy = dt.getFullYear();
    return `${dd}.${mm}.${yy}`;
  },
  genFromCode(code){
    if(!code) return 0;
    const c = code.replace(/x$/,""); // partner suffix weg
    let sub = c.slice(1); // nach der führenden 1
    let letters = (sub.match(/[A-Z]/g)||[]).length;
    let digits  = (sub.match(/[0-9]/g)||[]).length;
    return 1 + letters + digits;
  },
  normalizeCodeInput(s){
    if(!s) return "";
    s = s.trim();
    // alles upper außer optionalem x am Ende
    if(/x$/i.test(s)) {
      s = s.slice(0,-1).toUpperCase()+"x";
    } else {
      s = s.toUpperCase();
    }
    return s;
  },
  // siblings direct children pattern depending on parent's generation parity
  nextChildCode(parentCode, childrenBirths){
    const P = parentCode.replace(/x$/,"");
    const genP = U.genFromCode(P);
    const useLetters = (genP % 2 === 1); // 1->letters,2->digits,3->letters…
    if(useLetters){
      // children are P + [A,B,C...] based on birth order
      const existing = persons
        .filter(p=>p.parents && p.parents.includes(P))
        .sort((a,b)=> (U.parseDate(a.birth)||0) - (U.parseDate(b.birth)||0));
      // include prospective child birth among siblings to find rank
      const births = existing.map(p=>U.parseDate(p.birth)).filter(Boolean).concat(childrenBirths? [childrenBirths]:[]);
      const rank = births.sort((a,b)=>a-b).indexOf(childrenBirths);
      const letter = String.fromCharCode("A".charCodeAt(0) + (rank>=0?rank:existing.length));
      return P + letter;
    } else {
      // children are P + 1,2,3... based on birth order
      const existing = persons
        .filter(p=>p.parents && p.parents.includes(P))
        .sort((a,b)=> (U.parseDate(a.birth)||0) - (U.parseDate(b.birth)||0));
      const births = existing.map(p=>U.parseDate(p.birth)).filter(Boolean).concat(childrenBirths? [childrenBirths]:[]);
      const rank = births.sort((a,b)=>a-b).indexOf(childrenBirths);
      const num = (rank>=0?rank:existing.length)+1;
      return P + String(num);
    }
  },
  calcRingCode(p){
    if(p.inheritedFrom){
      return `${p.inheritedFrom}→${p.code}`;
    }
    return p.code;
  },
  ensureRefsConsistency(){
    // Remove broken refs after deletions
    const codes = new Set(persons.map(p=>p.code));
    for(const p of persons){
      if(p.partner && !codes.has(p.partner)) p.partner = "";
      if(p.parents){
        p.parents = p.parents.filter(c=>codes.has(c));
      }
      if(p.children){
        p.children = p.children.filter(c=>codes.has(c));
      }
      if(p.inheritedFrom && !codes.has(p.inheritedFrom)) p.inheritedFrom = "";
      // recompute gen and ring
      p.gen = U.genFromCode(p.code);
      p.ring = U.calcRingCode(p);
    }
  },
  codeExists(code){ return persons.some(p=>p.code===code); },
  findByCode(code){ return persons.find(p=>p.code===code); },
  toCSV(rows){
    const header = ["gen","code","name","birth","gender","partner","parents","children","ring","inheritedFrom","remark"];
    const esc = v => `"${String(v).replace(/"/g,'""')}"`;
    const lines = [header.join(",")];
    for(const p of rows){
      lines.push([p.gen,p.code,p.name,p.birth,p.gender,p.partner,(p.parents||[]).join("|"),(p.children||[]).join("|"),p.ring,p.inheritedFrom||"",p.remark||""].map(esc).join(","));
    }
    return lines.join("\r\n");
  },
  fromCSV(text){
    const lines = text.trim().split(/\r?\n/);
    const [headerLine, ...dataLines] = lines;
    const header = headerLine.split(",");
    const idx = (name)=> header.indexOf(name);
    const out = [];
    for(const line of dataLines){
      const cells = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(s=>s.replace(/^"|"$/g,"").replace(/""/g,'"'));
      const get = (k)=> cells[idx(k)]||"";
      const parents = get("parents")? get("parents").split("|"):[];
      const children = get("children")? get("children").split("|"):[];
      const p = {
        gen: parseInt(get("gen")||"0",10),
        code: get("code"),
        name: get("name"),
        birth: get("birth"),
        gender: get("gender"),
        partner: get("partner"),
        parents, children,
        ring: get("ring"),
        inheritedFrom: get("inheritedFrom"),
        remark: get("remark")
      };
      out.push(p);
    }
    return out;
  }
};

// --- Data layer ---
const Data = {
  persist(){ localStorage.setItem(LS_KEY, JSON.stringify(persons)); },
  load(){
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return null;
    try{ return JSON.parse(raw);}catch{ return null;}
  },
  exportJSON(){
    const blob = new Blob([JSON.stringify(persons,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "family-rings.json";
    document.body.appendChild(a); a.click(); a.remove();
  },
  exportCSV(){
    const csv = U.toCSV(persons);
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "family-rings.csv";
    document.body.appendChild(a); a.click(); a.remove();
  }
};

function loadData(){
  const saved = Data.load();
  if(saved && Array.isArray(saved) && saved.length){
    return saved;
  }
  // Beispiel-Datensatz minimal (du pflegst selbst)
  const demo = [
    { code:"1", name:"Olaf Geppert", birth:"01.01.1950", gender:"m", partner:"1x", parents:[], children:["1A","1B"], inheritedFrom:"", remark:"" },
    { code:"1x", name:"Irina Geppert", birth:"02.02.1955", gender:"w", partner:"1", parents:[], children:["1A","1B"], inheritedFrom:"", remark:"" },
    { code:"1A", name:"Kind A", birth:"01.01.1980", gender:"m", partner:"", parents:["1","1x"], children:["1A1"], inheritedFrom:"", remark:"" },
    { code:"1B", name:"Kind B", birth:"01.01.1982", gender:"w", partner:"", parents:["1","1x"], children:[], inheritedFrom:"", remark:"" },
    { code:"1A1", name:"Enkel A1", birth:"01.01.2010", gender:"m", partner:"", parents:["1A"], children:[], inheritedFrom:"1A", remark:"" }
  ];
  for(const p of demo){
    p.code = U.normalizeCodeInput(p.code);
    p.partner = U.normalizeCodeInput(p.partner);
    p.parents = (p.parents||[]).map(U.normalizeCodeInput);
    p.children = (p.children||[]).map(U.normalizeCodeInput);
    p.gen = U.genFromCode(p.code);
    p.ring = U.calcRingCode(p);
  }
  return demo;
}

// --- UI Layer ---
const UI = {
  els:{
    tableBody: null, tree: null,
    personDialog: null, deleteDialog: null, exportDialog: null, printDialog:null, helpPopup:null
  },
  init(){
    this.els.tableBody = document.querySelector("#personTable tbody");
    this.els.tree = document.querySelector("#familyTree");
    this.els.personDialog = document.getElementById("personDialog");
    this.els.deleteDialog = document.getElementById("deleteDialog");
    this.els.exportDialog = document.getElementById("exportDialog");
    this.els.printDialog = document.getElementById("printDialog");
    this.els.helpPopup = document.getElementById("helpPopup");

    document.getElementById("btnNew").onclick = ()=>UI.openPersonDialog();
    document.getElementById("btnDelete").onclick = ()=>UI.openDeleteDialog();
    document.getElementById("btnExport").onclick = ()=>UI.openExportDialog();
    document.getElementById("btnImport").onclick = ()=>UI.triggerImport();
    document.getElementById("btnUndo").onclick = ()=>UI.undo();
    document.getElementById("btnRedo").onclick = ()=>UI.redo();
    document.getElementById("btnPrint").onclick = ()=>UI.openPrintDialog();
    document.getElementById("btnStats").onclick = ()=>UI.showStats();
    document.getElementById("btnHelp").onclick = ()=>UI.showHelp();
    document.getElementById("btnReset").onclick = ()=>UI.resetAll();

    document.getElementById("searchInput").addEventListener("input", UI.applySearch);

    // double click to edit
    document.querySelector("#personTable").addEventListener("dblclick", (e)=>{
      const tr = e.target.closest("tr");
      if(!tr) return;
      const code = tr.getAttribute("data-code");
      if(code) UI.openPersonDialog(code);
    });

    document.getElementById("fileInput").addEventListener("change", UI.handleImportFile);

    this.renderAll();
  },
  renderAll(){
    this.renderTable();
    Tree.render();
    Data.persist();
  },
  renderTable(){
    const tbody = this.els.tableBody;
    tbody.innerHTML = "";
    // Sortierung: zuerst Generation, dann Personen-Code innerhalb Generation
    const sorted = U.clone(persons).sort((a,b)=>{
      const g = (a.gen||0) - (b.gen||0);
      if(g!==0) return g;
      return a.code.localeCompare(b.code);
    });
    for(const p of sorted){
      const tr = document.createElement("tr");
      tr.setAttribute("data-code", p.code);
      const parents = (p.parents||[]).join(" · ");
      const children = (p.children||[]).join(" · ");
      const ring = U.calcRingCode(p);
      tr.innerHTML = `
        <td>${p.gen||""}</td>
        <td>${p.code}</td>
        <td>${p.name||""}</td>
        <td>${p.birth||""}</td>
        <td>${p.gender||""}</td>
        <td>${p.partner||""}</td>
        <td>${parents}</td>
        <td>${children}</td>
        <td>${ring}</td>
        <td>${p.inheritedFrom||""}</td>
        <td>${p.remark||""}</td>`;
      tbody.appendChild(tr);
    }
    UI.applySearch(); // re-highlight after render
  },
  openPersonDialog(code){
    document.getElementById("personDialogTitle").textContent = code? "Person ändern":"Neue Person";
    const form = document.getElementById("personForm");
    form.dataset.editCode = code||"";
    // reset
    form.reset();
    if(code){
      const p = U.findByCode(code);
      if(p){
        document.getElementById("f_name").value = p.name||"";
        document.getElementById("f_birth").value = p.birth||"";
        document.getElementById("f_gender").value = p.gender||"";
        document.getElementById("f_partnerOf").value = ""; // Partner wird nicht geändert über diesen Weg
        document.getElementById("f_parent1").value = (p.parents&&p.parents[0])||"";
        document.getElementById("f_parent2").value = (p.parents&&p.parents[1])||"";
        document.getElementById("f_inherited").value = p.inheritedFrom||"";
        document.getElementById("f_remark").value = p.remark||"";
      }
    }
    this.personDialogSetVisible(true);
  },
  personDialogSetVisible(v){
    this.els.personDialog.setAttribute("aria-hidden", v? "false":"true");
  },
  closePersonDialog(){ UI.personDialogSetVisible(false); },
  savePerson(){
    const name = document.getElementById("f_name").value.trim();
    const birth = document.getElementById("f_birth").value.trim();
    const gender = document.getElementById("f_gender").value;
    const partnerOf = U.normalizeCodeInput(document.getElementById("f_partnerOf").value);
    const parent1 = U.normalizeCodeInput(document.getElementById("f_parent1").value);
    const parent2 = U.normalizeCodeInput(document.getElementById("f_parent2").value);
    const inherited = U.normalizeCodeInput(document.getElementById("f_inherited").value);
    const remark = document.getElementById("f_remark").value.trim();

    if(!name || !birth || !gender){
      alert("Bitte alle Pflichtfelder ausfüllen (Name, Geburtsdatum, Geschlecht).");
      return;
    }
    const dt = U.parseDate(birth);
    if(!dt){ alert("Bitte Datum im Format TT.MM.JJJJ eingeben."); return; }

    U.saveSnapshot();
    const editing = document.getElementById("personForm").dataset.editCode;

    if(editing){
      // update existing
      const p = U.findByCode(editing);
      if(!p){ alert("Person nicht gefunden."); return; }
      p.name = name; p.birth = birth; p.gender = gender;
      p.inheritedFrom = inherited;
      p.remark = remark;
      // parents adjustments (optional)
      p.parents = [parent1,parent2].filter(Boolean);
      p.ring = U.calcRingCode(p);
      p.gen = U.genFromCode(p.code);
      U.ensureRefsConsistency();
      UI.closePersonDialog();
      UI.renderAll();
      return;
    }

    // New person
    let code = "";
    let parents = [parent1,parent2].filter(Boolean);
    let partner = "";

    if(partnerOf){
      const main = partnerOf.replace(/x$/,"");
      code = main + "x";
      partner = main;
      // set relationship
      const other = U.findByCode(main);
      if(other){
        other.partner = code; // partner's code is this new person's code
      }
    } else if(parents.length){
      const P = parents[0].replace(/x$/,"");
      code = U.nextChildCode(P, dt);
    } else {
      // If no partnerOf and no parents: assume standalone root? Not allowed here.
      alert("Bitte entweder 'Partner von' ODER mindestens ein Eltern-Code angeben.");
      undoStack.pop(); // revert snapshot
      return;
    }

    if(U.codeExists(code)){
      alert("Der erzeugte Personen-Code existiert bereits. Bitte Daten prüfen.");
      undoStack.pop();
      return;
    }

    const p = {
      code, name, birth, gender, partner, parents, children:[],
      inheritedFrom: inherited, remark
    };
    p.gen = U.genFromCode(p.code);
    p.ring = U.calcRingCode(p);

    // attach child to parents
    for(const pc of parents){
      const pr = U.findByCode(pc.replace(/x$/,""));
      if(pr){
        pr.children = pr.children||[];
        if(!pr.children.includes(p.code)) pr.children.push(p.code);
      }
    }
    // connect partner both ways
    if(partner){
      p.partner = partner;
      const other = U.findByCode(partner);
      if(other) other.partner = p.code;
    }

    persons.push(p);
    U.ensureRefsConsistency();
    UI.closePersonDialog();
    UI.renderAll();
  },

  openDeleteDialog(){ this.els.deleteDialog.setAttribute("aria-hidden","false"); },
  closeDeleteDialog(){ this.els.deleteDialog.setAttribute("aria-hidden","true"); },
  confirmDelete(){
    const q = document.getElementById("del_query").value.trim();
    if(!q){ alert("Bitte Namen oder Code eingeben."); return; }
    U.saveSnapshot();
    const codeQuery = U.normalizeCodeInput(q);
    let target = U.findByCode(codeQuery);
    if(!target){
      // try by name (exact)
      target = persons.find(p=>p.name.trim().toLowerCase()===q.toLowerCase());
    }
    if(!target){ alert("Keine passende Person gefunden."); undoStack.pop(); return; }

    // remove person
    const code = target.code;
    persons = persons.filter(p=>p.code!==code);
    // remove references everywhere
    for(const p of persons){
      if(p.partner === code) p.partner = "";
      if(p.parents) p.parents = p.parents.filter(c=>c!==code);
      if(p.children) p.children = p.children.filter(c=>c!==code);
      if(p.inheritedFrom === code) p.inheritedFrom = "";
      p.ring = U.calcRingCode(p);
    }
    U.ensureRefsConsistency();
    this.closeDeleteDialog();
    this.renderAll();
  },

  openExportDialog(){ this.els.exportDialog.setAttribute("aria-hidden","false"); },
  closeExportDialog(){ this.els.exportDialog.setAttribute("aria-hidden","true"); },

  triggerImport(){
    document.getElementById("fileInput").value = "";
    document.getElementById("fileInput").click();
  },
  handleImportFile(e){
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      const text = reader.result;
      U.saveSnapshot();
      try{
        if(f.name.toLowerCase().endswith(".json")){
          const arr = JSON.parse(text);
          persons = Array.isArray(arr)? arr: [];
        }else{
          persons = U.fromCSV(text);
        }
        U.ensureRefsConsistency();
        UI.renderAll();
      }catch(err){
        alert("Import fehlgeschlagen: "+err);
        undoStack.pop();
      }
    };
    reader.readAsText(f, "utf-8");
  },

  openPrintDialog(){ this.els.printDialog.setAttribute("aria-hidden","false"); },
  closePrintDialog(){ this.els.printDialog.setAttribute("aria-hidden","true"); },

  printTable(){
    const w = window.open("", "_blank");
    const crest = '<img src="wappen.jpeg" style="height:36px;margin:0 8px" onerror="this.style.display=\\'none\\'"/>';
    const title = `<div style="text-align:center;font-family:system-ui,Arial"><div>${crest}<span style="font-size:22px;font-weight:700">Wappenringe der Familie GEPPERT</span>${crest}</div></div>`;
    let html = `
      <html><head><meta charset="UTF-8"><title>Druck Tabelle</title>
      <style>
        body{font-family:Arial,sans-serif;margin:16px}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
        thead th{background:#eee;position:sticky;top:0}
      </style></head><body>${title}
      <table><thead><tr>
        <th>Gen</th><th>Personencode</th><th>Name</th><th>Geburtsdatum</th><th>Geschlecht</th>
        <th>Partner</th><th>Eltern</th><th>Kinder</th><th>Ringcode</th><th>Geerbt von</th><th>Bemerkung</th>
      </tr></thead><tbody>`;
    const sorted = U.clone(persons).sort((a,b)=> (a.gen-b.gen) || a.code.localeCompare(b.code));
    for(const p of sorted){
      html += `<tr>
        <td>${p.gen||""}</td><td>${p.code}</td><td>${p.name||""}</td><td>${p.birth||""}</td><td>${p.gender||""}</td>
        <td>${p.partner||""}</td><td>${(p.parents||[]).join(" · ")}</td><td>${(p.children||[]).join(" · ")}</td>
        <td>${U.calcRingCode(p)}</td><td>${p.inheritedFrom||""}</td><td>${p.remark||""}</td>
      </tr>`;
    }
    html += `</tbody></table></body></html>`;
    w.document.write(html); w.document.close(); w.focus(); w.print();
    UI.closePrintDialog();
  },

  showStats(){
    // Gesamt, m, w, d + je Generation
    const total = persons.length;
    const m = persons.filter(p=>p.gender==="m").length;
    const w = persons.filter(p=>p.gender==="w").length;
    const d = persons.filter(p=>p.gender==="d").length;
    const gens = {};
    for(const p of persons){
      const g = p.gen||U.genFromCode(p.code);
      gens[g] = (gens[g]||0)+1;
    }
    let msg = `Gesamt: ${total}\nMännlich: ${m}\nWeiblich: ${w}\nDivers: ${d}\n\nAnzahl nach Generation:`;
    Object.keys(gens).sort((a,b)=>a-b).forEach(g=> msg+= `\n Generation ${g}: ${gens[g]}`);
    alert(msg);
  },

  showHelp(){ this.els.helpPopup.setAttribute("aria-hidden","false"); },
  closeHelp(){ this.els.helpPopup.setAttribute("aria-hidden","true"); },

  resetAll(){
    if(confirm("Sollen wirklich alle Personen gelöscht werden?")){
      U.saveSnapshot();
      persons = [];
      UI.renderAll();
    }
  },

  undo(){
    if(!undoStack.length) return;
    const state = undoStack.pop();
    redoStack.push(U.clone(persons));
    U.restore(state);
  },
  redo(){
    if(!redoStack.length) return;
    const state = redoStack.pop();
    undoStack.push(U.clone(persons));
    U.restore(state);
  },

  applySearch(){
    const q = document.getElementById("searchInput").value.trim().toLowerCase();
    // Clear previous marks by re-render? Instead, rebuild tbody to ensure fresh state.
    const rows = document.querySelectorAll("#personTable tbody tr");
    rows.forEach(tr=>{
      // reset content from data to avoid nested marks
      const code = tr.getAttribute("data-code");
      const p = persons.find(pp=>pp.code===code);
      if(!p) return;
      tr.innerHTML = `
        <td>${p.gen||""}</td>
        <td>${p.code}</td>
        <td>${p.name||""}</td>
        <td>${p.birth||""}</td>
        <td>${p.gender||""}</td>
        <td>${p.partner||""}</td>
        <td>${(p.parents||[]).join(" · ")}</td>
        <td>${(p.children||[]).join(" · ")}</td>
        <td>${U.calcRingCode(p)}</td>
        <td>${p.inheritedFrom||""}</td>
        <td>${p.remark||""}</td>`;
    });
    if(!q){ return; }
    // highlight matches
    const markCell = (td)=>{
      const text = td.textContent;
      if(!text) return;
      const idx = text.toLowerCase().indexOf(q);
      if(idx>=0){
        const before = text.slice(0,idx);
        const mid = text.slice(idx, idx+q.length);
        const after = text.slice(idx+q.length);
        td.innerHTML = `${before}<mark>${mid}</mark>${after}`;
      }
    };
    document.querySelectorAll("#personTable tbody tr td").forEach(markCell);
  }
};

// --- Stammbaum (SVG) ---
const Tree = {
  render(){
    const svg = document.getElementById("familyTree");
    while(svg.firstChild) svg.removeChild(svg.firstChild);

    // layout by generation levels (top to bottom)
    const byGen = {};
    for(const p of persons){
      p.gen = U.genFromCode(p.code);
      if(!byGen[p.gen]) byGen[p.gen]=[];
      byGen[p.gen].push(p);
    }
    const gens = Object.keys(byGen).map(n=>+n).sort((a,b)=>a-b);
    // sort inside gen by code for stability
    gens.forEach(g=> byGen[g].sort((a,b)=> a.code.localeCompare(b.code)) );

    const nodeW=150,nodeH=46,hGap=30,vGap=80;
    let y=20;
    const pos = {}; // code -> {x,y}
    let svgW = 1000, svgH = 200 + gens.length*(nodeH+vGap);

    for(const g of gens){
      const row = byGen[g];
      const width = row.length* (nodeW + hGap) + 40;
      svgW = Math.max(svgW, width);
      let x = 20;
      for(const p of row){
        pos[p.code] = {x,y};
        // node rectangle with inline styles (for print)
        this.node(svg, x, y, nodeW, nodeH, p);
        x += nodeW + hGap;
      }
      y += nodeH + vGap;
    }

    // partner lines (horizontal)
    for(const p of persons){
      if(p.partner){
        const a = pos[p.code], b = pos[p.partner];
        if(a && b && a.y===b.y){
          const yMid = a.y + nodeH/2;
          const x1 = a.x + nodeW; const x2 = b.x;
          this.line(svg, x1, yMid, x2, yMid);
        }
      }
    }
    // parent-child lines
    for(const child of persons){
      const parents = (child.parents||[]).map(c=>c.replace(/x$/,""));
      if(parents.length){
        const main = U.findByCode(parents[0]);
        const mainPos = pos[parents[0]] || pos[(parents[0]||"").replace(/x$/,"")];
        if(mainPos){
          const cx = (pos[child.code].x + nodeW/2);
          const cy = pos[child.code].y;
          const px = mainPos.x + nodeW/2;
          const py = mainPos.y + nodeH;
          // vertical from parent level down to child level
          this.line(svg, px, py, px, cy);
          // horizontal from vertical line to child top center
          this.line(svg, px, cy, cx, cy);
        }
      }
    }

    svg.setAttribute("width", String(svgW));
    svg.setAttribute("height", String(svgH));
  },
  node(svg, x,y,w,h,p){
    const g = document.createElementNS("http://www.w3.org/2000/svg","g");
    const rect = document.createElementNS("http://www.w3.org/2000/svg","rect");
    rect.setAttribute("x",x); rect.setAttribute("y",y);
    rect.setAttribute("width",w); rect.setAttribute("height",h);
    rect.setAttribute("rx",8); rect.setAttribute("ry",8);
    rect.setAttribute("fill","#f5f9ff"); rect.setAttribute("stroke","#1f6feb");
    rect.setAttribute("stroke-width","1.2");
    g.appendChild(rect);

    const t1 = document.createElementNS("http://www.w3.org/2000/svg","text");
    t1.setAttribute("x", x+w/2); t1.setAttribute("y", y+18);
    t1.setAttribute("text-anchor","middle"); t1.setAttribute("font-size","13"); t1.setAttribute("font-weight","700");
    t1.textContent = p.code;
    g.appendChild(t1);

    const t2 = document.createElementNS("http://www.w3.org/2000/svg","text");
    t2.setAttribute("x", x+w/2); t2.setAttribute("y", y+34);
    t2.setAttribute("text-anchor","middle"); t2.setAttribute("font-size","12");
    t2.textContent = `${p.name||""} ${p.birth?("("+p.birth+")"):""}`.trim();
    g.appendChild(t2);

    svg.appendChild(g);
  },
  line(svg, x1,y1,x2,y2){
    const ln = document.createElementNS("http://www.w3.org/2000/svg","line");
    ln.setAttribute("x1",x1); ln.setAttribute("y1",y1);
    ln.setAttribute("x2",x2); ln.setAttribute("y2",y2);
    ln.setAttribute("stroke","#555"); ln.setAttribute("stroke-width","1");
    svg.appendChild(ln);
  },
  printTree(){
    const svgEl = document.getElementById("familyTree");
    const svg = svgEl.outerHTML;
    const crest = '<img src="wappen.jpeg" style="height:36px;margin:0 8px" onerror="this.style.display=\\'none\\'"/>';
    const title = `<div style="text-align:center;font-family:system-ui,Arial"><div>${crest}<span style="font-size:22px;font-weight:700">Wappenringe der Familie GEPPERT</span>${crest}</div></div>`;
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><meta charset="UTF-8"><title>Druck Stammbaum</title></head>
      <body>${title}${svg}</body></html>
    `);
    w.document.close(); w.focus(); w.print();
    UI.closePrintDialog();
  }
};

// --- Wire global handlers for HTML ---
window.UI = UI;
window.Data = Data;
window.Tree = Tree;

// --- Init ---
window.addEventListener("DOMContentLoaded", ()=>{
  UI.init();
});

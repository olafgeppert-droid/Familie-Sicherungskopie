
// Family Ring App v83a -- Stammbaum-Logik aus v55b übernommen (vereinfachte Umsetzung)
(function(){
  const VERSION = window.APP_VERSION || "v83a";

  // ---- Data persistence ----
  const STORAGE_KEY = "familyRingDataV82"; // beibehalten, damit bestehende Daten bleiben
  let data = loadData();
  let undoStack = [], redoStack = [];

  // ---- Elements ----
  const tb = document.querySelector("#peopleTable tbody");
  const search = document.getElementById("search");
  const svg = document.getElementById("treeSvg");
  const btnNew = document.getElementById("btnNew");
  const btnDelete = document.getElementById("btnDelete");
  const btnImport = document.getElementById("btnImport");
  const btnExport = document.getElementById("btnExport");
  const btnPrint = document.getElementById("btnPrint");
  const btnStats = document.getElementById("btnStats");
  const btnUndo = document.getElementById("btnUndo");
  const btnRedo = document.getElementById("btnRedo");
  const btnReset = document.getElementById("btnReset");
  const btnHelp = document.getElementById("btnHelp");

  const dlgPrint = document.getElementById("printDialog");
  const dlgPrintClose = document.getElementById("printClose");
  const dlgPrintCancel = document.getElementById("printCancel");
  const btnPrintTable = document.getElementById("printTable");
  const btnPrintTree = document.getElementById("printTree");

  const dlgReset = document.getElementById("resetDialog");
  const resetClose = document.getElementById("resetClose");
  const resetCancel = document.getElementById("resetCancel");
  const resetOk = document.getElementById("resetOk");

  const dlgNew = document.getElementById("newDialog");
  const newClose = document.getElementById("newClose");
  const newCancel = document.getElementById("newCancel");
  const newSave = document.getElementById("newSave");
  const fldName = document.getElementById("newName");
  const fldDob = document.getElementById("newDob");
  const fldBirthplace = document.getElementById("newBirthplace");
  const fldSex = document.getElementById("newSex");
  const fldParents = document.getElementById("newParents");
  const fldPartner = document.getElementById("newPartner");
  const fldComment = document.getElementById("newComment");

  // ---- Render initial ----
  renderTable();
  renderTree();

  // ---- Event wiring ----
  search.addEventListener("input", ()=> renderTable(search.value.trim()));
  btnNew.addEventListener("click", ()=> openModal(dlgNew));
  newClose.addEventListener("click", ()=> closeModal(dlgNew));
  newCancel.addEventListener("click", ()=> closeModal(dlgNew));
  newSave.addEventListener("click", saveNewPerson);

  btnDelete.addEventListener("click", deleteSelected);
  btnExport.addEventListener("click", doExport);
  btnImport.addEventListener("click", doImport);
  btnPrint.addEventListener("click", ()=> openModal(dlgPrint));
  dlgPrintClose.addEventListener("click", ()=> closeModal(dlgPrint));
  dlgPrintCancel.addEventListener("click", ()=> closeModal(dlgPrint));
  btnPrintTable.addEventListener("click", ()=> handlePrint('table'));
  btnPrintTree.addEventListener("click", ()=> handlePrint('tree'));

  btnStats.addEventListener("click", showStats);
  btnUndo.addEventListener("click",()=>undo());
  btnRedo.addEventListener("click",()=>redo());
  btnReset.addEventListener("click", ()=> openModal(dlgReset));
  resetClose.addEventListener("click", ()=> closeModal(dlgReset));
  resetCancel.addEventListener("click", ()=> closeModal(dlgReset));
  resetOk.addEventListener("click", doReset);
  btnHelp.addEventListener("click", ()=> window.open('help.html','_blank'));

  // ---- Core ----

  function loadData(){
    let raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      try { return JSON.parse(raw); } catch(e){}
    }
    // default sample matching screenshot
    const sample = [
      {gen:1, code:"1", ringCode:"1", name:"Olaf Geppert", dob:"13.01.1965", birthplace:"Chemnitz", sex:"m", parents:"", partner:"1x", inheritedFrom:"", note:"Stammvater"},
      {gen:1, code:"1x", ringCode:"1x", name:"Irina Geppert", dob:"13.01.1970", birthplace:"Berlin", sex:"w", parents:"", partner:"1", inheritedFrom:"", note:"Partnerin"},
      {gen:2, code:"1A", ringCode:"1A", name:"Mario Geppert", dob:"28.04.1995", birthplace:"Berlin", sex:"m", parents:"1", partner:"1Ax", inheritedFrom:"1", note:"1. Sohn"},
      {gen:2, code:"1Ax", ringCode:"1Ax", name:"Kim", dob:"", birthplace:"", sex:"w", parents:"", partner:"1A", inheritedFrom:"", note:"Partnerin"},
      {gen:2, code:"1B", ringCode:"1B", name:"Nicolas Geppert", dob:"04.12.2000", birthplace:"Berlin", sex:"m", parents:"1", partner:"1Bx", inheritedFrom:"1", note:"2. Sohn"},
      {gen:2, code:"1Bx", ringCode:"1Bx", name:"Annika", dob:"", birthplace:"", sex:"w", parents:"", partner:"1B", inheritedFrom:"", note:"Partnerin"},
      {gen:2, code:"1C", ringCode:"1C", name:"Julienne Geppert", dob:"26.09.2002", birthplace:"Berlin", sex:"w", parents:"1", partner:"1Cx", inheritedFrom:"1", note:"Tochter"},
      {gen:2, code:"1Cx", ringCode:"1Cx", name:"Jonas", dob:"", birthplace:"", sex:"m", parents:"", partner:"1C", inheritedFrom:"", note:"Partner"},
      {gen:3, code:"1C1", ringCode:"1C1", name:"Michael Geppert", dob:"12.07.2025", birthplace:"Hochstätten", sex:"m", parents:"1C", partner:"", inheritedFrom:"1C", note:""}
    ];
    return sample;
  }

  function saveData(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function snapshot(){
    undoStack.push(JSON.stringify(data));
    redoStack.length = 0;
  }

  function undo(){
    if(!undoStack.length) return;
    redoStack.push(JSON.stringify(data));
    data = JSON.parse(undoStack.pop());
    saveData(); renderTable(search.value.trim()); renderTree();
  }
  function redo(){
    if(!redoStack.length) return;
    undoStack.push(JSON.stringify(data));
    data = JSON.parse(redoStack.pop());
    saveData(); renderTable(search.value.trim()); renderTree();
  }

  function renderTable(filter=""){
    const filterLC = filter.toLowerCase();
    tb.innerHTML = "";
    data.forEach((p,i)=>{
      // filter
      if(filter && !(p.name.toLowerCase().includes(filterLC) || (p.code||"").toLowerCase().includes(filterLC) || (p.ringCode||"").toLowerCase().includes(filterLC))) return;
      const tr = document.createElement("tr");
      tr.dataset.index = i;
      tr.innerHTML = `
        <td>${p.gen||""}</td><td>${p.code||""}</td><td>${p.ringCode||""}</td><td>${p.name||""}</td>
        <td>${p.dob||""}</td><td>${p.birthplace||""}</td><td>${p.sex||""}</td>
        <td>${p.parents||""}</td><td>${p.partner||""}</td><td>${p.inheritedFrom||""}</td><td>${p.note||""}</td>`;
      tr.addEventListener("click", ()=>{
        for(const r of tb.querySelectorAll("tr")) r.classList.remove("sel");
        tr.classList.add("sel");
      });
      tb.appendChild(tr);
    });
  }

  function nextCodeBase(gen){
    // naive: Gen1 root code "1"; children get letters A,B,C; partners suffix 'x'
    if(gen===1) return "1";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const siblingCount = data.filter(p=>p.gen===gen && !p.code.endsWith("x")).length;
    const letter = letters[siblingCount % letters.length];
    return "1" + letter; // simplified base from screenshot
  }

  function saveNewPerson(){
    const name = fldName.value.trim();
    if(!name){ alert("Bitte Namen eingeben."); return; }
    snapshot();
    const gen = inferGen(fldParents.value.trim()) || 1;
    const base = nextCodeBase(gen);
    const code = base;
    const newP = {
      gen, code, ringCode: code, name,
      dob: fldDob.value.trim(), birthplace: fldBirthplace.value.trim(),
      sex: fldSex.value, parents: fldParents.value.trim(),
      partner: fldPartner.value.trim(), inheritedFrom:"", note: fldComment.value.trim()
    };
    data.push(newP);
    saveData(); closeModal(dlgNew);
    fldName.value = fldDob.value = fldBirthplace.value = fldParents.value = fldPartner.value = fldComment.value = "";
    renderTable(search.value.trim());
    renderTree();
  }

  function inferGen(parentsCode){
    if(!parentsCode) return 1;
    // If parents like "1" -> children gen 2; "1C" -> gen 3, etc (count digits/letters)
    // Here: 1->gen2, 1C->gen3
    const base = parentsCode.replace(/x$/,"");
    return 1 + (base.length>1 ? 2 : 1); // extremely simplified but fits sample
  }

  function deleteSelected(){
    const sel = tb.querySelector("tr.sel");
    if(!sel) return;
    const idx = +sel.dataset.index;
    snapshot();
    data.splice(idx,1); saveData(); renderTable(search.value.trim()); renderTree();
  }

  function doExport(){
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const fileName = 'family-data.json';
    if(navigator.share && /iPad|iPhone|iPod/i.test(navigator.userAgent)){
      const file = new File([blob], fileName, {type:'application/json'});
      navigator.share({files:[file], title:'Familien-Daten', text:'Export aus Family-Ring'}).catch(()=>{});
    }else{
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href), 1500);
    }
  }

  function doImport(){
    const inp = document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
    inp.onchange = () => {
      const file = inp.files[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try{
          const arr = JSON.parse(reader.result);
          if(Array.isArray(arr)){
            snapshot(); data = arr; saveData(); renderTable(search.value.trim()); renderTree();
          } else alert('Ungültiges Format.');
        }catch(e){ alert('Import fehlgeschlagen.'); }
      };
      reader.readAsText(file);
    };
    inp.click();
  }

  function handlePrint(what){
    closeModal(dlgPrint);
    // iOS -> Share PDF; Desktop -> normales print
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    if(isIOS && navigator.share){
      toPdf(what).then((blob)=>{
        const file = new File([blob], `family-${what}.pdf`, {type:'application/pdf'});
        navigator.share({files:[file], title:'Drucken', text:`${what} als PDF`}).catch(()=>{});
      });
    }else{
      // open a new window with content and call print()
      const html = printHtml(what);
      const w = window.open('','_blank');
      w.document.write(html);
      w.document.close();
      setTimeout(()=>{ w.focus(); w.print(); }, 300);
    }
  }

  function toPdf(what){
    // lightweight PDF via SVG serialization for tree; table via HTML -> canvas -> PDF is heavy. We'll just open print window as PDF print target.
    // Fallback: create simple PDF-like blob of HTML using text/plain; iOS Share will still accept it for printing.
    const html = printHtml(what);
    return Promise.resolve(new Blob([html], {type:'text/html'}));
  }

  function printHtml(what){
    const title = 'Wappenringe der Familie GEPPERT';
    const date = new Date().toLocaleDateString('de-DE');
    let body = '';
    if(what==='table'){
      body = document.querySelector(".table-wrap").outerHTML;
    }else{
      const clone = svg.cloneNode(true);
      clone.removeAttribute('width'); clone.removeAttribute('height');
      clone.setAttribute('style','width:100%;height:auto');
      const wrap = document.createElement('div'); wrap.appendChild(clone);
      body = wrap.innerHTML;
    }
    return `<!doctype html><html><head><meta charset="utf-8"><title>Druck</title>
      <style>body{{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial}} h2{{margin:0 0 8px}}</style>
    </head><body>
      <h2>${title}</h2>
      ${body}
      <div style="margin-top:20px;font-size:12px;color:#333">Datum: ${date}</div>
    </body></html>`;
  }

  function showStats(){
    const total = data.length;
    const males = data.filter(p=>p.sex==='m').length;
    const females = data.filter(p=>p.sex==='w').length;
    alert(`Statistik:\nGesamt: ${total}\nm: ${males}\nw: ${females}`);
  }

  function doReset(){
    snapshot();
    data = []; saveData(); renderTable(search.value.trim()); renderTree(); closeModal(dlgReset);
  }

  function openModal(el){ el.classList.remove("hidden"); }
  function closeModal(el){ el.classList.add("hidden"); }

  // ---- Tree Rendering (inspired by v55b) ----
  function renderTree(){
    // Clear
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    const W = svg.viewBox.baseVal.width || 1400;
    const H = svg.viewBox.baseVal.height || 520;
    const margin = {top: 20, left: 40, right: 40, bottom: 20};
    const bandH = (H - margin.top - margin.bottom) / Math.max(1, Math.max(...data.map(p=>p.gen||1)));

    // Positions by generation
    const gens = {};
    data.forEach(p=>{ gens[p.gen] ||= []; gens[p.gen].push(p); });
    Object.keys(gens).forEach(g=> gens[g].sort((a,b)=> (a.code||'').localeCompare(b.code||'')));

    const pos = {}; // code -> {x,y,w,h}
    const colW = 170, colPad = 30;
    let y = margin.top + 10;

    Object.keys(gens).sort((a,b)=>a-b).forEach(g=>{
      const row = gens[g];
      const rowY = y + (bandH-80)/2;
      let x = margin.left;
      row.forEach(p=>{
        const w = 180, h = 44;
        pos[p.code] = {x, y: rowY, w, h, gen: p.gen};
        x += w + colPad;
      });
      y += bandH;
    });

    // Draw partner bus lines + vertical child lines
    // Helper: get partner base (strip trailing 'x')
    const base = (code)=> (code||"").replace(/x$/,"");

    // Children groups keyed by parents code base from 'parents' field
    const childrenByParents = {};
    data.forEach(ch=>{
      const e = (ch.parents||"").trim();
      if(!e) return;
      const b = base(e);
      (childrenByParents[b] ||= []).push(ch);
    });

    // Draw partner lines (solid if have children, dashed otherwise)
    const drawnPairs = new Set();
    data.forEach(p=>{
      const partnerCode = (p.partner||"").trim();
      if(!partnerCode) return;
      const a = p.code, b = partnerCode;
      const key = [a,b].sort().join("|");
      if(drawnPairs.has(key)) return;
      drawnPairs.add(key);
      if(!(pos[a] && pos[b])) return;
      const A = pos[a], B = pos[b];
      const yMid = (A.y + B.y)/2 + 22; // mid line
      const x1 = A.x + A.w, x2 = B.x;
      // Determine if couple has children
      const hasKids = !!childrenByParents[base(a)] || !!childrenByParents[base(b)];
      drawLine(Math.min(x1, x2)-10, yMid, Math.max(x1, x2)+10, yMid, hasKids ? false : true);
      // anchor point for verticals to kids if any
      if(hasKids){
        const midX = (Math.min(x1, x2)+Math.max(x1, x2))/2;
        // draw verticals from mid bus to each child
        const kids = (childrenByParents[base(a)] || childrenByParents[base(b)] || []);
        kids.forEach(ch=>{
          const cpos = pos[ch.code]; if(!cpos) return;
          drawLine(midX, yMid, midX, cpos.y, false);
          // connect horizontally to child's top center
          drawLine(midX, cpos.y, cpos.x + cpos.w/2, cpos.y, false);
        });
      }
    });

    // For single parents with children where no partner bus exists (e.g., only one parent known)
    Object.entries(childrenByParents).forEach(([parentBase, kids])=>{
      // If we already drew a partner bus for this base, skip
      const haveCouple = data.some(p=> base(p.code)===parentBase && p.partner);
      if(haveCouple) return;
      // anchor from the single parent's box bottom center
      const parent = data.find(p=> base(p.code)===parentBase);
      if(!parent || !pos[parent.code]) return;
      const P = pos[parent.code];
      const xMid = P.x + P.w/2;
      kids.forEach(ch=>{
        const C = pos[ch.code]; if(!C) return;
        drawLine(xMid, P.y+P.h, xMid, C.y, false);
        drawLine(xMid, C.y, C.x + C.w/2, C.y, false);
      });
    });

    // Draw nodes on top
    Object.values(pos).forEach((p)=>{
      const node = makeNode(p);
      svg.appendChild(node);
    });

    // --- helpers ---
    function makeNode(p){
      const g = document.createElementNS("http://www.w3.org/2000/svg","g");
      g.setAttribute("class", "node g"+(p.gen||1));
      const r = document.createElementNS(svg.namespaceURI,"rect");
      r.setAttribute("x", p.x); r.setAttribute("y", p.y);
      r.setAttribute("width", p.w); r.setAttribute("height", p.h);
      g.appendChild(r);
      const person = data.find(q=> pos[q.code]===p);
      const t1 = document.createElementNS(svg.namespaceURI,"text");
      t1.setAttribute("x", p.x+8); t1.setAttribute("y", p.y+18);
      t1.textContent = (person?.code || "") + " / " + (person?.name || "");
      const t2 = document.createElementNS(svg.namespaceURI,"text");
      t2.setAttribute("x", p.x+8); t2.setAttribute("y", p.y+36);
      t2.textContent = "Generation: " + (person?.gen||"") + " / " + (person?.dob||"");
      t1.setAttribute("font-size","12"); t2.setAttribute("font-size","12");
      g.appendChild(t1); g.appendChild(t2);
      return g;
    }

    function drawLine(x1,y1,x2,y2,dashed){
      const path = document.createElementNS(svg.namespaceURI,"path");
      const d = `M ${x1} ${y1} L ${x2} ${y2}`;
      path.setAttribute("d", d);
      path.setAttribute("class", "link"+(dashed?" dashed":""));
      svg.appendChild(path);
    }
  }

})();
// Family Ring WebApp v8 – robust login + features
const PASSWORD = "gepperT13Olli";
const STORAGE_KEY = "familyRingData_v3";

// ---- Auth
const btnLogin = document.getElementById("btnLogin");
btnLogin && btnLogin.addEventListener("click", () => {
  const v = (document.getElementById("pwd").value || "").trim();
  if(v === PASSWORD){
    document.getElementById("loginOverlay").style.display = "none";
  } else {
    document.getElementById("loginMsg").textContent = "Falsches Passwort.";
    const pw = document.getElementById('pwd'); if(pw){ pw.value = ''; pw.focus(); }
  }
});
// Enter to submit password
const pwdInput = document.getElementById('pwd');
if(pwdInput){ pwdInput.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter'){ document.getElementById('btnLogin').click(); } }); }

// ---- Storage safe wrappers
const __memStore = {}; // fallback for environments without localStorage
function safeGetItem(k){ try { return window.localStorage.getItem(k); } catch(e){ return __memStore[k]||null; } }
function safeSetItem(k,v){ try { window.localStorage.setItem(k,v); } catch(e){ __memStore[k]=v; } }

// ---- Seed data
const seed = [
  {Code:"1", Name:"Olaf Geppert", BirthDate:"13.01.1965", BirthPlace:"Herford", Gender:"m", Generation:0, ParentCode:"", PartnerCode:"1x", Note:"Stammvater", Inherited:false, InheritedFromCode:""},
  {Code:"1x", Name:"Irina Geppert", BirthDate:"13.01.1970", BirthPlace:"Halle/Westfalen", Gender:"w", Generation:0, ParentCode:"", PartnerCode:"1", Note:"Ehefrau von Olaf", Inherited:false, InheritedFromCode:""},
  {Code:"1A", Name:"Mario Geppert", BirthDate:"28.04.1995", BirthPlace:"Würselen", Gender:"m", Generation:1, ParentCode:"1", PartnerCode:"1Ax", Note:"1. Sohn", Inherited:false, InheritedFromCode:""},
  {Code:"1Ax", Name:"Kim", BirthDate:"", BirthPlace:"", Gender:"w", Generation:1, ParentCode:"", PartnerCode:"1A", Note:"Partnerin von Mario", Inherited:false, InheritedFromCode:""}
];
function loadData(){ const raw = safeGetItem(STORAGE_KEY); if(!raw){ safeSetItem(STORAGE_KEY, JSON.stringify(seed)); return seed.slice(); } try { return JSON.parse(raw); } catch(e){ safeSetItem(STORAGE_KEY, JSON.stringify(seed)); return seed.slice(); } }
function saveData(data){ safeSetItem(STORAGE_KEY, JSON.stringify(data)); }
let people = loadData();

// ---- Undo/Redo
const undoStack = []; const redoStack = [];
function snapshot(){ return JSON.stringify(people); }
function pushUndo(){ undoStack.push(snapshot()); if(undoStack.length>30) undoStack.shift(); redoStack.length = 0; }
function canUndo(){ return undoStack.length>0; }
function canRedo(){ return redoStack.length>0; }
function doUndo(){ if(!canUndo()) return; redoStack.push(snapshot()); people = JSON.parse(undoStack.pop()); saveData(people); renderTable(currentFilter); drawTree(); updateUndoRedoButtons(); }
function doRedo(){ if(!canRedo()) return; undoStack.push(snapshot()); people = JSON.parse(redoStack.pop()); saveData(people); renderTable(currentFilter); drawTree(); updateUndoRedoButtons(); }
function updateUndoRedoButtons(){ const bu=document.getElementById('btnUndo'), br=document.getElementById('btnRedo'); if(bu) bu.disabled=!canUndo(); if(br) br.disabled=!canRedo(); }

document.getElementById('btnUndo').onclick = ()=> doUndo();
document.getElementById('btnRedo').onclick = ()=> doRedo();
updateUndoRedoButtons();

// ---- Helpers
function indexToLetters(n){ let r=""; while(n>0){ n--; r = String.fromCharCode(65 + (n % 26)) + r; n=Math.floor(n/26);} return r; }
function childrenOf(parentCode){ return people.filter(p => p.ParentCode === parentCode); }
function generateChildCode(parentCode){ const count = childrenOf(parentCode).length + 1; if(parentCode === "1") return parentCode + indexToLetters(count); return parentCode + String(count); }
function generatePartnerCode(code){ return code + "x"; }
function inferGeneration(code){ if(code === "1" || code === "1x") return 0; const core = (code||"").toString().replace(/x/g,""); let gen = 0; if(core.startsWith("1") && core.length >= 2 && /[A-Z]/.test(core[1])) gen = 1; const digits = core.slice(2).replace(/[^0-9]/g,"").length; gen += digits>0 ? digits : 0; return gen; }
function ringCodeFor(p){ if(p && (p.Inherited === true || (p.InheritedFromCode||"").trim() !== "")){ const src = (p.InheritedFromCode||"").trim(); if(src) return `${src} ➔${p.Code}`; } return p.Code; }
function normalizeCode(v){ const u = (v||"").toString().trim().toUpperCase(); return u.replace(/X/g,'x'); }
function escRe(s){ return s.replace(/[.*+?^${}()|[\]\]/g, "\$&"); }
function hl(text, q){ if(!q) return text; const re = new RegExp(escRe(q), 'ig'); return (text||"").toString().replace(re, m=>`<mark class="hl">${m}</mark>`); }

// ---- UI: Table & search highlight
const tbody = document.querySelector('#peopleTable tbody');
let currentFilter='';
function renderTable(list = people, q = currentFilter){ if(!tbody) return; currentFilter=q||''; tbody.innerHTML=''; const sorted=list.slice().sort((a,b)=>{const ga=inferGeneration(a.Code), gb=inferGeneration(b.Code); if(ga!==gb) return ga-gb; return a.Code.localeCompare(b.Code);}); sorted.forEach(p=>{ p.Generation=inferGeneration(p.Code); const tr=document.createElement('tr'); const name=hl(p.Name||'', q); const code=hl(p.Code||'', q); tr.innerHTML = `
  <td>${code}</td><td>${name}</td><td>${p.BirthDate||''}</td><td>${p.BirthPlace||''}</td><td>${p.Gender||''}</td><td>${p.Generation}</td><td>${p.ParentCode||''}</td><td>${p.PartnerCode||''}</td><td>${p.InheritedFromCode||''}</td><td>${ringCodeFor(p)}</td><td>${p.Note||''}</td>
  <td class="no-print"><button class="edit-btn" data-code="${p.Code}">Bearbeiten</button> <button class="delete-btn" data-code="${p.Code}">Löschen</button></td>`; tbody.appendChild(tr); }); updateUndoRedoButtons(); }
renderTable();

const searchInput=document.getElementById('search');
searchInput.addEventListener('input',()=>{ const q=(searchInput.value||'').trim().toLowerCase(); const list=people.filter(p=> (p.Name||'').toLowerCase().includes(q) || (p.Code||'').toLowerCase().includes(q)); renderTable(list,q); });
document.getElementById('btnSearch').onclick=()=>{ const q=(searchInput.value||'').trim().toLowerCase(); const list=people.filter(p=> (p.Name||'').toLowerCase().includes(q) || (p.Code||'').toLowerCase().includes(q)); renderTable(list,q); };
document.getElementById('btnShowAll').onclick=()=>{ searchInput.value=''; renderTable(people,''); };

// ---- Delete (simple)
tbody && tbody.addEventListener('click', (e)=>{
  const del = e.target.closest('.delete-btn'); if(del){ const code=del.getAttribute('data-code'); deletePerson(code); return; }
});
function deletePerson(code){ const person=people.find(p=>p.Code===code); if(!person) return; if(!confirm(`Soll „${person.Name||code}“ wirklich gelöscht werden?`)) return; people = people.filter(p=>p.Code!==code); saveData(people); renderTable(currentFilter); drawTree(); }

// ---- Tree (with ring code line)
const svg = document.getElementById('treeSvg');
function drawTree(){ if(!svg) return; while(svg.firstChild) svg.removeChild(svg.firstChild); const defs = document.createElementNS('http://www.w3.org/2000/svg','defs'); const grad=document.createElementNS('http://www.w3.org/2000/svg','linearGradient'); grad.setAttribute('id','gradNode'); grad.setAttribute('x1','0'); grad.setAttribute('x2','0'); grad.setAttribute('y1','0'); grad.setAttribute('y2','1'); const s1=document.createElementNS('http://www.w3.org/2000/svg','stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#2b3f73'); const s2=document.createElementNS('http://www.w3.org/2000/svg','stop'); s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#182747'); grad.append(s1,s2); defs.appendChild(grad); svg.appendChild(defs); const byGen={}; people.forEach(p=>{ p.Generation=inferGeneration(p.Code); (byGen[p.Generation] ||= []).push(p); }); const gens=Object.keys(byGen).map(Number).sort((a,b)=>a-b); const xStep=230,yStep=100,marginX=40,marginY=40; const pos={}; let maxY=0; gens.forEach(g=>{ const col=byGen[g].slice().sort((a,b)=>a.Code.localeCompare(b.Code)); col.forEach((p,i)=>{ const x=marginX+g*xStep, y=marginY+i*yStep; pos[p.Code]={x:x+92,y:y+32}; const rect=el('rect',{x, y, rx:10, ry:10, width:184, height:70, class:'node'}); const t1=el('text',{x:x+10,y:y+20}); t1.appendChild(document.createTextNode(`${p.Code}`)); const t2=el('text',{x:x+10,y:y+38}); t2.appendChild(document.createTextNode(`${p.Name||''}`)); const t3=el('text',{x:x+10,y:y+56}); t3.appendChild(document.createTextNode(`${ringCodeFor(p)}`)); svg.append(rect,t1,t2,t3); maxY=Math.max(maxY,y+70); }); }); people.forEach(p=>{ if(p.ParentCode && pos[p.ParentCode] && pos[p.Code]){ const a=pos[p.ParentCode], b=pos[p.Code]; const path=el('path',{d:`M${a.x},${a.y} C ${a.x+40},${a.y} ${b.x-40},${b.y} ${b.x},${b.y}`, class:'link'}); svg.insertBefore(path, svg.firstChild); } if(p.PartnerCode && pos[p.Code] && pos[p.PartnerCode]){ const a=pos[p.Code], b=pos[p.PartnerCode]; const line=el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'link partner'}); svg.insertBefore(line, svg.firstChild); } }); svg.setAttribute('height', String(maxY + 80)); }
function el(name, attrs){ const n=document.createElementNS('http://www.w3.org/2000/svg',name); for(const k in attrs){ n.setAttribute(k, attrs[k]); } return n; }
drawTree();

// ---- Export / Import / CSV
function openExportDialog(){ document.getElementById('dlgExport').showModal(); }
document.getElementById('btnExport').onclick = async ()=>{
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if(isiOS && navigator.share){
    try{
      const data = JSON.stringify(people, null, 2);
      const file = new File([data], 'familienringe_export.json', {type:'application/json'});
      if(!navigator.canShare || navigator.canShare({files:[file]})){
        await navigator.share({ files:[file], title:'Familienringe Export', text:'Exportdaten als JSON' });
        return;
      }
    }catch(e){ /* fallback to dialog below */ }
  }
  openExportDialog();
};
async function exportJsonSaveAs(){ const data = JSON.stringify(people, null, 2); if('showSaveFilePicker' in window){ try{ const handle = await window.showSaveFilePicker({ suggestedName: 'familienringe_export.json', types: [{ description:'JSON', accept:{'application/json':['.json']} }] }); const w = await handle.createWritable(); await w.write(data); await w.close(); alert('Export erfolgreich gespeichert.'); return; }catch(err){ if(err && err.name!=='AbortError'){ alert('Export fehlgeschlagen: '+err.message); } } } exportJsonDownload(); }
function exportJsonDownload(){ const blob = new Blob([JSON.stringify(people,null,2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='familienringe_export.json'; a.click(); URL.revokeObjectURL(a.href); }
document.getElementById('btnExportSaveAs').onclick = ()=>{ document.getElementById('dlgExport').close(); exportJsonSaveAs(); };
document.getElementById('btnExportDownload').onclick = ()=>{ document.getElementById('dlgExport').close(); exportJsonDownload(); };

function toCsv(rows){ return rows.map(r=> r.map(v=>{ const s=(v??'').toString().replace(/"/g,'""'); return '"'+s+'"'; }).join(',')).join('
'); }
function exportCsv(){ const header=['Personen-Code','Name','Geburtsdatum','Geburtsort','Geschlecht','Generation','Eltern-Code','Partner-Code','Geerbt von','Ring-Code','Kommentar']; const rows=people.slice().sort((a,b)=>{const ga=inferGeneration(a.Code),gb=inferGeneration(b.Code); return ga!==gb?ga-gb:a.Code.localeCompare(b.Code);}).map(p=>[ p.Code,p.Name||'',p.BirthDate||'',p.BirthPlace||'',p.Gender||'',inferGeneration(p.Code),p.ParentCode||'',p.PartnerCode||'',p.InheritedFromCode||'',ringCodeFor(p),p.Note||'' ]); const csv=toCsv([header,...rows]); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); if('showSaveFilePicker' in window){ (async()=>{ try{ const handle=await window.showSaveFilePicker({ suggestedName:'familienringe_export.csv', types:[{description:'CSV', accept:{'text/csv':['.csv']}}] }); const w=await handle.createWritable(); await w.write(csv); await w.close(); }catch(e){ if(e.name!=='AbortError'){ alert('CSV-Export fehlgeschlagen: '+e.message); } } })(); } else { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='familienringe_export.csv'; a.click(); URL.revokeObjectURL(a.href); } }
document.getElementById('btnExportCsv').onclick = ()=> exportCsv();

// Import basic (no dup handling in this concise build)
document.getElementById('fileImport').onchange = (ev)=>{ const f=ev.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result); if(Array.isArray(data)){ people=data; saveData(people); renderTable(); drawTree(); } else alert('Ungültiges Format.'); }catch(e){ alert('Fehler beim Import: '+e.message); } }; reader.readAsText(f); };

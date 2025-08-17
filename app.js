// Family Ring WebApp v5 – robust login, Undo/Redo, search highlight, export dialog, CSV, import dupes, ring code in tree
const PASSWORD = "gepperT13Olli";
const STORAGE_KEY = "familyRingData_v3";

// ---- Auth
const btnLogin = document.getElementById("btnLogin");
btnLogin && btnLogin.addEventListener("click", () => {
  const v = (document.getElementById("pwd").value || "").trim();
  if(v === PASSWORD){ document.getElementById("loginOverlay").style.display = "none"; }
  else { document.getElementById("loginMsg").textContent = "Falsches Passwort."; }
});
// Enter to submit password
const pwdInput = document.getElementById('pwd');
if(pwdInput){ pwdInput.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter'){ document.getElementById('btnLogin').click(); } }); }

// ---- Storage (robust localStorage with fallback)
const __memStore = {};
function safeGetItem(k){ try{ return window.localStorage.getItem(k); }catch(e){ return __memStore[k]||null; } }
function safeSetItem(k,v){ try{ window.localStorage.setItem(k,v); }catch(e){ __memStore[k]=v; } }
function loadData(){ const raw = safeGetItem(STORAGE_KEY); if(!raw){ safeSetItem(STORAGE_KEY, JSON.stringify(seed)); return seed.slice(); } try{ return JSON.parse(raw); }catch(e){ safeSetItem(STORAGE_KEY, JSON.stringify(seed)); return seed.slice(); } }
function saveData(data){ safeSetItem(STORAGE_KEY, JSON.stringify(data)); }

// ---- Seed (unchanged)
const seed = [
  {Code:"1", Name:"Olaf Geppert", BirthDate:"13.01.1965", BirthPlace:"Herford", Gender:"m", Generation:0, ParentCode:"", PartnerCode:"1x", Note:"Stammvater", Inherited:false, InheritedFromCode:""},
  {Code:"1x", Name:"Irina Geppert", BirthDate:"13.01.1970", BirthPlace:"Halle/Westfalen", Gender:"w", Generation:0, ParentCode:"", PartnerCode:"1", Note:"Ehefrau von Olaf", Inherited:false, InheritedFromCode:""},
  {Code:"1A", Name:"Mario Geppert", BirthDate:"28.04.1995", BirthPlace:"Würselen", Gender:"m", Generation:1, ParentCode:"1", PartnerCode:"1Ax", Note:"1. Sohn", Inherited:false, InheritedFromCode:""},
  {Code:"1Ax", Name:"Kim", BirthDate:"", BirthPlace:"", Gender:"w", Generation:1, ParentCode:"", PartnerCode:"1A", Note:"Partnerin von Mario", Inherited:false, InheritedFromCode:""},
  {Code:"1B", Name:"Nicolas Geppert", BirthDate:"04.12.2000", BirthPlace:"Starnberg", Gender:"m", Generation:1, ParentCode:"1", PartnerCode:"1Bx", Note:"2. Sohn", Inherited:false, InheritedFromCode:""},
  {Code:"1Bx", Name:"Annika", BirthDate:"", BirthPlace:"", Gender:"w", Generation:1, ParentCode:"", PartnerCode:"1B", Note:"Partnerin von Nicolas", Inherited:false, InheritedFromCode:""},
  {Code:"1C", Name:"Julienne Geppert", BirthDate:"26.09.2002", BirthPlace:"Starnberg", Gender:"w", Generation:1, ParentCode:"1", PartnerCode:"1Cx", Note:"Tochter", Inherited:false, InheritedFromCode:""},
  {Code:"1Cx", Name:"Jonas", BirthDate:"", BirthPlace:"", Gender:"m", Generation:1, ParentCode:"", PartnerCode:"1C", Note:"Partner von Julienne", Inherited:false, InheritedFromCode:""}
];

let people = loadData();

// ---- Undo/Redo
const undoStack = []; const redoStack = [];
function snapshot(){ return JSON.stringify(people); }
function pushUndo(){ undoStack.push(snapshot()); if(undoStack.length>30) undoStack.shift(); redoStack.length = 0; }
function canUndo(){ return undoStack.length>0; }
function canRedo(){ return redoStack.length>0; }
function doUndo(){ if(!canUndo()) return; redoStack.push(snapshot()); people = JSON.parse(undoStack.pop()); saveData(people); renderTable(currentFilter); drawTree(); updateUndoRedoButtons(); }
function doRedo(){ if(!canRedo()) return; undoStack.push(snapshot()); people = JSON.parse(redoStack.pop()); saveData(people); renderTable(currentFilter); drawTree(); updateUndoRedoButtons(); }
function updateUndoRedoButtons(){ const bu=document.getElementById('btnUndo'); const br=document.getElementById('btnRedo'); if(bu) bu.disabled=!canUndo(); if(br) br.disabled=!canRedo(); }

document.getElementById('btnUndo').onclick=()=>doUndo();
document.getElementById('btnRedo').onclick=()=>doRedo();
updateUndoRedoButtons();

// ---- Helpers
function indexToLetters(n){ let r=""; while(n>0){ n--; r = String.fromCharCode(65+(n%26))+r; n=Math.floor(n/26);} return r; }
function childrenOf(parentCode){ return people.filter(p=>p.ParentCode===parentCode); }
function generateChildCode(parentCode){ const count=childrenOf(parentCode).length+1; if(parentCode==="1") return parentCode+indexToLetters(count); return parentCode+String(count); }
function generatePartnerCode(code){ return code+"x"; }
function inferGeneration(code){ if(code==="1"||code==="1x") return 0; const core=(code||"").replace(/x/g,""); let gen=0; if(core.startsWith("1")&&core.length>=2&&/[A-Z]/.test(core[1])) gen=1; const digits=core.slice(2).replace(/[^0-9]/g,"").length; gen+=digits>0?digits:0; return gen; }
function ringCodeFor(p){ if(p&&(p.Inherited===true||(p.InheritedFromCode||"").trim()!=="")){ const src=(p.InheritedFromCode||"").trim(); if(src) return `${src} ➔${p.Code}`; } return p.Code; }
function normalizeCode(v){ const u=(v||"").toString().trim().toUpperCase(); return u.replace(/X/g,'x'); }
function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function hl(text,q){ if(!q) return text; const re=new RegExp(escRe(q),'ig'); return (text||"").toString().replace(re,m=>`<mark class="hl">${m}</mark>`); }

// ---- UI: table & search highlight
const tbody=document.querySelector('#peopleTable tbody');
let currentFilter='';
function renderTable(list=people,q=currentFilter){ if(!tbody) return; currentFilter=q||''; tbody.innerHTML=""; const sorted=list.slice().sort((a,b)=>{ const ga=inferGeneration(a.Code), gb=inferGeneration(b.Code); if(ga!==gb) return ga-gb; return a.Code.localeCompare(b.Code); }); sorted.forEach(p=>{ p.Generation=inferGeneration(p.Code); const tr=document.createElement('tr'); const name=hl(p.Name||"",q); const code=hl(p.Code||"",q); tr.innerHTML=`<td>${code}</td><td>${name}</td><td>${p.BirthDate||""}</td><td>${p.BirthPlace||""}</td><td>${p.Gender||""}</td><td>${p.Generation}</td><td>${p.ParentCode||""}</td><td>${p.PartnerCode||""}</td><td>${p.InheritedFromCode||""}</td><td>${ringCodeFor(p)}</td><td>${p.Note||""}</td><td class="no-print"><button class="edit-btn" data-code="${p.Code}">Bearbeiten</button> <button class="delete-btn" data-code="${p.Code}">Löschen</button></td>`; tbody.appendChild(tr); }); updateUndoRedoButtons(); }
renderTable();

// Live search
const searchInput=document.getElementById('search');
searchInput.addEventListener('input',()=>{ const q=(searchInput.value||"").trim().toLowerCase(); const list=people.filter(p=> (p.Name||"").toLowerCase().includes(q) || (p.Code||"").toLowerCase().includes(q)); renderTable(list,q); });

document.getElementById('btnSearch').onclick=()=>{ const q=(searchInput.value||"").trim().toLowerCase(); const list=people.filter(p=> (p.Name||"").toLowerCase().includes(q) || (p.Code||"").toLowerCase().includes(q)); renderTable(list,q); };
document.getElementById('btnShowAll').onclick=()=>{ searchInput.value=''; renderTable(people,''); };
document.getElementById('btnDraw').onclick=()=>drawTree();

// Table actions
tbody&&tbody.addEventListener('click',(e)=>{ const del=e.target.closest('.delete-btn'); if(del){ const code=del.getAttribute('data-code'); pushUndo(); deletePerson(code); return; } const edit=e.target.closest('.edit-btn'); if(edit){ const code=edit.getAttribute('data-code'); openEdit(code); return; } });

function deletePerson(code){ const person=people.find(p=>p.Code===code); if(!person) return; const kids=people.filter(p=>p.ParentCode===code); const refs=people.filter(p=>p.PartnerCode===code); let msg=`Soll „${person.Name||code}“ wirklich gelöscht werden?`; if(kids.length>0) msg+=`\nAchtung: ${kids.length} Kind(er) verweisen auf diesen Personen‑Code.`; if(refs.length>0) msg+=`\nHinweis: ${refs.length} Partner‑Verbindung(en) werden gelöst.`; if(!confirm(msg)) return; const partner=people.find(p=>p.PartnerCode===code); if(partner){ partner.PartnerCode=""; } const me=people.find(p=>p.Code===code); if(me&&me.PartnerCode){ const p2=people.find(p=>p.Code===me.PartnerCode); if(p2){ p2.PartnerCode=""; } } people=people.filter(p=>p.Code!==code); saveData(people); renderTable(currentFilter); drawTree(); }

// ---- Tree (with ring code line)
const svg=document.getElementById('treeSvg');
function drawTree(){ if(!svg) return; while(svg.firstChild) svg.removeChild(svg.firstChild); const defs=document.createElementNS('http://www.w3.org/2000/svg','defs'); const grad=document.createElementNS('http://www.w3.org/2000/svg','linearGradient'); grad.setAttribute('id','gradNode'); grad.setAttribute('x1','0'); grad.setAttribute('x2','0'); grad.setAttribute('y1','0'); grad.setAttribute('y2','1'); const s1=document.createElementNS('http://www.w3.org/2000/svg','stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#2b3f73'); const s2=document.createElementNS('http://www.w3.org/2000/svg','stop'); s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#182747'); grad.append(s1,s2); defs.appendChild(grad); svg.appendChild(defs); const byGen={}; people.forEach(p=>{ p.Generation=inferGeneration(p.Code); (byGen[p.Generation] ||= []).push(p); }); const gens=Object.keys(byGen).map(Number).sort((a,b)=>a-b); const xStep=230, yStep=100, marginX=40, marginY=40; const pos={}; let maxY=0; gens.forEach(g=>{ const col=byGen[g].slice().sort((a,b)=>a.Code.localeCompare(b.Code)); col.forEach((p,i)=>{ const x=marginX+g*xStep, y=marginY+i*yStep; pos[p.Code]={x:x+92,y:y+32}; const rect=el('rect',{x, y, rx:10, ry:10, width:184, height:70, class:'node'}); const t1=el('text',{x:x+10, y:y+20}); t1.appendChild(document.createTextNode(`${p.Code}`)); const t2=el('text',{x:x+10, y:y+38}); t2.appendChild(document.createTextNode(`${p.Name||""}`)); const t3=el('text',{x:x+10, y:y+56}); t3.appendChild(document.createTextNode(`${ringCodeFor(p)}`)); svg.append(rect,t1,t2,t3); maxY=Math.max(maxY, y+70); }); }); people.forEach(p=>{ if(p.ParentCode && pos[p.ParentCode] && pos[p.Code]){ const a=pos[p.ParentCode], b=pos[p.Code]; const path=el('path',{d:`M${a.x},${a.y} C ${a.x+40},${a.y} ${b.x-40},${b.y} ${b.x},${b.y}`, class:'link'}); svg.insertBefore(path, svg.firstChild); } if(p.PartnerCode && pos[p.Code] && pos[p.PartnerCode]){ const a=pos[p.Code], b=pos[p.PartnerCode]; const line=el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'link partner'}); svg.insertBefore(line, svg.firstChild); } }); svg.setAttribute('height', String(maxY+80)); }
function el(name,attrs){ const n=document.createElementNS('http://www.w3.org/2000/svg',name); for(const k in attrs){ n.setAttribute(k, attrs[k]); } return n; }
drawTree();

// ---- Dialogs & Inputs
const dlgAdd=document.getElementById('dlgAdd'); document.getElementById('btnAdd').onclick=()=>dlgAdd.showModal();
const dlgPartner=document.getElementById('dlgPartner'); document.getElementById('btnAddPartner').onclick=()=>dlgPartner.showModal();
const dlgEdit=document.getElementById('dlgEdit');
const dlgExport=document.getElementById('dlgExport');
const dlgImportConf=document.getElementById('dlgImportConf');

function attachNormalize(el){ if(!el) return; el.addEventListener('input', e=>{ e.target.value=normalizeCode(e.target.value); }); }
attachNormalize(document.querySelector('#formAdd input[name="parentCode"]'));
attachNormalize(document.querySelector('#formAdd input[name="inheritedFrom"]'));
attachNormalize(document.querySelector('#formPartner input[name="personCode"]'));
attachNormalize(document.querySelector('#formEdit input[name="inheritedFrom"]'));

// Add Person Save
const btnAddOk=document.getElementById('dlgAddOk');
btnAddOk.onclick=()=>{ const fd=new FormData(document.getElementById('formAdd')); const parentCode=normalizeCode(fd.get('parentCode')); if(!parentCode){ alert('Bitte einen Eltern‑Code eingeben.'); return; } if(!people.some(p=>p.Code===parentCode)){ alert('Eltern‑Code nicht gefunden. Code bitte wie in der Tabelle eingeben (z. B. 1, 1A, 1C1).'); return; } const inh=(fd.get('inherited')||'nein').toString()==='ja'; const inhFrom=normalizeCode(fd.get('inheritedFrom')); if(inh && !inhFrom){ alert('„Vererbt?“ ist „ja“ – bitte „Geerbt von (Code)“ angeben.'); return; } if(inhFrom && !people.some(p=>p.Code===inhFrom)){ alert('„Geerbt von (Code)“ nicht gefunden. Bitte vorhandenen Personen‑Code verwenden.'); return; } pushUndo(); const code=generateChildCode(parentCode); const p={ Code:code, Name:(fd.get('name')||'').toString().trim(), BirthDate:(fd.get('birthDate')||'').toString().trim(), BirthPlace:(fd.get('birthPlace')||'').toString().trim(), Gender:(fd.get('gender')||'').toString(), Generation:inferGeneration(code), ParentCode:parentCode, PartnerCode:'', Note:(fd.get('note')||'').toString().trim(), Inherited:inh, InheritedFromCode:inhFrom }; people.push(p); saveData(people); renderTable(currentFilter); drawTree(); dlgAdd.close(); };

// Add Partner Save
const btnPartnerOk=document.getElementById('dlgPartnerOk');
btnPartnerOk.onclick=()=>{ const fd=new FormData(document.getElementById('formPartner')); const personCode=normalizeCode(fd.get('personCode')); if(!personCode){ alert('Bitte „Partner von Code“ eingeben.'); return; } const person=people.find(p=>p.Code===personCode); if(!person){ alert('Code nicht gefunden. Bitte exakt wie in der Tabelle eingeben (z. B. 1A).'); return; } const partnerCode=generatePartnerCode(personCode); if(people.some(p=>p.Code===partnerCode)){ alert('Für diese Person ist bereits ein Partner angelegt.'); return; } pushUndo(); const partner={ Code:partnerCode, Name:(fd.get('name')||'').toString().trim(), Gender:(fd.get('gender')||'').toString(), Generation:inferGeneration(partnerCode), ParentCode:'', PartnerCode:personCode, Note:(fd.get('note')||'').toString().trim(), BirthDate:'', BirthPlace:'', Inherited:false, InheritedFromCode:'' }; person.PartnerCode=partnerCode; people.push(partner); saveData(people); renderTable(currentFilter); drawTree(); dlgPartner.close(); };

// Edit Person
let editTarget=null;
function openEdit(code){ const p=people.find(x=>x.Code===code); if(!p) return; editTarget=p; const f=document.getElementById('formEdit'); f.code.value=p.Code; f.name.value=p.Name||''; f.birthDate.value=p.BirthDate||''; f.birthPlace.value=p.BirthPlace||''; f.gender.value=p.Gender||''; f.inherited.value=p.Inherited?'ja':'nein'; f.inheritedFrom.value=p.InheritedFromCode||''; f.note.value=p.Note||''; dlgEdit.showModal(); }

document.getElementById('dlgEditOk').onclick=()=>{ if(!editTarget){ dlgEdit.close(); return; } const f=document.getElementById('formEdit'); const inh=(f.inherited.value||'nein')==='ja'; const inhFrom=normalizeCode(f.inheritedFrom.value); if(inh && !inhFrom){ alert('„Vererbt?“ ist „ja“ – bitte „Geerbt von (Code)“ angeben.'); return; } if(inhFrom && !people.some(p=>p.Code===inhFrom)){ alert('„Geerbt von (Code)“ nicht gefunden.'); return; } pushUndo(); editTarget.Name=f.name.value.trim(); editTarget.BirthDate=f.birthDate.value.trim(); editTarget.BirthPlace=f.birthPlace.value.trim(); editTarget.Gender=f.gender.value; editTarget.Inherited=inh; editTarget.InheritedFromCode=inhFrom; editTarget.Note=f.note.value.trim(); saveData(people); renderTable(currentFilter); drawTree(); dlgEdit.close(); };

// Print
const btnPrintTable=document.getElementById('btnPrintTable'); const btnPrintTree=document.getElementById('btnPrintTree');
btnPrintTable.onclick=()=>doPrint('table');
btnPrintTree.onclick=()=>{ drawTree(); doPrint('tree'); };
function togglePrintMode(mode){ document.body.classList.remove('print-table-only','print-tree-only'); if(mode==='table') document.body.classList.add('print-table-only'); if(mode==='tree') document.body.classList.add('print-tree-only'); }
function doPrint(mode){ togglePrintMode(mode); window.print(); setTimeout(()=>{ document.body.classList.remove('print-table-only','print-tree-only'); },1500); }

// Export dialog
function openExportDialog(){ dlgExport.showModal(); }
document.getElementById('btnExport').onclick=()=>openExportDialog();
async function exportJsonSaveAs(){ const data=JSON.stringify(people,null,2); if('showSaveFilePicker' in window){ try{ const handle=await window.showSaveFilePicker({ suggestedName:'familienringe_export.json', types:[{description:'JSON',accept:{'application/json':['.json']}}] }); const w=await handle.createWritable(); await w.write(data); await w.close(); alert('Export erfolgreich gespeichert.'); }catch(err){ if(err&&err.name!=='AbortError'){ alert('Export fehlgeschlagen: '+err.message); } } } else { alert('„Speichern unter“ wird von diesem Browser nicht unterstützt. Es wird stattdessen im Downloadordner gespeichert.'); exportJsonDownload(); } }
function exportJsonDownload(){ const data=JSON.stringify(people,null,2); const blob=new Blob([data],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='familienringe_export.json'; a.click(); URL.revokeObjectURL(a.href); }

document.getElementById('btnExportSaveAs').onclick=()=>{ dlgExport.close(); exportJsonSaveAs(); };
document.getElementById('btnExportDownload').onclick=()=>{ dlgExport.close(); exportJsonDownload(); };

// CSV export
function toCsv(rows){ return rows.map(r=> r.map(v=>{ const s=(v??'').toString().replace(/"/g,'""'); return '"'+s+'"'; }).join(',')).join('\n'); }
function exportCsv(){ const header=['Personen-Code','Name','Geburtsdatum','Geburtsort','Geschlecht','Generation','Eltern-Code','Partner-Code','Geerbt von','Ring-Code','Kommentar']; const rows=people.slice().sort((a,b)=>{ const ga=inferGeneration(a.Code), gb=inferGeneration(b.Code); return ga!==gb?ga-gb:a.Code.localeCompare(b.Code); }).map(p=>[ p.Code,p.Name||'',p.BirthDate||'',p.BirthPlace||'',p.Gender||'',inferGeneration(p.Code),p.ParentCode||'',p.PartnerCode||'',p.InheritedFromCode||'',ringCodeFor(p),p.Note||'' ]); const csv=toCsv([header,...rows]); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); if('showSaveFilePicker' in window){ (async()=>{ try{ const handle=await window.showSaveFilePicker({ suggestedName:'familienringe_export.csv', types:[{description:'CSV',accept:{'text/csv':['.csv']}}] }); const w=await handle.createWritable(); await w.write(csv); await w.close(); }catch(e){ if(e.name!=='AbortError'){ alert('CSV-Export fehlgeschlagen: '+e.message); } } })(); } else { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='familienringe_export.csv'; a.click(); URL.revokeObjectURL(a.href); } }

document.getElementById('btnExportCsv').onclick=()=>exportCsv();

// Import with duplicate handling
let pendingImport=null, pendingDupeCodes=null;
document.getElementById('fileImport').onchange=(ev)=>{ const f=ev.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result); if(!Array.isArray(data)){ alert('Ungültiges Format.'); return; } data.forEach(p=>{ p.Code=normalizeCode(p.Code); p.ParentCode=normalizeCode(p.ParentCode); p.PartnerCode=normalizeCode(p.PartnerCode); p.InheritedFromCode=normalizeCode(p.InheritedFromCode); }); const existing=new Set(people.map(p=>p.Code)); const dupes=[...new Set(data.filter(p=>existing.has(p.Code)).map(p=>p.Code))]; if(dupes.length){ pendingImport=data; pendingDupeCodes=dupes; document.getElementById('impSummary').textContent=`Es wurden ${dupes.length} Duplikat(e) nach Personen‑Code gefunden: z. B. ${dupes.slice(0,5).join(', ')}${dupes.length>5?' …':''}`; dlgImportConf.showModal(); } else { pushUndo(); people=data; saveData(people); renderTable(currentFilter); drawTree(); } }catch(e){ alert('Fehler beim Import: '+e.message); } }; reader.readAsText(f); };

document.getElementById('dlgImportOk').onclick=()=>{ if(!pendingImport){ dlgImportConf.close(); return; } const mode=(new FormData(document.getElementById('formImportConf')).get('impMode'))||'overwrite'; let merged=[...people]; if(mode==='overwrite'){ const map=new Map(people.map(p=>[p.Code,p])); pendingImport.forEach(p=>{ map.set(p.Code,p); }); merged=[...map.values()]; } else if(mode==='skip'){ const exist=new Set(people.map(p=>p.Code)); const adds=pendingImport.filter(p=>!exist.has(p.Code)); merged=[...people,...adds]; } else if(mode==='keepboth'){ const exist=new Set(people.map(p=>p.Code)); const dupSet=new Set(pendingDupeCodes); const adjusted=pendingImport.map(p=>{ if(dupSet.has(p.Code)){ const old=p.Code; const newCode=p.Code+'-DUP'; pendingImport.forEach(q=>{ if(q.ParentCode===old) q.ParentCode=newCode; if(q.PartnerCode===old) q.PartnerCode=newCode; if(q.InheritedFromCode===old) q.InheritedFromCode=newCode; }); p.Code=newCode; p.Note=(p.Note?p.Note+' ':'')+'(Duplikat importiert)'; } return p; }); merged=[...people,...adjusted.filter(p=>!exist.has(p.Code))]; } pushUndo(); people=merged; saveData(people); renderTable(currentFilter); drawTree(); pendingImport=null; pendingDupeCodes=null; dlgImportConf.close(); };

// Statistik anzeigen
function showStatistics() {
    const total = people.length;
    const generations = [...new Set(people.map(p => inferGeneration(p.Code)))].length;
    const partners = people.filter(p => p.PartnerCode).length;
    const inherited = people.filter(p => p.Inherited).length;

    alert(`Statistik:\n\nPersonen insgesamt: ${total}\nGenerationen: ${generations}\nPartnerschaften: ${partners}\nVererbte Ringe: ${inherited}`);
}

// PDF-Export (Platzhalter)
function exportPDF() {
    alert("PDF-Export ist noch nicht implementiert. Bitte später erneut versuchen.");
}

// CSV-Export
function exportCSV() {
    exportCsv(); // nutzt die bestehende Funktion
}

// JSON-Export
function exportJSON() {
    exportJsonDownload(); // nutzt die bestehende Funktion
}

// Mehrfach-Partnerschaften (Platzhalter)
document.getElementById("btnAddPartner")?.addEventListener("click", () => {
    alert("Mehrfach-Partnerschaften sind noch nicht vollständig implementiert.");
});

// Trennungsstatus markieren (Platzhalter)
document.getElementById("btnMarkSeparation")?.addEventListener("click", () => {
    const code = prompt("Bitte Personen‑Code eingeben, bei der die Trennung markiert werden soll:");
    if (!code) return;
    const person = people.find(p => p.Code === normalizeCode(code));
    if (!person) {
        alert("Person nicht gefunden.");
        return;
    }
    person.Note += " (getrennt)";
    saveData(people);
    renderTable(currentFilter);
    drawTree();
    alert(`Trennung bei ${person.Name} vermerkt.`);
});

// Teilen über iOS
function triggerIOSShare() {
    if (navigator.share) {
        navigator.share({
            title: 'Familienringe',
            text: 'Stammbaumdaten teilen',
            url: window.location.href
        }).catch(err => alert("Fehler beim Teilen: " + err));
    } else {
        alert("Teilen wird von diesem Gerät nicht unterstützt.");
    }
}

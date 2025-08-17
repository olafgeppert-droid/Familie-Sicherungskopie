// v7 minimal app implementing requested changes
const PASSWORD = "gepperT13Olli";
const STORAGE_KEY = "familyRingData_v3";

// Safe storage
const __memStore = {}; function safeGetItem(k){try{return localStorage.getItem(k);}catch(e){return __memStore[k]||null;}} function safeSetItem(k,v){try{localStorage.setItem(k,v);}catch(e){__memStore[k]=v;}}

const seed=[{Code:"1",Name:"Olaf Geppert",BirthDate:"13.01.1965",BirthPlace:"Herford",Gender:"m",Generation:0,ParentCode:"",PartnerCode:"1x",Note:"Stammvater",Inherited:false,InheritedFromCode:""},{Code:"1x",Name:"Irina Geppert",BirthDate:"13.01.1970",BirthPlace:"Halle/Westfalen",Gender:"w",Generation:0,ParentCode:"",PartnerCode:"1",Note:"Ehefrau von Olaf",Inherited:false,InheritedFromCode:""}];

function loadData(){const raw=safeGetItem(STORAGE_KEY);if(!raw){safeSetItem(STORAGE_KEY,JSON.stringify(seed));return seed.slice();}try{return JSON.parse(raw);}catch(e){safeSetItem(STORAGE_KEY,JSON.stringify(seed));return seed.slice();}}
function saveData(d){safeSetItem(STORAGE_KEY,JSON.stringify(d));}
let people=loadData();

// Login
const btnLogin=document.getElementById('btnLogin');
btnLogin&&btnLogin.addEventListener('click',()=>{const v=(document.getElementById('pwd').value||'').trim(); if(v===PASSWORD){document.getElementById('loginOverlay').style.display='none';} else {document.getElementById('loginMsg').textContent='Falsches Passwort.'; const pw=document.getElementById('pwd'); if(pw){pw.value=''; pw.focus();}}});
const pwdInput=document.getElementById('pwd'); if(pwdInput){pwdInput.addEventListener('keydown',ev=>{if(ev.key==='Enter'){btnLogin.click();}})}

// Helpers
function inferGeneration(code){if(code==='1'||code==='1x')return 0; const core=(code||'').replace(/x/g,''); let gen=0; if(core.startsWith('1')&&core.length>=2&&/[A-Z]/.test(core[1])) gen=1; const digits=core.slice(2).replace(/[^0-9]/g,'').length; gen+=digits>0?digits:0; return gen;}
function ringCodeFor(p){if(p&&(p.Inherited===true||(p.InheritedFromCode||'').trim()!=='')){const src=(p.InheritedFromCode||'').trim(); if(src) return `${src} ➔${p.Code}`;} return p.Code;}
function normalizeCode(v){const u=(v||'').toString().trim().toUpperCase(); return u.replace(/X/g,'x');}

// Table render (minimal)
const tbody=document.querySelector('#peopleTable tbody');
function render(){tbody.innerHTML=''; people.slice().sort((a,b)=>{const ga=inferGeneration(a.Code),gb=inferGeneration(b.Code); if(ga!==gb) return ga-gb; return a.Code.localeCompare(b.Code)}).forEach(p=>{const tr=document.createElement('tr'); tr.innerHTML=`<td>${p.Code}</td><td>${p.Name||''}</td><td>${p.BirthDate||''}</td><td>${p.BirthPlace||''}</td><td>${p.Gender||''}</td><td>${inferGeneration(p.Code)}</td><td>${p.ParentCode||''}</td><td>${p.PartnerCode||''}</td><td>${p.InheritedFromCode||''}</td><td>${ringCodeFor(p)}</td><td>${p.Note||''}</td><td class='no-print'></td>`; tbody.appendChild(tr);});}
render();

// Tree (stub)
function drawTree(){}

document.getElementById('btnDraw').onclick=()=>drawTree();

// Export behavior with iOS share
function openExportDialog(){document.getElementById('dlgExport').showModal();}
document.getElementById('btnExport').onclick = async ()=>{
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if(isiOS && navigator.share){
    try{
      const data = JSON.stringify(people,null,2);
      const file = new File([data],'familienringe_export.json',{type:'application/json'});
      if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file], title:'Familienringe Export', text:'Exportdaten als JSON'});
        return;
      }
    }catch(e){ /* fallback below */ }
  }
  openExportDialog();
};

document.getElementById('btnExportSaveAs').onclick=async()=>{
  const data=JSON.stringify(people,null,2);
  if('showSaveFilePicker' in window){ try{ const h=await window.showSaveFilePicker({suggestedName:'familienringe_export.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]}); const w=await h.createWritable(); await w.write(data); await w.close(); alert('Export erfolgreich gespeichert.'); }catch(e){ if(e.name!=='AbortError') alert('Export fehlgeschlagen: '+e.message);} }
  else { alert('„Speichern unter“ wird nicht unterstützt – es wird stattdessen im Downloadordner gespeichert.'); exportDownload(); }
};
function exportDownload(){ const data=JSON.stringify(people,null,2); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download='familienringe_export.json'; a.click(); URL.revokeObjectURL(a.href); }
document.getElementById('btnExportDownload').onclick=()=>{ document.getElementById('dlgExport').close(); exportDownload(); };

// Family Ring WebApp v3 – complete features
const PASSWORD = "gepperT13Olli";
const STORAGE_KEY = "familyRingData_v3";

// Seed data (as requested)
const seed = [
  {Code:"1",  Name:"Olaf Geppert", BirthDate:"13.01.1965", BirthPlace:"Herford", Gender:"m", Generation:0, ParentCode:"", PartnerCode:"1x", Note:"Stammvater", Inherited:false, InheritedFromCode:""},
  {Code:"1x", Name:"Irina Geppert", BirthDate:"13.01.1970", BirthPlace:"Halle/Westfalen", Gender:"w", Generation:0, ParentCode:"", PartnerCode:"1", Note:"Ehefrau von Olaf", Inherited:false, InheritedFromCode:""},

  {Code:"1A", Name:"Mario Geppert", BirthDate:"28.04.1995", BirthPlace:"Würselen", Gender:"m", Generation:1, ParentCode:"1", PartnerCode:"1Ax", Note:"1. Sohn", Inherited:false, InheritedFromCode:""},
  {Code:"1Ax", Name:"Kim", BirthDate:"", BirthPlace:"", Gender:"w", Generation:1, ParentCode:"", PartnerCode:"1A", Note:"Partnerin von Mario", Inherited:false, InheritedFromCode:""},

  {Code:"1B", Name:"Nicolas Geppert", BirthDate:"04.12.2000", BirthPlace:"Starnberg", Gender:"m", Generation:1, ParentCode:"1", PartnerCode:"1Bx", Note:"2. Sohn", Inherited:false, InheritedFromCode:""},
  {Code:"1Bx", Name:"Annika", BirthDate:"", BirthPlace:"", Gender:"w", Generation:1, ParentCode:"", PartnerCode:"1B", Note:"Partnerin von Nicolas", Inherited:false, InheritedFromCode:""},

  {Code:"1C", Name:"Julienne Geppert", BirthDate:"26.09.2002", BirthPlace:"Starnberg", Gender:"w", Generation:1, ParentCode:"1", PartnerCode:"1Cx", Note:"Tochter", Inherited:false, InheritedFromCode:""},
  {Code:"1Cx", Name:"Jonas", BirthDate:"", BirthPlace:"", Gender:"m", Generation:1, ParentCode:"", PartnerCode:"1C", Note:"Partner von Julienne", Inherited:false, InheritedFromCode:""}
];

// ---- Auth
document.getElementById("btnLogin").addEventListener("click", () => {
  const v = (document.getElementById("pwd").value || "").trim();
  if(v === PASSWORD){
    document.getElementById("loginOverlay").style.display = "none";
  } else {
    document.getElementById("loginMsg").textContent = "Falsches Passwort.";
  }
});

// ---- Storage
function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); return seed.slice(); }
  try { return JSON.parse(raw); } catch(e){ localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); return seed.slice(); }
}
function saveData(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

let people = loadData();

// ---- Code system
function indexToLetters(n){ let r=""; while(n>0){ n--; r = String.fromCharCode(65 + (n % 26)) + r; n=Math.floor(n/26);} return r; }
function childrenOf(parentCode){ return people.filter(p => p.ParentCode === parentCode); }
function generateChildCode(parentCode){
  const count = childrenOf(parentCode).length + 1;
  if(parentCode === "1") return parentCode + indexToLetters(count);
  return parentCode + String(count);
}
function generatePartnerCode(code){ return code + "x"; }
function inferGeneration(code){
  if(code === "1" || code === "1x") return 0;
  const core = code.replace(/x/g,"");
  let gen = 0;
  if(core.startsWith("1") && core.length >= 2 && /[A-Z]/.test(core[1])) gen = 1;
  const digits = core.slice(2).replace(/[^0-9]/g,"").length;
  gen += digits>0 ? digits : 0;
  return gen;
}

// ---- UI: table
const tbody = document.querySelector("#peopleTable tbody");
function renderTable(list = people){
  tbody.innerHTML = "";
  list.sort((a,b)=>a.Code.localeCompare(b.Code)).forEach(p => {
    p.Generation = inferGeneration(p.Code);
    const ringCode = p.Inherited && p.InheritedFromCode ? `${p.InheritedFromCode} ➔ ${p.Code}` : p.Code;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.Code}</td><td>${p.Name||""}</td><td>${p.BirthDate||""}</td><td>${p.BirthPlace||""}</td>
      <td>${p.Gender||""}</td><td>${p.Generation}</td><td>${p.ParentCode||""}</td><td>${p.PartnerCode||""}</td>
      <td>${p.InheritedFromCode||""}</td><td>${ringCode}</td><td>${p.Note||""}</td>
      <td class="no-print"><button class="delete-btn" data-code="${p.Code}">Löschen</button></td>`;
    tbody.appendChild(tr);
  });
}

renderTable();

tbody.addEventListener("click", (e)=>{
  const btn = e.target.closest(".delete-btn");
  if(!btn) return;
  const code = btn.getAttribute("data-code");
  deletePerson(code);
});

function deletePerson(code){
  const person = people.find(p=>p.Code===code);
  if(!person) return;
  const kids = people.filter(p=>p.ParentCode === code);
  let msg = `Soll die Person „${person.Name||code}“ wirklich gelöscht werden?`;
  if(kids.length>0) msg += `\nAchtung: ${kids.length} Kind(er) verweisen auf diesen Code (bleiben bestehen).`;
  if(!confirm(msg)) return;
  if(person.PartnerCode){
    const partner = people.find(p=>p.Code===person.PartnerCode);
    if(partner && partner.PartnerCode === person.Code){ partner.PartnerCode = ""; }
  }
  people = people.filter(p=>p.Code !== code);
  saveData(people); renderTable(); drawTree();
}

// ---- Tree
const svg = document.getElementById("treeSvg");
function drawTree(){
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  // gradient def
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  grad.setAttribute("id","gradNode"); grad.setAttribute("x1","0"); grad.setAttribute("x2","0"); grad.setAttribute("y1","0"); grad.setAttribute("y2","1");
  const s1 = document.createElementNS("http://www.w3.org/2000/svg", "stop"); s1.setAttribute("offset","0%"); s1.setAttribute("stop-color","#2b3f73");
  const s2 = document.createElementNS("http://www.w3.org/2000/svg", "stop"); s2.setAttribute("offset","100%"); s2.setAttribute("stop-color","#182747");
  grad.append(s1,s2); defs.appendChild(grad); svg.appendChild(defs);

  const byGen = {};
  people.forEach(p => {
    p.Generation = inferGeneration(p.Code);
    (byGen[p.Generation] ||= []).push(p);
  });
  const gens = Object.keys(byGen).map(Number).sort((a,b)=>a-b);
  const xStep = 230, yStep = 86, marginX = 40, marginY = 40;
  const pos = {}; let maxY = 0;

  gens.forEach(g => {
    const col = byGen[g].sort((a,b)=>a.Code.localeCompare(b.Code));
    col.forEach((p,i)=>{
      const x = marginX + g * xStep, y = marginY + i * yStep;
      pos[p.Code] = {x:x+92, y:y+26};
      const rect = el("rect",{x, y, rx:10, ry:10, width:184, height:54, class:"node"});
      const t1 = el("text",{x:x+10, y:y+18}); t1.appendChild(document.createTextNode(`${p.Code}`));
      const t2 = el("text",{x:x+10, y:y+36}); t2.appendChild(document.createTextNode(`${p.Name||""}`));
      svg.append(rect,t1,t2);
      maxY = Math.max(maxY, y+54);
    });
  });

  people.forEach(p => {
    if(p.ParentCode && pos[p.ParentCode] && pos[p.Code]){
      const a = pos[p.ParentCode], b = pos[p.Code];
      const path = el("path",{d:`M${a.x},${a.y} C ${a.x+40},${a.y} ${b.x-40},${b.y} ${b.x},${b.y}`, class:"link"});
      svg.insertBefore(path, svg.firstChild);
    }
    if(p.PartnerCode && pos[p.Code] && pos[p.PartnerCode]){
      const a = pos[p.Code], b = pos[p.PartnerCode];
      const line = el("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:"link partner"});
      svg.insertBefore(line, svg.firstChild);
    }
  });

  svg.setAttribute("height", String(maxY + 80));
}
function el(name, attrs){ const n = document.createElementNS("http://www.w3.org/2000/svg", name); for(const k in attrs){ n.setAttribute(k, attrs[k]); } return n; }
drawTree();

// ---- Dialogs
const dlgAdd = document.getElementById("dlgAdd");
document.getElementById("btnAdd").onclick = ()=> dlgAdd.showModal();
document.getElementById("dlgAddOk").onclick = (e)=>{
  const fd = new FormData(document.getElementById("formAdd"));
  const parentCode = (fd.get("parentCode")||"").toString().trim();
  if(!parentCode){ e.preventDefault(); return; }
  const code = generateChildCode(parentCode);
  const p = {
    Code: code,
    Name: (fd.get("name")||"").toString().trim(),
    BirthDate: (fd.get("birthDate")||"").toString().trim(),
    BirthPlace: (fd.get("birthPlace")||"").toString().trim(),
    Gender: (fd.get("gender")||"").toString(),
    Generation: inferGeneration(code),
    ParentCode: parentCode,
    PartnerCode: "",
    Note: (fd.get("note")||"").toString().trim(),
    Inherited: ((fd.get("inherited")||"nein").toString()==="ja"),
    InheritedFromCode: (fd.get("inheritedFrom")||"").toString().trim()
  };
  people.push(p); saveData(people); renderTable(); drawTree();
};

const dlgPartner = document.getElementById("dlgPartner");
document.getElementById("btnAddPartner").onclick = ()=> dlgPartner.showModal();
document.getElementById("dlgPartnerOk").onclick = (e)=>{
  const fd = new FormData(document.getElementById("formPartner"));
  const personCode = (fd.get("personCode")||"").toString().trim();
  if(!personCode){ e.preventDefault(); return; }
  const partnerCode = generatePartnerCode(personCode);
  if(people.some(p=>p.Code===partnerCode)){ alert("Partner existiert bereits."); return; }
  const partner = {
    Code: partnerCode,
    Name: (fd.get("name")||"").toString().trim(),
    Gender: (fd.get("gender")||"").toString(),
    Generation: inferGeneration(partnerCode),
    ParentCode: "",
    PartnerCode: personCode,
    Note: (fd.get("note")||"").toString().trim(),
    BirthDate:"", BirthPlace:"", Inherited:false, InheritedFromCode:""
  };
  const person = people.find(p=>p.Code===personCode);
  if(person){ person.PartnerCode = partnerCode; }
  people.push(partner); saveData(people); renderTable(); drawTree();
};

// ---- Search
document.getElementById("btnSearch").onclick = ()=>{
  const q = (document.getElementById("search").value||"").toLowerCase();
  const list = people.filter(p => (p.Name||"").toLowerCase().includes(q) || (p.Code||"").toLowerCase().includes(q));
  renderTable(list);
};
document.getElementById("btnShowAll").onclick = ()=> renderTable(people);
document.getElementById("btnDraw").onclick = ()=> drawTree();

// ---- Print (no popups; iOS friendly)
function togglePrintMode(mode){
  document.body.classList.remove("print-table-only","print-tree-only");
  if(mode==="table") document.body.classList.add("print-table-only");
  if(mode==="tree")  document.body.classList.add("print-tree-only");
}
function doPrint(mode){
  togglePrintMode(mode);
  window.print();
  setTimeout(()=>{ document.body.classList.remove("print-table-only","print-tree-only"); }, 1500);
}
document.getElementById("btnPrintTable").onclick = ()=> doPrint("table");
document.getElementById("btnPrintTree").onclick = ()=> { drawTree(); doPrint("tree"); };

// ---- Export / Import
document.getElementById("btnExport").onclick = ()=>{
  const blob = new Blob([JSON.stringify(people,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "familienringe_export.json";
  a.click();
  URL.revokeObjectURL(a.href);
};
document.getElementById("fileImport").onchange = (ev)=>{
  const f = ev.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(Array.isArray(data)){
        people = data; saveData(people); renderTable(); drawTree();
      } else alert("Ungültiges Format.");
    }catch(e){ alert("Fehler beim Import: " + e.message); }
  };
  reader.readAsText(f);
};

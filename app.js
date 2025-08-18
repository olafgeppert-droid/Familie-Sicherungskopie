// --- Datenhaltung ---
let persons = [
  { code: "1",  name: "Olaf Geppert",  birth: "1960-05-01", gender: "m", partner: "1x", parents: "",   inherited: "", ring: "1",  notes: "" },
  { code: "1x", name: "Irina Geppert", birth: "1965-03-12", gender: "w", partner: "1",  parents: "",   inherited: "", ring: "1x", notes: "" },
  { code: "1A", name: "Anna Geppert",  birth: "1985-07-20", gender: "w", partner: "",   parents: "1,1x", inherited: "", ring: "1A", notes: "" }
];

// --- Hilfsfunktionen ---
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function normalizeCode(c){
  if(!c) return "";
  // Großbuchstaben erzwingen, Partner-suffix immer kleines x
  // Beispiel: '1c1' -> '1C1', '1X' -> '1x'
  const base = c.replace(/x$/i, "");
  const hasX = /x$/i.test(c);
  const up = base.toUpperCase();
  return up + (hasX ? "x" : "");
}

function findPersonByCode(code){
  code = normalizeCode(code);
  return persons.find(p => p.code === code);
}

function computeGeneration(code){
  if(!code) return 0;
  // Generation: '1' und '1x' -> 1; '1A' -> 2; '1A1' -> 3; usw. (x nicht gezählt)
  const core = code.replace(/x$/,''); // x ignorieren
  // Ab dem ersten Zeichen nach '1' zählt jedes Zeichen (Buchstabe/Ziffer) +1 zur Generation
  const after = core.slice(1);
  return 1 + after.length;
}

function recomputeRingCode(p){
  if(p.inherited){
    // Darstellung Erblasser→Erbe
    p.ring = normalizeCode(p.inherited) + "→" + p.code;
  }else{
    p.ring = p.code; // Standard: eigener Code (Partner inkl. 'x')
  }
}

function sortPersonsForTable(arr){
  return [...arr].sort((a,b)=>{
    const ga = computeGeneration(a.code);
    const gb = computeGeneration(b.code);
    if(ga!==gb) return ga-gb;
    // innerhalb Generation lexikografisch nach Code
    return a.code.localeCompare(b.code, 'de');
  });
}

// --- Tabelle ---
function renderTable(){
  const tbody = $("#personTable tbody");
  tbody.innerHTML = "";
  const rows = sortPersonsForTable(persons);
  for(const p of rows){
    const tr = document.createElement("tr");
    tr.dataset.code = p.code;
    tr.innerHTML = `
      <td>${p.code}</td>
      <td>${p.name}</td>
      <td>${p.birth||""}</td>
      <td>${p.gender||""}</td>
      <td>${p.partner||""}</td>
      <td>${p.parents||""}</td>
      <td>${p.inherited||""}</td>
      <td>${p.ring||""}</td>
      <td>${p.notes||""}</td>
    `;
    tr.addEventListener("dblclick", () => openEditDialog(p.code));
    tbody.appendChild(tr);
  }
  applySearchHighlight($("#searchInput").value.trim());
}

function applySearchHighlight(term){
  const tbody = $("#personTable tbody");
  Array.from(tbody.querySelectorAll('td')).forEach(td=>{
    const text = td.textContent;
    if(term){
      const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
      td.innerHTML = text.replace(rx, m=>`<mark>${m}</mark>`);
    }else{
      td.innerHTML = text;
    }
  });
}

// --- Stammbaum (einfache, vertikale Ebenen) ---
function renderTree(){
  const svg = $("#familyTree");
  const W = 1200, H = 600;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";
  const nodesByGen = new Map();
  for(const p of persons){
    const g = computeGeneration(p.code);
    if(!nodesByGen.has(g)) nodesByGen.set(g, []);
    nodesByGen.get(g).push(p);
  }
  // sortiere innerhalb Generation nach Code
  for(const g of nodesByGen.keys()){
    nodesByGen.get(g).sort((a,b)=>a.code.localeCompare(b.code,'de'));
  }
  const colW = 180, rowH = 120, boxW = 150, boxH = 54;
  const pos = {}; // code -> {x,y}

  // zeichne Boxen
  for(const [g, list] of Array.from(nodesByGen.entries()).sort((a,b)=>a[0]-b[0])){
    list.forEach((p, i)=>{
      const x = 40 + i*colW;
      const y = 30 + (g-1)*rowH;
      pos[p.code] = {x, y};
      // Box
      const rect = `<rect x="${x}" y="${y}" rx="6" ry="6" width="${boxW}" height="${boxH}" fill="#ffffff" stroke="#93c5fd"/>`;
      const t1 = `<text x="${x+8}" y="${y+18}" font-size="12" font-family="system-ui, Arial"># ${p.code}</text>`;
      const t2 = `<text x="${x+8}" y="${y+34}" font-size="12" font-family="system-ui, Arial">${p.name||""}</text>`;
      const t3 = `<text x="${x+8}" y="${y+48}" font-size="11" fill="#6b7280" font-family="system-ui, Arial">${p.birth||""}</text>`;
      svg.insertAdjacentHTML("beforeend", rect + t1 + t2 + t3);
    });
  }

  // Partner-Linien (horizontale Verbindung)
  for(const p of persons){
    if(p.partner){
      const a = pos[p.code], b = pos[normalizeCode(p.partner)];
      if(a && b){
        const y = a.y + boxH/2;
        svg.insertAdjacentHTML("beforeend",
          `<line x1="${a.x+boxW}" y1="${y}" x2="${b.x}" y2="${y}" stroke="#9ca3af" stroke-width="2"/>`);
      }
    }
  }

  // Eltern-Kind-Linien
  for(const p of persons){
    if(p.parents){
      const parts = p.parents.split(",").map(s=>normalizeCode(s.trim())).filter(Boolean);
      // Nimm die erste Person als Leit-Elternteil für die vertikale Linie
      if(parts.length){
        const parent = findPersonByCode(parts[0]);
        if(parent && pos[parent.code] && pos[p.code]){
          const pa = pos[parent.code], ch = pos[p.code];
          const xMid = pa.x + boxW/2;
          svg.insertAdjacentHTML("beforeend",
            `<line x1="${xMid}" y1="${pa.y+boxH}" x2="${xMid}" y2="${ch.y-6}" stroke="#9ca3af" stroke-width="2"/>`+
            `<line x1="${xMid}" y1="${ch.y-6}" x2="${ch.x+boxW/2}" y2="${ch.y-6}" stroke="#9ca3af" stroke-width="2"/>`+
            `<line x1="${ch.x+boxW/2}" y1="${ch.y-6}" x2="${ch.x+boxW/2}" y2="${ch.y}" stroke="#9ca3af" stroke-width="2"/>`
          );
        }
      }
    }
  }
}

// --- Dialoge Neu/Bearbeiten ---
function openNewDialog(){
  const dlg = $("#personDialog");
  $("#personDialogTitle").textContent = "Neue Person";
  $("#personForm").reset();
  dlg.showModal();
}
function openEditDialog(code){
  const p = findPersonByCode(code); if(!p) return;
  const dlg = $("#personDialog");
  $("#personDialogTitle").textContent = "Person bearbeiten";
  const f = $("#personForm");
  f.name.value = p.name||"";
  f.birth.value = p.birth||"";
  f.gender.value = p.gender||"";
  f.partnerOf.value = ""; // beim Bearbeiten kein Codewechsel
  f.parentCode.value = ""; // dito
  f.inheritedFrom.value = p.inherited||"";
  f.notes.value = p.notes||"";
  dlg.dataset.edit = p.code;
  dlg.showModal();
}

function closeDialog(){ $("#personDialog").close(); delete $("#personDialog").dataset.edit; }

// Codevergabe: Partner oder Kinder
function assignCodeForNew({partnerOf, parentCode, birth}){
  partnerOf = normalizeCode(partnerOf);
  parentCode = normalizeCode(parentCode);
  if(partnerOf){
    return partnerOf.replace(/x$/,'') + "x"; // Partnercode
  }
  if(parentCode){
    // Kinder einer Basislinie werden nach Geburtsdatum sortiert und erhalten Buchstaben/Digits
    const base = parentCode.replace(/x$/,''); // z.B. '1' oder '1A'
    // Bestimme Ebene: wenn '1' -> Buchstaben A,B,...; wenn '1A' -> Ziffern 1,2,...
    if(/^1$/.test(base)){
      // alle Kinder von 1: Muster 1[A-Z]
      const kids = persons.filter(p=>/^1[A-Z]$/.test(p.code)).map(p=>({code:p.code, birth:p.birth||""}));
      kids.push({code:null, birth});
      kids.sort((a,b)=> (a.birth||"").localeCompare(b.birth||""));
      // weise Buchstaben zu
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      const idx = kids.findIndex(k=>k.code===null);
      const letter = alphabet[idx] || "Z";
      return "1"+letter;
    }else if(/^1[A-Z]$/.test(base)){
      const prefix = base;
      const kids = persons.filter(p=>new RegExp("^"+prefix+"[0-9]$").test(p.code)).map(p=>({code:p.code, birth:p.birth||""}));
      kids.push({code:null, birth});
      kids.sort((a,b)=> (a.birth||"").localeCompare(b.birth||""));
      const idx = kids.findIndex(k=>k.code===null);
      return prefix + String(idx+1);
    }else{
      // einfache Fallback-Nummerierung anfügen
      const siblings = persons.filter(p=>p.code.startsWith(base)).length;
      return base + (siblings+1);
    }
  }
  // Fallback: wenn noch kein Stammvater existiert -> 1, sonst generischer Code
  if(!findPersonByCode("1")){
    return "1";
  }
  return "X" + (persons.length+1);
}

function onSavePerson(){
  const f = $("#personForm");
  const payload = {
    name: f.name.value.trim(),
    birth: f.birth.value || "",
    gender: f.gender.value || "",
    partnerOf: f.partnerOf.value.trim(),
    parentCode: f.parentCode.value.trim(),
    inheritedFrom: f.inheritedFrom.value.trim(),
    notes: f.notes.value.trim()
  };
  if(!payload.name){
    // Abbrechen ist jederzeit möglich, aber Speichern ohne Name verhindern
    alert("Bitte einen Namen eintragen oder Abbrechen klicken.");
    return;
  }

  const editCode = $("#personDialog").dataset.edit;

  if(editCode){
    // Bearbeiten
    const p = findPersonByCode(editCode);
    if(!p) return;
    p.name = payload.name;
    p.birth = payload.birth;
    p.gender = payload.gender;
    p.inherited = normalizeCode(payload.inheritedFrom);
    p.notes = payload.notes;
    recomputeRingCode(p);
  }else{
    // Neu
    const code = assignCodeForNew(payload);
    const partnerCode = payload.partnerOf ? normalizeCode(payload.partnerOf).replace(/x$/,'')+"x" : "";
    const parents = payload.parentCode ? normalizeCode(payload.parentCode) : "";

    const newP = {
      code,
      name: payload.name,
      birth: payload.birth,
      gender: payload.gender,
      partner: partnerCode ? normalizeCode(payload.partnerOf).replace(/x$/,'') : "",
      parents: parents,
      inherited: normalizeCode(payload.inheritedFrom),
      ring: code,
      notes: payload.notes
    };
    recomputeRingCode(newP);
    persons.push(newP);

    // Partnerverknüpfung, falls Partner angelegt wird
    if(partnerCode){
      const base = normalizeCode(payload.partnerOf).replace(/x$/,'');
      const other = findPersonByCode(base);
      if(other){
        other.partner = code; // gegenseitige Verknüpfung
      }
    }
  }

  closeDialog();
  renderTable();
  renderTree();
}

// Person löschen (Name ODER Code)
function deletePersonFlow(){
  const input = prompt("Bitte Namen ODER Personencode eingeben, der gelöscht werden soll:");
  if(!input) return;
  const term = input.trim();
  let idx = persons.findIndex(p => p.code === normalizeCode(term) || p.name.toLowerCase() === term.toLowerCase());
  if(idx===-1){ alert("Keine passende Person gefunden."); return; }
  const code = persons[idx].code;
  // Entferne Referenzen
  for(const p of persons){
    if(p.partner === code) p.partner = "";
    if(p.parents){
      const parts = p.parents.split(",").map(s=>normalizeCode(s.trim())).filter(Boolean);
      const newParts = parts.filter(c => c !== code);
      p.parents = newParts.join(",");
    }
    if(normalizeCode(p.inherited) === code) p.inherited = "";
    recomputeRingCode(p);
  }
  persons.splice(idx,1);
  renderTable(); renderTree();
}

// Druck nur Tabelle bzw. nur Baum (mit Überschrift)
function printSection(selector){
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Druck</title>
  <style>body{font-family:system-ui,Arial;margin:24px;}h2{text-align:center}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px}</style>
  </head><body><h2>Wappenringe der Familie GEPPERT</h2>` + document.querySelector(selector).outerHTML + `</body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  setTimeout(()=>w.close(), 100);
}

// Statistik
function showStats(){
  const total = persons.length;
  const male = persons.filter(p=>p.gender==="m").length;
  const female = persons.filter(p=>p.gender==="w").length;
  const diverse = persons.filter(p=>p.gender==="d").length;
  // Personen pro Generation
  const gens = {};
  for(const p of persons){
    const g = computeGeneration(p.code);
    gens[g] = (gens[g]||0)+1;
  }
  const gensText = Object.keys(gens).sort((a,b)=>a-b).map(g=>`Gen ${g}: ${gens[g]}`).join("\n");
  alert(`Statistik
Gesamt: ${total}
Männlich: ${male}
Weiblich: ${female}
Divers: ${diverse}
---
Personen pro Generation
${gensText}`);
}

// Suche
function onSearch(e){ applySearchHighlight(e.target.value.trim()); }

// --- Event Handlers verbinden ---
window.addEventListener("DOMContentLoaded", () => {
  // Initiale Ringcodes sicherstellen
  persons.forEach(recomputeRingCode);
  renderTable();
  renderTree();

  $("#newPersonBtn").addEventListener("click", openNewDialog);
  $("#deletePersonBtn").addEventListener("click", deletePersonFlow);
  $("#printTableBtn").addEventListener("click", () => printSection("#personTable"));
  $("#printTreeBtn").addEventListener("click", () => printSection("#treeContainer"));
  $("#statsBtn").addEventListener("click", showStats);
  $("#helpBtn").addEventListener("click", () => { window.open("help.html","hilfe","width=800,height=700"); });

  $("#searchInput").addEventListener("input", onSearch);

  $("#cancelBtn").addEventListener("click", () => { /* Abbrechen ohne Pflichtfelder ok */ $("#personDialog").close(); });
  $("#saveBtn").addEventListener("click", (ev) => { ev.preventDefault(); onSavePerson(); });
});

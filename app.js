let persons = [];

function addPerson() {
  const name = prompt("Name der Person:");
  const birth = prompt("Geburtsdatum (YYYY-MM-DD):");
  if (!name || !birth) return;
  const code = generateCode(name, birth);
  persons.push({code, name, birth, partner: "", ring: code, inheritedFrom: ""});
  renderTable();
  renderTree();
}

function generateCode(name, birth) {
  if (persons.length === 0) return "1";
  return "1A"; // Platzhalter
}

function renderTable() {
  const tbody = document.querySelector("#personTable tbody");
  tbody.innerHTML = "";
  persons.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.code}</td><td>${p.name}</td><td>${p.birth}</td>
                    <td>${p.partner}</td><td>${p.ring}</td><td>${p.inheritedFrom}</td>
                    <td><button onclick="deletePerson(${idx})">Löschen</button></td>`;
    tbody.appendChild(tr);
  });
}

function deletePerson(index) {
  if (!confirm("Person wirklich löschen?")) return;
  persons.splice(index, 1);
  renderTable();
  renderTree();
}

function renderTree() {
  const container = document.getElementById("tree-container");
  container.innerHTML = "<svg width='600' height='400'><text x='20' y='20'>[Stammbaum Platzhalter]</text></svg>";
}

function exportData() {
  const blob = new Blob([JSON.stringify(persons, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "family.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      persons = JSON.parse(reader.result);
      renderTable();
      renderTree();
    };
    reader.readAsText(file);
  };
  input.click();
}

function printTable() { window.print(); }
function printTree() { window.print(); }

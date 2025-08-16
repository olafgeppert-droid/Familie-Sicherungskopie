
const persons = [
  { code: "1", name: "Olaf", birth: "1950-01-01", place: "Hamburg", gender: "m", parents: "", partner: "2", comment: "", inheritedFrom: "" },
  { code: "2", name: "Irina", birth: "1952-02-02", place: "Berlin", gender: "w", parents: "", partner: "1", comment: "", inheritedFrom: "" },
  { code: "1A", name: "Mario", birth: "1975-03-03", place: "Hamburg", gender: "m", parents: "1", partner: "3", comment: "", inheritedFrom: "" },
  { code: "3", name: "Julia", birth: "1976-04-04", place: "Berlin", gender: "w", parents: "", partner: "1A", comment: "", inheritedFrom: "" },
  { code: "1A1", name: "Nicolas", birth: "2000-05-05", place: "Hamburg", gender: "m", parents: "1A", partner: "", comment: "", inheritedFrom: "1A" },
  { code: "1A2", name: "Julienne", birth: "2002-06-06", place: "Hamburg", gender: "w", parents: "1A", partner: "", comment: "", inheritedFrom: "1A" }
];

function calculateRingCode(person) {
  return person.inheritedFrom ? `${person.inheritedFrom} ➔ ${person.code}` : person.code;
}

function getGeneration(code) {
  return code.split(/[^A-Z0-9]/).length;
}

function renderTable() {
  const tbody = document.querySelector("#personTable tbody");
  tbody.innerHTML = "";
  persons.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.code}</td>
      <td>${p.name}</td>
      <td>${p.birth}</td>
      <td>${p.place}</td>
      <td>${p.gender}</td>
      <td>${getGeneration(p.code)}</td>
      <td>${p.parents}</td>
      <td>${p.partner}</td>
      <td>${p.inheritedFrom}</td>
      <td>${calculateRingCode(p)}</td>
      <td>${p.comment}</td>
      <td><button onclick="editPerson('${p.code}')">✏️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function editPerson(code) {
  alert("Bearbeiten: " + code);
}

function addPerson() {
  alert("Neue Person hinzufügen");
}

function addPartner() {
  alert("Partner hinzufügen");
}

function searchPerson() {
  // Dummy-Suche
}

function drawTree() {
  // Dummy-Stammbaum
}

function exportData() {
  // Dummy-Export
}

function importData(event) {
  // Dummy-Import
}

document.addEventListener("DOMContentLoaded", renderTable);

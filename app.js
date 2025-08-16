
// Sample app.js with Ring-Code logic
let persons = [];

function calculateRingCode(person) {
  if (!person.geerbtVon) {
    return person.code;
  } else {
    return person.geerbtVon + ' ➔ ' + person.code;
  }
}

function renderTable() {
  const tbody = document.querySelector("#personTable tbody");
  tbody.innerHTML = "";
  persons.forEach((p, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.code}</td>
      <td>${p.name}</td>
      <td>${p.geburtsdatum}</td>
      <td>${p.geburtsort}</td>
      <td>${p.geschlecht}</td>
      <td>${p.generation}</td>
      <td>${p.elternCode}</td>
      <td>${p.partnerCode}</td>
      <td>${p.geerbtVon || ""}</td>
      <td>${calculateRingCode(p)}</td>
      <td>${p.kommentar || ""}</td>
      <td><button onclick="deletePerson(${index})">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function addPerson() {
  // Dummy person for demonstration
  const newPerson = {
    code: "1C1",
    name: "Max Mustermann",
    geburtsdatum: "2000-01-01",
    geburtsort: "Berlin",
    geschlecht: "m",
    generation: 3,
    elternCode: "1C",
    partnerCode: "",
    geerbtVon: "1",
    kommentar: "Beispielperson"
  };
  persons.push(newPerson);
  renderTable();
}

function deletePerson(index) {
  persons.splice(index, 1);
  renderTable();
}

function addPartner() {}
function searchPerson(value) {}
function drawTree() {}
function exportData() {}
function importData(event) {}

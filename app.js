// app.js – Version upd53

// ----------------------
// Globale Variablen
// ----------------------
let persons = [];
let selectedRow = null;

// ----------------------
// Initialisierung
// ----------------------
window.onload = function () {
  loadData();
  renderTable();
  bindButtons();
};

// ----------------------
// Buttons binden
// ----------------------
function bindButtons() {
  document.getElementById("btnNew").onclick = openNewPersonDialog;
  document.getElementById("btnDelete").onclick = deletePersonDialog;
  document.getElementById("btnExport").onclick = exportDataDialog;
  document.getElementById("btnImport").onclick = importDataDialog;
  document.getElementById("btnPrint").onclick = printDataDialog;
  document.getElementById("btnStats").onclick = showStats;
  document.getElementById("btnReset").onclick = resetAllData;
  document.getElementById("btnHelp").onclick = openHelpPopup;
}

// ----------------------
// Datenverwaltung
// ----------------------
function saveData() {
  localStorage.setItem("familyData", JSON.stringify(persons));
}

function loadData() {
  let stored = localStorage.getItem("familyData");
  if (stored) {
    persons = JSON.parse(stored);
  } else {
    // Beispielperson als Demo
    persons = [{
      code: "1",
      name: "Olaf Geppert",
      gender: "männlich",
      birthdate: "01.01.1950",
      ringcode: "1",
      generation: 1
    }];
  }
}

// ----------------------
// Tabelle rendern
// ----------------------
function renderTable(searchTerm = "") {
  const tableBody = document.getElementById("personTableBody");
  tableBody.innerHTML = "";

  persons.forEach((p, index) => {
    const row = document.createElement("tr");

    ["generation", "code", "name", "gender", "birthdate", "ringcode"].forEach(field => {
      const cell = document.createElement("td");
      let value = p[field] || "";

      // Suchtreffer markieren
      if (searchTerm && value.toLowerCase().includes(searchTerm.toLowerCase())) {
        const regex = new RegExp(`(${searchTerm})`, "gi");
        value = value.replace(regex, "<mark>$1</mark>");
      }

      cell.innerHTML = value;
      row.appendChild(cell);
    });

    row.ondblclick = () => openEditPersonDialog(index);
    tableBody.appendChild(row);
  });
}

// ----------------------
// Personendialoge
// ----------------------
function openNewPersonDialog() {
  alert("Dialog: Neue Person (UI folgt wie in upd46).");
}

function openEditPersonDialog(index) {
  alert("Dialog: Person ändern (UI folgt wie in upd46).");
}

function deletePersonDialog() {
  const code = prompt("Gib den Personen-Code oder Namen der zu löschenden Person ein:");
  if (!code) return;

  persons = persons.filter(p => p.code !== code && p.name !== code);
  saveData();
  renderTable();
}

// ----------------------
// Export / Import
// ----------------------
function exportDataDialog() {
  const choice = confirm("OK = Export JSON, Abbrechen = Export CSV");
  if (choice) exportJSON(); else exportCSV();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(persons, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "familyData.json";
  link.click();
}

function exportCSV() {
  const header = Object.keys(persons[0] || {}).join(";");
  const rows = persons.map(p => Object.values(p).join(";")).join("\n");
  const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "familyData.csv";
  link.click();
}

function importDataDialog() {
  alert("Importfunktion folgt (Dateiupload).");
}

// ----------------------
// Drucken
// ----------------------
function printDataDialog() {
  const choice = confirm("OK = Druck Tabelle, Abbrechen = Druck Stammbaum");
  if (choice) printTable(); else printTree();
}

function printTable() {
  const printWin = window.open("", "", "width=800,height=600");
  printWin.document.write("<h1>Wappenringe der Familie GEPPERT</h1>");
  printWin.document.write(document.getElementById("personTable").outerHTML);
  printWin.document.close();
  printWin.print();
}

function printTree() {
  alert("Stammbaum-Druck (Platzhalter, UI folgt).");
}

// ----------------------
// Statistik
// ----------------------
function showStats() {
  const total = persons.length;
  const male = persons.filter(p => p.gender === "männlich").length;
  const female = persons.filter(p => p.gender === "weiblich").length;
  const diverse = persons.filter(p => p.gender === "divers").length;

  let genMap = {};
  persons.forEach(p => {
    genMap[p.generation] = (genMap[p.generation] || 0) + 1;
  });

  let genText = Object.entries(genMap).map(([g, c]) => `Generation ${g}: ${c}`).join("\n");

  alert(
    `Gesamtanzahl: ${total}\n` +
    `Männlich: ${male}\nWeiblich: ${female}\nDivers: ${diverse}\n` +
    `\nNach Generationen:\n${genText}`
  );
}

// ----------------------
// Reset
// ----------------------
function resetAllData() {
  if (confirm("Sollen wirklich alle Personen gelöscht werden?")) {
    persons = [];
    saveData();
    renderTable();
  }
}

// ----------------------
// Hilfe
// ----------------------
function openHelpPopup() {
  const popup = window.open("", "helpPopup", "width=600,height=600,scrollbars=yes");
  fetch("help.html")
    .then(res => res.text())
    .then(html => {
      popup.document.write(html + '<br><button onclick="window.close()">Schließen</button>');
    });
}

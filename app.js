let personen = [];
const password = "gepperT13Olli";

function checkPassword() {
  const input = document.getElementById("password").value;
  if (input === password) {
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
  } else {
    document.getElementById("loginError").innerText = "Falsches Passwort!";
  }
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";
  if (id === "tabelle") renderTable();
  if (id === "baum") renderTree();
}

function addPerson() {
  const name = document.getElementById("name").value;
  const geb = document.getElementById("geburtsdatum").value;
  const partner = document.getElementById("partner").value;
  const eltern = document.getElementById("eltern").value;

  if (!name) return alert("Bitte Name eingeben!");
  personen.push({ id: Date.now(), name, geb, partner, eltern });

  document.getElementById("name").value = "";
  document.getElementById("geburtsdatum").value = "";
  document.getElementById("partner").value = "";
  document.getElementById("eltern").value = "";
  renderList();
  renderTable();
}

function renderList() {
  const ul = document.getElementById("personenListe");
  ul.innerHTML = "";
  personen.forEach(p => {
    const li = document.createElement("li");
    li.innerText = `${p.name} (${p.geb})`;
    const del = document.createElement("button");
    del.innerText = "❌";
    del.onclick = () => deletePerson(p.id);
    li.appendChild(del);
    ul.appendChild(li);
  });
}

function renderTable() {
  const tbody = document.querySelector("#personenTabelle tbody");
  tbody.innerHTML = "";
  personen.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.name}</td><td>${p.geb}</td><td>${p.partner}</td><td>${p.eltern}</td>
      <td><button onclick="deletePerson(${p.id})">❌ Löschen</button></td>`;
    tbody.appendChild(tr);
  });
}

function renderTree() {
  const div = document.getElementById("stammbaum");
  div.innerHTML = "";
  personen.forEach(p => {
    const el = document.createElement("div");
    el.innerText = `${p.name} (${p.geb})`;
    div.appendChild(el);
  });
}

function deletePerson(id) {
  personen = personen.filter(p => p.id !== id);
  renderList();
  renderTable();
  renderTree();
}

function printView() {
  window.print();
}

function exportData() {
  const blob = new Blob([JSON.stringify(personen)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "familie.json";
  a.click();
}

function importData(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    personen = JSON.parse(e.target.result);
    renderList();
    renderTable();
    renderTree();
  };
  reader.readAsText(file);
}

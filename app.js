// ==============================
// AES Verschlüsselung
// ==============================
function encryptPassword(password) {
  return CryptoJS.AES.encrypt(password, "secret-key").toString();
}
function decryptPassword(ciphertext) {
  try {
    let bytes = CryptoJS.AES.decrypt(ciphertext, "secret-key");
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return "";
  }
}

// ==============================
// Beispiel-Daten
// ==============================
let familyData = [
  { name: "Max Mustermann", birthdate: "1970-01-01", generation: 0, partners: ["Anna"], children: [1], divorced: false },
  { name: "Lisa Mustermann", birthdate: "1995-05-12", generation: 1, partners: [], children: [], divorced: false }
];

// ==============================
// Passwort-Handling
// ==============================
function checkPassword() {
  let pwInput = document.getElementById("password");
  let password = pwInput.value;
  let stored = localStorage.getItem("password");
  if (!stored) {
    localStorage.setItem("password", encryptPassword(password));
    alert("Passwort gesetzt!");
  } else {
    let decrypted = decryptPassword(stored);
    if (password === decrypted) {
      alert("Login erfolgreich!");
    } else {
      alert("Falsches Passwort!");
      handleWrongPassword();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let pwInput = document.getElementById("password");
  if (pwInput) {
    pwInput.addEventListener("keyup", function(e) {
      if (e.key === "Enter") {
        document.getElementById("loginBtn").click();
      }
    });
  }
});

function handleWrongPassword() {
  let pwInput = document.getElementById("password");
  if (pwInput) pwInput.value = "";
}

// ==============================
// Import / Export
// ==============================
function exportData(format) {
  let dataStr = JSON.stringify(familyData, null, 2);
  let blob = new Blob([dataStr], {type: 'application/json'});
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = "family_data." + format;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  let reader = new FileReader();
  reader.onload = function(e) {
    try {
      let imported = JSON.parse(e.target.result);
      familyData = imported;
      renderTree();
      alert("Daten erfolgreich importiert!");
    } catch (err) {
      alert("Fehler beim Import: " + err);
    }
  };
  reader.readAsText(file);
}

// ==============================
// Stammbaum rendern (vertikal mit Generationen + Tooltips)
// ==============================
function renderTree() {
  let container = document.getElementById("treeContainer");
  if (!container) return;
  container.innerHTML = "";
  let generations = {};
  familyData.forEach(p => {
    let gen = p.generation || 0;
    if (!generations[gen]) generations[gen] = [];
    generations[gen].push(p);
  });
  Object.keys(generations).sort((a,b)=>a-b).forEach(gen => {
    let genDiv = document.createElement("div");
    genDiv.className = "generation-" + gen;
    let title = document.createElement("h3");
    title.innerText = "Generation " + gen;
    genDiv.appendChild(title);
    generations[gen].forEach(person => {
      let pDiv = document.createElement("div");
      pDiv.className = "person";
      pDiv.innerText = person.name;
      let partners = person.partners ? person.partners.join(", ") : "";
      let info = "Name: " + person.name + "\\n";
      if (person.birthdate) info += "Geboren: " + person.birthdate + "\\n";
      if (partners) info += "Partner: " + partners + "\\n";
      if (person.divorced) info += "Status: Geschieden/ Getrennt\\n";
      info += "Generation: " + gen;
      pDiv.title = info;
      genDiv.appendChild(pDiv);
    });
    container.appendChild(genDiv);
  });
}

// ==============================
// Validierung
// ==============================
function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    if (!field.value) {
      field.style.border = "2px solid red";
      valid = false;
    } else {
      field.style.border = "";
    }
  });
  return valid;
}

// ==============================
// Statistik & Analyse
// ==============================
function calculateStats() {
  let generations = {};
  let inheritanceStats = [];
  familyData.forEach(p => {
    let gen = p.generation || 0;
    if (!generations[gen]) generations[gen] = [];
    generations[gen].push(p);
    inheritanceStats.push({name: p.name, children: p.children ? p.children.length : 0});
  });
  let genCounts = Object.keys(generations).map(g => ({generation: g, count: generations[g].length}));
  return { generations: genCounts, inheritance: inheritanceStats };
}

function exportCSV() {
  let stats = calculateStats();
  let rows = ["Generation,Anzahl"];
  stats.generations.forEach(g => {
    rows.push(g.generation + "," + g.count);
  });
  rows.push("\\nName,Kinder");
  stats.inheritance.forEach(i => {
    rows.push(i.name + "," + i.children);
  });
  let csvContent = rows.join("\\n");
  let blob = new Blob([csvContent], {type: "text/csv"});
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "stats.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  let stats = calculateStats();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Statistik", 10, 10);
  let y = 20;
  doc.text("Anzahl Personen pro Generation:", 10, y);
  y += 10;
  stats.generations.forEach(g => {
    doc.text("Generation " + g.generation + ": " + g.count, 10, y);
    y += 10;
  });
  y += 10;
  doc.text("Kinder pro Person:", 10, y);
  y += 10;
  stats.inheritance.forEach(i => {
    doc.text(i.name + ": " + i.children, 10, y);
    y += 10;
  });
  doc.save("stats.pdf");
}

// ==============================
// iOS Teilen
// ==============================
function shareDataIOS(dataStr) {
  if (navigator.share) {
    navigator.share({
      title: "Familiendaten",
      text: "Exportierte Familiendaten",
      files: [new File([dataStr], "family_data.json", {type: "application/json"})]
    });
  } else {
    alert("Teilen nicht unterstützt.");
  }
}

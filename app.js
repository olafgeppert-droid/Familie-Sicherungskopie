
let people = [];
let history = [];
let future = [];
let currentFilter = "";
let passwordHash = "gepperT13Olli"; // Replace with hashed password if needed

// Utility functions
function normalizeCode(code) {
    return code.trim().toUpperCase();
}

function saveData(data) {
    localStorage.setItem("people", JSON.stringify(data));
    history.push(JSON.stringify(data));
    future = [];
}

function loadData() {
    const saved = localStorage.getItem("people");
    if (saved) {
        people = JSON.parse(saved);
    }
}

function renderTable(filter = "") {
    const tbody = document.querySelector("#peopleTable tbody");
    tbody.innerHTML = "";
    const filtered = people.filter(p => p.Name.includes(filter) || p.Code.includes(filter));
    filtered.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.Code}</td>
            <td>${p.Name}</td>
            <td>${p.BirthDate}</td>
            <td>${p.ParentCode || ""}</td>
            <td>${Array.isArray(p.PartnerCodes) ? p.PartnerCodes.join(", ") : p.PartnerCode || ""}</td>
            <td>${p.Inherited ? "✅" : ""}</td>
            <td>${p.Note || ""}</td>
            <td><button onclick="editPerson('${p.Code}')">✏️</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function drawTree() {
    const canvas = document.getElementById("treeCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const generations = {};
    people.forEach(p => {
        const gen = inferGeneration(p.Code);
        if (!generations[gen]) generations[gen] = [];
        generations[gen].push(p);
    });

    const genKeys = Object.keys(generations).sort((a, b) => a - b);
    genKeys.forEach((gen, i) => {
        const y = 100 + i * 150;
        generations[gen].forEach((p, j) => {
            const x = 100 + j * 150;
            ctx.fillStyle = p.Inherited ? "#88f" : "#ccc";
            ctx.fillRect(x, y, 100, 40);
            ctx.fillStyle = "#000";
            ctx.fillText(p.Name, x + 5, y + 25);
        });
    });
}

function inferGeneration(code) {
    let gen = 0;
    let current = people.find(p => p.Code === normalizeCode(code));
    while (current && current.ParentCode) {
        gen++;
        current = people.find(p => p.Code === normalizeCode(current.ParentCode));
    }
    return gen;
}

function editPerson(code) {
    const person = people.find(p => p.Code === normalizeCode(code));
    if (!person) return;
    document.getElementById("personCode").value = person.Code;
    document.getElementById("personName").value = person.Name;
    document.getElementById("personBirthDate").value = person.BirthDate;
    document.getElementById("personParentCode").value = person.ParentCode || "";
    document.getElementById("personPartnerCodes").value = Array.isArray(person.PartnerCodes) ? person.PartnerCodes.join(", ") : person.PartnerCode || "";
    document.getElementById("personInherited").checked = person.Inherited || false;
    document.getElementById("personInheritedFromCode").value = person.InheritedFromCode || "";
    document.getElementById("personNote").value = person.Note || "";
    document.getElementById("personDialog").showModal();
}

document.getElementById("btnSavePerson").addEventListener("click", () => {
    const code = normalizeCode(document.getElementById("personCode").value);
    const existing = people.find(p => p.Code === code);
    const person = {
        Code: code,
        Name: document.getElementById("personName").value,
        BirthDate: document.getElementById("personBirthDate").value,
        ParentCode: normalizeCode(document.getElementById("personParentCode").value),
        PartnerCodes: document.getElementById("personPartnerCodes").value.split(",").map(c => normalizeCode(c.trim())).filter(c => c),
        Inherited: document.getElementById("personInherited").checked,
        InheritedFromCode: normalizeCode(document.getElementById("personInheritedFromCode").value),
        Note: document.getElementById("personNote").value
    };
    if (existing) {
        Object.assign(existing, person);
    } else {
        people.push(person);
    }
    saveData(people);
    renderTable(currentFilter);
    drawTree();
    document.getElementById("personDialog").close();
});

document.getElementById("btnCancelPerson").addEventListener("click", () => {
    document.getElementById("personDialog").close();
});

document.getElementById("btnAddPerson").addEventListener("click", () => {
    document.getElementById("personCode").value = "";
    document.getElementById("personName").value = "";
    document.getElementById("personBirthDate").value = "";
    document.getElementById("personParentCode").value = "";
    document.getElementById("personPartnerCodes").value = "";
    document.getElementById("personInherited").checked = false;
    document.getElementById("personInheritedFromCode").value = "";
    document.getElementById("personNote").value = "";
    document.getElementById("personDialog").showModal();
});

document.getElementById("btnLogin").addEventListener("click", () => {
    const input = document.getElementById("password");
    if (input.value === passwordHash) {
        document.getElementById("auth").style.display = "none";
        document.getElementById("controls").style.display = "block";
        document.getElementById("tableView").style.display = "block";
        document.getElementById("treeView").style.display = "block";
        loadData();
        renderTable();
        drawTree();
    } else {
        alert("Falsches Passwort.");
        input.value = "";
    }
});

document.getElementById("password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        document.getElementById("btnLogin").click();
    }
});

document.getElementById("searchInput").addEventListener("input", (e) => {
    currentFilter = e.target.value;
    renderTable(currentFilter);
});

document.getElementById("btnUndo").addEventListener("click", () => {
    if (history.length > 1) {
        future.push(history.pop());
        const previous = history[history.length - 1];
        people = JSON.parse(previous);
        saveData(people);
        renderTable(currentFilter);
        drawTree();
    }
});

document.getElementById("btnRedo").addEventListener("click", () => {
    if (future.length > 0) {
        const next = future.pop();
        people = JSON.parse(next);
        saveData(people);
        renderTable(currentFilter);
        drawTree();
    }
});

document.getElementById("btnImport").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            people = JSON.parse(reader.result);
            saveData(people);
            renderTable(currentFilter);
            drawTree();
        };
        reader.readAsText(file);
    };
    input.click();
});

function exportJsonDownload() {
    const blob = new Blob([JSON.stringify(people, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "family-data.json";
    a.click();
    URL.revokeObjectURL(url);
}

function exportCsv() {
    const header = ["Code", "Name", "BirthDate", "ParentCode", "PartnerCodes", "Inherited", "InheritedFromCode", "Note"];
    const rows = people.map(p => [
        p.Code,
        p.Name,
        p.BirthDate,
        p.ParentCode || "",
        Array.isArray(p.PartnerCodes) ? p.PartnerCodes.join(", ") : p.PartnerCode || "",
        p.Inherited ? "Ja" : "Nein",
        p.InheritedFromCode || "",
        p.Note || ""
    ]);
    const csv = [header, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "family-data.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function exportPDF() {
    const element = document.getElementById("peopleTable");
    html2pdf().from(element).save("family-data.pdf");
}

document.getElementById("btnExportJSON").addEventListener("click", exportJsonDownload);
document.getElementById("btnExportCSV").addEventListener("click", exportCsv);
document.getElementById("btnExportPDF").addEventListener("click", exportPDF);

document.getElementById("btnStatistics").addEventListener("click", () => {
    const total = people.length;
    const generations = [...new Set(people.map(p => inferGeneration(p.Code)))].length;
    const partners = people.filter(p => Array.isArray(p.PartnerCodes) && p.PartnerCodes.length > 0).length;
    const inherited = people.filter(p => p.Inherited).length;
    alert(`Statistik:\n\nPersonen insgesamt: ${total}\nGenerationen: ${generations}\nPartnerschaften: ${partners}\nVererbte Ringe: ${inherited}`);
});

document.getElementById("btnAddPartner").addEventListener("click", () => {
    const code = prompt("Personen‑Code eingeben:");
    const partnerCode = prompt("Partner‑Code eingeben:");
    if (!code || !partnerCode) return;
    const person = people.find(p => p.Code === normalizeCode(code));
    if (!person) return alert("Person nicht gefunden.");
    if (!Array.isArray(person.PartnerCodes)) person.PartnerCodes = [];
    person.PartnerCodes.push(normalizeCode(partnerCode));
    saveData(people);
    renderTable(currentFilter);
    drawTree();
});

document.getElementById("btnMarkSeparation").addEventListener("click", () => {
    const code = prompt("Personen‑Code eingeben:");
    const person = people.find(p => p.Code === normalizeCode(code));
    if (!person) return alert("Person nicht gefunden.");
    person.Note = (person.Note || "") + " (getrennt)";
    saveData(people);
    renderTable(currentFilter);
    drawTree();
});

document.getElementById("btnShareIOS").addEventListener("click", () => {
    if (navigator.share) {
        navigator.share({
            title: "Familienringe",
            text: "Stammbaumdaten teilen",
            url: window.location.href
        }).catch(err => alert("Fehler beim Teilen: " + err));
    } else {
        alert("Teilen wird von diesem Gerät nicht unterstützt.");
    }
});

// Globale Datenbank (Beispieldaten)
let personen = [
    {
        code: "1",
        name: "Olaf Geppert",
        geburtsdatum: "01.01.1940",
        geschlecht: "männlich",
        ringcode: "1",
        partner: "",
        eltern: "",
        generation: 1
    }
];

// ------------------- HILFE-POPUP -------------------
document.getElementById("btnHelp").addEventListener("click", () => {
    fetch("help.html")
        .then(res => res.text())
        .then(html => {
            const modal = document.getElementById("helpModal");
            document.getElementById("helpContent").innerHTML = html;
            modal.style.display = "block";
        });
});

// Schließen des Popups
document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => {
        btn.closest(".modal").style.display = "none";
    };
});

// ------------------- EXPORT -------------------
document.getElementById("btnExport").addEventListener("click", () => {
    const choice = confirm("Export als JSON? (Abbrechen für CSV)");
    if (choice) {
        const blob = new Blob([JSON.stringify(personen, null, 2)], {type: "application/json"});
        downloadFile(blob, "familie.json");
    } else {
        let csv = "Code;Name;Geburtsdatum;Geschlecht;Ringcode;Partner;Eltern;Generation\n";
        personen.forEach(p => {
            csv += `${p.code};${p.name};${p.geburtsdatum};${p.geschlecht};${p.ringcode};${p.partner};${p.eltern};${p.generation}\n`;
        });
        const blob = new Blob([csv], {type: "text/csv"});
        downloadFile(blob, "familie.csv");
    }
});

function downloadFile(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ------------------- DRUCKEN -------------------
document.getElementById("btnPrint").addEventListener("click", () => {
    const choice = confirm("Tabelle drucken? (Abbrechen für Stammbaum)");
    if (choice) {
        window.print(); // Tabelle
    } else {
        const treeWindow = window.open("", "", "width=800,height=600");
        treeWindow.document.write("<h1>Wappenringe der Familie GEPPERT</h1>");
        treeWindow.document.write(document.getElementById("treeContainer").innerHTML);
        treeWindow.print();
    }
});

// ------------------- RESET -------------------
document.getElementById("btnReset").addEventListener("click", () => {
    if (confirm("Sollen wirklich alle Personen gelöscht werden?")) {
        personen = [];
        renderTable();
        renderTree();
    }
});

// ------------------- TABELLE -------------------
function renderTable() {
    const tbody = document.getElementById("personenTableBody");
    tbody.innerHTML = "";
    personen.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.generation}</td>
            <td>${p.code}</td>
            <td>${p.name}</td>
            <td>${p.geburtsdatum}</td>
            <td>${p.geschlecht}</td>
            <td>${p.ringcode}</td>
            <td>${p.partner}</td>
            <td>${p.eltern}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ------------------- STAMMBAUM -------------------
function renderTree() {
    const container = document.getElementById("treeContainer");
    container.innerHTML = "";
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "600");

    let y = 50;
    personen.forEach((p, i) => {
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", 50 + i * 180);
        rect.setAttribute("y", y);
        rect.setAttribute("width", 160);
        rect.setAttribute("height", 60);
        rect.setAttribute("fill", "#e6e6fa");
        rect.setAttribute("stroke", "#333");
        svg.appendChild(rect);

        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", 60 + i * 180);
        text.setAttribute("y", y + 25);
        text.setAttribute("font-size", "12");
        text.textContent = `${p.code} | ${p.name} | ${p.geburtsdatum}`;
        svg.appendChild(text);
    });

    container.appendChild(svg);
}

// ------------------- INITIALISIERUNG -------------------
renderTable();
renderTree();

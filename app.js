let persons = [
    { code: "1", name: "Stammvater", birth: "1950-01-01", partner: "", inherited: "", ring: "" },
    { code: "1x", name: "Irina", birth: "1952-02-02", partner: "1", inherited: "", ring: "" },
    { code: "1A", name: "Kind A", birth: "1975-05-01", partner: "", inherited: "1", ring: "" },
    { code: "1B", name: "Kind B", birth: "1978-06-01", partner: "", inherited: "1", ring: "" },
    { code: "1C", name: "Kind C", birth: "1980-07-01", partner: "", inherited: "1", ring: "" },
    { code: "1A1", name: "Enkel A1", birth: "2000-01-01", partner: "", inherited: "1A", ring: "" },
    { code: "1B1", name: "Enkel B1", birth: "2002-01-01", partner: "", inherited: "1B", ring: "" },
    { code: "1C1", name: "Enkel C1", birth: "2003-01-01", partner: "", inherited: "1C", ring: "" }
];

function renderTable() {
    persons.sort((a, b) => {
        const genA = a.code.replace(/[^0-9]/g, '').length;
        const genB = b.code.replace(/[^0-9]/g, '').length;
        if (genA !== genB) return genA - genB;
        return a.code.localeCompare(b.code);
    });

    const tbody = document.querySelector("#personTable tbody");
    tbody.innerHTML = "";
    persons.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.code}</td><td>${p.name}</td><td>${p.birth}</td><td>${p.partner}</td><td>${p.inherited}</td><td>${p.ring}</td>`;
        tbody.appendChild(tr);
    });
}

// Dialoge
document.getElementById("btnAdd").addEventListener("click", () => {
    document.getElementById("dialogAdd").classList.remove("hidden");
});
document.getElementById("btnCancelAdd").addEventListener("click", () => {
    document.getElementById("dialogAdd").classList.add("hidden");
});
document.getElementById("btnSavePerson").addEventListener("click", () => {
    const name = document.getElementById("newName").value;
    const birth = document.getElementById("newBirth").value;
    const partner = document.getElementById("newPartner").value;
    const inherit = document.getElementById("inheritCode").value;

    if (!name) return;

    // Personen-Code generieren (vereinfacht, nach Geburtsdatum sortiert)
    let newCode = "NEW" + (persons.length + 1);
    let ringCode = "";
    if (inherit) {
        ringCode = inherit + "→" + newCode;
    }
    persons.push({ code: newCode, name, birth, partner, inherited: inherit, ring: ringCode });

    renderTable();
    document.getElementById("dialogAdd").classList.add("hidden");
});

document.getElementById("btnDelete").addEventListener("click", () => {
    document.getElementById("dialogDelete").classList.remove("hidden");
});
document.getElementById("btnCancelDelete").addEventListener("click", () => {
    document.getElementById("dialogDelete").classList.add("hidden");
});
document.getElementById("btnConfirmDelete").addEventListener("click", () => {
    const input = document.getElementById("deleteInput").value.trim();
    persons = persons.filter(p => p.code !== input && p.name !== input);
    renderTable();
    document.getElementById("dialogDelete").classList.add("hidden");
});

renderTable();


document.querySelector("form").addEventListener("submit", function(event) {
    event.preventDefault();
    const personencode = document.getElementById("personencode").value;
    const geerbtvon = document.getElementById("geerbtvon").value;
    const ringcode = geerbtvon ? geerbtvon + " ➔ " + personencode : personencode;

    const tableBody = document.getElementById("personTableBody");
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${personencode}</td>
        <td></td>
        <td>${geerbtvon}</td>
        <td>${ringcode}</td>
        <td></td>
    `;

    tableBody.appendChild(row);
});

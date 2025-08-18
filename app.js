function openNewPerson() {
  alert('Neue Person hinzufügen (Dialog folgt)');
}

function deletePerson() {
  alert('Person löschen und Verweise entfernen');
}

function printTable() {
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Druck</title></head><body>');
  printWindow.document.write('<h2><img src="wappen.jpeg" height="40"> Wappenringe der Familie GEPPERT <img src="wappen.jpeg" height="40"></h2>');
  printWindow.document.write(document.getElementById('personTable').outerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}

function printTree() {
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Druck</title></head><body>');
  printWindow.document.write('<h2><img src="wappen.jpeg" height="40"> Wappenringe der Familie GEPPERT <img src="wappen.jpeg" height="40"></h2>');
  printWindow.document.write(document.getElementById('treeContainer').outerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}

function showStatistics() {
  alert('Gesamt: 1, männlich: 1, weiblich: 0, divers: 0, Generationen: 1');
}

function openHelp() {
  const win = window.open('help.html', 'Hilfe', 'width=600,height=400,scrollbars=yes');
}

function searchTable() {
  const input = document.getElementById('searchBox').value.toLowerCase();
  const rows = document.querySelectorAll('#personTable tbody tr');
  rows.forEach(row => {
    row.style.display = 'none';
    let match = false;
    row.querySelectorAll('td').forEach(cell => {
      if (cell.textContent.toLowerCase().includes(input)) {
        match = true;
        cell.classList.add('highlight');
      } else {
        cell.classList.remove('highlight');
      }
    });
    if (match) row.style.display = '';
  });
}

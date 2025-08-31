
export const printView = (printableAreaId: string) => {
    const printContentElement = document.getElementById(printableAreaId);
    if (!printContentElement) {
        console.error(`Druckbarer Bereich mit der ID "${printableAreaId}" nicht gefunden.`);
        return;
    }

    const printWindow = window.open('', '_blank', 'height=800,width=1200,scrollbars=yes');

    if (!printWindow) {
        alert('Bitte erlauben Sie Pop-ups für diese Seite, um die Druckfunktion nutzen zu können.');
        return;
    }

    const doc = printWindow.document;
    const headContent = document.head.innerHTML;

    // We build the document content in the new window
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html lang="de">
            <head>
                <title>Druckansicht</title>
                ${headContent}
            </head>
            <body style="padding: 2rem;">
                <div id="${printableAreaId}">
                    ${printContentElement.innerHTML}
                </div>
            </body>
        </html>
    `);
    doc.close();

    // Wait for the window to load all resources (like Tailwind script).
    printWindow.onload = () => {
        // A short delay is crucial to allow scripts (like Tailwind) and CSS animations 
        // to finish rendering before the print dialog is triggered.
        setTimeout(() => {
            printWindow.focus(); // Focus the new window
            printWindow.print(); // Open the print dialog
            printWindow.close(); // Close the window after printing
        }, 300); // This delay helps prevent printing blank pages.
    };
};
import type { Person } from '../types';

// Helper for the download logic to avoid repetition
function triggerDownload(blob: Blob, fileName: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

// Make the function async to handle the promise from navigator.share
async function downloadFile(content: string, fileName: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const file = new File([blob], fileName, { type: contentType });
    
    // Check for Web Share API support for files
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        const shareData = {
            files: [file],
            title: 'Stammbaum Daten',
            text: `Stammbaum Daten als ${fileName}.`,
        };
        try {
            await navigator.share(shareData);
            return; // Exit if share is successful
        } catch (error) {
            // If user cancels the share dialog, do not fall back to download
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('File share was cancelled by the user.');
                return;
            }
            // For any other share error, log it and fall back to direct download
            console.error('File share failed, falling back to download:', error);
        }
    } 
    
    // Fallback for browsers that don't support sharing files or if sharing fails
    triggerDownload(blob, fileName);
}


function convertToCSV(people: Person[]): string {
    if (people.length === 0) return '';
    
    // Explicitly define headers to control order and exclude photoUrl
    const headers: (keyof Person)[] = [
        'id', 'code', 'name', 'gender', 'birthDate', 'deathDate', 
        'birthPlace', 'parentId', 'partnerId', 'ringCode', 
        'inheritedFrom', 'hasRing', 'ringHistory', 'comment'
    ];
    const csvRows = [headers.join(',')];

    for (const person of people) {
        const values = headers.map(header => {
            const value = person[header];
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            if (Array.isArray(value)) {
                return `"${value.join(';')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
}

function parseCSV(csvText: string): Person[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const people: Person[] = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        // This is a naive CSV parser and will fail on quoted commas.
        const values = lines[i].split(',');
        const person: any = {};
        for (let j = 0; j < headers.length; j++) {
            let value: any = values[j];
            const header = headers[j];
            
            if (header === 'ringHistory') {
                value = value.replace(/"/g, '').split(';');
            } else if (header === 'hasRing') {
                value = (value === 'true');
            }
            
            if(value === 'null') value = null;
            if(value === 'undefined') value = undefined;

            person[header] = value;
        }
        people.push(person as Person);
    }
    return people;
}

export const exportData = (people: Person[], format: 'json' | 'csv') => {
    if (format === 'json') {
        const jsonString = JSON.stringify(people, null, 2);
        downloadFile(jsonString, 'stammbaum.json', 'application/json');
    } else if (format === 'csv') {
        const csvString = convertToCSV(people);
        downloadFile(csvString, 'stammbaum.csv', 'text/csv;charset=utf-8;');
    }
};

export const importData = (file: File): Promise<Person[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                if (file.name.endsWith('.json')) {
                    const data = JSON.parse(content);
                    // Basic validation
                    if (Array.isArray(data) && (data.length === 0 || 'id' in data[0])) {
                        resolve(data);
                    } else {
                        reject(new Error('Invalid JSON format.'));
                    }
                } else if (file.name.endsWith('.csv')) {
                    const data = parseCSV(content);
                     if (Array.isArray(data) && (data.length === 0 || 'id' in data[0])) {
                        resolve(data);
                    } else {
                        reject(new Error('Invalid CSV format.'));
                    }
                } else {
                    reject(new Error('Unsupported file type. Please use .json or .csv'));
                }
            } catch (e) {
                reject(new Error(`Failed to parse file: ${e instanceof Error ? e.message : 'Unknown error'}`));
            }
        };
        reader.onerror = (error) => reject(new Error('Failed to read file.'));
        reader.readAsText(file);
    });
};
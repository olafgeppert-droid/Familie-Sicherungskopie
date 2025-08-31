import type { Person, PersonFormData } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generation anhand des Codes bestimmen (ohne Partner-Suffix 'x').
 */
export const getGeneration = (code: string): number => {
    if (!code) return 0;
    return code.replace(/x$/, '').length;
};

/**
 * Farben für Generationen (identisch zu vorheriger Verwendung).
 */
export const generationBackgroundColors = [
    '#ffcdd2', // Gen 1
    '#c8e6c9', // Gen 2
    '#bbdefb', // Gen 3
    '#fff9c4', // Gen 4
    '#d1c4e9', // Gen 5
    '#ffecb3', // Gen 6
    '#b2dfdb', // Gen 7
];

/**
 * Generationsnamen.
 */
export const getGenerationName = (generation: number): string => {
    switch (generation) {
        case 1: return 'Stammeltern';
        case 2: return 'Kinder';
        case 3: return 'Enkel';
        case 4: return 'Urenkel';
        case 5: return 'Ururenkel';
        case 6: return 'Urururenkel';
        default: return generation > 1 ? `${generation}. Generation` : '';
    }
};

/**
 * Ermittelt den Personen-Code bei **Neuanlage**.
 *  - Stammeltern: '1'
 *  - Partner:    partner.code + 'x'
 *  - Kind:       Bei Eltern-Code '1' → Buchstaben (1A, 1B, ...)
 *                sonst numerisch (z. B. 1A1, 1A2, ...)
 */
export const generatePersonCode = (personData: Partial<PersonFormData>, allPeople: Person[]): string => {
    // Erstperson / explizit Stammeltern
    if (personData.relationship === 'progenitor' || allPeople.length === 0) {
        return '1';
    }

    // Partner: Code vom Partner + 'x'
    if (personData.relationship === 'partner' && personData.partnerId) {
        const partner = allPeople.find(p => p.id === personData.partnerId);
        return partner ? `${partner.code}x` : 'error-partner-not-found';
    }

    // Kind: abhängig vom Eltern-Code
    if (personData.relationship === 'child' && personData.parentId) {
        const parent = allPeople.find(p => p.id === personData.parentId);
        if (!parent) return 'error-parent-not-found';

        // Alle vorhandenen Kinder (ohne Partner) des Elternteils
        const siblings = allPeople
            .filter(p => p.parentId === personData.parentId)
            .filter(p => !p.code.endsWith('x'));

        // Reihenfolge durch Geburtsdatum (älteste zuerst)
        const allChildren = [...siblings, personData as Person].sort((a, b) =>
            new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()
        );

        const newIndex = allChildren.findIndex(c => c.id === personData.id);

        if (parent.code === '1') {
            // 2. Generation: Buchstaben
            return `1${ALPHABET[newIndex]}`;
        } else {
            // Spätere Generationen: numerisch fortlaufend
            return `${parent.code}${newIndex + 1}`;
        }
    }

    return 'error-invalid-data';
};

/**
 * Hilfsfunktion: Partnercode aus Kinder-Code bilden.
 */
const partnerCodeOf = (childCode: string) => `${childCode}x`;

/**
 * **WICHTIGER FIX:** Wenn durch Hinzufügen eines Kindes die Codes
 * der Geschwister neu berechnet werden, müssen **auch deren Partner**
 * synchron mit aktualisiert werden (child.code + 'x').
 */
export const getCodeRecalculation = (
    newPerson: Person,
    allPeople: Person[]
): { updates: { id: string; code: string }[] } => {

    // Nur Kinder lösen eine Neuberechnung aus
    if (!newPerson.parentId) {
        return { updates: [] };
    }

    const parent = allPeople.find(p => p.id === newPerson.parentId);
    if (!parent) return { updates: [] };

    // Alle Kinder (ohne Partner) des Elternteils
    const siblings = allPeople
        .filter(p => p.parentId === newPerson.parentId)
        .filter(p => !p.code.endsWith('x'));

    // Neu einfügen und nach Geburtsdatum sortieren (älteste zuerst)
    const ordered = [...siblings, newPerson].sort(
        (a, b) => new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()
    );

    const updates: { id: string; code: string }[] = [];

    ordered.forEach((child, index) => {
        const isGen2 = parent.code === '1';
        const newChildCode = isGen2 ? `1${ALPHABET[index]}` : `${parent.code}${index + 1}`;

        // 1) Kind selbst updaten?
        if (child.id !== newPerson.id && child.code !== newChildCode) {
            updates.append({ id: child.id, code: newChildCode });
        } else if (child.id === newPerson.id) {
            newPerson.code = newChildCode;
        }

        // 2) Partner des Kindes mitsynchronisieren
        const partner = allPeople.find(p => p.partnerId === child.id);
        if (partner) {
            const expectedPartnerCode = partnerCodeOf(newChildCode);
            if (partner.code !== expectedPartnerCode) {
                updates.push({ id: partner.id, code: expectedPartnerCode });
            }
        }
    });

    return { updates };
};

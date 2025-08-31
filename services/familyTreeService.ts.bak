
import type { Person, PersonFormData } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Gets the generation number from a person's code.
 */
export const getGeneration = (code: string): number => {
    if (!code) return 0;
    // The generation is the length of the code, excluding any partner 'x' suffix.
    return code.replace(/x$/, '').length;
};

/**
 * Provides a consistent set of background colors for generations across the app.
 */
export const generationBackgroundColors = [
    '#ffcdd2', // Gen 1 (light red)
    '#c8e6c9', // Gen 2 (light green)
    '#bbdefb', // Gen 3 (light blue)
    '#fff9c4', // Gen 4 (light yellow)
    '#d1c4e9', // Gen 5 (light purple)
    '#ffecb3', // Gen 6 (light orange)
    '#b2dfdb', // Gen 7 (light teal)
];

/**
 * Returns the name for a given generation number.
 */
export const getGenerationName = (generation: number): string => {
    switch (generation) {
        case 1: return 'Stammeltern';
        case 2: return 'Kinder';
        case 3: return 'Enkel';
        case 4: return 'Urenkel';
        case 5: return 'Ururenkel';
        case 6: return 'Urururenkel';
        default:
            if (generation > 1) {
                return `${generation}. Generation`;
            }
            return '';
    }
};

/**
 * Generates a person code for a new person.
 * Note: This function determines the code for the new person in isolation.
 * For recalculating sibling codes, use `getCodeRecalculation`.
 */
export const generatePersonCode = (personData: Partial<PersonFormData>, allPeople: Person[]): string => {
    if (personData.relationship === 'progenitor' || allPeople.length === 0) {
        return '1';
    }

    if (personData.relationship === 'partner' && personData.partnerId) {
        const partner = allPeople.find(p => p.id === personData.partnerId);
        return partner ? `${partner.code}x` : 'error-partner-not-found';
    }

    if (personData.relationship === 'child' && personData.parentId) {
        const parent = allPeople.find(p => p.id === personData.parentId);
        if (!parent) return 'error-parent-not-found';

        const siblings = allPeople.filter(p => p.parentId === personData.parentId);
        const allChildren = [...siblings, personData as Person].sort((a, b) => 
            new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()
        );

        const newPersonIndex = allChildren.findIndex(c => c.id === personData.id);

        if (parent.code === '1') {
            return `1${ALPHABET[newPersonIndex]}`;
        } else {
            return `${parent.code}${newPersonIndex + 1}`;
        }
    }

    return 'error-invalid-data';
};

/**
 * Calculates the necessary code updates for siblings when a new person is added.
 */
export const getCodeRecalculation = (newPerson: Person, allPeople: Person[]): { updates: { id: string, code: string }[] } => {
    if (!newPerson.parentId) {
        return { updates: [] }; // Progenitors or partners don't cause recalculations
    }

    const parent = allPeople.find(p => p.id === newPerson.parentId);
    if (!parent) return { updates: [] };
    
    const siblings = allPeople.filter(p => p.parentId === newPerson.parentId);
    const allChildrenSorted = [...siblings, newPerson].sort((a, b) => 
        new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()
    );

    const updates: { id: string, code: string }[] = [];

    allChildrenSorted.forEach((child, index) => {
        let newCode: string;
        if (parent.code === '1') {
            newCode = `1${ALPHABET[index]}`;
        } else {
            newCode = `${parent.code}${index + 1}`;
        }
        
        // If it's an existing person and their code changes, add to updates
        if (child.id !== newPerson.id && child.code !== newCode) {
            updates.push({ id: child.id, code: newCode });
        }
        // If it's the new person, update their code to the final correct one
        else if (child.id === newPerson.id) {
            newPerson.code = newCode;
        }
    });

    return { updates };
};

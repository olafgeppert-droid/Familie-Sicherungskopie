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
    // Stammeltern
    if (personData.relationship === 'progenitor' || allPeople.length === 0) {
        return '1';
    }

    // Partner bekommt Partnercode (z. B. 1A → 1Ax)
    if (personData.relationship === 'partner' && personData.partnerId) {
        const partner = allPeople.find(p => p.id === personData.partnerId);
        return partner ? `${partner.code}x` : 'error-partner-not-found';
    }

    // Kind bekommt Buchstaben
    if (personData.relationship === 'child' && personData.parentId) {
        const siblings = allPeople.filter(p => p.parentId === personData.parentId && !p.code.endsWith('x'));
        const nextLetter = ALPHABET[siblings.length];
        const parent = allPeople.find(p => p.id === personData.parentId);
        return parent ? `${parent.code}${nextLetter}` : 'error-parent-not-found';
    }

    return 'error-unknown-relationship';
};

/**
 * Generates a ring code for a person based on parent or partner.
 */
export const generateRingCode = (person: Person, allPeople: Person[]): string => {
    if (!person) return '';

    // Partner: Ringcode vom Partner übernehmen + x
    if (person.partnerId) {
        const partner = allPeople.find(p => p.id === person.partnerId);
        if (partner) {
            return partner.ringCode.endsWith('x')
                ? partner.ringCode
                : `${partner.ringCode}x`;
        }
    }

    // Kind: vom Parent ableiten
    if (person.parentId) {
        const parent = allPeople.find(p => p.id === person.parentId);
        if (parent) {
            return `${parent.ringCode.replace(/x$/, '')} → ${person.code}`;
        }
    }

    // Stammeltern: Code = 1
    return person.code;
};

/**
 * Build family tree data, including partners.
 */
export const buildFamilyTree = (people: Person[]): any[] => {
    const tree: any[] = [];

    people.forEach(person => {
        // Prüfen ob Person schon im Baum ist
        if (!tree.find(p => p.id === person.id)) {
            tree.push(person);
        }

        // Partner hinzufügen
        if (person.partnerId) {
            const partner = people.find(p => p.id === person.partnerId);
            if (partner && !tree.find(p => p.id === partner.id)) {
                tree.push(partner);
            }
        }
    });

    return tree;
};

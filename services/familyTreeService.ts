// src/services/familyTreeService.ts

import type { Person, PersonFormData } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** 
 * Ermittelt die Generation anhand des Codes. 
 * Partner ("x") werden ignoriert. 
 * Stammeltern = 1, Kinder = 2, usw. 
 */
export const getGeneration = (code: string): number => {
    if (!code) return 0;
    return code.replace(/x$/, '').length;
};

/** Farben für Generationen (rot, grün, blau, gelb, lila, orange, türkis) */
export const generationBackgroundColors = [
    '#ffcdd2',
    '#c8e6c9',
    '#bbdefb',
    '#fff9c4',
    '#d1c4e9',
    '#ffecb3',
    '#b2dfdb',
];

/** Sprechende Bezeichnungen für Generationen */
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

/** Vergibt einen neuen Personen-Code */
export const generatePersonCode = (personData: Partial<PersonFormData>, allPeople: Person[]): string => {
    if (personData.relationship === 'progenitor' || allPeople.length === 0) return '1';

    // Partner bekommt denselben Code + "x"
    if (personData.relationship === 'partner' && personData.partnerId) {
        const partner = allPeople.find(p => p.id === personData.partnerId);
        return partner ? `${partner.code}x` : 'error-partner-not-found';
    }

    // Kinder bekommen Code auf Basis des Elternteils
    if (personData.relationship === 'child' && personData.parentId) {
        const parent = allPeople.find(p => p.id === personData.parentId);
        if (!parent) return 'error-parent-not-found';

        const siblings = allPeople
            .filter(p => p.parentId === personData.parentId)
            .filter(p => !p.code.endsWith('x'));

        const allChildren = [...siblings, personData as any].sort((a, b) =>
            new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()
        );
        const newIndex = allChildren.findIndex(c => c.id === (personData as any).id);

        if (parent.code === '1') {
            return `1${ALPHABET[newIndex]}`;
        } else {
            return `${parent.code}${newIndex + 1}`;
        }
    }

    return 'error-invalid-data';
};

const partnerCodeOf = (childCode: string) => `${childCode}x`;

/** Berechnet Codes für Kinder und ggf. deren Partner neu */
export const getCodeRecalculation = (
    newPerson: Person,
    allPeople: Person[]
): { updates: { id: string; code: string }[] } => {

    if (!newPerson.parentId) return { updates: [] };

    const parent = allPeople.find(p => p.id === newPerson.parentId);
    if (!parent) return { updates: [] };

    const siblings = allPeople
        .filter(p => p.parentId === newPerson.parentId)
        .filter(p => !p.code.endsWith('x'));

    const ordered = [...siblings, newPerson].sort(
        (a, b) => new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()
    );

    const updates: { id: string; code: string }[] = [];

    ordered.forEach((child, index) => {
        const isGen2 = parent.code === '1';
        const newChildCode = isGen2 ? `1${ALPHABET[index]}` : `${parent.code}${index + 1}`;

        if (child.id !== newPerson.id && child.code !== newChildCode) {
            updates.push({ id: child.id, code: newChildCode });
        } else if (child.id === newPerson.id) {
            newPerson.code = newChildCode;
        }

        // Partner anpassen
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

/* ============================================================
   RING-CODE LOGIK
   ============================================================ */

/**
 * Vergibt einen Ring-Code für ein Kind.
 * - Ring-Code Kind = Ring-Code Eltern (ohne "x") + Zähler nach Geburtsreihenfolge
 * - In der 1. Kindergeneration: Buchstaben (A, B, C, …)
 * - Ab 2. Kindergeneration: Zahlen (1, 2, 3, …)
 */
export const generateRingCode = (person: Person, allPeople: Person[]): string | undefined => {
    if (!person.parentId) {
        // Stammeltern: Ring-Code = Personen-Code
        return person.code;
    }

    const parent = allPeople.find(p => p.id === person.parentId);
    if (!parent) return undefined;

    const siblings = allPeople
        .filter(p => p.parentId === person.parentId)
        .filter(p => !p.code.endsWith('x'));

    const ordered = [...siblings, person].sort(
        (a, b) => new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()
    );

    const index = ordered.findIndex(c => c.id === person.id);

    const base = parent.ringCode?.replace(/x$/, '') || parent.code.replace(/x$/, '');

    if (parent.code === '1') {
        // Erste Kindergeneration → A, B, C …
        return `${base}${ALPHABET[index]}`;
    } else {
        // Ab 2. Generation → 1, 2, 3 …
        return `${base}${index + 1}`;
    }
};

/**
 * Wendet eine Ringvererbung an.
 * - Alte Gravur bleibt bestehen
 * - Erbender Code wird mit "->" angehängt
 * Beispiel: Ring von "1" wird von "1C2" geerbt → "1 -> 1C2"
 */
export const inheritRingCode = (fromPerson: Person, toPerson: Person): string => {
    return `${fromPerson.ringCode || fromPerson.code} -> ${toPerson.code}`;
};

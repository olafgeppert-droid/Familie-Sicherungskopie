
import type { Person, PersonFormData } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Generation ohne 'x' ermitteln */
export const getGeneration = (code: string): number => {
    if (!code) return 0;
    return code.replace(/x$/, '').length;
};

export const generationBackgroundColors = [
    '#ffcdd2','#c8e6c9','#bbdefb','#fff9c4','#d1c4e9','#ffecb3','#b2dfdb',
];

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

/** Neuanlage-Code */
export const generatePersonCode = (personData: Partial<PersonFormData>, allPeople: Person[]): string => {
    if (personData.relationship === 'progenitor' || allPeople.length === 0) return '1';

    if (personData.relationship === 'partner' && personData.partnerId) {
        const partner = allPeople.find(p => p.id === personData.partnerId);
        return partner ? `${partner.code}x` : 'error-partner-not-found';
    }

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

/** Recalculation inkl. Partner-Codes */
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

        // Partner mitführen
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

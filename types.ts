export type Gender = 'm' | 'f' | 'd';

export interface Person {
    id: string;
    code: string; // Personen-Code (z.B. "1A2")
    name: string;
    gender: Gender;
    birthDate: string; // ISO string format 'YYYY-MM-DD'
    deathDate?: string | null; // ISO string format 'YYYY-MM-DD'
    birthPlace?: string | null;
    parentId?: string | null; // ID of the non-partner parent for children
    partnerId?: string | null; // ID of the partner

    hasRing: boolean;
    ringCode?: string | null;      // Gravur im Ring, z.B. "1 -> 1C2"
    ringHistory?: string[];        // Verlauf der Gravuränderungen

    inheritedFrom?: string | null; // ID der Person, von der der Ring stammt
    comment?: string | null;
    photoUrl?: string | null;
}

export type PersonFormData = Omit<Person, 'code' | 'ringCode' | 'ringHistory'> & {
    relationship: 'progenitor' | 'child' | 'partner';
};

export type View = 'table' | 'tree' | 'stats';

// State management types
export interface AppState {
    people: Person[];
}

export type Action =
    | { type: 'ADD_PERSON'; payload: Person }
    | { type: 'ADD_PERSON_WITH_RECALCULATION'; payload: { newPerson: Person; updates: { id: string; code: string }[] } }
    | { type: 'UPDATE_PERSON'; payload: Person }
    | { type: 'DELETE_PERSON'; payload: string }
    | { type: 'SET_DATA'; payload: Person[] }
    | { type: 'RESET_PERSON_DATA' }   // ✅ korrigiert: RESET → RESET_PERSON_DATA
    | { type: 'LOAD_SAMPLE_DATA' };

export interface History {
    past: AppState[];
    present: AppState;
    future: AppState[];
}

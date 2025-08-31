export type Gender = 'm' | 'f' | 'd';

export interface Person {
    id: string;
    code: string;
    name: string;
    gender: Gender;
    birthDate: string; // ISO string format 'YYYY-MM-DD'
    deathDate?: string | null; // ISO string format 'YYYY-MM-DD'
    birthPlace?: string | null;
    parentId?: string | null; // ID of the non-partner parent for children
    partnerId?: string | null; // ID of the partner
    ringCode: string;
    inheritedFrom?: string | null;
    hasRing: boolean;
    ringHistory: string[]; // e.g., ["1B", "1B -> 1B2"]
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
    | { type: 'RESET' }
    | { type: 'LOAD_SAMPLE_DATA' };

export interface History {
    past: AppState[];
    present: AppState;
    future: AppState[];
}
import { useReducer, useCallback } from 'react';
import type { AppState, Action, History } from '../types';
import { samplePeople } from '../services/sampleData';
import { validateFamilyData } from '../services/validateFamilyData';

const defaultState: AppState = { people: [] };

const saveStateToLocalStorage = (state: AppState) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('familyTreeState', serializedState);
    } catch (e) {
        console.warn("Could not save state to local storage", e);
    }
};

const loadStateFromLocalStorage = (): AppState => {
    try {
        const serializedState = localStorage.getItem('familyTreeState');
        const hasBeenInitialized = localStorage.getItem('databaseHasBeenInitialized');

        if (serializedState === null) {
            if (hasBeenInitialized) {
                return defaultState;
            }
            localStorage.setItem('databaseHasBeenInitialized', 'true');
            const initialStateWithSample = { ...defaultState, people: samplePeople };
            saveStateToLocalStorage(initialStateWithSample);
            return initialStateWithSample;
        }

        const parsedState = JSON.parse(serializedState);
        if (parsedState.people === undefined) {
            if (hasBeenInitialized) {
                return defaultState;
            }
            localStorage.setItem('databaseHasBeenInitialized', 'true');
            const initialStateWithSample = { ...defaultState, people: samplePeople };
            saveStateToLocalStorage(initialStateWithSample);
            return initialStateWithSample;
        }

        if (!hasBeenInitialized) {
            localStorage.setItem('databaseHasBeenInitialized', 'true');
        }

        return { ...defaultState, ...parsedState };
    } catch (e) {
        console.warn("Could not load state from local storage", e);
        if (!localStorage.getItem('databaseHasBeenInitialized')) {
            localStorage.setItem('databaseHasBeenInitialized', 'true');
            const initialStateWithSample = { ...defaultState, people: samplePeople };
            saveStateToLocalStorage(initialStateWithSample);
            return initialStateWithSample;
        }
        return defaultState;
    }
};

const initialState: AppState = loadStateFromLocalStorage();

const reducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'ADD_PERSON': {
            const newPerson = action.payload;
            if (newPerson.partnerId) {
                const updatedPeople = state.people.map(p =>
                    p.id === newPerson.partnerId ? { ...p, partnerId: newPerson.id } : p
                );
                return { ...state, people: [...updatedPeople, newPerson] };
            }
            return { ...state, people: [...state.people, newPerson] };
        }

        case 'ADD_PERSON_WITH_RECALCULATION': {
            const { newPerson, updates } = action.payload;
            const updatedPeople = state.people.map(p => {
                const update = updates.find(u => u.id === p.id);
                if (update) {
                    const shouldUpdateRingCode = p.ringCode === p.code;
                    return {
                        ...p,
                        code: update.code,
                        ringCode: shouldUpdateRingCode ? update.code : p.ringCode
                    };
                }
                return p;
            });
            return { ...state, people: [...updatedPeople, newPerson] };
        }

        case 'UPDATE_PERSON': {
            const updatedPerson = action.payload;
            const originalPerson = state.people.find(p => p.id === updatedPerson.id);
            if (!originalPerson) return state;

            const oldPartnerId = originalPerson.partnerId;
            const newPartnerId = updatedPerson.partnerId;

            if (oldPartnerId === newPartnerId) {
                return {
                    ...state,
                    people: state.people.map(p =>
                        p.id === updatedPerson.id ? updatedPerson : p
                    ),
                };
            }

            const newPeople = state.people.map(p => {
                if (p.id === updatedPerson.id) return updatedPerson;
                if (p.id === oldPartnerId) return { ...p, partnerId: null };
                if (p.id === newPartnerId) return { ...p, partnerId: updatedPerson.id };
                return p;
            });

            return { ...state, people: newPeople };
        }

        case 'DELETE_PERSON': {
            const personIdToDelete = action.payload;
            const personToDelete = state.people.find(p => p.id === personIdToDelete);
            const partnerIdToUnlink = personToDelete?.partnerId;

            const newPeople = state.people
                .filter(p => p.id !== personIdToDelete)
                .map(p => {
                    let newP = { ...p };
                    if (newP.parentId === personIdToDelete) newP.parentId = null;
                    if (newP.id === partnerIdToUnlink) newP.partnerId = null;
                    if (newP.partnerId === personIdToDelete) newP.partnerId = null;
                    return newP;
                });

            return { ...state, people: newPeople };
        }

        case 'SET_DATA':
            return { ...state, people: action.payload };

        case 'RESET':
            return { ...state, people: [] };

        case 'LOAD_SAMPLE_DATA':
            return { ...state, people: samplePeople };

        default:
            return state;
    }
};

const historyReducer = (state: History, action: Action | { type: 'UNDO' } | { type: 'REDO' }): History => {
    const { past, present, future } = state;

    if (action.type === 'UNDO') {
        if (past.length === 0) return state;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        saveStateToLocalStorage(previous);
        return { past: newPast, present: previous, future: [present, ...future] };
    }

    if (action.type === 'REDO') {
        if (future.length === 0) return state;
        const next = future[0];
        const newFuture = future.slice(1);
        saveStateToLocalStorage(next);
        return { past: [...past, present], present: next, future: newFuture };
    }

    const newPresent = reducer(present, action);
    if (present === newPresent) return state;

    saveStateToLocalStorage(newPresent);

    return { past: [...past, present], present: newPresent, future: [] };
};

export const useFamilyData = () => {
    const [state, dispatch] = useReducer(historyReducer, {
        past: [],
        present: initialState,
        future: [],
    });

    const { present, past, future } = state;

    const dispatchWithHistory = useCallback((action: Action) => {
        dispatch(action);
    }, []);

    const undo = useCallback(() => {
        if (past.length > 0) dispatch({ type: 'UNDO' });
    }, [past]);

    const redo = useCallback(() => {
        if (future.length > 0) dispatch({ type: 'REDO' });
    }, [future]);

    const warnings = validateFamilyData(present.people);

    return {
        state: present,
        warnings,
        dispatch: dispatchWithHistory,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
    };
};

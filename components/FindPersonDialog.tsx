
import React, { useState } from 'react';
import { CloseIcon } from './Icons';

interface FindPersonDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onFind: (term: string) => void;
}

export const FindPersonDialog: React.FC<FindPersonDialogProps> = ({ isOpen, onClose, onFind }) => {
    const [term, setTerm] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFind(term);
        setTerm(''); // Clear after find
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-primary">Person ändern oder löschen</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon />
                    </button>
                </div>
                <p className="text-gray-600 mb-4">Welche Person soll geändert oder gelöscht werden?</p>
                <div>
                    <label htmlFor="find-person-term" className="block text-base font-medium text-gray-700">Name oder Code</label>
                    <input
                        id="find-person-term"
                        type="text"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        placeholder="Name oder Code eingeben..."
                        className="mt-1 block w-full rounded-md border border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 text-base bg-gray-200"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                        Abbrechen
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors"
                    >
                        Suchen & Öffnen
                    </button>
                </div>
            </form>
        </div>
    );
};
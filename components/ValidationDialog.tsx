import React from 'react';
import { XCircleIcon, WrenchIcon } from 'lucide-react';

interface ValidationDialogProps {
    isOpen: boolean;
    errors: string[];
    onClose: () => void;
    onFix: () => void;
}

export const ValidationDialog: React.FC<ValidationDialogProps> = ({ isOpen, errors, onClose, onFix }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold text-red-600 flex items-center">
                    <XCircleIcon className="w-6 h-6 mr-2" />
                    Dateninkonsistenzen gefunden
                </h2>

                <ul className="list-disc list-inside space-y-1 text-gray-700 max-h-60 overflow-y-auto">
                    {errors.map((err, i) => (
                        <li key={i}>{err}</li>
                    ))}
                </ul>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={onFix}
                        className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow"
                    >
                        <WrenchIcon className="w-4 h-4 mr-2" />
                        Automatisch reparieren
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};

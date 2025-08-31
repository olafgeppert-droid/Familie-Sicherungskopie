import React from 'react';
import { CloseIcon } from './Icons';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonClass?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonClass }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-primary">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon />
                    </button>
                </div>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                        Abbrechen
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2 text-white rounded-md transition-colors ${confirmButtonClass || 'bg-red-600 hover:bg-red-700'}`}
                    >
                        Bestätigen
                    </button>
                </div>
            </div>
        </div>
    );
};
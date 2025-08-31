import React from 'react';
import type { AppColors } from '../App';
import { CloseIcon, ResetIcon, BeakerIcon } from './Icons';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onReset: () => void;
    onLoadSampleData: () => void;
    colors: AppColors;
    onColorsChange: (newColors: AppColors) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, onReset, onLoadSampleData, colors, onColorsChange }) => {
    if (!isOpen) return null;

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onColorsChange({ ...colors, [name]: value });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 animate-fade-in">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-brand-primary">Einstellungen</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    {/* Color Settings */}
                    <div>
                        <h3 className="text-lg font-semibold text-brand-primary mb-3">Farbanpassung</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label htmlFor="headerColor" className="text-gray-700">Header-Farbe</label>
                                <input
                                    id="headerColor"
                                    name="header"
                                    type="color"
                                    value={colors.header}
                                    onChange={handleColorChange}
                                    className="w-12 h-8 p-0 border border-black rounded"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="sidebarColor" className="text-gray-700">Seitenleisten-Farbe</label>
                                <input
                                    id="sidebarColor"
                                    name="sidebar"
                                    type="color"
                                    value={colors.sidebar}
                                    onChange={handleColorChange}
                                    className="w-12 h-8 p-0 border border-black rounded"
                                />
                            </div>
                        </div>
                    </div>

                    {/* File Path Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-brand-primary mb-3">Speicherpfad</h3>
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Hinweis:</strong> Aus Sicherheitsgründen können Web-Anwendungen nicht auf Dein lokales Dateisystem zugreifen, um einen Standard-Speicherpfad festzulegen. Der Speicherort für Exporte wird von Deinem Browser verwaltet.
                            </p>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div>
                        <h3 className="text-lg font-semibold text-brand-primary mb-3">Datenverwaltung</h3>
                        <div className="space-y-3">
                            <button
                                onClick={onLoadSampleData}
                                className="w-full flex items-center justify-center px-4 py-2 bg-yellow-400 text-brand-dark rounded-md hover:bg-yellow-500 transition-colors"
                            >
                                <BeakerIcon className="w-5 h-5 mr-2" />
                                30+ Beispieldaten laden
                            </button>
                             <button
                                onClick={onReset}
                                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                <ResetIcon className="w-5 h-5 mr-2" />
                                Alle Personendaten zurücksetzen
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-4 border-t bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors">
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};

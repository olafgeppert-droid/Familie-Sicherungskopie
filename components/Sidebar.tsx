

import React from 'react';
import type { View } from '../types';
import { TableIcon, TreeIcon, StatsIcon, HelpIcon, SettingsIcon, InfoIcon, WavingHandIcon } from './Icons';
import type { AppColors } from '../App';

interface SidebarProps {
    currentView: View;
    onSetView: (view: View) => void;
    onHelp: () => void;
    onSettings: () => void;
    onGoToWelcome: () => void;
    color: string;
}

const NavButton: React.FC<{
    label: string;
    icon: JSX.Element;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-3 text-left rounded-lg transition-colors duration-200 ${
            isActive
                ? 'bg-brand-header/20 text-brand-header font-semibold'
                : 'text-brand-primary/80 hover:bg-black/5 hover:text-brand-primary'
        }`}
    >
        {React.cloneElement(icon, { className: 'w-6 h-6 mr-3' })}
        <span className="font-medium">{label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSetView, onHelp, onSettings, onGoToWelcome, color }) => {
    return (
        <nav style={{ backgroundColor: color }} className="w-64 p-4 flex-shrink-0 print:hidden overflow-y-auto flex flex-col">
            <div>
                <h2 className="text-lg font-semibold text-brand-primary/90 uppercase tracking-wider mb-4 px-3">Navigation</h2>
                <div className="space-y-2">
                    <NavButton
                        label="Tabelle"
                        icon={<TableIcon />}
                        isActive={currentView === 'table'}
                        onClick={() => onSetView('table')}
                    />
                    <NavButton
                        label="Stammbaum"
                        icon={<TreeIcon />}
                        isActive={currentView === 'tree'}
                        onClick={() => onSetView('tree')}
                    />
                    <NavButton
                        label="Statistik"
                        icon={<StatsIcon />}
                        isActive={currentView === 'stats'}
                        onClick={() => onSetView('stats')}
                    />
                    <hr className="my-2 border-brand-primary/10" />
                    <NavButton
                        label="Einstellungen"
                        icon={<SettingsIcon />}
                        isActive={false}
                        onClick={onSettings}
                    />
                    <NavButton
                        label="Hilfe"
                        icon={<HelpIcon />}
                        isActive={false}
                        onClick={onHelp}
                    />
                     <NavButton
                        label="Willkommen"
                        icon={<WavingHandIcon />}
                        isActive={false}
                        onClick={onGoToWelcome}
                    />
                </div>
            </div>
            <div className="mt-auto">
                <div className="bg-brand-header/10 p-3 rounded-lg text-brand-primary/80 text-xs">
                    <div className="flex items-start">
                        <InfoIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>
                            Bearbeiten eines Eintrags durch Doppelklick auf die Person. Personen- und Ring-Code werden vom Programm vergeben. Denke daran, die Datenbank durch Export zu sichern.
                        </p>
                    </div>
                </div>
            </div>
        </nav>
    );
};
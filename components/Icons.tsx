

import React from 'react';

type IconProps = {
    className?: string;
    width?: number;
    height?: number;
    color?: string;
    x?: number;
    y?: number;
};

export const AddIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

export const EditIcon: React.FC<IconProps> = ({ className = "w-5 h-5", ...props } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

export const DeleteIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const UndoIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

export const RedoIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </svg>
);

export const ImportIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

export const ExportIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.001l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.367a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);

export const ResetIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 12c0 4.142-3.358 7.5-7.5 7.5s-7.5-3.358-7.5-7.5 3.358-7.5 7.5-7.5c2.31 0 4.39.99 5.86 2.75M19.5 5v5h-5" />
    </svg>
);

export const HelpIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const TableIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
    </svg>
);

export const TreeIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="5" rx="1" />
        <path d="M12 7v4" />
        <path d="M8 11h8" />
        <path d="M8 11v4" />
        <path d="M16 11v4" />
        <rect x="5" y="15" width="6" height="5" rx="1" />
        <rect x="13" y="15" width="6" height="5" rx="1" />
    </svg>
);

export const StatsIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className = "w-5 h-5 text-gray-400" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ className = "w-5 h-5 text-gray-500" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const ImageUploadIcon: React.FC<IconProps> = ({ className = "w-6 h-6" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} pointer-events-none`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const UserIcon: React.FC<IconProps> = ({ className = "w-6 h-6 text-gray-400" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const WavingHandIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.735L16.5 16.5m-3.375-3.375L11.25 16.5m2.25-6.375L11.25 7.5m2.25 2.25l2.25 2.25M5.25 6.375l3.375 3.375m-3.375 0L8.625 13.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const BeakerIcon: React.FC<IconProps> = ({ className = "w-5 h-5" } = {}) => (
   <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.037-.502.068-.752.098m.752-.098a2.25 2.25 0 012.25 2.25v4.5m-3-6.602c.429-.023.87-.034 1.32-.034s.891.011 1.32.034m-2.64 0a2.25 2.25 0 00-2.25 2.25v4.5m2.25-6.602l-.531 3.188a2.25 2.25 0 001.83 2.531l3.187.531m0 0c.429.072.87.127 1.32.168m1.32-.168a2.25 2.25 0 012.25 2.25v4.5m-2.25-6.602c-.429.023-.87.034-1.32.034s-.891-.011-1.32-.034m2.64 0l.531 3.188a2.25 2.25 0 01-1.83 2.531l-3.187-.531m0 0l-3.188.531a2.25 2.25 0 01-2.531-1.83l-.531-3.188m0 0a2.25 2.25 0 00-2.25-2.25v-4.5A2.25 2.25 0 005.25 6H10" />
   </svg>
);
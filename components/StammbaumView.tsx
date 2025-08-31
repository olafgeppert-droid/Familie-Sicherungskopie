import React from 'react';
import { useFamilyData } from '../hooks/useFamilyData';
import type { Person } from '../types';
import './StammbaumView.css';

export const StammbaumView: React.FC = () => {
    const { state, warnings } = useFamilyData();

    const buildTree = (parentId: string | null): Person[] => {
        return state.people.filter(p => p.parentId === parentId);
    };

    const renderPerson = (person: Person) => {
        const partner = state.people.find(p => p.id === person.partnerId);

        return (
            <li key={person.id}>
                <div className="person-node">
                    <div className="person-box">
                        <div className="person-name">{person.name}</div>
                        <div className="person-code">{person.code}</div>
                        {partner && (
                            <div className="partner-info">
                                ⟷ {partner.name} ({partner.code})
                            </div>
                        )}
                    </div>
                </div>
                <ul>
                    {buildTree(person.id).map(child => renderPerson(child))}
                </ul>
            </li>
        );
    };

    const roots = buildTree(null);

    return (
        <div className="stammbaum-container">
            {/* 🚨 Warnungsbox oben */}
            {warnings.length > 0 && (
                <div className="warning-box">
                    <h4>⚠️ Daten-Inkonsistenzen:</h4>
                    <ul>
                        {warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                        ))}
                    </ul>
                </div>
            )}

            <ul className="stammbaum-root">
                {roots.map(root => renderPerson(root))}
            </ul>
        </div>
    );
};

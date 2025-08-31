import React, { useMemo } from 'react';
import type { Person } from '../types';

interface StatisticsViewProps {
    people: Person[];
}

const getGeneration = (code: string): number => {
    if (!code) return 0;
    return code.replace(/x$/, '').length;
};

// FIX: Made the `value` prop optional and conditionally rendered the value paragraph.
const StatCard: React.FC<{ title: string; value?: React.ReactNode; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-500">{title}</h3>
        {value && <p className="mt-1 text-4xl font-semibold text-brand-primary">{value}</p>}
        {children}
    </div>
);

const Bar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm font-medium text-gray-500">{value} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="h-4 rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
            </div>
        </div>
    );
};

export const StatisticsView: React.FC<StatisticsViewProps> = ({ people }) => {
    const stats = useMemo(() => {
        const total = people.length;
        const genders = { m: 0, f: 0, d: 0 };
        const status = { living: 0, deceased: 0 };
        const ringBearers = { yes: 0, no: 0 };
        const generations: Record<number, number> = {};

        people.forEach(person => {
            // Gender
            genders[person.gender]++;
            
            // Status
            person.deathDate ? status.deceased++ : status.living++;
            
            // Ring Bearers
            person.hasRing ? ringBearers.yes++ : ringBearers.no++;

            // Generation
            const generation = getGeneration(person.code);
            if (generation > 0) {
                generations[generation] = (generations[generation] || 0) + 1;
            }
        });

        return { total, genders, status, ringBearers, generations };
    }, [people]);

    if (people.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg text-center text-gray-500 animate-fade-in">
                <p>Keine Personen erfasst. Fügen Sie Personen hinzu, um Statistiken anzuzeigen.</p>
            </div>
        );
    }

    const generationEntries = Object.entries(stats.generations).sort(([a], [b]) => parseInt(a) - parseInt(b));
    const maxGenerationCount = Math.max(...Object.values(stats.generations), 0);

    return (
        <div className="animate-fade-in">
             <h2 className="text-2xl font-bold mb-4 text-brand-primary">Statistiken</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Personen Gesamt" value={stats.total} />

                <StatCard title="Geschlechter">
                    <div className="mt-4 space-y-3">
                        <Bar label="Männlich" value={stats.genders.m} total={stats.total} color="#0D3B66" />
                        <Bar label="Weiblich" value={stats.genders.f} total={stats.total} color="#F4D35E" />
                        <Bar label="Divers" value={stats.genders.d} total={stats.total} color="#cccccc" />
                    </div>
                </StatCard>
                
                <StatCard title="Status">
                     <div className="mt-4 space-y-3">
                        <Bar label="Lebend" value={stats.status.living} total={stats.total} color="#4ade80" />
                        <Bar label="Verstorben" value={stats.status.deceased} total={stats.total} color="#f87171" />
                    </div>
                </StatCard>

                <StatCard title="Ringbesitzer">
                     <div className="mt-4 space-y-3">
                        <Bar label="Ja" value={stats.ringBearers.yes} total={stats.total} color="#facc15" />
                        <Bar label="Nein" value={stats.ringBearers.no} total={stats.total} color="#9ca3af" />
                    </div>
                </StatCard>

                <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-500 mb-4">Personen pro Generation</h3>
                    <div className="space-y-4">
                        {generationEntries.map(([gen, count]) => (
                             <div key={gen} className="w-full">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">Generation {gen}</span>
                                    <span className="text-sm font-medium text-gray-500">{count}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-5">
                                    <div className="bg-brand-primary h-5 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${maxGenerationCount > 0 ? (count / maxGenerationCount) * 100 : 0}%` }}>
                                        {count}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

             </div>
        </div>
    );
};
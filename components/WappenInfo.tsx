// src/components/WappenInfo.tsx
import React from 'react';

interface WappenInfoProps {
    onShowDatabase: () => void;
}

const DropCap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="float-left text-5xl font-bold text-red-600 mr-2 font-gothic">
        {children}
    </span>
);

export const WappenInfo: React.FC<WappenInfoProps> = ({ onShowDatabase }) => {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* 🔹 Hintergrund mit transparenten Wappen */}
            <div
                className="absolute inset-0 opacity-80"
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL + "wappen.png"})`,
                    backgroundSize: "auto 250px",
                    backgroundRepeat: "repeat",
                    backgroundPosition: "top left"
                }}
            />
            
            {/* Inhalt */}
            <div className="relative w-full max-w-4xl animate-fade-in">
                <div className="w-full max-w-sm mx-auto text-center mb-6">
                    <button 
                        onClick={onShowDatabase} 
                        className="w-full bg-brand-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-105"
                    >
                        ZUR DATENBANK
                    </button>
                </div>
                <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl shadow-2xl">
                    <div className="bg-[#FDF5E6] p-8 sm:p-12 rounded-lg font-serif text-lg text-stone-800 leading-relaxed">
                        <h2 className="text-4xl font-bold text-center text-brand-dark mb-4 font-gothic">
                            Blasonierung zum Wappen der Familie Geppert
                        </h2>
                        <p className="text-center mb-8">
                            In Blau ein silberner Leistenschragen, überdeckt von einem goldenen Steigbügel. Auf dem blau-golden bewulsteten Helm mit blau-goldenen Decken eine liegende goldene Mondsichel. Deren Höhlung zu einem Kreuzchen ausgezogen und die Spitzen mit je einem silbernen Stern besteckt.
                        </p>

                        <h2 className="text-4xl font-bold text-center text-brand-dark mt-12 mb-4 font-gothic">
                            Sinndeutung
                        </h2>
                        
                        <div className="space-y-6 text-justify">
                            <p>
                                <DropCap>D</DropCap>ie beiden sechsstrahligen Sterne auf der Helmzier repräsentieren Vater sowie Mutter der wappenführenden Person aus der Familie Geppert und fungieren zugleich als glückbringende Symbole für den Wappenführer.
                            </p>
                            <p>
                                 <DropCap>D</DropCap>er Halbmond mit Innenkreuz als Helmzier eines Stechhelms erinnert an die Brustzier des niederschlesischen Adlers und somit an die Stammheimat der Familie.
                            </p>
                            <p>
                                 <DropCap>D</DropCap>as silberne Schrägkreuz X im Schild trägt in der germanischen Runenschrift den Lautwert „<span className="font-semibold">G</span>“ und steht somit als Initial des Familiennamens <span className="text-xl">G</span>eppert.
                            </p>
                            <p>
                                 <DropCap>D</DropCap>er goldene Steigbügel - hier in einer alten Form - symbolisiert die Pferde- und Reitertradition der Ahnen im Mannesstamm auf eigenem Gutshof in Schlesien.
                            </p>
                            <p>
                                 <DropCap>D</DropCap>ie früher wertvolle Farbe Blau innerhalb des Wappens assoziiert der Stifter mit einer Farbsymbolik für die Begriffe Freiheit, Harmonie, Hoffnung, Treue, Unabhängigkeit, Verstand und Vertrauen.
                            </p>
                            <p>
                                 <DropCap>D</DropCap>ie Devise unterhalb des Wappens lautet „Memento Radicum Tuarum“, lateinisch für „Erinnere dich an deine Wurzeln“. Der Wahlspruch fordert die Familienmitglieder auf, sich ihre Familienwurzeln zu vergegenwärtigen und zusammenzuhalten, wo immer ihr Lebensweg sie hinträgt.
                            </p>
                        </div>

                        <p className="text-center mt-12 italic text-gray-600">
                            Im April Anno Domini 2024, Olaf <span className="text-xl">G</span>eppert
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

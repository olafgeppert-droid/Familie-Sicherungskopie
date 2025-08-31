// src/components/WelcomeScreen.tsx
import React, { useState } from 'react';

// 🔐 Passwort jetzt aus .env laden
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD as string;

interface WelcomeScreenProps {
    onShowDatabase: () => void;
    onShowInfo: () => void;
    version: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onShowDatabase, onShowInfo, version }) => {
    const [showLogin, setShowLogin] = useState<null | "info" | "database">(null);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = () => {
        if (password === CORRECT_PASSWORD) {
            if (showLogin === "info") {
                onShowInfo();
            } else if (showLogin === "database") {
                onShowDatabase();
            }
            setPassword("");
            setError("");
            setShowLogin(null);
        } else {
            setError("❌ Falsches Passwort!");
        }
    };

    return (
        <div 
            className="min-h-screen w-full flex items-center justify-center p-4"
            style={{
                backgroundImage: `url(${import.meta.env.BASE_URL + "wappen.png"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}
        >
            <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 max-w-4xl w-full text-center animate-fade-in border-4 border-yellow-300 relative">
                <img
                    src={import.meta.env.BASE_URL + "wappen.png"}
                    alt="Familienwappen"
                    className="mx-auto h-auto w-40 rounded-full border-4 border-white shadow-lg -mt-28 mb-4 drop-shadow-lg"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
                    Willkommen im Datenbankprogramm zur Verwaltung der Wappenringe der Familie GEPPERT
                </h1>
                <p className="text-gray-500 mb-2">Softwareversion v{version}</p>
                <p className="text-gray-500 mb-6">Copyright by Olaf Geppert</p>
                
                <div className="text-sm text-gray-800 text-justify bg-gray-200 p-4 rounded-lg border border-gray-300 mb-8">
                    Dieses Programm dient der Dokumentation der ausgegeben Wappenringe der Familie. Es ermittelt automatisch die korrekte Innengravur eines Ringes in Abhängigkeit der Abstammungslinie, unabhängig davon, ob er neu angeschafft oder vererbt wurde. Ziel ist es, die Historie der Ringe für folgende Generationen nachvollziehbar zu machen. Dieses Programm ersetzt keine Familienchronik oder genealogische Stammbaum Dokumentation.
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                        onClick={() => setShowLogin("info")} 
                        className="bg-brand-accent text-brand-dark font-bold py-3 px-8 rounded-full shadow-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105"
                    >
                        WAPPEN-INFO ANZEIGEN
                    </button>
                    <button 
                        onClick={() => setShowLogin("database")} 
                        className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-105"
                    >
                        ZUR DATENBANK
                    </button>
                </div>
            </div>

            {/* 🔐 Login-Dialog */}
            {showLogin && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-lg p-6 w-80">
                        <h2 className="text-xl font-bold mb-4">🔐 Passwort erforderlich</h2>
                        <input
                            type="password"
                            placeholder="Passwort eingeben"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border rounded-lg p-2 w-full mb-2"
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end gap-2 mt-3">
                            <button
                                onClick={() => { setShowLogin(null); setPassword(""); setError(""); }}
                                className="px-3 py-1 bg-gray-300 rounded-lg"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleLogin}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

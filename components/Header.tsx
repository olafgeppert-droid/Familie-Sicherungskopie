// src/components/Header.tsx
import React from "react";

interface HeaderProps {
  onShowWelcome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowWelcome }) => {
  return (
    <header className="bg-brand-primary text-white py-6 px-4 flex flex-col items-center shadow-lg relative">
      <div className="flex items-center justify-center gap-6">
        {/* Linkes Wappen */}
        <img
          src={import.meta.env.BASE_URL + "wappen.png"}
          alt="Familienwappen links"
          className="h-20 w-auto object-contain drop-shadow-lg"
        />
        
        {/* Überschrift */}
        <h1
          className="text-3xl sm:text-4xl font-bold cursor-pointer text-center"
          onClick={onShowWelcome}
        >
          Wappenringe der Familie GEPPERT
        </h1>

        {/* Rechtes Wappen */}
        <img
          src={import.meta.env.BASE_URL + "wappen.png"}
          alt="Familienwappen rechts"
          className="h-20 w-auto object-contain drop-shadow-lg"
        />
      </div>
    </header>
  );
};

// src/components/WelcomeScreen.tsx
import React from "react";
import wappen from "../assets/wappen.png";

interface WelcomeScreenProps {
  onEnter: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: `url(${wappen})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="bg-white bg-opacity-80 rounded-2xl shadow-lg p-10 text-center">
        <h1 className="text-3xl font-bold mb-6">Willkommen zur Familienchronik</h1>
        <button
          onClick={onEnter}
          className="px-6 py-3 bg-blue-600 text-white text-lg rounded-xl shadow hover:bg-blue-700"
        >
          Enter
        </button>
      </div>
    </div>
  );
};

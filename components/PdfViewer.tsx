
import React from 'react';

interface PdfViewerProps {
    onShowDatabase: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ onShowDatabase }) => {
    const pdfPath = "/Wappen_Geppert_Info.pdf"; // Please ensure this PDF file exists in your public folder.

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600 p-4">
            <div className="w-full max-w-4xl animate-fade-in">
                <div className="w-full max-w-sm mx-auto text-center mb-6">
                    <button onClick={onShowDatabase} className="w-full bg-brand-accent text-brand-dark font-bold py-3 px-8 rounded-full shadow-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105">
                        ZUR DATENBANK
                    </button>
                </div>
                <div className="bg-[#FDF5E6] p-4 sm:p-6 rounded-lg shadow-2xl border-2 border-yellow-200">
                    <div className="flex justify-between items-center bg-gray-200 p-2 rounded-t-md text-sm text-gray-700">
                        <button className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            &larr; Vorherige
                        </button>
                        <span>Seite 1/1</span>
                        <button className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Nächste &rarr;
                        </button>
                    </div>
                    <div className="w-full h-[70vh] bg-white border-t border-gray-300">
                         {/* Using <embed> for broad compatibility with browser PDF plugins. */}
                        <embed 
                            src={pdfPath} 
                            type="application/pdf" 
                            className="w-full h-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

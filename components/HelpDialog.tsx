import React from 'react';
import { CloseIcon } from './Icons';

interface HelpDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const sections = [
        {
            emoji: "👋",
            title: "Willkommen & Grundkonzept",
            content: [
                "Diese Anwendung hilft dir, die Wappenringe der Familie GEPPERT zu verwalten und ihre Geschichte nachzuverfolgen, sowie die korrekte Innengravur des Ringes zu bestimmen.",
                "<strong>Das Ziel:</strong> Die Historie der Ringe für kommende Generationen nachvollziehbar zu machen.",
                "Alle Daten werden <strong>lokal in deinem Browser</strong> gespeichert. Mache regelmäßige Backups mit der Export-Funktion! 🛡️",
            ]
        },
        {
            emoji: "👀",
            title: "Die Ansichten im Überblick",
            content: [
                "<strong>📊 Tabelle:</strong> Die Hauptansicht. Hier siehst du alle Personen in einer sortierbaren und durchsuchbaren Liste. Ideal für den schnellen Überblick.",
                "<strong>🌳 Stammbaum:</strong> Visualisiert die Familienbeziehungen. Klicke auf eine Person, um sie zu bearbeiten. Perfekt, um Abstammungslinien zu verfolgen.",
                "<strong>📈 Statistik:</strong> Zeigt interessante Auswertungen an, z.B. die Verteilung der Geschlechter, die Anzahl der Personen pro Generation oder den Anteil der eingegebenen Personen, die einen Familienwappen-Ring besitzen.",
                "<strong>📱 Handy:</strong> Auf einem Handy oder ähnlich kleinem Bildschirm kann es hilfreich sein, den Zoomfaktor des Browsers auf 50–75% zu stellen."
            ]
        },
        {
            emoji: "✍️",
            title: "Personen verwalten",
            content: [
                "<strong>➕ Neue Person:</strong> Füge über die Schaltfläche eine neue Person hinzu. Wähle zuerst den Beziehungstyp (Kind oder Partner).",
                "<strong>✏️ Bearbeiten:</strong> Doppelklicke auf eine Person in der Tabelle oder klicke auf einen Knoten im Stammbaum, um den Bearbeitungsdialog zu öffnen.",
                "<strong>🗑️ Löschen:</strong> Im Bearbeitungsdialog findest du die Schaltfläche zum Löschen einer Person. Sei vorsichtig, dies kann nicht einfach rückgängig gemacht werden!",
                "<strong>🔎 Suchen & Finden:</strong> Nutze das Suchfeld, um die Tabelle zu filtern. Oder verwende 'Ändern/Löschen', um direkt nach einer Person zu suchen und sie zu bearbeiten."
            ]
        },
        {
            emoji: "🧬",
            title: "Das Code-System verstehen",
            content: [
                "Jede Person erhält einen einzigartigen, automatisch generierten Code. Dies ist das Herzstück der Ring-Verfolgung!",
                "<strong>Stammvater/mutter:</strong> Beginnt immer mit Code <code>1</code>.",
                "<strong>Partner/in:</strong> Erhält den Code des Partners mit einem <code>x</code> am Ende (z.B. <code>1x</code>).",
                "<strong>Kinder (2. Gen):</strong> Werden alphabetisch angehängt (<code>1A</code>, <code>1B</code>, ...), sortiert nach Geburtsdatum.",
                "<strong>Weitere Generationen:</strong> Werden numerisch angehängt (z.B. Kind von <code>1A</code> ist <code>1A1</code>), ebenfalls nach Geburtsdatum sortiert.",
                "Das System sortiert Geschwister automatisch neu, wenn du ein Kind mit einem früheren Geburtsdatum hinzufügst. Magie! ✨"
            ]
        },
        {
            emoji: "💍",
            title: "Ring-Codes & Vererbung",
            content: [
                "<strong>Ring-Code:</strong> Zeigt an, wer den Ring aktuell besitzt. Standardmäßig ist es der Personen-Code.",
                "<strong>Vererbung:</strong> Wenn ein Ring vererbt wird, trage den Code des Vererbenden in das Feld 'Ring geerbt von' ein. Das Programm erstellt dann automatisch eine Historie (z.B. <code>1A → 1A1</code>).",
                "<strong><span style=\"text-shadow: 0 0 3px gold;\">💍</span> Ringbesitzer:</strong> Setze im Bearbeitungsdialog das Häkchen bei 'Wappenringbesitzer?', um zu markieren, dass eine Person einen Ring besitzt. Das Ring-Symbol erscheint dann in der Tabelle und im Stammbaum.",
                "Dies stellt sicher, dass der Weg jedes einzelnen Rings nachvollziehbar bleibt.",
                "<span style='color:red;'>❗</span> <strong>Der Ring-Code, den das Programm errechnet, ist exakt die Gravur, die im Ring der Person eingraviert werden muss, um der Logik zu entsprechen.</strong>"
            ]
        },
        {
            emoji: "💾",
            title: "Daten sichern & verwalten",
            content: [
                "<strong>📥 Import / 📤 Export:</strong> Sichere deine Daten als JSON- oder CSV-Datei. Lade eine Sicherung, um deinen Arbeitsstand wiederherzustellen.",
                "<strong>🖨️ Drucken:</strong> Drucke die aktuelle Ansicht (Tabelle oder Stammbaum) in einem sauberen Format. Für eine bessere Übersicht kann es helfen, die Browser-Zoomstufe anzupassen.",
                "<strong>↩️ Undo / Redo ↪️:</strong> Verklickt? Kein Problem! Mache deine letzte Aktion rückgängig oder wiederhole sie.",
                "<strong>🧪 Beispieldaten laden:</strong> In den Einstellungen kannst du einen Satz Beispieldaten laden, um die Programmfunktionen zu testen. <strong>⚠️ Achtung:</strong> Diese Aktion <strong>überschreibt deine gesamte aktuelle Datenbank!</strong> Sichere unbedingt deine eigenen Daten vorher über die Export-Funktion.",
                "<strong>⚙️ Einstellungen:</strong> Passe die Farben der Anwendung an oder setze alle Daten zurück (Vorsicht!)."
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 animate-fade-in">
                 <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-brand-primary">Hilfe & Informationen</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {sections.map(section => {
                        const isRingEmoji = section.emoji === '💍';
                        return (
                        <div key={section.title} className="mb-8">
                            <h3 className="text-xl font-semibold text-brand-primary mb-3 flex items-center">
                                <span className="text-2xl mr-3" style={isRingEmoji ? { textShadow: '0 0 3px gold' } : {}}>
                                    {section.emoji}
                                </span>
                                {section.title}
                            </h3>
                            <ul className="list-none space-y-2 text-gray-700 pl-10 border-l-2 border-brand-primary/10 ml-4">
                                {section.content.map((item, index) => (
                                    <li key={index} className="relative before:content-['•'] before:absolute before:-left-5 before:text-brand-primary before:font-bold" dangerouslySetInnerHTML={{ __html: item }} />
                                ))}
                            </ul>
                        </div>
                        );
                    })}
                </div>
                 <div className="flex justify-end p-4 border-t bg-gray-50 sticky bottom-0">
                    <button onClick={onClose} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors font-semibold">
                        Verstanden!
                    </button>
                </div>
            </div>
        </div>
    );
};

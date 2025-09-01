// src/services/validateData.ts

import { Person } from '../types';
import { getGeneration, generatePersonCode } from './familyTreeService';

export type ValidationError = {
  personId: string;
  message: string;
  severity: 'error' | 'warning';
  fix?: () => void; // Automatische Reparaturfunktion
};

/**
 * Konsistenzprüfung aller Personen.
 * Blockiert Speichern/Import, solange Fehler vorhanden sind.
 * Liefert Liste von Fehlern inkl. optionaler Reparaturvorschläge.
 */
export function validateData(people: Person[]): ValidationError[] {
  const errors: ValidationError[] = [];

  people.forEach(p => {
    // 1. Partnerprüfung
    if (p.partnerId) {
      const partner = people.find(pp => pp.id === p.partnerId);
      if (!partner) {
        errors.push({
          personId: p.id,
          message: `Partner von ${p.name} (${p.code}) nicht gefunden.`,
          severity: 'error',
          fix: () => { p.partnerId = undefined; }
        });
      } else if (partner.partnerId !== p.id) {
        errors.push({
          personId: p.id,
          message: `Partnerbeziehung zwischen ${p.name} und ${partner.name} ist nicht wechselseitig.`,
          severity: 'error',
          fix: () => { partner.partnerId = p.id; }
        });
      }
    }

    // 2. Codeprüfung (passt Code zur Elternstruktur?)
    if (p.parentId) {
      const parent = people.find(pp => pp.id === p.parentId);
      if (parent && !p.code.startsWith(parent.code)) {
        errors.push({
          personId: p.id,
          message: `Code ${p.code} passt nicht zu Elternteil ${parent.code}.`,
          severity: 'error',
          fix: () => { p.code = generatePersonCode(p, people); }
        });
      }
    } else if (p.code !== '1' && !p.code.endsWith('x')) {
      // Nur Stammeltern dürfen den Code "1" haben
      errors.push({
        personId: p.id,
        message: `Person ${p.name} hat keinen Elternteil, aber Code ${p.code}.`,
        severity: 'error',
      });
    }

    // 3. Generation prüfen
    const gen = getGeneration(p.code);
    if (p.generation !== gen) {
      errors.push({
        personId: p.id,
        message: `Generation von ${p.name} ist ${p.generation}, sollte aber ${gen} sein.`,
        severity: 'error',
        fix: () => { p.generation = gen; }
      });
    }

    // 4. Ringprüfung (optional, falls Ring-Logik vorhanden)
    if (p.ringId) {
      const duplicates = people.filter(pp => pp.ringId === p.ringId);
      if (duplicates.length > 1 && !p.isRingHolder) {
        errors.push({
          personId: p.id,
          message: `Ring ${p.ringId} mehrfach vergeben (z.B. bei ${duplicates[0].name}).`,
          severity: 'error',
          fix: () => { p.ringId = undefined; }
        });
      }
    }
  });

  return errors;
}

/**
 * Wendet alle verfügbaren automatischen Reparaturen auf die Daten an.
 * Gibt true zurück, wenn mindestens eine Reparatur durchgeführt wurde.
 */
export function autoFixData(people: Person[]): boolean {
  const errors = validateData(people);
  let fixed = false;

  errors.forEach(err => {
    if (err.fix) {
      err.fix();
      fixed = true;
    }
  });

  return fixed;
}

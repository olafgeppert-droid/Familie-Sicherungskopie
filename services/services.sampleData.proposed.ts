// services/sampleData.ts
// Vollständige Beispieldaten "Geppert" – kompatibel zu hooks/useFamilyData (export: samplePeople)
import type { Person } from '../types';

export const samplePeople: Person[] = [
  // ─────────────────────────────
  // Generation 1 – Stammeltern
  // ─────────────────────────────
  {
    id: 'p1',
    code: '1',
    name: 'Wilhelm Geppert',
    gender: 'm',
    birthDate: '1930-04-18',
    birthPlace: 'Berlin',
    deathDate: '2012-03-10',
    parentId: null,
    partnerId: 'p2',
    hasRing: false,
    ringCode: '1'
  },
  {
    id: 'p2',
    code: '1x',
    name: 'Marta Schulz-Geppert',
    gender: 'f',
    birthDate: '1932-09-07',
    birthPlace: 'Leipzig',
    deathDate: '2018-01-26',
    parentId: null,
    partnerId: 'p1',
    hasRing: false,
    ringCode: '1x'
  },

  // ─────────────────────────────
  // Generation 2 – Kinder (A…)
  // ─────────────────────────────
  // Reihenfolge nach Geburtsdatum: 1A (ältestes), 1B, 1C, 1D
  {
    id: 'p3',
    code: '1A',
    name: 'Heinrich Geppert',
    gender: 'm',
    birthDate: '1955-02-11',
    birthPlace: 'Hamburg',
    parentId: 'p1',
    partnerId: 'p4',
    hasRing: false,
    ringCode: '1A'
  },
  {
    id: 'p4',
    code: '1Ax',
    name: 'Eva Müller-Geppert',
    gender: 'f',
    birthDate: '1956-06-30',
    birthPlace: 'Bonn',
    parentId: null,
    partnerId: 'p3',
    hasRing: false,
    ringCode: '1Ax'
  },

  {
    id: 'p5',
    code: '1B',
    name: 'Liselotte Geppert',
    gender: 'f',
    birthDate: '1957-10-21',
    birthPlace: 'Köln',
    parentId: 'p1',
    partnerId: 'p6',
    hasRing: false,
    ringCode: '1B'
  },
  {
    id: 'p6',
    code: '1Bx',
    name: 'Fritz Wagner-Geppert',
    gender: 'm',
    birthDate: '1956-01-13',
    birthPlace: 'Düsseldorf',
    parentId: null,
    partnerId: 'p5',
    hasRing: false,
    ringCode: '1Bx'
  },

  {
    id: 'p7',
    code: '1C',
    name: 'Otto Geppert',
    gender: 'm',
    birthDate: '1959-07-03',
    birthPlace: 'München',
    parentId: 'p1',
    partnerId: 'p8',
    hasRing: false,
    ringCode: '1C'
  },
  {
    id: 'p8',
    code: '1Cx',
    name: 'Ingrid Becker-Geppert',
    gender: 'f',
    birthDate: '1960-03-28',
    birthPlace: 'Augsburg',
    parentId: null,
    partnerId: 'p7',
    hasRing: false,
    ringCode: '1Cx'
  },

  {
    id: 'p9',
    code: '1D',
    name: 'Ruth Geppert',
    gender: 'f',
    birthDate: '1961-12-17',
    birthPlace: 'Stuttgart',
    parentId: 'p1',
    partnerId: 'p10',
    hasRing: false,
    ringCode: '1D'
  },
  {
    id: 'p10',
    code: '1Dx',
    name: 'Karl-Heinz Meyer-Geppert',
    gender: 'm',
    birthDate: '1960-08-09',
    birthPlace: 'Nürnberg',
    parentId: null,
    partnerId: 'p9',
    hasRing: false,
    ringCode: '1Dx'
  },

  // ─────────────────────────────
  // Generation 3 – Enkel (…1, …2 …)
  // ─────────────────────────────

  // Kinder von 1A
  {
    id: 'p11',
    code: '1A1',
    name: 'Thomas Geppert',
    gender: 'm',
    birthDate: '1979-01-14',
    birthPlace: 'Hamburg',
    parentId: 'p3',
    partnerId: 'p12',
    hasRing: false,
    ringCode: '1A1'
  },
  {
    id: 'p12',
    code: '1A1x',
    name: 'Sabine Schulz-Geppert',
    gender: 'f',
    birthDate: '1980-10-02',
    birthPlace: 'Bremen',
    parentId: null,
    partnerId: 'p11',
    hasRing: false,
    ringCode: '1A1x'
  },
  {
    id: 'p13',
    code: '1A2',
    name: 'Julia Geppert',
    gender: 'f',
    birthDate: '1981-04-06',
    birthPlace: 'Kiel',
    parentId: 'p3',
    partnerId: 'p14',
    hasRing: false,
    ringCode: '1A2'
  },
  {
    id: 'p14',
    code: '1A2x',
    name: 'Michael Weber-Geppert',
    gender: 'm',
    birthDate: '1978-07-20',
    birthPlace: 'Flensburg',
    parentId: null,
    partnerId: 'p13',
    hasRing: false,
    ringCode: '1A2x'
  },

  // Kinder von 1B
  {
    id: 'p15',
    code: '1B1',
    name: 'Andreas Geppert',
    gender: 'm',
    birthDate: '1978-03-10',
    birthPlace: 'Frankfurt am Main',
    parentId: 'p5',
    partnerId: 'p16',
    hasRing: false,
    ringCode: '1B1'
  },
  {
    id: 'p16',
    code: '1B1x',
    name: 'Katrin Müller-Geppert',
    gender: 'f',
    birthDate: '1980-01-27',
    birthPlace: 'Wiesbaden',
    parentId: null,
    partnerId: 'p15',
    hasRing: false,
    ringCode: '1B1x'
  },
  {
    id: 'p17',
    code: '1B2',
    name: 'Heike Geppert',
    gender: 'f',
    birthDate: '1982-08-24',
    birthPlace: 'Mainz',
    parentId: 'p5',
    partnerId: 'p18',
    hasRing: false,
    ringCode: '1B2'
  },
  {
    id: 'p18',
    code: '1B2x',
    name: 'Matthias Becker-Geppert',
    gender: 'm',
    birthDate: '1981-12-02',
    birthPlace: 'Darmstadt',
    parentId: null,
    partnerId: 'p17',
    hasRing: false,
    ringCode: '1B2x'
  },

  // Kinder von 1C
  {
    id: 'p19',
    code: '1C1',
    name: 'Peter Geppert',
    gender: 'm',
    birthDate: '1983-11-11',
    birthPlace: 'München',
    parentId: 'p7',
    partnerId: 'p20',
    hasRing: false,
    ringCode: '1C1'
  },
  {
    id: 'p20',
    code: '1C2',
    name: 'Claudia Geppert',
    gender: 'f',
    birthDate: '1985-03-08',
    birthPlace: 'Regensburg',
    parentId: 'p7',
    partnerId: 'p21',
    hasRing: false,
    // Erbt direkt vom Stammträger "1"
    inheritedFrom: '1',
    ringCode: '1 → 1C2'
  },
  {
    id: 'p21',
    code: '1C2x',
    name: 'Andreas Meyer-Geppert',
    gender: 'm',
    birthDate: '1984-10-29',
    birthPlace: 'Ingolstadt',
    parentId: null,
    partnerId: 'p20',
    hasRing: false,
    ringCode: '1C2x'
  },

  // Kind von 1D
  {
    id: 'p22',
    code: '1D1',
    name: 'Christian Geppert',
    gender: 'm',
    birthDate: '1984-05-30',
    birthPlace: 'Stuttgart',
    parentId: 'p9',
    partnerId: 'p23',
    hasRing: false,
    ringCode: '1D1'
  },
  {
    id: 'p23',
    code: '1D1x',
    name: 'Birgit Schneider-Geppert',
    gender: 'f',
    birthDate: '1985-02-19',
    birthPlace: 'Heilbronn',
    parentId: null,
    partnerId: 'p22',
    hasRing: false,
    ringCode: '1D1x'
  },

  // ─────────────────────────────
  // Generation 4 – Urenkel
  // ─────────────────────────────

  // Kinder von 1A1
  {
    id: 'p24',
    code: '1A11',
    name: 'Lukas Geppert',
    gender: 'm',
    birthDate: '2004-02-14',
    birthPlace: 'Hamburg',
    parentId: 'p11',
    partnerId: 'p25',
    hasRing: false,
    ringCode: '1A11'
  },
  {
    id: 'p25',
    code: '1A11x',
    name: 'Lea Schulz-Geppert',
    gender: 'f',
    birthDate: '2005-11-05',
    birthPlace: 'Hamburg',
    parentId: null,
    partnerId: 'p24',
    hasRing: false,
    ringCode: '1A11x'
  },
  {
    id: 'p26',
    code: '1A12',
    name: 'Mara Geppert',
    gender: 'f',
    birthDate: '2006-07-12',
    birthPlace: 'Hamburg',
    parentId: 'p11',
    partnerId: null,
    hasRing: false,
    ringCode: '1A12'
  },

  // Kinder von 1B2
  {
    id: 'p27',
    code: '1B21',
    name: 'David Geppert',
    gender: 'm',
    birthDate: '2008-03-20',
    birthPlace: 'Frankfurt am Main',
    parentId: 'p17',
    partnerId: null,
    hasRing: false,
    ringCode: '1B21'
  },

  // Kinder von 1C2
  {
    id: 'p28',
    code: '1C21',
    name: 'Clara Geppert',
    gender: 'f',
    birthDate: '2007-07-12',
    birthPlace: 'München',
    parentId: 'p20',
    partnerId: null,
    // Ring wandert weiter von 1C2 → 1C21
    inheritedFrom: '1C2',
    hasRing: true, // aktuelle Ringträgerin
    ringCode: '1 → 1C2 → 1C21'
  },
  {
    id: 'p29',
    code: '1C22',
    name: 'Jonas Geppert',
    gender: 'm',
    birthDate: '2009-05-16',
    birthPlace: 'München',
    parentId: 'p20',
    partnerId: null,
    hasRing: false,
    ringCode: '1C22'
  },

  // Kinder von 1D1
  {
    id: 'p30',
    code: '1D11',
    name: 'Sophie Geppert',
    gender: 'f',
    birthDate: '2006-12-20',
    birthPlace: 'Stuttgart',
    parentId: 'p22',
    partnerId: null,
    hasRing: false,
    ringCode: '1D11'
  },

  // ─────────────────────────────
  // Generation 5
  // ─────────────────────────────

  // Kind von 1A11
  {
    id: 'p31',
    code: '1A111',
    name: 'Emil Geppert',
    gender: 'm',
    birthDate: '2026-03-02',
    birthPlace: 'Hamburg',
    parentId: 'p24',
    partnerId: null,
    hasRing: false,
    ringCode: '1A111'
  },

  // ─────────────────────────────
  // Generation 6
  // ─────────────────────────────

  // Kind von 1A111 (Datum fiktiv)
  {
    id: 'p32',
    code: '1A1111',
    name: 'Nora Geppert',
    gender: 'f',
    birthDate: '2050-05-18',
    birthPlace: 'Hamburg',
    parentId: 'p31',
    partnerId: null,
    hasRing: false,
    ringCode: '1A1111'
  }
];

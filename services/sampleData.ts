// src/services/sampleData.ts

import { Person } from '../types';

export const samplePeople: Person[] = [
  // ─────────────────────────────
  // Generation 1 – Stammeltern
  // ─────────────────────────────
  { id: 'p1',  code: '1',  name: 'Wilhelm Geppert', gender: 'm', birthDate: '1930-04-18', birthPlace: 'Berlin',    deathDate: '2012-03-10', parentId: null, partnerId: 'p2', hasRing: false, ringCode: 'R01' },
  { id: 'p2',  code: '1x', name: 'Marta Schulz-Geppert', gender: 'f', birthDate: '1932-09-07', birthPlace: 'Leipzig', deathDate: '2018-01-26', parentId: null, partnerId: 'p1', hasRing: true,  ringCode: 'R11' },

  // ─────────────────────────────
  // Generation 2 – Kinder (1A–1E) + Partner
  // ─────────────────────────────
  { id: 'p3',  code: '1A',  name: 'Heinrich Geppert', gender: 'm', birthDate: '1954-02-11', birthPlace: 'Hamburg', parentId: 'p1', partnerId: 'p4', hasRing: false, ringCode: 'R02' },
  { id: 'p4',  code: '1Ax', name: 'Eva Müller-Geppert', gender: 'f', birthDate: '1956-06-30', birthPlace: 'Bonn',   parentId: null, partnerId: 'p3', hasRing: true,  ringCode: 'R12' },

  { id: 'p5',  code: '1B',  name: 'Liselotte Geppert', gender: 'f', birthDate: '1952-10-21', birthPlace: 'Köln',   parentId: 'p1', partnerId: 'p6', hasRing: false, ringCode: 'R03' },
  { id: 'p6',  code: '1Bx', name: 'Fritz Wagner-Geppert', gender: 'm', birthDate: '1951-01-13', birthPlace: 'Düsseldorf', parentId: null, partnerId: 'p5', hasRing: true,  ringCode: 'R13' },

  { id: 'p7',  code: '1C',  name: 'Otto Geppert', gender: 'm', birthDate: '1957-07-03', birthPlace: 'München', parentId: 'p1', partnerId: 'p8', hasRing: false, ringCode: 'R04' },
  { id: 'p8',  code: '1Cx', name: 'Ingrid Becker-Geppert', gender: 'f', birthDate: '1959-03-28', birthPlace: 'Augsburg', parentId: null, partnerId: 'p7', hasRing: true,  ringCode: 'R14' },

  { id: 'p9',  code: '1D',  name: 'Ruth Geppert', gender: 'f', birthDate: '1955-12-17', birthPlace: 'Stuttgart', parentId: 'p1', partnerId: 'p10', hasRing: false, ringCode: 'R05' },
  { id: 'p10', code: '1Dx', name: 'Karl-Heinz Meyer-Geppert', gender: 'm', birthDate: '1954-08-09', birthPlace: 'Nürnberg', parentId: null, partnerId: 'p9', hasRing: true,  ringCode: 'R15' },

  { id: 'p11', code: '1E',  name: 'Gerhard Geppert', gender: 'm', birthDate: '1960-05-05', birthPlace: 'Hannover', parentId: 'p1', partnerId: 'p12', hasRing: false, ringCode: 'R06' },
  { id: 'p12', code: '1Ex', name: 'Ute Hoffmann-Geppert', gender: 'f', birthDate: '1961-11-23', birthPlace: 'Mainz', parentId: null, partnerId: 'p11', hasRing: true,  ringCode: 'R16' },

  // ─────────────────────────────
  // Generation 3 – Enkel (je 3 Kinder pro Linie) + Partner
  // 1A-Kinder
  { id: 'p13', code: '1A1',  name: 'Thomas Geppert', gender: 'm', birthDate: '1979-01-14', birthPlace: 'Hamburg', parentId: 'p3', partnerId: 'p14', hasRing: true,  ringCode: 'R01', inheritedFrom: '1' },
  { id: 'p14', code: '1A1x', name: 'Sabine Schulz-Geppert', gender: 'f', birthDate: '1980-10-02', birthPlace: 'Bremen', parentId: null, partnerId: 'p13', hasRing: true, ringCode: 'R17' },

  { id: 'p15', code: '1A2',  name: 'Julia Geppert', gender: 'f', birthDate: '1981-04-06', birthPlace: 'Kiel', parentId: 'p3', partnerId: 'p16', hasRing: false, ringCode: 'R07' },
  { id: 'p16', code: '1A2x', name: 'Michael Weber-Geppert', gender: 'm', birthDate: '1978-07-20', birthPlace: 'Flensburg', parentId: null, partnerId: 'p15', hasRing: true, ringCode: 'R18' },

  { id: 'p17', code: '1A3',  name: 'Markus Geppert', gender: 'm', birthDate: '1983-02-18', birthPlace: 'Lübeck', parentId: 'p3', partnerId: 'p18', hasRing: true, ringCode: 'R19' },
  { id: 'p18', code: '1A3x', name: 'Daniela Hoffmann-Geppert', gender: 'f', birthDate: '1984-06-12', birthPlace: 'Potsdam', parentId: null, partnerId: 'p17', hasRing: true, ringCode: 'R20' },

  // 1B-Kinder
  { id: 'p19', code: '1B1',  name: 'Martina Geppert', gender: 'f', birthDate: '1976-05-01', birthPlace: 'Köln', parentId: 'p5', partnerId: 'p20', hasRing: false, ringCode: 'R08' },
  { id: 'p20', code: '1B1x', name: 'Stefan Wagner-Geppert', gender: 'm', birthDate: '1975-09-16', birthPlace: 'Düsseldorf', parentId: null, partnerId: 'p19', hasRing: true, ringCode: 'R21' },

  { id: 'p21', code: '1B2',  name: 'Andreas Geppert', gender: 'm', birthDate: '1978-03-10', birthPlace: 'Frankfurt am Main', parentId: 'p5', partnerId: 'p22', hasRing: true, ringCode: 'R03', inheritedFrom: '1B' },
  { id: 'p22', code: '1B2x', name: 'Katrin Müller-Geppert', gender: 'f', birthDate: '1980-01-27', birthPlace: 'Wiesbaden', parentId: null, partnerId: 'p21', hasRing: true, ringCode: 'R22' },

  { id: 'p23', code: '1B3',  name: 'Heike Geppert', gender: 'f', birthDate: '1982-08-24', birthPlace: 'Mainz', parentId: 'p5', partnerId: 'p24', hasRing: true, ringCode: 'R23' },
  { id: 'p24', code: '1B3x', name: 'Matthias Becker-Geppert', gender: 'm', birthDate: '1981-12-02', birthPlace: 'Darmstadt', parentId: null, partnerId: 'p23', hasRing: true, ringCode: 'R24' },

  // 1C-Kinder
  { id: 'p25', code: '1C1',  name: 'Peter Geppert', gender: 'm', birthDate: '1985-11-11', birthPlace: 'München', parentId: 'p7', partnerId: 'p26', hasRing: true, ringCode: 'R04', inheritedFrom: '1C' },
  { id: 'p26', code: '1C1x', name: 'Claudia Schulz-Geppert', gender: 'f', birthDate: '1987-03-08', birthPlace: 'Regensburg', parentId: null, partnerId: 'p25', hasRing: true, ringCode: 'R25' },

  { id: 'p27', code: '1C2',  name: 'Susanne Geppert', gender: 'f', birthDate: '1986-07-13', birthPlace: 'Augsburg', parentId: 'p7', partnerId: 'p28', hasRing: false, ringCode: 'R09' },
  { id: 'p28', code: '1C2x', name: 'Andreas Meyer-Geppert', gender: 'm', birthDate: '1984-10-29', birthPlace: 'Ingolstadt', parentId: null, partnerId: 'p27', hasRing: true, ringCode: 'R26' },

  { id: 'p29', code: '1C3',  name: 'Johannes Geppert', gender: 'm', birthDate: '1988-01-22', birthPlace: 'Rosenheim', parentId: 'p7', partnerId: 'p30', hasRing: true, ringCode: 'R27' },
  { id: 'p30', code: '1C3x', name: 'Nina Hoffmann-Geppert', gender: 'f', birthDate: '1989-09-07', birthPlace: 'Passau', parentId: null, partnerId: 'p29', hasRing: true, ringCode: 'R28' },

  // 1D-Kinder
  { id: 'p31', code: '1D1',  name: 'Christian Geppert', gender: 'm', birthDate: '1980-05-30', birthPlace: 'Stuttgart', parentId: 'p9', partnerId: 'p32', hasRing: true, ringCode: 'R05', inheritedFrom: '1D' },
  { id: 'p32', code: '1D1x', name: 'Birgit Schneider-Geppert', gender: 'f', birthDate: '1981-02-19', birthPlace: 'Heilbronn', parentId: null, partnerId: 'p31', hasRing: true, ringCode: 'R29' },

  { id: 'p33', code: '1D2',  name: 'Markus Geppert', gender: 'm', birthDate: '1983-06-21', birthPlace: 'Tübingen', parentId: 'p9', partnerId: 'p34', hasRing: false, ringCode: 'R10' },
  { id: 'p34', code: '1D2x', name: 'Andrea Weber-Geppert', gender: 'f', birthDate: '1984-12-14', birthPlace: 'Ulm', parentId: null, partnerId: 'p33', hasRing: true, ringCode: 'R30' },

  { id: 'p35', code: '1D3',  name: 'Heike Geppert', gender: 'f', birthDate: '1986-09-18', birthPlace: 'Karlsruhe', parentId: 'p9', partnerId: 'p36', hasRing: true, ringCode: 'R31' },
  { id: 'p36', code: '1D3x', name: 'Alex Braun-Geppert', gender: 'd', birthDate: '1987-04-03', birthPlace: 'Mannheim', parentId: null, partnerId: 'p35', hasRing: true, ringCode: 'R32' },

  // 1E-Kinder
  { id: 'p37', code: '1E1',  name: 'Philipp Geppert', gender: 'm', birthDate: '1987-08-26', birthPlace: 'Hannover', parentId: 'p11', partnerId: 'p38', hasRing: true, ringCode: 'R06', inheritedFrom: '1E' },
  { id: 'p38', code: '1E1x', name: 'Sophie Müller-Geppert', gender: 'f', birthDate: '1989-01-08', birthPlace: 'Celle', parentId: null, partnerId: 'p37', hasRing: true, ringCode: 'R33' },

  { id: 'p39', code: '1E2',  name: 'Nadine Geppert', gender: 'f', birthDate: '1990-11-09', birthPlace: 'Hildesheim', parentId: 'p11', partnerId: 'p40', hasRing: true, ringCode: 'R34' },
  { id: 'p40', code: '1E2x', name: 'Daniel Hoffmann-Geppert', gender: 'm', birthDate: '1989-05-15', birthPlace: 'Göttingen', parentId: null, partnerId: 'p39', hasRing: true, ringCode: 'R35' },

  { id: 'p41', code: '1E3',  name: 'Fabian Geppert', gender: 'm', birthDate: '1992-03-02', birthPlace: 'Braunschweig', parentId: 'p11', partnerId: 'p42', hasRing: true, ringCode: 'R36' },
  { id: 'p42', code: '1E3x', name: 'Ulrike Schulz-Geppert', gender: 'f', birthDate: '1993-12-30', birthPlace: 'Wolfsburg', parentId: null, partnerId: 'p41', hasRing: true, ringCode: 'R37' },

  // ─────────────────────────────
  // Generation 4 – Urenkel (8 Kinder, ohne Partner) + Vererbungen
  // ─────────────────────────────
  { id: 'p43', code: '1A11', name: 'Lukas Geppert',   gender: 'm', birthDate: '2006-02-14', birthPlace: 'Hamburg', parentId: 'p13', partnerId: null, hasRing: true,  ringCode: 'R02', inheritedFrom: '1A' },
  { id: 'p44', code: '1A12', name: 'Lea Geppert',     gender: 'f', birthDate: '2008-11-05', birthPlace: 'Hamburg', parentId: 'p13', partnerId: null, hasRing: true,  ringCode: 'R07', inheritedFrom: '1A2' },

  { id: 'p45', code: '1B21', name: 'David Geppert',   gender: 'm', birthDate: '2011-03-20', birthPlace: 'Frankfurt am Main', parentId: 'p21', partnerId: null, hasRing: true, ringCode: 'R08', inheritedFrom: '1B1' },
  { id: 'p46', code: '1C11', name: 'Clara Geppert',   gender: 'f', birthDate: '2010-07-12', birthPlace: 'München', parentId: 'p25', partnerId: null, hasRing: true, ringCode: 'R09', inheritedFrom: '1C2' },

  { id: 'p47', code: '1D31', name: 'Jonas Geppert',   gender: 'm', birthDate: '2012-05-16', birthPlace: 'Karlsruhe', parentId: 'p35', partnerId: null, hasRing: true, ringCode: 'R10', inheritedFrom: '1D2' },
  { id: 'p48', code: '1E21', name: 'Sophie Geppert',  gender: 'f', birthDate: '2013-12-20', birthPlace: 'Hildesheim', parentId: 'p39', partnerId: null, hasRing: true, ringCode: 'R15', inheritedFrom: '1Dx' },

  { id: 'p49', code: '1A21', name: 'Paul Geppert',    gender: 'm', birthDate: '2014-04-11', birthPlace: 'Kiel', parentId: 'p15', partnerId: null, hasRing: true, ringCode: 'R38' },
  { id: 'p50', code: '1C31', name: 'Mira Geppert',    gender: 'd', birthDate: '2015-09-10', birthPlace: 'Rosenheim', parentId: 'p29', partnerId: null, hasRing: true, ringCode: 'R39' },
];

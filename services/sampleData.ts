import type { Person } from '../types';

export const samplePeople: Person[] = [
  // Gen 1
  { id: 'g1-adam', code: '1', name: 'Adam Geppert', gender: 'm', birthDate: '1850-01-15', deathDate: '1920-05-20', birthPlace: 'Berlin', parentId: null, partnerId: 'g1-eva', ringCode: '1', inheritedFrom: null, hasRing: true, ringHistory: [], comment: 'Stammvater der Familie.', photoUrl: null },
  { id: 'g1-eva', code: '1x', name: 'Eva Geppert (geb. Meier)', gender: 'f', birthDate: '1852-03-10', deathDate: '1925-11-30', birthPlace: 'Potsdam', parentId: null, partnerId: 'g1-adam', ringCode: '1x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: 'Stammmutter der Familie.', photoUrl: null },

  // Gen 2 - Children of Adam & Eva
  { id: 'g2-bernd', code: '1A', name: 'Bernd Geppert', gender: 'm', birthDate: '1875-04-01', deathDate: '1945-08-15', birthPlace: 'Berlin', parentId: 'g1-adam', partnerId: 'g2-anna', ringCode: '1 → 1A', inheritedFrom: '1', hasRing: true, ringHistory: [], comment: 'Hat den ersten Ring geerbt.', photoUrl: null },
  { id: 'g2-anna', code: '1Ax', name: 'Anna Geppert (geb. Schmidt)', gender: 'f', birthDate: '1878-06-22', deathDate: '1950-12-01', birthPlace: 'Hamburg', parentId: null, partnerId: 'g2-bernd', ringCode: '1Ax', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g2-clara', code: '1B', name: 'Clara Geppert', gender: 'f', birthDate: '1878-09-11', deathDate: '1960-02-18', birthPlace: 'Berlin', parentId: 'g1-adam', partnerId: 'g2-friedrich', ringCode: '1B', inheritedFrom: null, hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g2-friedrich', code: '1Bx', name: 'Friedrich Geppert-Weber', gender: 'm', birthDate: '1876-01-30', deathDate: '1955-07-25', birthPlace: 'München', parentId: null, partnerId: 'g2-clara', ringCode: '1Bx', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g2-david', code: '1C', name: 'David Geppert', gender: 'm', birthDate: '1882-02-20', deathDate: '1933-03-14', birthPlace: 'Berlin', parentId: 'g1-adam', partnerId: 'g2-sabine', ringCode: '1C', inheritedFrom: null, hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g2-sabine', code: '1Cx', name: 'Sabine Geppert (geb. Lang)', gender: 'f', birthDate: '1885-01-01', deathDate: '1940-01-01', birthPlace: 'Köln', parentId: null, partnerId: 'g2-david', ringCode: '1Cx', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g2-doris', code: '1D', name: 'Doris Geppert', gender: 'f', birthDate: '1885-06-18', deathDate: '1965-04-23', birthPlace: 'Berlin', parentId: 'g1-adam', partnerId: 'g2-erich', ringCode: '1D', inheritedFrom: null, hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g2-erich', code: '1Dx', name: 'Erich Geppert-Schulz', gender: 'm', birthDate: '1883-02-12', deathDate: '1962-10-09', birthPlace: 'Frankfurt', parentId: null, partnerId: 'g2-doris', ringCode: '1Dx', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 3 - Children of Bernd & Anna
  { id: 'g3-emil', code: '1A1', name: 'Emil Geppert', gender: 'm', birthDate: '1900-05-15', deathDate: '1980-01-10', birthPlace: 'Hamburg', parentId: 'g2-bernd', partnerId: 'g3-dora', ringCode: '1A → 1A1', inheritedFrom: '1A', hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g3-dora', code: '1A1x', name: 'Dora Geppert (geb. Becker)', gender: 'f', birthDate: '1902-11-05', deathDate: '1985-06-20', birthPlace: 'Leipzig', parentId: null, partnerId: 'g3-emil', ringCode: '1A1x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g3-frida', code: '1A2', name: 'Frida Geppert', gender: 'f', birthDate: '1903-08-25', deathDate: '1990-09-05', birthPlace: 'Hamburg', parentId: 'g2-bernd', partnerId: null, ringCode: '1A2', inheritedFrom: null, hasRing: false, ringHistory: [], comment: 'Künstlerin.', photoUrl: null },

  // Gen 3 - Children of Clara & Friedrich
  { id: 'g3-gustav', code: '1B1', name: 'Gustav Geppert-Weber', gender: 'm', birthDate: '1905-12-01', deathDate: '1975-03-12', birthPlace: 'München', parentId: 'g2-clara', partnerId: 'g3-greta', ringCode: '1B1', inheritedFrom: null, hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g3-greta', code: '1B1x', name: 'Greta Geppert-Weber (geb. Fischer)', gender: 'f', birthDate: '1908-02-14', deathDate: '1988-04-22', birthPlace: 'Stuttgart', parentId: null, partnerId: 'g3-gustav', ringCode: '1B1x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 3 - Children of David & Sabine
  { id: 'g3-otto', code: '1C1', name: 'Otto Geppert', gender: 'm', birthDate: '1905-10-10', deathDate: '1970-11-11', birthPlace: 'Köln', parentId: 'g2-david', partnerId: 'g3-paula', ringCode: '1C → 1C1', inheritedFrom: '1C', hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g3-paula', code: '1C1x', name: 'Paula Geppert (geb. Herrmann)', gender: 'f', birthDate: '1908-12-12', deathDate: '1975-01-01', birthPlace: 'Düsseldorf', parentId: null, partnerId: 'g3-otto', ringCode: '1C1x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 3 - Children of Doris & Erich
  { id: 'g3-felix', code: '1D1', name: 'Felix Geppert-Schulz', gender: 'm', birthDate: '1910-01-10', deathDate: '1995-12-12', birthPlace: 'Frankfurt', parentId: 'g2-doris', partnerId: 'g3-gerda', ringCode: '1D1', inheritedFrom: null, hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g3-gerda', code: '1D1x', name: 'Gerda Geppert-Schulz (geb. Hoffmann)', gender: 'f', birthDate: '1912-03-15', deathDate: '1998-05-18', birthPlace: 'Dortmund', parentId: null, partnerId: 'g3-felix', ringCode: '1D1x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 4 - Children of Emil & Dora
  { id: 'g4-hans', code: '1A11', name: 'Hans Geppert', gender: 'm', birthDate: '1925-07-30', deathDate: '2005-10-15', birthPlace: 'Leipzig', parentId: 'g3-emil', partnerId: 'g4-hilde', ringCode: '1A1 → 1A11', inheritedFrom: '1A1', hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g4-hilde', code: '1A11x', name: 'Hilde Geppert (geb. Wagner)', gender: 'f', birthDate: '1928-09-02', deathDate: '2010-11-25', birthPlace: 'Dresden', parentId: null, partnerId: 'g4-hans', ringCode: '1A11x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g4-ida', code: '1A12', name: 'Ida Geppert', gender: 'f', birthDate: '1928-10-10', deathDate: null, birthPlace: 'Leipzig', parentId: 'g3-emil', partnerId: null, ringCode: '1A12', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 4 - Children of Gustav & Greta
  { id: 'g4-ingrid', code: '1B11', name: 'Ingrid Geppert-Weber', gender: 'f', birthDate: '1930-03-03', deathDate: '2015-01-01', birthPlace: 'Stuttgart', parentId: 'g3-gustav', partnerId: 'g4-jurgen', ringCode: '1B11', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g4-jurgen', code: '1B11x', name: 'Jürgen Geppert-Klein', gender: 'm', birthDate: '1929-05-05', deathDate: '2014-02-02', birthPlace: 'Nürnberg', parentId: null, partnerId: 'g4-ingrid', ringCode: '1B11x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 4 - Children of Otto & Paula
  { id: 'g4-rita', code: '1C11', name: 'Rita Geppert', gender: 'f', birthDate: '1930-01-01', deathDate: '2010-02-02', birthPlace: 'Düsseldorf', parentId: 'g3-otto', partnerId: 'g4-richard', ringCode: '1C11', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g4-richard', code: '1C11x', name: 'Richard Geppert-Lehmann', gender: 'm', birthDate: '1928-03-03', deathDate: '2008-04-04', birthPlace: 'Essen', parentId: null, partnerId: 'g4-rita', ringCode: '1C11x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 4 - Children of Felix & Gerda
  { id: 'g4-heidi', code: '1D11', name: 'Heidi Geppert-Schulz', gender: 'f', birthDate: '1935-08-20', deathDate: null, birthPlace: 'Dortmund', parentId: 'g3-felix', partnerId: null, ringCode: '1D11', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g4-ingo', code: '1D12', name: 'Ingo Geppert-Schulz', gender: 'm', birthDate: '1938-11-25', deathDate: '2018-02-28', birthPlace: 'Dortmund', parentId: 'g3-felix', partnerId: 'g4-johanna', ringCode: '1D1 → 1D12', inheritedFrom: '1D1', hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g4-johanna', code: '1D12x', name: 'Johanna Geppert-Schulz (geb. Richter)', gender: 'f', birthDate: '1940-01-05', deathDate: null, birthPlace: 'Bremen', parentId: null, partnerId: 'g4-ingo', ringCode: '1D12x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 5 - Children of Hans & Hilde
  { id: 'g5-karl', code: '1A111', name: 'Karl Geppert', gender: 'm', birthDate: '1950-01-20', deathDate: null, birthPlace: 'Dresden', parentId: 'g4-hans', partnerId: 'g5-karin', ringCode: '1A11 → 1A111', inheritedFrom: '1A11', hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g5-karin', code: '1A111x', name: 'Karin Geppert (geb. Wolf)', gender: 'f', birthDate: '1952-04-18', deathDate: null, birthPlace: 'Hannover', parentId: null, partnerId: 'g5-karl', ringCode: '1A111x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g5-laura', code: '1A112', name: 'Laura Geppert', gender: 'f', birthDate: '1955-06-12', deathDate: null, birthPlace: 'Dresden', parentId: 'g4-hans', partnerId: null, ringCode: '1A112', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 5 - Children of Ingrid & Jürgen
  { id: 'g5-klaus', code: '1B111', name: 'Klaus Geppert-Klein', gender: 'm', birthDate: '1953-08-19', deathDate: null, birthPlace: 'Nürnberg', parentId: 'g4-ingrid', partnerId: null, ringCode: '1B111', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 5 - Children of Rita & Richard
  { id: 'g5-stefan', code: '1C111', name: 'Stefan Geppert-Lehmann', gender: 'm', birthDate: '1955-05-05', deathDate: null, birthPlace: 'Essen', parentId: 'g4-rita', partnerId: 'g5-susanne', ringCode: '1C111', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g5-susanne', code: '1C111x', name: 'Susanne Geppert-Lehmann (geb. Schubert)', gender: 'f', birthDate: '1956-06-06', deathDate: null, birthPlace: 'Duisburg', parentId: null, partnerId: 'g5-stefan', ringCode: '1C111x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 5 - Children of Ingo & Johanna
  { id: 'g5-kurt', code: '1D121', name: 'Kurt Geppert-Schulz', gender: 'm', birthDate: '1965-04-10', deathDate: null, birthPlace: 'Bremen', parentId: 'g4-ingo', partnerId: null, ringCode: '1D12 → 1D121', inheritedFrom: '1D12', hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g5-lina', code: '1D122', name: 'Lina Geppert-Schulz', gender: 'f', birthDate: '1968-07-22', deathDate: null, birthPlace: 'Bremen', parentId: 'g4-ingo', partnerId: 'g5-markus', ringCode: '1D122', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g5-markus', code: '1D122x', name: 'Markus Geppert-König', gender: 'm', birthDate: '1966-09-15', deathDate: null, birthPlace: 'Bochum', parentId: null, partnerId: 'g5-lina', ringCode: '1D122x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 6 - Children of Karl & Karin
  { id: 'g6-martin', code: '1A1111', name: 'Martin Geppert', gender: 'm', birthDate: '1975-11-22', deathDate: null, birthPlace: 'Hannover', parentId: 'g5-karl', partnerId: 'g6-maria', ringCode: '1A111 → 1A1111', inheritedFrom: '1A111', hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g6-maria', code: '1A1111x', name: 'Maria Geppert (geb. Neumann)', gender: 'f', birthDate: '1976-12-25', deathDate: null, birthPlace: 'Wuppertal', parentId: null, partnerId: 'g6-martin', ringCode: '1A1111x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g6-nina', code: '1A1112', name: 'Nina Geppert', gender: 'f', birthDate: '1980-03-15', deathDate: null, birthPlace: 'Hannover', parentId: 'g5-karl', partnerId: null, ringCode: '1A1112', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 6 - Children of Stefan & Susanne
  { id: 'g6-thomas', code: '1C1111', name: 'Thomas Geppert-Lehmann', gender: 'm', birthDate: '1980-08-08', deathDate: null, birthPlace: 'Duisburg', parentId: 'g5-stefan', partnerId: null, ringCode: '1C1111', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g6-tanja', code: '1C1112', name: 'Tanja Geppert-Lehmann', gender: 'f', birthDate: '1982-09-09', deathDate: null, birthPlace: 'Duisburg', parentId: 'g5-stefan', partnerId: 'g6-torsten', ringCode: '1C1112', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g6-torsten', code: '1C1112x', name: 'Torsten Geppert-Keller', gender: 'm', birthDate: '1980-01-01', deathDate: null, birthPlace: 'Bielefeld', parentId: null, partnerId: 'g6-tanja', ringCode: '1C1112x', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  
  // Gen 6 - Children of Lina & Markus
  { id: 'g6-nora', code: '1D1221', name: 'Nora Geppert-König', gender: 'f', birthDate: '1990-05-30', deathDate: null, birthPlace: 'Bochum', parentId: 'g5-lina', partnerId: null, ringCode: '1D1221', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 7 - Children of Martin & Maria
  { id: 'g7-oskar', code: '1A11111', name: 'Oskar Geppert', gender: 'm', birthDate: '2005-09-01', deathDate: null, birthPlace: 'Wuppertal', parentId: 'g6-martin', partnerId: null, ringCode: '1A1111 → 1A11111', inheritedFrom: '1A1111', hasRing: true, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g7-paul', code: '1A11112', name: 'Paul Geppert', gender: 'm', birthDate: '2008-07-14', deathDate: null, birthPlace: 'Wuppertal', parentId: 'g6-martin', partnerId: null, ringCode: '1A11112', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },

  // Gen 7 - Children of Tanja & Torsten
  { id: 'g7-uwe', code: '1C11121', name: 'Uwe Geppert-Keller', gender: 'm', birthDate: '2005-05-05', deathDate: null, birthPlace: 'Bielefeld', parentId: 'g6-tanja', partnerId: null, ringCode: '1C11121', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
  { id: 'g7-ulrike', code: '1C11122', name: 'Ulrike Geppert-Keller', gender: 'f', birthDate: '2008-08-08', deathDate: null, birthPlace: 'Bielefeld', parentId: 'g6-tanja', partnerId: null, ringCode: '1C11122', inheritedFrom: null, hasRing: false, ringHistory: [], comment: null, photoUrl: null },
];
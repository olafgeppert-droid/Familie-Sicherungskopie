// src/services/sampleData.ts

import { Person } from '../types';

export const samplePeople: Person[] = [
  // Generation 1 – Stammeltern
  { id: '1', code: '1', name: 'Karl Geppert', birthDate: '1925-05-12', parentId: null, partnerId: '2' },
  { id: '2', code: '1x', name: 'Anna Müller-Geppert', birthDate: '1928-09-03', parentId: null, partnerId: '1' },

  // Generation 2 – Kinder
  { id: '3', code: '1.1', name: 'Hans Geppert', birthDate: '1950-03-14', parentId: '1', partnerId: '4' },
  { id: '4', code: '1.1x', name: 'Maria Schneider-Geppert', birthDate: '1952-11-21', parentId: null, partnerId: '3' },

  { id: '5', code: '1.2', name: 'Elisabeth Geppert', birthDate: '1948-06-01', parentId: '1', partnerId: '6' },
  { id: '6', code: '1.2x', name: 'Johann Geppert', birthDate: '1947-12-12', parentId: null, partnerId: '5' },

  { id: '7', code: '1.3', name: 'Peter Geppert', birthDate: '1953-08-09', parentId: '1', partnerId: '8' },
  { id: '8', code: '1.3x', name: 'Clara Meyer-Geppert', birthDate: '1955-01-30', parentId: null, partnerId: '7' },

  { id: '9', code: '1.4', name: 'Monika Geppert', birthDate: '1951-04-17', parentId: '1', partnerId: '10' },
  { id: '10', code: '1.4x', name: 'Franz Geppert', birthDate: '1949-07-23', parentId: null, partnerId: '9' },

  // Generation 3 – Enkel (Kinder von Hans & Maria)
  { id: '11', code: '1.1.1', name: 'Thomas Geppert', birthDate: '1975-03-05', parentId: '3', partnerId: '12' },
  { id: '12', code: '1.1.1x', name: 'Sabine Schulz-Geppert', birthDate: '1976-09-15', parentId: null, partnerId: '11' },

  { id: '13', code: '1.1.2', name: 'Julia Geppert', birthDate: '1978-11-22', parentId: '3', partnerId: '14' },
  { id: '14', code: '1.1.2x', name: 'Michael Geppert', birthDate: '1974-02-02', parentId: null, partnerId: '13' },

  // Enkel (Kinder von Elisabeth & Johann)
  { id: '15', code: '1.2.1', name: 'Andreas Geppert', birthDate: '1970-07-08', parentId: '5', partnerId: '16' },
  { id: '16', code: '1.2.1x', name: 'Katrin Hoffmann-Geppert', birthDate: '1972-03-19', parentId: null, partnerId: '15' },

  { id: '17', code: '1.2.2', name: 'Martina Geppert', birthDate: '1973-05-14', parentId: '5', partnerId: '18' },
  { id: '18', code: '1.2.2x', name: 'Stefan Geppert', birthDate: '1971-09-25', parentId: null, partnerId: '17' },

  // Enkel (Kinder von Peter & Clara)
  { id: '19', code: '1.3.1', name: 'Markus Geppert', birthDate: '1979-01-11', parentId: '7', partnerId: '20' },
  { id: '20', code: '1.3.1x', name: 'Daniela Weber-Geppert', birthDate: '1980-10-10', parentId: null, partnerId: '19' },

  { id: '21', code: '1.3.2', name: 'Susanne Geppert', birthDate: '1977-06-06', parentId: '7', partnerId: '22' },
  { id: '22', code: '1.3.2x', name: 'Andreas Müller-Geppert', birthDate: '1976-12-24', parentId: null, partnerId: '21' },

  // Enkel (Kinder von Monika & Franz)
  { id: '23', code: '1.4.1', name: 'Christian Geppert', birthDate: '1972-08-02', parentId: '9', partnerId: '24' },
  { id: '24', code: '1.4.1x', name: 'Birgit Schneider-Geppert', birthDate: '1974-01-18', parentId: null, partnerId: '23' },

  { id: '25', code: '1.4.2', name: 'Heike Geppert', birthDate: '1976-09-30', parentId: '9', partnerId: '26' },
  { id: '26', code: '1.4.2x', name: 'Matthias Geppert', birthDate: '1975-04-04', parentId: null, partnerId: '25' },

  // Generation 4 – Urenkel (Kinder von Thomas & Sabine)
  { id: '27', code: '1.1.1.1', name: 'Lukas Geppert', birthDate: '2000-02-14', parentId: '11' },
  { id: '28', code: '1.1.1.2', name: 'Lea Geppert', birthDate: '2002-11-05', parentId: '11' },

  // Kinder von Julia & Michael
  { id: '29', code: '1.1.2.1', name: 'David Geppert', birthDate: '1999-03-20', parentId: '13' },
  { id: '30', code: '1.1.2.2', name: 'Clara Geppert', birthDate: '2001-07-12', parentId: '13' },

  // Kinder von Andreas & Katrin
  { id: '31', code: '1.2.1.1', name: 'Johannes Geppert', birthDate: '1998-09-09', parentId: '15' },
  { id: '32', code: '1.2.1.2', name: 'Sarah Geppert', birthDate: '2003-05-25', parentId: '15' },

  // Kinder von Martina & Stefan
  { id: '33', code: '1.2.2.1', name: 'Paul Geppert', birthDate: '1996-04-01', parentId: '17' },
  { id: '34', code: '1.2.2.2', name: 'Anna Geppert', birthDate: '1997-08-18', parentId: '17' },

  // Kinder von Markus & Daniela
  { id: '35', code: '1.3.1.1', name: 'Finn Geppert', birthDate: '2004-12-03', parentId: '19' },
  { id: '36', code: '1.3.1.2', name: 'Mia Geppert', birthDate: '2006-07-22', parentId: '19' },

  // Kinder von Susanne & Andreas
  { id: '37', code: '1.3.2.1', name: 'Leon Geppert', birthDate: '1995-01-15', parentId: '21' },
  { id: '38', code: '1.3.2.2', name: 'Nina Geppert', birthDate: '1999-10-29', parentId: '21' },

  // Kinder von Christian & Birgit
  { id: '39', code: '1.4.1.1', name: 'Jonas Geppert', birthDate: '1997-06-16', parentId: '23' },
  { id: '40', code: '1.4.1.2', name: 'Sophie Geppert', birthDate: '2001-12-20', parentId: '23' },

  // Kinder von Heike & Matthias
  { id: '41', code: '1.4.2.1', name: 'Emil Geppert', birthDate: '1998-02-08', parentId: '25' },
  { id: '42', code: '1.4.2.2', name: 'Marie Geppert', birthDate: '2000-09-17', parentId: '25' },

  // Generation 5 – Ururenkel (z. B. Lukas' Kinder)
  { id: '43', code: '1.1.1.1.1', name: 'Ben Geppert', birthDate: '2020-04-11', parentId: '27' },
  { id: '44', code: '1.1.1.1.2', name: 'Lia Geppert', birthDate: '2022-06-30', parentId: '27' },

  // Weitere Ururenkel
  { id: '45', code: '1.1.2.1.1', name: 'Milan Geppert', birthDate: '2018-03-05', parentId: '29' },
  { id: '46', code: '1.2.1.1.1', name: 'Ella Geppert', birthDate: '2019-07-14', parentId: '31' },
  { id: '47', code: '1.2.2.1.1', name: 'Noah Geppert', birthDate: '2017-12-01', parentId: '33' },
  { id: '48', code: '1.3.1.1.1', name: 'Clara-Marie Geppert', birthDate: '2016-05-25', parentId: '35' },
  { id: '49', code: '1.3.2.1.1', name: 'Luis Geppert', birthDate: '2015-09-10', parentId: '37' },
  { id: '50', code: '1.4.2.1.1', name: 'Marta Geppert', birthDate: '2021-11-19', parentId: '41' },
];

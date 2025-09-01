import type { Person } from '../types';

export const samplePeople: Person[] = [
  {
    id: "1",
    code: "1",
    name: "Heinrich Müller",
    birthDate: "1940-05-12",
    deathDate: null,
    parentId: null,
    partnerId: "2",
    hasRing: true,
    photoUrl: ""
  },
  {
    id: "2",
    code: "1x",
    name: "Anna Müller",
    birthDate: "1942-03-20",
    deathDate: null,
    parentId: null,
    partnerId: "1",
    hasRing: false,
    photoUrl: ""
  },
  {
    id: "3",
    code: "2",
    name: "Karl Müller",
    birthDate: "1965-07-01",
    deathDate: null,
    parentId: "1",
    partnerId: "4",
    hasRing: false,
    photoUrl: ""
  },
  {
    id: "4",
    code: "2x",
    name: "Eva Müller",
    birthDate: "1967-09-14",
    deathDate: null,
    parentId: null,
    partnerId: "3",
    hasRing: false,
    photoUrl: ""
  },
  {
    id: "5",
    code: "3",
    name: "Thomas Müller",
    birthDate: "1990-11-23",
    deathDate: null,
    parentId: "3",
    partnerId: "6",
    hasRing: false,
    photoUrl: ""
  },
  {
    id: "6",
    code: "3x",
    name: "Laura Müller",
    birthDate: "1992-04-18",
    deathDate: null,
    parentId: null,
    partnerId: "5",
    hasRing: false,
    photoUrl: ""
  },
  {
    id: "7",
    code: "4",
    name: "Max Müller",
    birthDate: "2020-01-05",
    deathDate: null,
    parentId: "5",
    partnerId: null,
    hasRing: false,
    photoUrl: ""
  },
  // --- weitere Beispielpersonen hinzufügen ---
];

// 👉 Für dein Projekt kannst du die Liste beliebig aufstocken (20, 30 oder mehr Personen).
// Wichtig ist: Partner haben sich gegenseitig die partnerId gesetzt (z.B. "1" ↔ "2").

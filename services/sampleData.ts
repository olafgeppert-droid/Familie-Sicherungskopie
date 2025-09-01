import type { Person } from "./types";

export const sampleData: Person[] = [
  // Generation 1
  {
    id: "p1",
    code: "1",
    name: "Urahn",
    birthDate: "1900-01-01",
    deathDate: "1970-01-01",
    hasRing: true,
    partnerId: "p2",
  },
  {
    id: "p2",
    code: "1x",
    name: "Urahnin",
    birthDate: "1905-02-02",
    deathDate: "1980-02-02",
    partnerId: "p1",
  },

  // Generation 2
  {
    id: "p3",
    code: "2a",
    name: "Sohn A",
    birthDate: "1925-03-03",
    parentId: "p1",
    partnerId: "p4",
  },
  {
    id: "p4",
    code: "2ax",
    name: "Ehefrau A",
    birthDate: "1927-04-04",
    partnerId: "p3",
  },
  {
    id: "p5",
    code: "2b",
    name: "Tochter B",
    birthDate: "1930-05-05",
    parentId: "p1",
    partnerId: "p6",
  },
  {
    id: "p6",
    code: "2bx",
    name: "Ehemann B",
    birthDate: "1929-06-06",
    partnerId: "p5",
  },

  // Generation 3
  {
    id: "p7",
    code: "3a",
    name: "Enkel A1",
    birthDate: "1950-07-07",
    parentId: "p3",
    partnerId: "p8",
  },
  {
    id: "p8",
    code: "3ax",
    name: "Ehefrau A1",
    birthDate: "1952-08-08",
    partnerId: "p7",
  },
  {
    id: "p9",
    code: "3b",
    name: "Enkel A2",
    birthDate: "1955-09-09",
    parentId: "p3",
  },
  {
    id: "p10",
    code: "3c",
    name: "Enkel B1",
    birthDate: "1958-10-10",
    parentId: "p5",
  },

  // Generation 4
  {
    id: "p11",
    code: "4a",
    name: "Urenkel A1a",
    birthDate: "1975-11-11",
    parentId: "p7",
    partnerId: "p12",
  },
  {
    id: "p12",
    code: "4ax",
    name: "Ehefrau A1a",
    birthDate: "1976-12-12",
    partnerId: "p11",
  },
  {
    id: "p13",
    code: "4b",
    name: "Urenkel B1a",
    birthDate: "1980-01-13",
    parentId: "p10",
  },

  // Generation 5
  {
    id: "p14",
    code: "5a",
    name: "Nachfahre A1a1",
    birthDate: "2000-02-14",
    parentId: "p11",
  },
  {
    id: "p15",
    code: "5b",
    name: "Nachfahre B1a1",
    birthDate: "2002-03-15",
    parentId: "p13",
  },

  // Generation 6
  {
    id: "p16",
    code: "6a",
    name: "Jüngster A1a1a",
    birthDate: "2025-01-01",
    parentId: "p14",
  },
];

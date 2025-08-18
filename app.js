
// Family Rings – upd37 (no login) with auto codes, ring code, "Geerbt von", SVG tree

const STORAGE_KEY = "familyRingVault_v4";
let people = [];
let undoStack = [];
let redoStack = [];
let filtered = "";
let currentSort = {dir:1};

// Seed minimal
const seed = [
  {Code:"1", RingCode:"1", Name:"Olaf Geppert", BirthDate:"13.01.1965", BirthPlace:"", Gender:"m", ParentCode:"", PartnerCode:"1x", InheritedFrom:"", Note:""},
  {Code:"1x", RingCode:"1", Name:"Irina Geppert", BirthDate:"13.01.1970", BirthPlace:"", Gender:"w", ParentCode:"", PartnerCode:"1", InheritedFrom:"1", Note:""},
  {Code:"1A", RingCode:"1", Name:"Mario Geppert", BirthDate:"28.04.1995", BirthPlace:"", Gender:"m", ParentCode:"1", PartnerCode:"1Ax", InheritedFrom:"1", Note:""},
  {Code:"1Ax", RingCode:"1", Name:"Kim", BirthDate:"", BirthPlace:"", Gender:"w", ParentCode:"", PartnerCode:"1A", InheritedFrom:"1A", Note:""}
];

// Helpers
function sget(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; } }
function sset(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function qs(s){ return document.querySelector(s); }
function qsa(s){ return Array.from(document.querySelectorAll(s)); }

function isPartner(code){ return code && code.endsWith("x"); }
function baseOf(code){ return isPartner(code) ? code.slice(0,-1) : code; }
function normalizeCode(code){
  if(!code) return "";
  code = code.trim();
  const partner = code.endsWith("x") || code.endsWith("X");
  code = code.toUpperCase();
  return partner ? code.slice(0,-1)+"x" : code;
}

// Generation = length of base (no 'x')
function generationOf(code){ if(!code) return 0; return baseOf(code).length; }


function recalcAll(){
  // keep codes as-is, set Generation, compute RingCode from explicit inheritance
  const byCode = Object.fromEntries(people.map(p => [p.Code, p]));
  for(const p of people){
    p.Generation = generationOf(p.Code);
  }
  for(const p of people){
    const base = baseOf(p.Code);
    // Partner teilt Ringcode mit Basis
    if(isPartner(p.Code)){
      const b = byCode[base];
      p.RingCode = b ? (b.RingCode || base) : base;
      continue;
    }
    // Inheritance chain
    if(p.InheritedFrom){
      const donor = byCode[p.InheritedFrom];
      const donorChain = donor && donor.RingCode ? donor.RingCode : p.InheritedFrom;
      p.RingCode = donorChain + "→" + p.Code;
    }else{
      // Default: eigener gravierter Code (Basis)
      p.RingCode = base;
    }
  }
}


function nextRootNumber

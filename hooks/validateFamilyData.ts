import { Person } from "../types";

export function validateFamilyData(people: Person[]) {
  const warnings: string[] = [];

  // Partner-Validierung
  people.forEach(p => {
    if (p.partnerId) {
      const partner = people.find(q => q.id === p.partnerId);
      if (!partner) {
        warnings.push(`❌ Person ${p.name} (${p.id}) verweist auf ungültigen PartnerId=${p.partnerId}`);
      } else if (partner.partnerId !== p.id) {
        warnings.push(`⚠️ Partnerlink nur einseitig: ${p.name} (${p.id}) → ${partner.name} (${partner.id})`);
      }
    }
  });

  // Ringcode-Validierung
  people.forEach(p => {
    if (p.partnerId) {
      const partner = people.find(q => q.id === p.partnerId);
      if (partner && partner.ringCode && p.ringCode) {
        const pX = p.ringCode.endsWith("x");
        const qX = partner.ringCode.endsWith("x");
        if (!(pX ^ qX)) {
          warnings.push(`⚠️ Partnercodes inkonsistent bei ${p.name} (${p.ringCode}) und ${partner.name} (${partner.ringCode})`);
        }
      }
    }
  });

  if (warnings.length > 0) {
    console.group("Familien-Datenprüfung");
    warnings.forEach(w => console.warn(w));
    console.groupEnd();
  } else {
    console.info("✅ Familien-Daten sind konsistent.");
  }
}

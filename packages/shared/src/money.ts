// Money is stored and sent as integer centavos (85000 = ₱850.00), the unit Stripe uses.

const pesoFormat = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/** 85000 → "₱850.00". */
export function formatPeso(centavos: number): string {
  return pesoFormat.format(centavos / 100);
}

/** 85000 → "850.00", for filling a price input. */
export function centavosToPesos(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

/**
 * What someone typed as a peso amount → centavos. Accepts "850", "850.5",
 * "₱1,250.00"; returns null for anything else (letters, negatives, 3+ decimals).
 */
export function pesosToCentavos(text: string): number | null {
  const cleaned = text.replace(/[₱,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole = "0", fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

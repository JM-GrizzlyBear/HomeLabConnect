import type { Specimen } from "@homelabconnect/shared";

export { centavosToPesos, formatPeso, pesosToCentavos } from "@homelabconnect/shared";

export const specimenLabels: Record<Specimen, string> = {
  blood: "Blood",
  urine: "Urine",
  stool: "Stool",
  swab: "Swab",
  other: "Other",
};

/** 24 → "24 hours", 72 → "3 days", 30 → "30 hours". */
export function formatTurnaround(hours: number): string {
  if (hours >= 48 && hours % 24 === 0) return `${hours / 24} days`;
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

/** 0 → "No fasting", 8 → "Fast 8 hours". */
export function formatFasting(hours: number): string {
  if (hours === 0) return "No fasting";
  return hours === 1 ? "Fast 1 hour" : `Fast ${hours} hours`;
}

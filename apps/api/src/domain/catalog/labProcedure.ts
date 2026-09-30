import { InvalidProcedure } from "./catalogErrors.js";

export const SPECIMENS = ["blood", "urine", "stool", "swab", "other"] as const;
export type Specimen = (typeof SPECIMENS)[number];

/** ₱1,000,000.00. Prices are integer centavos. */
export const MAX_PRICE_CENTAVOS = 100_000_000;
/** 2–20 characters: letters and digits, with single dashes between them. */
const CODE_PATTERN = /^(?=.{2,20}$)[A-Z0-9]+(-[A-Z0-9]+)*$/;

/** What an admin fills in for a procedure. */
export interface LabProcedureDetails {
  code: string;
  name: string;
  categoryId: string;
  priceCentavos: number;
  specimen: Specimen;
  turnaroundHours: number;
  fastingHours: number;
  preparation: string | null;
  description: string | null;
}

/**
 * A lab test patients can book, e.g. "CBC". Procedures are deactivated, never
 * deleted, so past appointments and payments keep pointing at them.
 */
export interface LabProcedure extends LabProcedureDetails {
  id: string;
  isActive: boolean;
}

/** "lipid-panel " → "LIPID-PANEL". */
export function normalizeProcedureCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Each business rule for a procedure's details, with the message shown when it's broken. */
const rules: { holds(details: LabProcedureDetails): boolean; message: string }[] = [
  {
    holds: ({ code }) => CODE_PATTERN.test(code),
    message: "Codes are 2–20 letters, digits and single dashes.",
  },
  { holds: ({ name }) => name.length > 0, message: "A procedure needs a name." },
  {
    holds: ({ priceCentavos }) => isWholeBetween(priceCentavos, 1, MAX_PRICE_CENTAVOS),
    message: "The price must be above ₱0 and at most ₱1,000,000.",
  },
  {
    holds: ({ turnaroundHours }) => isWholeBetween(turnaroundHours, 1, 720),
    message: "Results must take between 1 hour and 30 days.",
  },
  {
    holds: ({ fastingHours }) => isWholeBetween(fastingHours, 0, 24),
    message: "Fasting must be between 0 and 24 hours.",
  },
];

/** Normalises the code and name, then applies the rules. Throws on the first broken one. */
export function checkProcedureDetails(input: LabProcedureDetails): LabProcedureDetails {
  const details = { ...input, code: normalizeProcedureCode(input.code), name: input.name.trim() };
  const broken = rules.find((rule) => !rule.holds(details));
  if (broken) throw new InvalidProcedure(broken.message);
  return details;
}

function isWholeBetween(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

import { eq, sql } from "drizzle-orm";
import type { Specimen } from "../../domain/catalog/labProcedure.js";
import type { Database } from "./client.js";
import { labProcedures, procedureCategories } from "./schema/index.js";

interface SeedProcedure {
  code: string;
  name: string;
  category: string;
  /** Pesos, converted to centavos on insert. */
  price: number;
  specimen: Specimen;
  turnaroundHours: number;
  fastingHours?: number;
  preparation?: string;
  description: string;
}

const categories = [
  "Hematology",
  "Clinical Chemistry",
  "Urinalysis & Fecalysis",
  "Serology & Immunology",
  "Microbiology",
  "Health Packages",
];

const fasting = (hours: number) => `Fast for ${hours} hours before collection. Water is allowed.`;

const procedures: SeedProcedure[] = [
  {
    code: "CBC",
    name: "Complete Blood Count",
    category: "Hematology",
    price: 350,
    specimen: "blood",
    turnaroundHours: 24,
    description: "Red and white cells, hemoglobin and platelets.",
  },
  {
    code: "CBC-PLT",
    name: "CBC with Platelet Count",
    category: "Hematology",
    price: 450,
    specimen: "blood",
    turnaroundHours: 24,
    description: "Complete blood count plus a manual platelet count.",
  },
  {
    code: "ABO-RH",
    name: "Blood Typing (ABO/Rh)",
    category: "Hematology",
    price: 250,
    specimen: "blood",
    turnaroundHours: 24,
    description: "Blood group and Rh factor.",
  },
  {
    code: "ESR",
    name: "Erythrocyte Sedimentation Rate",
    category: "Hematology",
    price: 200,
    specimen: "blood",
    turnaroundHours: 24,
    description: "A general marker of inflammation.",
  },
  {
    code: "FBS",
    name: "Fasting Blood Sugar",
    category: "Clinical Chemistry",
    price: 200,
    specimen: "blood",
    turnaroundHours: 24,
    fastingHours: 8,
    preparation: fasting(8),
    description: "Blood glucose after fasting, to screen for diabetes.",
  },
  {
    code: "HBA1C",
    name: "HbA1c",
    category: "Clinical Chemistry",
    price: 850,
    specimen: "blood",
    turnaroundHours: 48,
    description: "Average blood sugar over the past 3 months.",
  },
  {
    code: "LIPID",
    name: "Lipid Panel",
    category: "Clinical Chemistry",
    price: 900,
    specimen: "blood",
    turnaroundHours: 24,
    fastingHours: 10,
    preparation: fasting(10),
    description: "Total cholesterol, HDL, LDL and triglycerides.",
  },
  {
    code: "CREA",
    name: "Creatinine",
    category: "Clinical Chemistry",
    price: 250,
    specimen: "blood",
    turnaroundHours: 24,
    description: "Checks how well the kidneys filter.",
  },
  {
    code: "BUA",
    name: "Blood Uric Acid",
    category: "Clinical Chemistry",
    price: 250,
    specimen: "blood",
    turnaroundHours: 24,
    description: "Screens for gout and kidney problems.",
  },
  {
    code: "SGPT",
    name: "SGPT (ALT)",
    category: "Clinical Chemistry",
    price: 300,
    specimen: "blood",
    turnaroundHours: 24,
    description: "A liver enzyme.",
  },
  {
    code: "SGOT",
    name: "SGOT (AST)",
    category: "Clinical Chemistry",
    price: 300,
    specimen: "blood",
    turnaroundHours: 24,
    description: "A liver and heart enzyme.",
  },
  {
    code: "UA",
    name: "Urinalysis",
    category: "Urinalysis & Fecalysis",
    price: 150,
    specimen: "urine",
    turnaroundHours: 24,
    preparation: "Collect the first morning urine, midstream, in the sterile cup provided.",
    description: "Physical, chemical and microscopic urine exam.",
  },
  {
    code: "FA",
    name: "Fecalysis",
    category: "Urinalysis & Fecalysis",
    price: 150,
    specimen: "stool",
    turnaroundHours: 24,
    preparation: "Collect a thumb-sized sample in the container provided. Avoid mixing with urine.",
    description: "Checks stool for parasites, blood and infection.",
  },
  {
    code: "PT",
    name: "Pregnancy Test (Urine)",
    category: "Urinalysis & Fecalysis",
    price: 200,
    specimen: "urine",
    turnaroundHours: 4,
    preparation: "First morning urine gives the most reliable result.",
    description: "Detects hCG in urine.",
  },
  {
    code: "HBSAG",
    name: "Hepatitis B Surface Antigen",
    category: "Serology & Immunology",
    price: 400,
    specimen: "blood",
    turnaroundHours: 48,
    description: "Screens for hepatitis B infection.",
  },
  {
    code: "DENGUE-NS1",
    name: "Dengue NS1 Antigen",
    category: "Serology & Immunology",
    price: 1200,
    specimen: "blood",
    turnaroundHours: 12,
    description: "Detects dengue in the first days of fever.",
  },
  {
    code: "TSH",
    name: "Thyroid Stimulating Hormone",
    category: "Serology & Immunology",
    price: 950,
    specimen: "blood",
    turnaroundHours: 48,
    description: "Screens thyroid function.",
  },
  {
    code: "URINE-CS",
    name: "Urine Culture & Sensitivity",
    category: "Microbiology",
    price: 1100,
    specimen: "urine",
    turnaroundHours: 72,
    preparation: "Collect midstream urine in the sterile cup before taking any antibiotics.",
    description: "Finds the bacteria behind a urinary infection and which antibiotics work.",
  },
  {
    code: "THROAT-CS",
    name: "Throat Swab Culture",
    category: "Microbiology",
    price: 900,
    specimen: "swab",
    turnaroundHours: 72,
    preparation: "Don't eat, drink or gargle for 1 hour before the swab.",
    description: "Checks for bacterial throat infection.",
  },
  {
    code: "PKG-BASIC",
    name: "Basic Health Package",
    category: "Health Packages",
    price: 1500,
    specimen: "blood",
    turnaroundHours: 48,
    fastingHours: 10,
    preparation: fasting(10),
    description: "CBC, FBS, lipid panel, creatinine and urinalysis.",
  },
  {
    code: "PKG-EXEC",
    name: "Executive Health Package",
    category: "Health Packages",
    price: 4500,
    specimen: "blood",
    turnaroundHours: 72,
    fastingHours: 10,
    preparation: fasting(10),
    description: "The basic package plus HbA1c, liver enzymes, uric acid, TSH and fecalysis.",
  },
];

/**
 * Adds the seed categories and procedures that don't exist yet. Existing rows
 * are left alone, so an admin's price changes survive a re-seed.
 * Returns how many procedures were added.
 */
export async function seedCatalog(db: Database): Promise<number> {
  await db
    .insert(procedureCategories)
    .values(categories.map((name) => ({ name })))
    .onConflictDoNothing();

  const categoryIds = new Map<string, string>();
  for (const name of categories) {
    const [row] = await db
      .select({ id: procedureCategories.id })
      .from(procedureCategories)
      .where(eq(sql`lower(${procedureCategories.name})`, name.toLowerCase()));
    if (!row) throw new Error(`Seed category ${name} is missing.`);
    categoryIds.set(name, row.id);
  }

  const added = await db
    .insert(labProcedures)
    .values(
      procedures.map((procedure) => ({
        code: procedure.code,
        name: procedure.name,
        categoryId: categoryIds.get(procedure.category) ?? "",
        priceCentavos: procedure.price * 100,
        specimen: procedure.specimen,
        turnaroundHours: procedure.turnaroundHours,
        fastingHours: procedure.fastingHours ?? 0,
        preparation: procedure.preparation ?? null,
        description: procedure.description,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: labProcedures.id });
  return added.length;
}

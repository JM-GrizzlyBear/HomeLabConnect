import { describe, expect, it } from "vitest";
import { CreateLabProcedure } from "../../../../src/application/catalog/CreateLabProcedure.js";
import { CreateProcedureCategory } from "../../../../src/application/catalog/CreateProcedureCategory.js";
import { DeleteProcedureCategory } from "../../../../src/application/catalog/DeleteProcedureCategory.js";
import { GetLabProcedure } from "../../../../src/application/catalog/GetLabProcedure.js";
import { ListLabProcedures } from "../../../../src/application/catalog/ListLabProcedures.js";
import { RenameProcedureCategory } from "../../../../src/application/catalog/RenameProcedureCategory.js";
import { SetLabProcedureActive } from "../../../../src/application/catalog/SetLabProcedureActive.js";
import { UpdateLabProcedure } from "../../../../src/application/catalog/UpdateLabProcedure.js";
import {
  CategoryInUse,
  CategoryNameTaken,
  CategoryNotFound,
  ProcedureCodeTaken,
  ProcedureNameTaken,
  ProcedureNotFound,
} from "../../../../src/domain/catalog/catalogErrors.js";
import {
  FixedClock,
  InMemoryLabProcedureRepository,
  InMemoryProcedureCategoryRepository,
  InMemoryPromotionRepository,
} from "../../../support/fakes.js";

function setup() {
  const categories = new InMemoryProcedureCategoryRepository();
  const procedures = new InMemoryLabProcedureRepository(categories);
  const promotions = new InMemoryPromotionRepository();
  const clock = new FixedClock();
  const hematology = categories.add("Hematology");
  return { categories, procedures, promotions, clock, hematology };
}

const details = (categoryId: string) => ({
  code: "cbc",
  name: "Complete Blood Count",
  categoryId,
  priceCentavos: 35_000,
  specimen: "blood" as const,
  turnaroundHours: 24,
  fastingHours: 0,
  preparation: null,
  description: "Red and white cells.",
});

describe("CreateLabProcedure", () => {
  it("creates an active procedure with an uppercase code and its category", async () => {
    const { categories, procedures, hematology } = setup();

    const created = await new CreateLabProcedure(procedures, categories).execute(
      details(hematology.id),
    );

    expect(created).toMatchObject({ code: "CBC", isActive: true, category: hematology });
  });

  it("rejects a code or a name another procedure uses", async () => {
    const { categories, procedures, hematology } = setup();
    procedures.add({ code: "CBC", name: "Old CBC", categoryId: hematology.id });
    procedures.add({ code: "OTHER", name: "complete blood count", categoryId: hematology.id });
    const create = new CreateLabProcedure(procedures, categories);

    await expect(create.execute(details(hematology.id))).rejects.toThrow(ProcedureCodeTaken);
    await expect(create.execute({ ...details(hematology.id), code: "NEW" })).rejects.toThrow(
      ProcedureNameTaken,
    );
  });

  it("rejects an unknown category", async () => {
    const { categories, procedures } = setup();

    await expect(
      new CreateLabProcedure(procedures, categories).execute(details("missing")),
    ).rejects.toThrow(CategoryNotFound);
  });
});

describe("UpdateLabProcedure", () => {
  it("keeps its own code and name, and changes the rest", async () => {
    const { categories, procedures, hematology } = setup();
    const cbc = procedures.add({
      code: "CBC",
      name: "Complete Blood Count",
      categoryId: hematology.id,
    });

    const updated = await new UpdateLabProcedure(procedures, categories).execute({
      id: cbc.id,
      ...details(hematology.id),
      priceCentavos: 40_000,
    });

    expect(updated.priceCentavos).toBe(40_000);
  });

  it("returns ProcedureNotFound for an unknown id", async () => {
    const { categories, procedures, hematology } = setup();

    await expect(
      new UpdateLabProcedure(procedures, categories).execute({
        id: "missing",
        ...details(hematology.id),
      }),
    ).rejects.toThrow(ProcedureNotFound);
  });
});

describe("SetLabProcedureActive and the viewer rules", () => {
  it("hides a deactivated procedure from people who can't manage the catalogue", async () => {
    const { procedures, promotions, clock, hematology } = setup();
    const cbc = procedures.add({ code: "CBC", categoryId: hematology.id });
    procedures.add({ code: "ESR", categoryId: hematology.id });

    await new SetLabProcedureActive(procedures).execute({ id: cbc.id, isActive: false });

    const list = new ListLabProcedures(procedures, promotions, clock);
    const base = { search: null, categoryId: null, isActive: null, page: 1, pageSize: 20 };
    const asViewer = await list.execute({ ...base, includeInactive: false });
    const asManager = await list.execute({ ...base, includeInactive: true });
    expect(asViewer.items.map((item) => item.code)).toEqual(["ESR"]);
    expect(asManager.total).toBe(2);

    const get = new GetLabProcedure(procedures, promotions, clock);
    await expect(get.execute({ id: cbc.id, includeInactive: false })).rejects.toThrow(
      ProcedureNotFound,
    );
    expect((await get.execute({ id: cbc.id, includeInactive: true })).isActive).toBe(false);
  });

  it("searches code and name", async () => {
    const { procedures, promotions, clock, hematology } = setup();
    procedures.add({ code: "CBC", name: "Complete Blood Count", categoryId: hematology.id });
    procedures.add({ code: "ESR", name: "Sedimentation Rate", categoryId: hematology.id });

    const result = await new ListLabProcedures(procedures, promotions, clock).execute({
      search: " blood ",
      categoryId: null,
      isActive: null,
      includeInactive: true,
      page: 1,
      pageSize: 20,
    });

    expect(result.items.map((item) => item.code)).toEqual(["CBC"]);
  });
});

describe("procedure categories", () => {
  it("creates and renames, refusing duplicate names ignoring case", async () => {
    const { categories, hematology } = setup();

    const chemistry = await new CreateProcedureCategory(categories).execute({
      name: " Chemistry ",
    });
    expect(chemistry).toMatchObject({ name: "Chemistry", procedureCount: 0 });

    await expect(
      new CreateProcedureCategory(categories).execute({ name: "hematology" }),
    ).rejects.toThrow(CategoryNameTaken);
    await expect(
      new RenameProcedureCategory(categories).execute({ id: chemistry.id, name: "HEMATOLOGY" }),
    ).rejects.toThrow(CategoryNameTaken);

    const renamed = await new RenameProcedureCategory(categories).execute({
      id: hematology.id,
      name: "Blood",
    });
    expect(renamed.name).toBe("Blood");
  });

  it("deletes an empty category but not one with procedures", async () => {
    const { categories, procedures, hematology } = setup();
    const empty = categories.add("Empty");
    procedures.add({ code: "CBC", categoryId: hematology.id });
    const remove = new DeleteProcedureCategory(categories);

    await remove.execute({ id: empty.id });
    await expect(remove.execute({ id: hematology.id })).rejects.toThrow(CategoryInUse);
    expect((await categories.list()).map((category) => category.name)).toEqual(["Hematology"]);
  });
});

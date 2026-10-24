import { describe, expect, it } from "vitest";
import { CreatePromotion } from "../../../../src/application/catalog/CreatePromotion.js";
import { GetPromotion } from "../../../../src/application/catalog/GetPromotion.js";
import { ListLabProcedures } from "../../../../src/application/catalog/ListLabProcedures.js";
import { ListPromotions } from "../../../../src/application/catalog/ListPromotions.js";
import { SetPromotionActive } from "../../../../src/application/catalog/SetPromotionActive.js";
import { UpdatePromotion } from "../../../../src/application/catalog/UpdatePromotion.js";
import {
  InvalidPromotion,
  PromotionNameTaken,
  PromotionNotFound,
} from "../../../../src/domain/catalog/catalogErrors.js";
import {
  FixedClock,
  InMemoryLabProcedureRepository,
  InMemoryProcedureCategoryRepository,
  InMemoryPromotionRepository,
} from "../../../support/fakes.js";

// FixedClock: 2026-01-15, 16:00 in Manila.
function setup() {
  const categories = new InMemoryProcedureCategoryRepository();
  const procedures = new InMemoryLabProcedureRepository(categories);
  const promotions = new InMemoryPromotionRepository();
  const clock = new FixedClock();
  const hematology = categories.add("Hematology");
  const cbc = procedures.add({ code: "CBC", categoryId: hematology.id, priceCentavos: 35_000 });
  const fbs = procedures.add({ code: "FBS", categoryId: hematology.id, priceCentavos: 20_000 });
  return { procedures, promotions, clock, cbc, fbs };
}

const diabetesCheck = (procedureIds: string[]) => ({
  name: "Diabetes Check",
  description: null,
  discountType: "fixed" as const,
  value: 5_000,
  startsOn: "2026-01-15",
  endsOn: "2026-01-31",
  appliesTo: "selected" as const,
  procedureIds,
});

describe("CreatePromotion", () => {
  it("creates a running promotion on the chosen procedures", async () => {
    const { procedures, promotions, clock, fbs } = setup();

    const created = await new CreatePromotion(promotions, procedures, clock).execute(
      diabetesCheck([fbs.id]),
    );

    expect(created).toMatchObject({
      name: "Diabetes Check",
      status: "running",
      procedureIds: [fbs.id],
    });
  });

  it("rejects a duplicate name and a procedure that doesn't exist", async () => {
    const { procedures, promotions, clock, fbs } = setup();
    promotions.add({ name: "diabetes check" });
    const create = new CreatePromotion(promotions, procedures, clock);

    await expect(create.execute(diabetesCheck([fbs.id]))).rejects.toThrow(PromotionNameTaken);
    await expect(create.execute({ ...diabetesCheck(["missing"]), name: "Other" })).rejects.toThrow(
      InvalidPromotion,
    );
  });
});

describe("UpdatePromotion and SetPromotionActive", () => {
  it("changes the details and switches it off", async () => {
    const { procedures, promotions, clock, fbs } = setup();
    const existing = promotions.add({ name: "Diabetes Check" });

    const updated = await new UpdatePromotion(promotions, procedures, clock).execute({
      id: existing.id,
      ...diabetesCheck([fbs.id]),
      value: 10_000,
    });
    expect(updated.value).toBe(10_000);

    const off = await new SetPromotionActive(promotions, clock).execute({
      id: existing.id,
      isActive: false,
    });
    expect(off.status).toBe("off");
  });

  it("returns PromotionNotFound for an unknown id", async () => {
    const { promotions, clock } = setup();

    await expect(
      new SetPromotionActive(promotions, clock).execute({ id: "missing", isActive: false }),
    ).rejects.toThrow(PromotionNotFound);
  });
});

describe("ListPromotions and GetPromotion", () => {
  it("shows viewers running promotions only, and managers everything", async () => {
    const { promotions, clock } = setup();
    const running = promotions.add({ name: "January Sale" });
    const scheduled = promotions.add({
      name: "February Sale",
      startsOn: "2026-02-01",
      endsOn: "2026-02-28",
    });
    promotions.add({ name: "Old Sale", startsOn: "2025-12-01", endsOn: "2025-12-31" });

    const list = new ListPromotions(promotions, clock);
    const asViewer = await list.execute({ status: "scheduled", includeAll: false });
    const asManager = await list.execute({ status: null, includeAll: true });
    const scheduledOnly = await list.execute({ status: "scheduled", includeAll: true });

    expect(asViewer.map((promotion) => promotion.name)).toEqual(["January Sale"]);
    expect(asManager).toHaveLength(3);
    expect(scheduledOnly.map((promotion) => promotion.name)).toEqual(["February Sale"]);

    const get = new GetPromotion(promotions, clock);
    expect((await get.execute({ id: running.id, includeAll: false })).status).toBe("running");
    await expect(get.execute({ id: scheduled.id, includeAll: false })).rejects.toThrow(
      PromotionNotFound,
    );
  });
});

describe("prices in the catalogue", () => {
  it("shows each procedure's best running promotion", async () => {
    const { procedures, promotions, clock, cbc, fbs } = setup();
    promotions.add({ name: "20% off everything" });
    promotions.add({ ...diabetesCheck([fbs.id]), value: 15_000 });
    promotions.add({ name: "Switched off", value: 90, isActive: false });

    const { items } = await new ListLabProcedures(procedures, promotions, clock).execute({
      search: null,
      categoryId: null,
      isActive: null,
      includeInactive: false,
      page: 1,
      pageSize: 20,
    });

    const byCode = Object.fromEntries(items.map((item) => [item.code, item.promotion]));
    expect(byCode[cbc.code]).toMatchObject({
      name: "20% off everything",
      discountedPriceCentavos: 28_000,
    });
    expect(byCode[fbs.code]).toMatchObject({
      name: "Diabetes Check",
      discountedPriceCentavos: 5_000,
    });
  });

  it("drops the sale price once the promotion ends", async () => {
    const { procedures, promotions, clock } = setup();
    promotions.add({ name: "Ends today", startsOn: "2026-01-01", endsOn: "2026-01-15" });
    const list = new ListLabProcedures(procedures, promotions, clock);
    const query = {
      search: null,
      categoryId: null,
      isActive: null,
      includeInactive: false,
      page: 1,
      pageSize: 20,
    };

    expect((await list.execute(query)).items[0]?.promotion).not.toBeNull();
    clock.advanceMinutes(8 * 60); // midnight in Manila
    expect((await list.execute(query)).items[0]?.promotion).toBeNull();
  });
});

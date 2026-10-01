import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, toasts } from "../support/renderApp";

const hematology = { id: "5a0e2c1b-3d4f-4a6b-8c9d-0e1f2a3b4c5d", name: "Hematology" };

const procedure = (id: string, code: string, name: string, priceCentavos: number) => ({
  id,
  code,
  name,
  category: hematology,
  priceCentavos,
  specimen: "blood",
  turnaroundHours: 24,
  fastingHours: 0,
  preparation: null,
  description: null,
  isActive: true,
  promotion: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const cbc = procedure(
  "7c2a4e3d-5f6b-4c8d-8e1f-2a3b4c5d6e7f",
  "CBC",
  "Complete Blood Count",
  35_000,
);
const fbs = procedure("8d3b5f4e-6a7c-4d9e-9f2a-3b4c5d6e7f80", "FBS", "Fasting Blood Sugar", 20_000);

const PROCEDURES = "GET /api/catalog/procedures?status=active&pageSize=100";
const procedureList = () => ({
  status: 200,
  body: { items: [cbc, fbs], total: 2, page: 1, pageSize: 100 },
});

const savedPromotion = {
  id: "9e4c6a5f-7b8d-4e0f-8a3b-4c5d6e7f8091",
  name: "Diabetes Check",
  description: null,
  discountType: "fixed",
  value: 5_000,
  startsOn: "2026-10-01",
  endsOn: "2026-10-31",
  appliesTo: "selected",
  procedureIds: [fbs.id],
  isActive: true,
  status: "running",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

describe("PromotionEditorPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("homelabconnect.token", "tkn");
  });

  it("previews the sale price as the discount is typed", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [PROCEDURES]: procedureList,
    });
    renderApp("/app/catalog/promotions/new");

    await userEvent.type(await screen.findByRole("textbox", { name: "Percent off" }), "20");

    const cbcLine = screen.getByText("Complete Blood Count").closest("li")!;
    expect(within(cbcLine).getByText("₱280.00")).toBeInTheDocument();
  });

  it("creates a standing discount with no end date", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [PROCEDURES]: procedureList,
      "POST /api/catalog/promotions": (body) => {
        sent = body;
        return { status: 201, body: { ...savedPromotion, ...(body as object) } };
      },
      "GET /api/catalog/promotions": () => ({ status: 200, body: [] }),
    });
    renderApp("/app/catalog/promotions/new");

    await userEvent.type(await screen.findByRole("textbox", { name: "Name" }), "Senior & PWD");
    await userEvent.click(screen.getByLabelText("First day"));
    const calendar = within(await screen.findByRole("dialog"));
    await userEvent.click(calendar.getAllByRole("button", { name: / 1st, / })[0]!);
    await userEvent.click(screen.getByRole("radio", { name: /No end date/ }));
    expect(screen.queryByLabelText("Last day")).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "Percent off" }), "20");
    await userEvent.click(screen.getByRole("button", { name: "Create promotion" }));

    expect(await toasts().findByText("Promotion created")).toBeInTheDocument();
    expect(sent).toMatchObject({ name: "Senior & PWD", value: 20, endsOn: null });
  });

  it("asks for procedures when it applies to selected ones only", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [PROCEDURES]: procedureList,
    });
    renderApp("/app/catalog/promotions/new");

    await userEvent.click(
      await screen.findByRole("radio", { name: "Only the procedures I choose" }),
    );
    expect(screen.getByRole("checkbox", { name: /Fasting Blood Sugar/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Create promotion" }));

    expect(screen.getByText("Enter a name.")).toBeInTheDocument();
    expect(screen.getByText("Choose the first day.")).toBeInTheDocument();
  });

  it("loads a peso promotion and saves its changes", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [PROCEDURES]: procedureList,
      [`GET /api/catalog/promotions/${savedPromotion.id}`]: () => ({
        status: 200,
        body: savedPromotion,
      }),
      [`PUT /api/catalog/promotions/${savedPromotion.id}`]: (body) => {
        sent = body;
        return { status: 200, body: { ...savedPromotion, ...(body as object) } };
      },
      "GET /api/catalog/promotions": () => ({ status: 200, body: [savedPromotion] }),
    });
    const router = renderApp(`/app/catalog/promotions/${savedPromotion.id}`);

    const amount = await screen.findByRole("textbox", { name: "Amount off" });
    expect(amount).toHaveValue("50.00");
    expect(screen.getByRole("checkbox", { name: /Fasting Blood Sugar/ })).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: /Complete Blood Count/ }));
    await userEvent.clear(amount);
    await userEvent.type(amount, "75");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await toasts().findByText("Promotion saved")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/app/catalog/promotions");
    expect(sent).toMatchObject({
      discountType: "fixed",
      value: 7_500,
      appliesTo: "selected",
      procedureIds: [fbs.id, cbc.id],
    });
  });

  it("shows a taken name under the Name field", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [PROCEDURES]: procedureList,
      [`GET /api/catalog/promotions/${savedPromotion.id}`]: () => ({
        status: 200,
        body: savedPromotion,
      }),
      [`PUT /api/catalog/promotions/${savedPromotion.id}`]: () => ({
        status: 409,
        body: {
          error: {
            code: "promotion_name_taken",
            message: "A promotion with this name already exists.",
          },
        },
      }),
    });
    renderApp(`/app/catalog/promotions/${savedPromotion.id}`);

    await screen.findByRole("textbox", { name: "Amount off" });
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("A promotion with this name already exists."),
    ).toBeInTheDocument();
  });
});

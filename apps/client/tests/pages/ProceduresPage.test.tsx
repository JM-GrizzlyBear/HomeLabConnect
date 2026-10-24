import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const hematology = { id: "5a0e2c1b-3d4f-4a6b-8c9d-0e1f2a3b4c5d", name: "Hematology" };
const chemistry = { id: "6b1f3d2c-4e5a-4b7c-9d0e-1f2a3b4c5d6e", name: "Clinical Chemistry" };

const procedure = (overrides: Record<string, unknown> = {}) => ({
  id: "7c2a4e3d-5f6b-4c8d-8e1f-2a3b4c5d6e7f",
  code: "CBC",
  name: "Complete Blood Count",
  category: hematology,
  priceCentavos: 35_000,
  specimen: "blood",
  turnaroundHours: 24,
  fastingHours: 0,
  preparation: null,
  description: "Red and white cells, hemoglobin and platelets.",
  isActive: true,
  promotion: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const fbs = procedure({
  id: "8d3b5f4e-6a7c-4d9e-9f2a-3b4c5d6e7f80",
  code: "FBS",
  name: "Fasting Blood Sugar",
  category: chemistry,
  priceCentavos: 20_000,
  fastingHours: 8,
  preparation: "Fast for 8 hours before collection. Water is allowed.",
});

const page = (items: unknown[]) => ({
  status: 200,
  body: { items, total: items.length, page: 1, pageSize: 20 },
});

const categories = () => ({
  status: 200,
  body: [
    { ...chemistry, procedureCount: 1 },
    { ...hematology, procedureCount: 1 },
  ],
});

describe("ProceduresPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows patients a read-only catalogue with prices and preparation details", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/catalog/categories": categories,
      "GET /api/catalog/procedures?page=1&pageSize=20": () => page([procedure(), fbs]),
    });
    renderApp("/app/catalog/procedures");

    const row = (await screen.findByText("Fasting Blood Sugar")).closest("tr")!;
    expect(within(row).getByText("₱200.00")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "New procedure" })).not.toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Actions for Fasting Blood Sugar" }));
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: "View details" }));

    const sheet = within(await screen.findByRole("dialog"));
    expect(sheet.getByText("Fast 8 hours")).toBeInTheDocument();
    expect(sheet.getByText(/Water is allowed/)).toBeInTheDocument();
  });

  it("shows a sale price next to the struck-through list price", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/catalog/categories": categories,
      "GET /api/catalog/procedures?page=1&pageSize=20": () =>
        page([
          procedure({
            promotion: {
              id: "9e4c6a5f-7b8d-4e0f-8a3b-4c5d6e7f8091",
              name: "Senior Week",
              discountedPriceCentavos: 28_000,
            },
          }),
        ]),
    });
    renderApp("/app/catalog/procedures");

    const row = (await screen.findByText("Complete Blood Count")).closest("tr")!;
    expect(within(row).getByText("₱350.00").tagName).toBe("S");
    expect(within(row).getByText("₱280.00")).toBeInTheDocument();
    expect(within(row).getByText("Senior Week")).toBeInTheDocument();
  });

  it("filters by category and search", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/catalog/categories": categories,
      "GET /api/catalog/procedures?page=1&pageSize=20": () => page([procedure(), fbs]),
      "GET /api/catalog/procedures?q=sugar&page=1&pageSize=20": () => page([fbs]),
    });
    renderApp("/app/catalog/procedures");
    await screen.findByText("Complete Blood Count");

    await userEvent.type(screen.getByRole("searchbox", { name: "Search procedures" }), "sugar");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await expect.poll(() => screen.queryByText("Complete Blood Count")).toBeNull();
    expect(screen.getByText("Fasting Blood Sugar")).toBeInTheDocument();
  });

  it("lets an admin deactivate a procedure after confirming", async () => {
    let active = true;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/catalog/categories": categories,
      "GET /api/catalog/procedures?page=1&pageSize=20": () =>
        page([procedure({ isActive: active })]),
      [`PATCH /api/catalog/procedures/${procedure().id}/status`]: (body) => {
        active = (body as { isActive: boolean }).isActive;
        return { status: 200, body: procedure({ isActive: active }) };
      },
    });
    renderApp("/app/catalog/procedures");

    await userEvent.click(
      await screen.findByRole("button", { name: "Actions for Complete Blood Count" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Deactivate" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Deactivate" }),
    );

    expect(await toasts().findByText("Procedure deactivated")).toBeInTheDocument();
    expect(await screen.findByText("Inactive")).toBeInTheDocument();
  });

  it("explains why a category in use can't be deleted", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/catalog/categories": categories,
      "GET /api/catalog/procedures?page=1&pageSize=20": () => page([procedure()]),
      [`DELETE /api/catalog/categories/${hematology.id}`]: () => ({
        status: 409,
        body: {
          error: {
            code: "category_in_use",
            message: "1 procedure is in this category. Move them to another category first.",
          },
        },
      }),
    });
    renderApp("/app/catalog/procedures");

    await userEvent.click(await screen.findByRole("button", { name: "Categories" }));
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Delete Hematology",
      }),
    );
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete category",
      }),
    );

    expect(await screen.findByText(/1 procedure is in this category/)).toBeInTheDocument();
  });

  it("adds a category, showing a duplicate name inline", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/catalog/categories": categories,
      "GET /api/catalog/procedures?page=1&pageSize=20": () => page([procedure()]),
      "POST /api/catalog/categories": () => ({
        status: 409,
        body: {
          error: {
            code: "category_name_taken",
            message: "A category with this name already exists.",
          },
        },
      }),
    });
    renderApp("/app/catalog/procedures");

    await userEvent.click(await screen.findByRole("button", { name: "Categories" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.type(dialog.getByRole("textbox", { name: "New category" }), "hematology");
    await userEvent.click(dialog.getByRole("button", { name: "Add category" }));

    expect(
      await dialog.findByText("A category with this name already exists."),
    ).toBeInTheDocument();
  });
});

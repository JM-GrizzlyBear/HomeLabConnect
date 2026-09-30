import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, toasts } from "../support/renderApp";

const hematology = { id: "5a0e2c1b-3d4f-4a6b-8c9d-0e1f2a3b4c5d", name: "Hematology" };

const categories = () => ({ status: 200, body: [{ ...hematology, procedureCount: 0 }] });

const saved = {
  id: "7c2a4e3d-5f6b-4c8d-8e1f-2a3b4c5d6e7f",
  code: "VIT-D",
  name: "Vitamin D",
  category: hematology,
  priceCentavos: 180_000,
  specimen: "blood",
  turnaroundHours: 72,
  fastingHours: 0,
  preparation: null,
  description: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

async function choose(label: string, option: string) {
  await userEvent.click(screen.getByRole("combobox", { name: label }));
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

async function fillForm() {
  await screen.findByRole("textbox", { name: "Code" });
  await userEvent.type(screen.getByRole("textbox", { name: "Code" }), "vit-d");
  await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Vitamin D");
  await choose("Category", "Hematology");
  await userEvent.type(screen.getByRole("textbox", { name: "Price" }), "1,800");
  await choose("Specimen", "Blood");
  const turnaround = screen.getByRole("spinbutton", { name: "Results in (hours)" });
  await userEvent.clear(turnaround);
  await userEvent.type(turnaround, "72");
}

describe("ProcedureEditorPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("homelabconnect.token", "tkn");
  });

  it("shows field errors before sending anything", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/catalog/categories": categories,
    });
    renderApp("/app/catalog/procedures/new");

    await userEvent.click(await screen.findByRole("button", { name: "Add procedure" }));

    expect(screen.getByText("Enter a code of at least 2 characters.")).toBeInTheDocument();
    expect(screen.getByText("Choose a category.")).toBeInTheDocument();
    expect(screen.getByText("Enter a price.")).toBeInTheDocument();
  });

  it("sends the price in centavos and returns to the list", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/catalog/categories": categories,
      "POST /api/catalog/procedures": (body) => {
        sent = body;
        return { status: 201, body: saved };
      },
      "GET /api/catalog/procedures?page=1&pageSize=20": () => ({
        status: 200,
        body: { items: [saved], total: 1, page: 1, pageSize: 20 },
      }),
    });
    const router = renderApp("/app/catalog/procedures/new");

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Add procedure" }));

    expect(await toasts().findByText("Procedure added")).toBeInTheDocument();
    expect(sent).toMatchObject({
      code: "VIT-D",
      categoryId: hematology.id,
      priceCentavos: 180_000,
      turnaroundHours: 72,
      fastingHours: 0,
    });
    expect(router.state.location.pathname).toBe("/app/catalog/procedures");
  });

  it("shows a taken code under the Code field", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/catalog/categories": categories,
      "POST /api/catalog/procedures": () => ({
        status: 409,
        body: {
          error: {
            code: "procedure_code_taken",
            message: "Another procedure already uses this code.",
          },
        },
      }),
    });
    renderApp("/app/catalog/procedures/new");

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Add procedure" }));

    expect(
      await screen.findByText("Another procedure already uses this code."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("loads an existing procedure with its price in pesos", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/catalog/categories": categories,
      [`GET /api/catalog/procedures/${saved.id}`]: () => ({ status: 200, body: saved }),
    });
    renderApp(`/app/catalog/procedures/${saved.id}`);

    expect(await screen.findByRole("textbox", { name: "Price" })).toHaveValue("1800.00");
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue("VIT-D");
  });
});

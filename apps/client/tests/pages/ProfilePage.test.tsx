import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser } from "../support/renderApp";

const patientProfile = {
  id: sampleUser.id,
  email: sampleUser.email,
  role: "patient" as const,
  firstName: "Juan",
  lastName: "Dela Cruz",
  phone: "09171234567",
  patient: { birthDate: null, address: null },
};

describe("ProfilePage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("homelabconnect.token", "tkn");
  });

  it("saves a patient's details and updates the name in the sidebar", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/users/me/profile": () => ({ status: 200, body: patientProfile }),
      "PATCH /api/users/me/profile": (body) => {
        sent = body;
        return {
          status: 200,
          body: {
            ...patientProfile,
            firstName: "Juanito",
            patient: { birthDate: null, address: "12 Rizal St, Makati" },
          },
        };
      },
    });
    renderApp("/app/profile");

    const firstName = await screen.findByLabelText("First name");
    expect(screen.getByLabelText("Email")).toHaveValue("juan@example.com");
    await userEvent.clear(firstName);
    await userEvent.type(firstName, "Juanito");
    await userEvent.type(screen.getByLabelText(/Home address/), "12 Rizal St, Makati");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Your profile has been saved.")).toBeInTheDocument();
    expect(screen.getByText("Juanito Dela Cruz")).toBeInTheDocument();
    expect(sent).toEqual({
      firstName: "Juanito",
      lastName: "Dela Cruz",
      phone: "09171234567",
      patient: { birthDate: null, address: "12 Rizal St, Makati" },
    });
  });

  it("hides patient fields from staff", async () => {
    const doctor = { ...sampleUser, role: "doctor" as const };
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: doctor }),
      "GET /api/users/me/profile": () => ({
        status: 200,
        body: { ...patientProfile, role: "doctor", phone: null, patient: null },
      }),
    });
    renderApp("/app/profile");

    expect(await screen.findByLabelText("First name")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Home address/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Birth date/)).not.toBeInTheDocument();
  });

  it("changes the password from the profile page", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/users/me/profile": () => ({ status: 200, body: patientProfile }),
      "PUT /api/auth/password": () => ({ status: 200, body: sampleUser }),
    });
    renderApp("/app/profile");

    await userEvent.type(await screen.findByLabelText("Current password"), "Password123");
    await userEvent.type(screen.getByLabelText("New password"), "NewPassword456");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "NewPassword456");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText(/Password changed/)).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toHaveValue("");
  });
});

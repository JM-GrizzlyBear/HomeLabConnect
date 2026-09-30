import { loginRequestSchema } from "@homelabconnect/shared";
import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/api/apiClient";
import { FeedbackProvider } from "../../src/feedback/FeedbackProvider";
import { useFormState } from "../../src/forms/useFormState";

const wrapper = ({ children }: { children: ReactNode }) => (
  <FeedbackProvider>{children}</FeedbackProvider>
);

const renderForm = () => renderHook(() => useFormState({ email: "", password: "" }), { wrapper });

describe("useFormState", () => {
  it("updates values through field() and set()", () => {
    const { result } = renderForm();

    act(() => result.current.field("email").onChange({ target: { value: "ana@example.com" } }));
    act(() => result.current.set("password")("secret123"));

    expect(result.current.values).toEqual({ email: "ana@example.com", password: "secret123" });
  });

  it("shows validation issues under their fields without sending", async () => {
    const { result } = renderForm();
    const send = vi.fn(async () => {});

    await act(() =>
      result.current.submit(loginRequestSchema.safeParse(result.current.values), send, {
        title: "Couldn't sign you in",
      }),
    );

    expect(send).not.toHaveBeenCalled();
    expect(result.current.field("email").error).toBeTruthy();
  });

  it("is submitting while sending, then clears old errors", async () => {
    const { result } = renderForm();
    act(() => result.current.setErrors({ email: "Old error" }));
    let finish!: () => void;
    const send = () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      });

    let done!: Promise<void>;
    act(() => {
      done = result.current.submit({ success: true, data: null }, send, { title: "x" });
    });
    expect(result.current.submitting).toBe(true);
    expect(result.current.errors).toEqual({});

    await act(async () => {
      finish();
      await done;
    });
    expect(result.current.submitting).toBe(false);
  });

  it("puts an API error code under its field", async () => {
    const { result } = renderForm();
    const send = async () => {
      throw new ApiError(409, "email_taken", "That email is taken.");
    };

    await act(() =>
      result.current.submit({ success: true, data: null }, send, {
        title: "x",
        fieldByCode: { email_taken: "email" },
      }),
    );

    expect(result.current.errors).toEqual({ email: "That email is taken." });
  });

  it("opens an error dialog for anything else", async () => {
    const { result } = renderForm();
    const send = async () => {
      throw new ApiError(500, "internal_error", "Something went wrong.");
    };

    await act(() =>
      result.current.submit({ success: true, data: null }, send, { title: "Couldn't save" }),
    );

    expect(await screen.findByText("Couldn't save")).toBeInTheDocument();
    expect(result.current.errors).toEqual({});
  });
});

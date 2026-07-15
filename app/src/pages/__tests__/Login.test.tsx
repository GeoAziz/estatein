import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../lib/api-client", () => ({
  apiClient: {
    getMe: vi.fn().mockRejectedValue(new Error("not logged in")),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reportError: vi.fn(),
    trackEvent: vi.fn(),
  },
}));

const { AuthProvider } = await import("../../lib/auth-api");
const { default: Login } = await import("../Login");

describe("Login page", () => {
  it("renders email and password fields", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it("shows a validation error for an invalid email", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = await screen.findByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailInput, { target: { value: "not-an-email" } });
    // fireEvent.click on the submit button would go through native
    // constraint validation for type="email" and never dispatch a submit
    // event at all — dispatch submit directly to exercise the app's own
    // validation logic in handleSubmit.
    fireEvent.submit(emailInput.closest("form")!);

    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
  });
});

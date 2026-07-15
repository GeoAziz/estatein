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
const { default: SignUp } = await import("../SignUp");

describe("SignUp page", () => {
  it("shows required-field errors when submitting an empty form", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SignUp />
        </AuthProvider>
      </MemoryRouter>
    );

    const submit = await screen.findByRole("button", { name: /sign up/i });
    fireEvent.click(submit);

    expect(await screen.findAllByText(/this field is required/i)).not.toHaveLength(0);
  });

  it("pre-selects the agent role when ?role=agent is present", async () => {
    render(
      <MemoryRouter initialEntries={["/signup?role=agent&plan=professional"]}>
        <AuthProvider>
          <SignUp />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/create agent account/i)).toBeInTheDocument();
  });
});

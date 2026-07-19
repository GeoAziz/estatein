import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockLogin = vi.fn();
const mockVerifyLogin2FA = vi.fn();
const mockRequestOtpLogin = vi.fn();
const mockVerifyOtpLogin = vi.fn();
const mockVerifyBackupCode = vi.fn();

vi.mock("../../lib/api-client", () => ({
  apiClient: {
    getMe: vi.fn().mockRejectedValue(new Error("not logged in")),
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    reportError: vi.fn(),
    trackEvent: vi.fn(),
    verifyLogin2FA: mockVerifyLogin2FA,
    requestOtpLogin: mockRequestOtpLogin,
    verifyOtpLogin: mockVerifyOtpLogin,
    verifyBackupCode: mockVerifyBackupCode,
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

  it("shows a 2FA code step when the backend reports requires2FA, and completes login on a valid code", async () => {
    mockLogin.mockResolvedValueOnce({ requires2FA: true, userId: "user_1" });
    mockVerifyLogin2FA.mockResolvedValueOnce({
      user: { id: "user_1", email: "buyer@example.com", name: "Buyer", role: "buyer" },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByPlaceholderText(/you@example.com/i), { target: { value: "buyer@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /log in$/i }));

    expect(await screen.findByText(/two-factor verification/i)).toBeInTheDocument();

    const codeInput = screen.getByPlaceholderText("123456");
    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify & log in/i }));

    await waitFor(() => expect(mockVerifyLogin2FA).toHaveBeenCalledWith("user_1", "123456"));
  });

  it("allows switching to a backup code during 2FA verification", async () => {
    mockLogin.mockResolvedValueOnce({ requires2FA: true, userId: "user_1" });
    mockVerifyBackupCode.mockResolvedValueOnce({
      user: { id: "user_1", email: "buyer@example.com", name: "Buyer", role: "buyer" },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByPlaceholderText(/you@example.com/i), { target: { value: "buyer@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /log in$/i }));

    expect(await screen.findByText(/two-factor verification/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/use a backup code instead/i));
    expect(await screen.findByText(/enter one of your unused backup codes/i)).toBeInTheDocument();

    const codeInput = screen.getByPlaceholderText("A1B2C3D4");
    fireEvent.change(codeInput, { target: { value: "a1b2c3d4" } });
    fireEvent.click(screen.getByRole("button", { name: /verify & log in/i }));

    await waitFor(() => expect(mockVerifyBackupCode).toHaveBeenCalledWith("user_1", "A1B2C3D4"));
  });

  it("supports logging in with a one-time code instead of a password", async () => {
    mockRequestOtpLogin.mockResolvedValueOnce({ message: "sent" });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByText(/log in with a one-time code instead/i));
    expect(await screen.findByText(/log in with a code/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: "buyer@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send code/i }));

    expect(await screen.findByPlaceholderText("123456")).toBeInTheDocument();
    expect(mockRequestOtpLogin).toHaveBeenCalledWith("buyer@example.com");
  });
});

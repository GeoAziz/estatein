import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../lib/api-client", () => ({
  apiClient: {
    getMe: vi.fn().mockResolvedValue({
      user: { id: "pm_1", email: "pm@example.com", name: "Pat Manager", role: "property_manager" },
    }),
    getTenants: vi.fn().mockResolvedValue({ tenants: [] }),
    getMaintenanceRequests: vi.fn().mockResolvedValue({ requests: [] }),
  },
}));

const { AuthProvider } = await import("../../../lib/auth-api");
const { ToastProvider } = await import("../../../lib/toast");
const { ConfirmProvider } = await import("../../../lib/confirm");
const { default: PropertyManagerDashboard } = await import("../PropertyManagerDashboard");

describe("PropertyManagerDashboard", () => {
  it("renders the welcome header and empty states once data loads", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <PropertyManagerDashboard />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/welcome, pat/i)).toBeInTheDocument();
    expect(await screen.findByText(/no tenants yet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /maintenance requests/i }));
    expect(await screen.findByText(/no maintenance requests yet/i)).toBeInTheDocument();
  });
});

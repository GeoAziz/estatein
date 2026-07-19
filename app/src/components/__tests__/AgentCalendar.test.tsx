import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockGetAvailabilitySlots = vi.fn();
const mockCreateAvailabilitySlots = vi.fn();
const mockDeleteAvailabilitySlot = vi.fn();

vi.mock("../../lib/api-client", () => ({
  apiClient: {
    getAvailabilitySlots: mockGetAvailabilitySlots,
    createAvailabilitySlots: mockCreateAvailabilitySlots,
    deleteAvailabilitySlot: mockDeleteAvailabilitySlot,
  },
}));

const { default: AgentCalendar } = await import("../AgentCalendar");

describe("AgentCalendar", () => {
  it("renders a 7-day week grid and loads slots for the agent", async () => {
    mockGetAvailabilitySlots.mockResolvedValueOnce({ slots: [] });

    render(<AgentCalendar agentId="agent_1" />);

    expect(await screen.findByText(/availability calendar/i)).toBeInTheDocument();
    await waitFor(() => expect(mockGetAvailabilitySlots).toHaveBeenCalledWith("agent_1", expect.any(String), expect.any(String)));
  });

  it("shows an existing unbooked slot with a delete control", async () => {
    const today = new Date().toISOString();
    mockGetAvailabilitySlots.mockResolvedValueOnce({
      slots: [{ id: "slot_1", date: today, startTime: "09:00", endTime: "10:00", isBooked: false }],
    });

    render(<AgentCalendar agentId="agent_1" />);

    expect(await screen.findByText("09:00–10:00")).toBeInTheDocument();
  });

  it("creates a new slot via the add-slot form", async () => {
    mockGetAvailabilitySlots.mockResolvedValue({ slots: [] });
    mockCreateAvailabilitySlots.mockResolvedValueOnce({ slots: [], count: 1 });

    render(<AgentCalendar agentId="agent_1" />);

    const addButtons = await screen.findAllByText(/add slot/i);
    fireEvent.click(addButtons[0]);

    const addConfirmButtons = screen.getAllByRole("button", { name: /^add$/i });
    fireEvent.click(addConfirmButtons[0]);

    await waitFor(() => expect(mockCreateAvailabilitySlots).toHaveBeenCalledTimes(1));
  });
});

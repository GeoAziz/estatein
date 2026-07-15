import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Pricing from "../Pricing";

describe("Pricing page", () => {
  it("renders all three tiers with working 'Get Started' links to signup", () => {
    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    );

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();

    const ctas = screen.getAllByRole("link", { name: /get started/i });
    expect(ctas).toHaveLength(3);
    expect(ctas[0]).toHaveAttribute("href", "/signup?role=agent&plan=starter");
    expect(ctas[1]).toHaveAttribute("href", "/signup?role=agent&plan=professional");
    expect(ctas[2]).toHaveAttribute("href", "/signup?role=agent&plan=enterprise");
  });
});

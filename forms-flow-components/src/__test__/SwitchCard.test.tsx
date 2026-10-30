import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SwitchCard } from "../components/CustomComponents/SwitchCard";

describe("SwitchCard Component", () => {
  it("renders the label as the switch's accessible name", () => {
    render(<SwitchCard label="Assistance is OFF" />);
    expect(
      screen.getByRole("switch", { name: "Assistance is OFF" })
    ).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("switch-card")).not.toHaveClass(
      "switch-card--checked"
    );
  });

  it("applies the checked modifier and calls onChange when toggled", () => {
    const onChange = jest.fn();
    render(<SwitchCard checked label="Assistance is ON" onChange={onChange} />);
    expect(screen.getByTestId("switch-card")).toHaveClass(
      "switch-card--checked"
    );
    fireEvent.click(screen.getByTestId("switch-card-switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("renders the description only when provided", () => {
    const { rerender } = render(
      <SwitchCard label="Title" description="Details" dataTestId="ai" />
    );
    expect(screen.getByTestId("ai-description")).toHaveTextContent("Details");
    expect(screen.getByTestId("ai")).not.toHaveClass(
      "switch-card--no-description"
    );

    rerender(<SwitchCard label="Title" dataTestId="ai" />);
    expect(screen.queryByTestId("ai-description")).not.toBeInTheDocument();
    expect(screen.getByTestId("ai")).toHaveClass("switch-card--no-description");
  });

  it("maps colour overrides onto CSS custom properties", () => {
    render(
      <SwitchCard
        label="Title"
        colors={{ checkedBorder: "red", label: "var(--ff-primary)" }}
      />
    );
    const card = screen.getByTestId("switch-card");
    expect(card.style.getPropertyValue("--switch-card-checked-border")).toBe(
      "red"
    );
    expect(card.style.getPropertyValue("--switch-card-label-color")).toBe(
      "var(--ff-primary)"
    );
    expect(card.style.getPropertyValue("--switch-card-border")).toBe("");
  });

  it("does not toggle while disabled", () => {
    const onChange = jest.fn();
    render(<SwitchCard disabled label="Locked" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("switch-card-switch"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

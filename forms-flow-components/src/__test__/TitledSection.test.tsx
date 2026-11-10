import React from "react";
import { render, screen } from "@testing-library/react";
import { TitledSection } from "../components/CustomComponents/TitledSection";

describe("TitledSection Component", () => {
  it("names the section by its title and renders its content", () => {
    render(
      <TitledSection title="Required content">
        <p>Privacy notice</p>
      </TitledSection>
    );
    expect(
      screen.getByRole("region", { name: "Required content" })
    ).toContainElement(screen.getByText("Privacy notice"));
    expect(
      screen.getByRole("heading", { level: 2, name: "Required content" })
    ).toBeInTheDocument();
  });

  it("shows the note only when given one", () => {
    const { rerender } = render(<TitledSection title="Optional content" />);
    expect(screen.queryByTestId("titled-section-note")).not.toBeInTheDocument();

    rerender(
      <TitledSection title="Optional content" note="2 available, none in use" />
    );
    expect(screen.getByTestId("titled-section-note")).toHaveTextContent(
      "2 available, none in use"
    );
  });

  it("uses the requested heading level, class and test id", () => {
    render(
      <TitledSection
        title="Optional content"
        headingLevel={3}
        className="extra"
        dataTestId="optional"
      />
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveAttribute(
      "data-testid",
      "optional-title"
    );
    expect(screen.getByTestId("optional")).toHaveClass(
      "titled-section",
      "extra"
    );
  });
});

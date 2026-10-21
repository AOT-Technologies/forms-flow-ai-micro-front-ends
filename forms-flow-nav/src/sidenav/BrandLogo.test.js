import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrandLogo } from "./Sidebar";

describe("BrandLogo (sidebar logo)", () => {
  it("shows the tenant logo with the display name as alt text", () => {
    render(
      <BrandLogo
        logoUrl="https://cdn.example.com/logo.png"
        displayName="Acme"
      />
    );
    const img = screen.getByTestId("tenant-logo");
    expect(img).toHaveAttribute("src", "https://cdn.example.com/logo.png");
    expect(img).toHaveAttribute("alt", "Acme");
  });

  it("falls back to the formsflow logo when no logo is set", () => {
    const { container } = render(
      <BrandLogo logoUrl={null} displayName={null} />
    );
    expect(screen.queryByTestId("tenant-logo")).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-mock="ApplicationLogoFull"]')
    ).toBeInTheDocument();
  });

  it("falls back to the formsflow logo when the image fails to load", () => {
    const { container } = render(
      <BrandLogo logoUrl="https://cdn.example.com/missing.png" />
    );
    fireEvent.error(screen.getByTestId("tenant-logo"));
    expect(screen.queryByTestId("tenant-logo")).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-mock="ApplicationLogoFull"]')
    ).toBeInTheDocument();
  });

  it("tries again when a new logo arrives after a failure", () => {
    const { rerender } = render(
      <BrandLogo logoUrl="https://cdn.example.com/missing.png" />
    );
    fireEvent.error(screen.getByTestId("tenant-logo"));
    rerender(<BrandLogo logoUrl="https://cdn.example.com/new.png" />);
    expect(screen.getByTestId("tenant-logo")).toHaveAttribute(
      "src",
      "https://cdn.example.com/new.png"
    );
  });
});

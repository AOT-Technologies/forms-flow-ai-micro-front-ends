import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Loading from "../components/Loading/Loading";

describe("Loading Component", () => {
  it("renders loading component with correct test id", () => {
    render(<Loading />);
    const loadingElement = screen.getByTestId("loading-component");
    expect(loadingElement).toBeInTheDocument();
  });

  it("renders with loader-container class", () => {
    render(<Loading />);
    const loadingElement = screen.getByTestId("loading-component");
    expect(loadingElement).toHaveClass("loader-container");
  });

  it("renders SpinnerSVG with correct fill color", () => {
    render(<Loading />);
    const spinnerElement = screen.getByTestId("loading-component").querySelector("svg");
    expect(spinnerElement).toHaveAttribute("fill", "#868e96");
  });

 
});

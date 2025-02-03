import React from "react";
import { render, screen } from "@testing-library/react";
import { ShowPremiumIcons } from "../components/CustomComponents/ShowPremiumIcon";
import * as constants from "../constants/constants";

jest.mock("../components/SvgIcons/index", () => ({
  StarPremiumIcon: jest.fn(({ color }) => (
    <span data-testid="star-icon" style={{ color }}></span>
  )),
}));

describe("ShowPremiumIcons Component", () => {
  it("renders StarPremiumIcon when SHOW_PREMIUM_ICON is true", () => {
    Object.defineProperty(constants, "SHOW_PREMIUM_ICON", { value: true });

    render(<ShowPremiumIcons color="gold" />);
    expect(screen.getByTestId("star-icon")).toBeInTheDocument();
  });

  it("does not render StarPremiumIcon when SHOW_PREMIUM_ICON is false", () => {
    Object.defineProperty(constants, "SHOW_PREMIUM_ICON", { value: false });

    render(<ShowPremiumIcons color="gold" />);
    expect(screen.queryByTestId("star-icon")).not.toBeInTheDocument();
  });
});

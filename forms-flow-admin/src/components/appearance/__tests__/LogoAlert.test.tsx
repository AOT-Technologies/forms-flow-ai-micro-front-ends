import React from "react";
import { render, screen } from "@testing-library/react";
import LogoAlert from "../LogoAlert";

describe("LogoAlert", () => {
  it("shows the Error label before the message", () => {
    render(
      <LogoAlert
        error={{ message: "Image is larger than 3MB" }}
        onDismiss={jest.fn()}
      />
    );
    expect(screen.getByTestId("appearance-logo-alert")).toHaveTextContent(
      "Error: Image is larger than 3MB"
    );
  });
});

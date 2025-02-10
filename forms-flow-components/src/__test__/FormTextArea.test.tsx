import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormTextArea } from "../components/CustomComponents/FormTextArea";

const handleChange = jest.fn();

/* ----------- rendering FormTextArea component with default props ---------- */
const renderComponent = (props) =>
  render(
    <FormTextArea
      onChange={handleChange}
      value=""
      dataTestid="textarea"
      {...props}
    />
  );
describe("FormTextArea Component", () => {
  it("renders with default props", () => {
    renderComponent();
    expect(screen.getByTestId("textarea")).toBeInTheDocument();
  });

  it("displays label when provided", () => {
    renderComponent({label:"Test Label"});
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("displays placeholder text", () => {
    renderComponent({placeholder:"Enter text"});
    expect(screen.getByTestId("textarea")).toHaveAttribute(
      "placeholder",
      "Enter text"
    );
  });

  it("triggers onChange when text is typed", () => {
    renderComponent();
    fireEvent.change(screen.getByTestId("textarea"), {
      target: { value: "Hello" },
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("triggers onBlur when focus is lost", () => {
    const handleBlur = jest.fn();
    renderComponent({onBlur:handleBlur})
    fireEvent.blur(screen.getByTestId("textarea"));
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("displays validation feedback when isInvalid is true", () => {
 
    renderComponent({isInvalid:true,feedback:"Error message" })
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("renders an icon when provided", () => {
 
    renderComponent({icon:<span data-testid="icon">⭐</span>})
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("calls onIconClick when icon is clicked", () => {
    const handleIconClick = jest.fn();
    renderComponent({icon:<span data-testid="icon">⭐</span>,onIconClick:handleIconClick})
    fireEvent.click(screen.getByTestId("icon"));
    expect(handleIconClick).toHaveBeenCalledTimes(1);
  });
});

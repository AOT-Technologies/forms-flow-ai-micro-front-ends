import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import RichTextEditor from "../RichTextEditor";

jest.mock("react-i18next", () => {
  const t = (key: string) => key;
  return { useTranslation: () => ({ t }) };
});

jest.mock("@formsflow/components", () => ({
  V8CustomButton: ({ label, onClick, dataTestId }: any) => (
    <button data-testid={dataTestId} onClick={onClick}>
      {label}
    </button>
  ),
}));

const renderEditor = (value = "") => {
  const onChange = jest.fn();
  render(
    <RichTextEditor
      id="body"
      value={value}
      onChange={onChange}
      labelId="body-label"
      dataTestId="editor"
    />
  );
  return { onChange, area: screen.getByTestId("editor-area") };
};

describe("RichTextEditor", () => {
  it("shows the toolbar from the design, with accessible names", () => {
    renderEditor();
    expect(
      screen.getByRole("toolbar", { name: "Formatting" })
    ).toBeInTheDocument();
    ["Bold", "Italic", "Link", "Bulleted list", "Numbered list"].forEach(
      (name) => expect(screen.getByRole("button", { name })).toBeInTheDocument()
    );
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-labelledby",
      "body-label"
    );
  });

  it("loads the given value and reports sanitized edits", () => {
    const { onChange, area } = renderEditor("<p>Approved</p>");
    expect(area.innerHTML).toBe("<p>Approved</p>");

    area.innerHTML =
      '<p>Approved <b>wording</b><img src=x onerror="alert(1)"></p>';
    fireEvent.input(area);
    expect(onChange).toHaveBeenLastCalledWith(
      "<p>Approved <strong>wording</strong></p>"
    );
  });

  it("rejects an invalid link address and keeps the popover open", () => {
    const { onChange } = renderEditor("<p>Questions</p>");
    fireEvent.click(screen.getByTestId("editor-link"));
    fireEvent.change(screen.getByTestId("editor-link-input"), {
      target: { value: "privacy office page" },
    });
    fireEvent.click(screen.getByTestId("editor-link-apply"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a web address starting with https://, or an email address."
    );
    expect(screen.getByTestId("editor-link-popover")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("adds an email address as a mailto link", () => {
    const { onChange, area } = renderEditor("<p>Questions</p>");
    fireEvent.keyDown(area, { key: "k", ctrlKey: true });
    fireEvent.change(screen.getByTestId("editor-link-input"), {
      target: { value: "privacy@example.org" },
    });
    fireEvent.keyDown(screen.getByTestId("editor-link-input"), {
      key: "Enter",
    });

    expect(screen.queryByTestId("editor-link-popover")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      '<p>Questions<a href="mailto:privacy@example.org" target="_blank" rel="noopener noreferrer">privacy@example.org</a></p>'
    );
  });

  it("edits and removes a link from the hover bar", () => {
    const { onChange, area } = renderEditor(
      '<p>Ask the <a href="https://example.org/privacy">Privacy Office</a>.</p>'
    );
    fireEvent.mouseOver(screen.getByText("Privacy Office"));
    expect(screen.getByTestId("editor-link-bar")).toHaveTextContent(
      "https://example.org/privacy"
    );

    fireEvent.click(screen.getByTestId("editor-link-edit"));
    const input = screen.getByTestId("editor-link-input");
    expect(input).toHaveValue("https://example.org/privacy");
    fireEvent.change(input, {
      target: { value: "https://example.org/office" },
    });
    fireEvent.click(screen.getByTestId("editor-link-apply"));
    expect(area.querySelector("a")).toHaveAttribute(
      "href",
      "https://example.org/office"
    );

    fireEvent.mouseOver(screen.getByText("Privacy Office"));
    fireEvent.click(screen.getByTestId("editor-link-remove"));
    expect(area.querySelector("a")).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith("<p>Ask the Privacy Office.</p>");
  });

  it("closes the link popover on Escape without changes", () => {
    const { onChange } = renderEditor("<p>Questions</p>");
    fireEvent.click(screen.getByTestId("editor-link"));
    fireEvent.keyDown(screen.getByTestId("editor-link-input"), {
      key: "Escape",
    });
    expect(screen.queryByTestId("editor-link-popover")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

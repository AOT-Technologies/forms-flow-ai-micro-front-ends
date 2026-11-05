// Test-only manual mock for the "@formsflow/components" webpack external.
// The real module is provided at runtime by the root-config import map and is
// not installed in node_modules, so jest resolves it here (see
// jest.config.js moduleNameMapper). Each export is a minimal stub component.
import React from "react";

const makeStub = (name) => {
  const Stub = ({ children }) =>
    React.createElement("span", { "data-mock": name }, children);
  Stub.displayName = name;
  return Stub;
};

export const AppModal = Object.assign(makeStub("AppModal"), {
  Header: makeStub("AppModal.Header"),
  Body: makeStub("AppModal.Body"),
  Footer: makeStub("AppModal.Footer"),
  Title: makeStub("AppModal.Title"),
});

export const BreadCrumbs = makeStub("BreadCrumbs");
export const CloseIcon = makeStub("CloseIcon");
export const ConfirmModal = makeStub("ConfirmModal");
export const CopyIcon = makeStub("CopyIcon");
export const CustomInfo = makeStub("CustomInfo");
export const CustomSearch = makeStub("CustomSearch");
export const CustomTabs = makeStub("CustomTabs");
export const CustomTextInput = makeStub("CustomTextInput");
export const DeleteIcon = makeStub("DeleteIcon");
export const DownArrowIcon = makeStub("DownArrowIcon");
export const FormInput = makeStub("FormInput");
export const FormTextArea = makeStub("FormTextArea");
export const ReusableTable = makeStub("ReusableTable");
// Functional stand-in so tests can toggle it like the real role="switch" button.
export const Switch = ({ checked = false, onChange, label, dataTestId }) =>
  React.createElement(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": checked,
      "aria-label": label,
      "data-testid": dataTestId,
      onClick: () => onChange?.(!checked),
    },
    label
  );
// Functional stand-ins mirroring the real DOM contract: one checkbox per item with
// test id "<dataTestId>-inline-checkbox-<n>", and a textarea whose id is
// "<dataTestId>-textarea".
export const CustomCheckbox = ({
  items = [],
  selectedValues = [],
  onChange,
  disabled = false,
  dataTestId = "",
  id = "",
}) =>
  React.createElement(
    "fieldset",
    { id, disabled },
    items.map((item, index) => {
      const checked = selectedValues.includes(item.value);
      return React.createElement(
        "label",
        { key: String(item.value) },
        React.createElement("input", {
          type: "checkbox",
          id: `${id}-${index + 1}`,
          checked,
          disabled,
          "data-testid": `${dataTestId}-inline-checkbox-${index + 1}`,
          onChange: (event) =>
            onChange?.(
              checked
                ? selectedValues.filter((v) => v !== item.value)
                : [...selectedValues, item.value],
              event
            ),
        }),
        item.label
      );
    })
  );
export const CustomTextArea = ({
  value,
  setValue,
  disabled = false,
  maxLength,
  rows,
  ariaLabel,
  dataTestId,
}) =>
  React.createElement("textarea", {
    id: `${dataTestId}-textarea`,
    value,
    disabled,
    maxLength,
    rows,
    "aria-label": ariaLabel,
    "data-testid": dataTestId,
    onChange: (event) => setValue(event.target.value),
  });
export const UpArrowIcon = makeStub("UpArrowIcon");
export const V8CustomButton = makeStub("V8CustomButton");

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
export const UpArrowIcon = makeStub("UpArrowIcon");
export const V8CustomButton = makeStub("V8CustomButton");

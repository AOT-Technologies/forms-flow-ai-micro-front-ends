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
});

export const ApplicationLogo = makeStub("ApplicationLogo");
export const ChevronIcon = makeStub("ChevronIcon");
export const CloseIcon = makeStub("CloseIcon");
export const CustomInfo = makeStub("CustomInfo");
export const CustomTextInput = makeStub("CustomTextInput");
export const GoogleIcon = makeStub("GoogleIcon");
export const HamburgerIcon = makeStub("HamburgerIcon");
export const LogoutIcon = makeStub("LogoutIcon");
export const MenuToggleIcon = makeStub("MenuToggleIcon");
export const MicrosoftIcon = makeStub("MicrosoftIcon");
export const NavbarAnalyzeIcon = makeStub("NavbarAnalyzeIcon");
export const NavbarBuildIcon = makeStub("NavbarBuildIcon");
export const NavbarHomeIcon = makeStub("NavbarHomeIcon");
export const NavbarManageIcon = makeStub("NavbarManageIcon");
export const NavbarSubmitIcon = makeStub("NavbarSubmitIcon");
export const NavbarTaskIcon = makeStub("NavbarTaskIcon");
export const PromptModal = makeStub("PromptModal");
export const ShowPremiumIcons = makeStub("ShowPremiumIcons");
export const V8CustomButton = makeStub("V8CustomButton");

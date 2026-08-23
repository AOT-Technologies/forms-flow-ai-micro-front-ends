import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

// @formsflow/service is a webpack external resolved via the import map at
// runtime; it does not exist in node_modules, so it must be mocked virtually.
jest.mock(
  "@formsflow/service",
  () => ({
    StorageService: {
      User: { USER_DETAILS: "UserDetails" },
      getParsedData: jest.fn(() => null),
      get: jest.fn(() => null),
      delete: jest.fn(),
      saveDataToSessionStorage: jest.fn(),
    },
  }),
  { virtual: true }
);

// formiojs (pulled in via formio-react) cannot initialize under jsdom; the
// root reducer only needs the form/submission reducer factories from it.
jest.mock("@aot-technologies/formio-react", () => ({
  form:
    () =>
    (state = {}) =>
      state,
  submission:
    () =>
    (state = {}) =>
      state,
}));

const mockCapturedStores: unknown[] = [];

// Stub the Task shell (src/index.tsx) so Root renders without the full app;
// capture the Redux store Root provides on every render.
jest.mock("../index", () => {
  const { useStore } = require("react-redux");
  return {
    __esModule: true,
    default: function TaskStub() {
      mockCapturedStores.push(useStore());
      return null;
    },
  };
});

import Root from "../root.component";

describe("Root store identity", () => {
  it("keeps the same Redux store instance across re-renders of Root", () => {
    const { rerender } = render(<Root someProp={1} />);
    rerender(<Root someProp={2} />);

    // The stub renders at least once per Root render pass.
    expect(mockCapturedStores.length).toBeGreaterThanOrEqual(2);
    const firstStore = mockCapturedStores[0];
    expect(firstStore).toBeTruthy();
    mockCapturedStores.forEach((store) => {
      expect(store).toBe(firstStore);
    });
  });
});

/**
 * Module smoke tests.
 *
 * The @formsflow/* packages are single-spa externals provided by the runtime
 * import map — they are not present in node_modules, so they are mocked
 * virtually here (same approach as the nav package's test setup). These tests
 * guard module evaluation (imports, module-scope constants) after the
 * dead-code removals and constant hoists — they do not render components.
 */

jest.mock(
  "@formsflow/service",
  () => ({
    RequestService: {
      httpGETRequest: jest.fn(() => Promise.resolve({ data: {} })),
      httpPOSTRequest: jest.fn(() => Promise.resolve({ data: {} })),
    },
    StorageService: {
      get: jest.fn(() => "[]"),
      save: jest.fn(),
      User: { USER_ROLE: "USER_ROLE", AUTH_TOKEN: "AUTH_TOKEN" },
    },
    HelperServices: {
      getLocalDateAndTime: jest.fn(),
      removeTenantFromRoles: jest.fn(),
      getResetSortOrders: jest.fn(() => ({})),
    },
    StyleServices: { getCSSVariable: jest.fn(() => "") },
    getRedirectUrl: jest.fn(() => "/"),
    navigateToSubmissionDetail: jest.fn(),
    navigateToSubmissionsListing: jest.fn(),
    MULTITENANCY_ENABLED: false,
  }),
  { virtual: true }
);

// formio-react is installed but its formiojs dependency requires unhoisted
// transitive modules (choices.js) that break under jest — stub the two slice
// factories reducers/index.ts consumes.
jest.mock("@aot-technologies/formio-react", () => ({
  submission:
    () =>
    (state = {}) =>
      state,
  form:
    () =>
    (state = {}) =>
      state,
}));

jest.mock(
  "@formsflow/components",
  () =>
    new Proxy(
      {},
      {
        get: (_target, prop) => (prop === "__esModule" ? true : () => null),
      }
    ),
  { virtual: true }
);

describe("module smoke", () => {
  it("SubmissionListing module imports cleanly and default-exports a component", () => {
    const mod = require("../Routes/SubmissionListing");
    expect(mod.default).toBeDefined();
  });

  it("ManageFieldsSortModal module imports cleanly and default-exports a component", () => {
    const mod = require("../components/Modals/ManageFieldsSortModal");
    expect(mod.default).toBeDefined();
  });

  it("StoreServices builds a working store (redux-logger is lazily required in dev only)", () => {
    const StoreService = require("../services/StoreServices").default;
    const store = StoreService.configureStore();
    expect(typeof store.getState).toBe("function");
    expect(() => store.dispatch({ type: "smoke/noop" })).not.toThrow();
  });
});

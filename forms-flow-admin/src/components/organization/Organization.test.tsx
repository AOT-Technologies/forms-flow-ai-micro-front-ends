import React from "react";
import { TextEncoder, TextDecoder } from "util";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { fetchFeatureUsage } from "@formsflow/service";

// react-router needs these and jsdom lacks them; set before it loads.
Object.assign(global, { TextEncoder, TextDecoder });
const { MemoryRouter } = require("react-router-dom");
const Organization = require("./index").default;

const mockFlags = { multiTenant: false, formGovernance: true };
jest.mock("../../constants", () => ({
  ...jest.requireActual("../../constants"),
  get MULTITENANCY_ENABLED() {
    return mockFlags.multiTenant;
  },
  get FORM_GOVERNANCE_ENABLED() {
    return mockFlags.formGovernance;
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@formsflow/service", () => ({
  ...jest.requireActual("../../__mocks__/formsflowService.js"),
  StorageService: {
    ...jest.requireActual("../../__mocks__/formsflowService.js").StorageService,
    get: (key: string) =>
      key === "USER_ROLE"
        ? JSON.stringify(["manage_organization", "manage_governed_content"])
        : null,
  },
  SUBMISSION_FEATURE_KEY: "submission",
  fetchFeatureUsage: jest.fn(() => Promise.resolve({ used: 5, total: 100 })),
  mapUsageResponse: (data: unknown) => (data ? { used: 5 } : null),
  isAiAssistantFeatureEnabled: () => true,
}));

jest.mock("./UsageSummaryCard", () => ({
  UsageSummaryCard: () => <div data-testid="organization-usage-summary-card" />,
}));

jest.mock("./AiPermissionsSection", () => ({
  ...jest.requireActual("./AiPermissionsSection"),
  AiPermissionsSection: () => <div data-testid="organization-ai-permissions" />,
}));

jest.mock("./GovernedContentSettingSection", () => ({
  GovernedContentSettingSection: () => (
    <div data-testid="organization-governed-content" />
  ),
}));

const renderPage = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <Organization />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("Organization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFlags.formGovernance = true;
  });

  it.each([[false], [true]])(
    "hides Form Governance when the env is off (multi-tenant: %s)",
    (multiTenant) => {
      mockFlags.multiTenant = multiTenant;
      mockFlags.formGovernance = false;
      renderPage();

      expect(
        screen.queryByTestId("organization-governed-content")
      ).not.toBeInTheDocument();
    }
  );

  it("single-tenant shows AI and governed content but no usage or terms", () => {
    mockFlags.multiTenant = false;
    renderPage();

    expect(
      screen.getByTestId("organization-governed-content")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("organization-ai-permissions")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("organization-usage-summary-card")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("organization-terms-toggle")
    ).not.toBeInTheDocument();
    expect(fetchFeatureUsage).not.toHaveBeenCalled();
  });

  it("multi-tenant keeps usage, AI, terms and governed content", async () => {
    mockFlags.multiTenant = true;
    renderPage();

    expect(
      await screen.findByTestId("organization-usage-summary-card")
    ).toBeInTheDocument();
    await waitFor(() => expect(fetchFeatureUsage).toHaveBeenCalled());
    expect(screen.getByTestId("organization-terms-toggle")).toBeInTheDocument();
    expect(
      screen.getByTestId("organization-ai-permissions")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("organization-governed-content")
    ).toBeInTheDocument();
  });
});

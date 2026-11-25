import { isGovernedContentOn } from "../governedSetting";

const mockFlags = { multiTenant: false, formGovernance: false };
jest.mock("../../../constants", () => ({
  get MULTITENANCY_ENABLED() {
    return mockFlags.multiTenant;
  },
  get FORM_GOVERNANCE_ENABLED() {
    return mockFlags.formGovernance;
  },
}));

const TENANT_ON = { details: { governed_content: "true" } };

describe("isGovernedContentOn", () => {
  it.each([[false], [true]])(
    "is off whenever the env is off (multi-tenant: %s)",
    (multiTenant) => {
      mockFlags.multiTenant = multiTenant;
      mockFlags.formGovernance = false;
      expect(isGovernedContentOn(TENANT_ON)).toBe(false);
    }
  );

  it("is on in single-tenant when the env is on", () => {
    mockFlags.multiTenant = false;
    mockFlags.formGovernance = true;
    expect(isGovernedContentOn(null)).toBe(true);
  });

  it("follows the tenant record in multi-tenant when the env is on", () => {
    mockFlags.multiTenant = true;
    mockFlags.formGovernance = true;
    expect(isGovernedContentOn(null)).toBe(false);
    expect(isGovernedContentOn(TENANT_ON)).toBe(true);
    expect(isGovernedContentOn({ governed_content: false })).toBe(false);
  });
});

import {
  isAiAssistantFeatureEnabled,
  isSubmissionAssistantEnabledForTenant,
  canShowSubmissionAssistant,
} from "./aiAssistantPermissions";

const setEnv = (env: Record<string, unknown> | undefined) => {
  (window as any)._env_ = env;
};

const BOTH_ON = {
  REACT_APP_SUBMISSION_AI_ASSISTANT_ENABLED: "true",
  REACT_APP_MULTI_TENANCY_ENABLED: "true",
};

afterEach(() => setEnv(undefined));

describe("isAiAssistantFeatureEnabled", () => {
  it("is true only when both env flags are on", () => {
    setEnv(BOTH_ON);
    expect(isAiAssistantFeatureEnabled()).toBe(true);
  });

  it("accepts boolean env values", () => {
    setEnv({
      REACT_APP_SUBMISSION_AI_ASSISTANT_ENABLED: true,
      REACT_APP_MULTI_TENANCY_ENABLED: true,
    });
    expect(isAiAssistantFeatureEnabled()).toBe(true);
  });

  it.each([
    [{ ...BOTH_ON, REACT_APP_SUBMISSION_AI_ASSISTANT_ENABLED: "false" }],
    [{ ...BOTH_ON, REACT_APP_MULTI_TENANCY_ENABLED: "false" }],
    [{ REACT_APP_SUBMISSION_AI_ASSISTANT_ENABLED: "true" }],
    [{}],
  ])("is false when either flag is off or missing (%o)", (env) => {
    setEnv(env);
    expect(isAiAssistantFeatureEnabled()).toBe(false);
  });
});

describe("isSubmissionAssistantEnabledForTenant", () => {
  it("reads the flag from details", () => {
    expect(
      isSubmissionAssistantEnabledForTenant({ details: { submission_assistant: true } })
    ).toBe(true);
  });

  it("falls back to the top-level flag", () => {
    expect(isSubmissionAssistantEnabledForTenant({ submission_assistant: true })).toBe(true);
  });

  it("prefers details over the top-level flag", () => {
    expect(
      isSubmissionAssistantEnabledForTenant({
        submission_assistant: true,
        details: { submission_assistant: false },
      })
    ).toBe(false);
  });

  it.each([[null], [undefined], [{}], [{ details: null }], [{ submission_assistant: false }]])(
    "is false for %o",
    (tenantData) => {
      expect(isSubmissionAssistantEnabledForTenant(tenantData as any)).toBe(false);
    }
  );
});

describe("canShowSubmissionAssistant", () => {
  const tenantOn = { details: { submission_assistant: true } };

  it("is true when env flags and tenant flag are on", () => {
    setEnv(BOTH_ON);
    expect(canShowSubmissionAssistant(tenantOn)).toBe(true);
  });

  it("is false when the tenant flag is off", () => {
    setEnv(BOTH_ON);
    expect(canShowSubmissionAssistant({ details: { submission_assistant: false } })).toBe(false);
  });

  it("is false when an env flag is off", () => {
    setEnv({ ...BOTH_ON, REACT_APP_MULTI_TENANCY_ENABLED: "false" });
    expect(canShowSubmissionAssistant(tenantOn)).toBe(false);
  });
});

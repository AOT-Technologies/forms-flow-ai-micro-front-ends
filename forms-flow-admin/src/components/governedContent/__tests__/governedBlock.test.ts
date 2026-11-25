import {
  EMPTY_BLOCK_DRAFT,
  GovernedBlockDraft,
  isBlockDraftComplete,
  isSameBlockDraft,
  toBlockDraft,
  toComponentKey,
  toGovernedPayload,
} from "../governedBlock";
import { GovernedContentRecord } from "../../../services/governedContent";

const DRAFT: GovernedBlockDraft = {
  name: " Claims privacy notice ",
  heading: "Collection of <personal> information",
  body: "<p>Questions go to the Privacy Office.</p>",
  owner: " Legal ",
  policyReference: "Privacy Policy §4.2",
  requirement: "required",
};

describe("toComponentKey", () => {
  it("camel-cases the name behind a governed prefix", () => {
    expect(toComponentKey("Claims privacy notice")).toBe(
      "governedClaimsPrivacyNotice"
    );
    expect(toComponentKey("§4.2 / retention")).toBe("governed42Retention");
    expect(toComponentKey("  ")).toBe("governedContent");
  });
});

describe("toGovernedPayload", () => {
  it("builds a form.io content component from a new draft", () => {
    expect(toGovernedPayload(DRAFT)).toEqual({
      name: "Claims privacy notice",
      requirement: "required",
      component: {
        type: "content",
        key: "governedClaimsPrivacyNotice",
        input: false,
        html: "<h4>Collection of &lt;personal&gt; information</h4><p>Questions go to the Privacy Office.</p>",
        properties: {
          governedOwner: "Legal",
          governedPolicyReference: "Privacy Policy §4.2",
        },
      },
    });
  });

  it("omits the heading and a blank policy reference", () => {
    const payload = toGovernedPayload({
      ...DRAFT,
      heading: " ",
      policyReference: "",
    });
    expect(payload.component.html).toBe(
      "<p>Questions go to the Privacy Office.</p>"
    );
    expect(payload.component.properties).toEqual({ governedOwner: "Legal" });
  });

  it("keeps the existing key and attributes when editing", () => {
    const payload = toGovernedPayload(
      { ...DRAFT, name: "Renamed", policyReference: "" },
      {
        type: "content",
        key: "governedOriginalKey",
        customClass: "kept",
        properties: { governedPolicyReference: "Old", other: "kept" },
      }
    );
    expect(payload.component).toMatchObject({
      key: "governedOriginalKey",
      customClass: "kept",
      properties: { governedOwner: "Legal", other: "kept" },
    });
    expect(payload.component.properties).not.toHaveProperty(
      "governedPolicyReference"
    );
  });
});

describe("toBlockDraft", () => {
  it("round-trips a saved block", () => {
    const { name, requirement, component } = toGovernedPayload(DRAFT);
    const record: GovernedContentRecord = {
      id: 7,
      name,
      requirement,
      component,
      status: "active",
      version: 1,
    };
    expect(toBlockDraft(record)).toEqual({
      ...DRAFT,
      name: "Claims privacy notice",
      owner: "Legal",
    });
  });

  it("treats html without a leading heading as body", () => {
    const draft = toBlockDraft({
      id: 1,
      name: "Footer",
      requirement: "optional",
      status: "active",
      version: 1,
      component: { type: "content", key: "f", html: "<p>Only body</p>" },
    });
    expect(draft).toMatchObject({
      heading: "",
      body: "<p>Only body</p>",
      owner: "",
      policyReference: "",
    });
  });
});

describe("draft helpers", () => {
  it("requires name, body, owner and type", () => {
    expect(isBlockDraftComplete(DRAFT)).toBe(true);
    expect(isBlockDraftComplete(EMPTY_BLOCK_DRAFT)).toBe(false);
    expect(isBlockDraftComplete({ ...DRAFT, owner: "  " })).toBe(false);
    expect(isBlockDraftComplete({ ...DRAFT, requirement: "" })).toBe(false);
    expect(
      isBlockDraftComplete({ ...DRAFT, heading: "", policyReference: "" })
    ).toBe(true);
  });

  it("compares drafts field by field", () => {
    expect(isSameBlockDraft(DRAFT, { ...DRAFT })).toBe(true);
    expect(isSameBlockDraft(DRAFT, { ...DRAFT, body: "<p>x</p>" })).toBe(false);
  });
});

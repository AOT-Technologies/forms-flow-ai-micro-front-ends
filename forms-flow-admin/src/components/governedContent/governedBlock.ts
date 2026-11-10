import {
  GovernedComponent,
  GovernedContentPayload,
  GovernedContentRecord,
  GovernedRequirement,
} from "../../services/governedContent";
import { escapeText, sanitizeRichText } from "./richText";

/** What the New/Edit block screen edits. */
export interface GovernedBlockDraft {
  name: string;
  heading: string;
  body: string;
  owner: string;
  policyReference: string;
  requirement: GovernedRequirement | "";
}

export const EMPTY_BLOCK_DRAFT: GovernedBlockDraft = {
  name: "",
  heading: "",
  body: "",
  owner: "",
  policyReference: "",
  requirement: "",
};

// The API stores only name, requirement and a form.io component. Owner and
// policy reference ride in the component's properties so they travel with
// the block onto every form (designers see who owns it).
export const OWNER_PROPERTY = "governedOwner";
export const POLICY_REFERENCE_PROPERTY = "governedPolicyReference";

// The Type field's options; the View block page shows the same wording.
export const REQUIREMENT_LABELS: Record<GovernedRequirement, string> = {
  required: "Required — on every form",
  optional: "Optional — designers switch it on",
};

const COMPONENT_TYPE = "content";
const HEADING_TAG = "H4";
const KEY_PREFIX = "governed";

/** A form.io key from the name, e.g. "Claims privacy notice" -> "governedClaimsPrivacyNotice". */
export const toComponentKey = (name: string): string =>
  KEY_PREFIX +
  (name.match(/[A-Za-z0-9]+/g) ?? ["Content"])
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

const toHtml = (heading: string, body: string) =>
  heading.trim()
    ? `<${HEADING_TAG.toLowerCase()}>${escapeText(
        heading.trim()
      )}</${HEADING_TAG.toLowerCase()}>${body}`
    : body;

// The heading is the leading <h4> written by toHtml; the body toolbar
// cannot produce headings, so anything else is body.
const splitHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const first = doc.body.firstElementChild;
  let heading = "";
  if (first?.tagName === HEADING_TAG) {
    heading = first.textContent ?? "";
    first.remove();
  }
  return { heading, body: sanitizeRichText(doc.body.innerHTML) };
};

export const isRetired = (record: GovernedContentRecord): boolean =>
  record.status === "retired";

export const getOwner = (record: GovernedContentRecord): string =>
  record.component?.properties?.[OWNER_PROPERTY] ?? "";

export const getPolicyReference = (record: GovernedContentRecord): string =>
  record.component?.properties?.[POLICY_REFERENCE_PROPERTY] ?? "";

export const toBlockDraft = (
  record: GovernedContentRecord
): GovernedBlockDraft => ({
  name: record.name ?? "",
  ...splitHtml(record.component?.html ?? ""),
  owner: getOwner(record),
  policyReference: getPolicyReference(record),
  requirement: record.requirement ?? "",
});

/**
 * Builds the API payload. When editing, the existing component is the base so
 * its key (referenced by forms) and any attributes set elsewhere are kept.
 */
export const toGovernedPayload = (
  draft: GovernedBlockDraft,
  existing?: GovernedComponent
): GovernedContentPayload => {
  const properties: Record<string, string> = {
    ...(existing?.properties ?? {}),
    [OWNER_PROPERTY]: draft.owner.trim(),
  };
  const policyReference = draft.policyReference.trim();
  if (policyReference) properties[POLICY_REFERENCE_PROPERTY] = policyReference;
  else delete properties[POLICY_REFERENCE_PROPERTY];

  return {
    name: draft.name.trim(),
    requirement: draft.requirement || "optional",
    component: {
      ...(existing ?? {}),
      type: COMPONENT_TYPE,
      key: existing?.key || toComponentKey(draft.name),
      input: false,
      html: toHtml(draft.heading, draft.body),
      properties,
    },
  };
};

export const isBlockDraftComplete = (draft: GovernedBlockDraft): boolean =>
  Boolean(
    draft.name.trim() && draft.body && draft.owner.trim() && draft.requirement
  );

export const isSameBlockDraft = (
  a: GovernedBlockDraft,
  b: GovernedBlockDraft
): boolean =>
  (Object.keys(a) as (keyof GovernedBlockDraft)[]).every(
    (field) => a[field] === b[field]
  );

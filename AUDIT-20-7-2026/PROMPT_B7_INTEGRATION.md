# Prompt B7 — Implement Safe Fixes (forms-flow-integration)

**Run order: 7 of 8.** The smallest MFE (integrations/recipes UI). Quick pass.

**How to use:** run Prompt A first and review **section I** of `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`.
Then paste the prompt below into Claude Code. It implements **only** the items tagged
[SAFE] in section I; to include a [DISCUSS] item, name it explicitly when you paste.
Consolidations with forms-flow-admin clones belong to PROMPT_C (cross-package), not here.

---

```
Implement the [SAFE] fixes from section I (forms-flow-integration) of
AUDIT-20-7-2026/PERFORMANCE_AUDIT.md. Work inside the forms-flow-integration/ package
only.

SCOPE & SAFETY:
- Only implement items tagged [SAFE] in section I (plus any [DISCUSS] item I explicitly
  approve in this message). Skip everything else.
- IN-PACKAGE ONLY: where section I notes near-clones of forms-flow-admin code, do NOT
  consolidate across packages here — that is PROMPT_C's job. Fix only what lives in
  this package.
- Embedded/iframe integration surfaces (Workato): message-event listeners keep
  subscribe/unsubscribe symmetric; do not change origins, payloads, or embed URLs.
- Route paths and single-spa lifecycle exports are contracts. Do NOT upgrade/add/remove
  dependencies (the unused-looking formio deps stay in package.json — removing a dep is
  a [DISCUSS]-gated change); do NOT touch webpack.config.js or externals.
- Dep arrays are tool-unverified: trimmed arrays may be intentional — only change one
  when the section-I finding explicitly covers it as [SAFE].

CHANGE DISCIPLINE:
- Work from forms-flow-integration/. One logical change per commit.
- After EACH change: `npm run lint`, `npm run check-format` (fix with
  `npm run format`), `npm test` green.
- Comment non-trivial changes with what/why.
- If a fix turns out to carry behavior-change risk mid-implementation, STOP that item
  and report back instead of guessing.

This package is small — one or two batches should cover it. After each batch,
summarize: section-I items covered, what changed, lint/test result. Commit to the
working branch; no PR unless I ask.
```

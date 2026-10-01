# Prompt B2 — Implement Safe Fixes (forms-flow-components)

**Run order: 2 of 8.** The shared UI library renders inside every consumer MFE — a
render-path fix here multiplies across the whole product.

**How to use:** run Prompt A first and review **section C** of `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`.
Then paste the prompt below into Claude Code. It implements **only** the items tagged
[SAFE] in section C; to include a [DISCUSS] item, name it explicitly when you paste.

---

```
Implement the [SAFE] fixes from section C (forms-flow-components) of
AUDIT-20-7-2026/PERFORMANCE_AUDIT.md. Work inside the forms-flow-components/ package
only.

SCOPE & SAFETY:
- Only implement items tagged [SAFE] in section C (plus any [DISCUSS] item I explicitly
  approve in this message). Skip everything else.
- Everything exported from src/formsflow-components.ts (components, hooks, types) is a
  cross-repo public API consumed by every other MFE and by forms-flow-web in the
  separate forms-flow-ai repo: never rename, remove, or change the props/signature/
  rendered markup/class names of an existing export. Internal refactors only.
- Visual identity: these components render everywhere — no DOM structure, class-name,
  or style changes. Memoization, stable identities, lifecycle cleanup, and dead-code
  removal only.
- bpmn-js lifecycle fixes (destroy on unmount, listener dedup): add cleanup in
  dedicated unmount effects; do not merge destroy logic into effects with unstable dep
  arrays.
- Do NOT upgrade/add/remove dependencies; do NOT touch webpack.config.js, the externals
  list, or Storybook config unless I approved a build-config item.
- Dep arrays: eslint-plugin-react-hooks is not installed — treat existing trimmed
  arrays as intentional; only change one when the section-C finding explicitly covers
  it as [SAFE].

CHANGE DISCIPLINE:
- Work from forms-flow-components/. One logical change per commit.
- After EACH change: `npm run lint`, `npm run check-format` (fix with
  `npm run format`), and `npm test` must pass. Tests mock @formsflow/service via
  __mocks__/ — keep that pattern in any test you add; add/adjust a test when you change
  a component's lifecycle (e.g. assert destroy/cleanup is called on unmount).
- If a changed component has a Storybook story, keep the story compiling (adjust only
  if imports moved — no story behavior changes).
- Comment non-trivial changes (memo dependency choices, lifecycle cleanup, extracted
  hooks) with what/why; trivial fixes need no comment.
- If a fix turns out to carry behavior-change risk mid-implementation, STOP that item
  and report back instead of guessing.

Work in small batches. After each batch, summarize: section-C items covered, what
changed, lint/test result. Commit to the working branch; no PR unless I ask.
```

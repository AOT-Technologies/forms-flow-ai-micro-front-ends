# Prompt B4 — Implement Safe Fixes (forms-flow-review)

**Run order: 4 of 8.** The largest feature MFE (reviewer journey: task lists, filters,
live updates over STOMP/SockJS).

**How to use:** run Prompt A first and review **section R** of `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`.
Then paste the prompt below into Claude Code. It implements **only** the items tagged
[SAFE] in section R; to include a [DISCUSS] item, name it explicitly when you paste.

---

```
Implement the [SAFE] fixes from section R (forms-flow-review) of AUDIT-20-7-2026/PERFORMANCE_AUDIT.md
at the repo root. Work inside the forms-flow-review/ package only.

SCOPE & SAFETY:
- Only implement items tagged [SAFE] in section R (plus any [DISCUSS] item I explicitly
  approve in this message). Skip everything else.
- WEBSOCKETS: any STOMP/SockJS lifecycle fix must preserve current reconnect behavior
  and message handling exactly — add missing cleanup/unsubscribe, never restructure the
  connection strategy without an approved [DISCUSS] item.
- Redux: selector fixes (shallowEqual, leaf selectors, createSelector from the
  installed @reduxjs/toolkit) must not change what any component receives. Keep
  dispatch order and action payloads identical.
- formio <Form> sites: memoize options/handlers per the report, then manually verify
  the affected screen still handles typing and language switching (note it in the batch
  summary).
- Route paths (src/Routes/) and the single-spa lifecycle exports are contracts. In-MFE
  React.lazy boundaries are allowed where section R proposes them — wrap in Suspense
  with the app's existing loading UX, not a new spinner.
- Do NOT upgrade/add/remove dependencies; do NOT touch webpack.config.js or externals.
- Dep arrays are tool-unverified: trimmed arrays may be intentional — only change one
  when the section-R finding explicitly covers it as [SAFE].

CHANGE DISCIPLINE:
- Work from forms-flow-review/. One logical change per commit.
- After EACH change: `npm run lint`, `npm run check-format` (fix with
  `npm run format`), `npm test` green; add/adjust tests for lifecycle fixes (e.g.
  unsubscribe called on unmount).
- Comment non-trivial changes (socket cleanup, memoized selectors/options, extracted
  hooks) with what/why.
- If a fix turns out to carry behavior-change risk mid-implementation, STOP that item
  and report back instead of guessing.

Work in small batches. After each batch, summarize: section-R items covered, what
changed, lint/test result, and any manual-verification notes. Commit to the working
branch; no PR unless I ask.
```

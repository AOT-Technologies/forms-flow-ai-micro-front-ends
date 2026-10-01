# Prompt B3 — Implement Safe Fixes (forms-flow-nav)

**Run order: 3 of 8.** The navbar is mounted persistently on every page for the whole
session — per-render waste here is paid app-wide.

**How to use:** run Prompt A first and review **section N** of `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`.
Then paste the prompt below into Claude Code. It implements **only** the items tagged
[SAFE] in section N; to include a [DISCUSS] item, name it explicitly when you paste.

---

```
Implement the [SAFE] fixes from section N (forms-flow-nav) of AUDIT-20-7-2026/PERFORMANCE_AUDIT.md at
the repo root. Work inside the forms-flow-nav/ package only.

SCOPE & SAFETY:
- Only implement items tagged [SAFE] in section N (plus any [DISCUSS] item I explicitly
  approve in this message). Skip everything else.
- This package is plain JavaScript (NO TypeScript) — keep it that way; no .ts/.tsx
  files, no type annotations.
- The nav triggers routing, i18n, and login/logout for the whole app: navigation
  targets, auth triggers, language-switch behavior, and menu visibility rules must be
  byte-identical. Route paths and role names are contracts.
- single-spa event subscriptions (window "single-spa:*" listeners), storage listeners,
  and i18n language listeners: every fix keeps subscribe/unsubscribe symmetric —
  cleanup in the same effect that subscribes.
- Do NOT upgrade/add/remove dependencies; do NOT touch webpack.config.js or externals.
- Dep arrays are tool-unverified here (no hooks lint, no TS): treat existing trimmed
  arrays as intentional; only change one when the section-N finding explicitly covers
  it as [SAFE].

CHANGE DISCIPLINE:
- Work from forms-flow-nav/. One logical change per commit.
- After EACH change: `npm run lint`, `npm run check-format` (fix with
  `npm run format`), `npm test` green. NOTE: this package runs Jest 27 — do not use
  Jest 28+ APIs in tests you add.
- Comment non-trivial changes (memoized derivations, listener lifecycle) with what/why.
- Manual smoke note: after the batch, list what to click-verify (login/logout, language
  switch, each menu item) — the nav has thin automated coverage.
- If a fix turns out to carry behavior-change risk mid-implementation, STOP that item
  and report back instead of guessing.

Work in small batches. After each batch, summarize: section-N items covered, what
changed, lint/test result. Commit to the working branch; no PR unless I ask.
```

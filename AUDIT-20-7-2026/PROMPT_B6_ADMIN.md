# Prompt B6 — Implement Safe Fixes (forms-flow-admin)

**Run order: 6 of 8.** The admin-only MFE (dashboard/role/user management) — local
state + services, no Redux, no react-query.

**How to use:** run Prompt A first and review **section A** of `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`.
Then paste the prompt below into Claude Code. It implements **only** the items tagged
[SAFE] in section A; to include a [DISCUSS] item, name it explicitly when you paste.

---

```
Implement the [SAFE] fixes from section A (forms-flow-admin) of AUDIT-20-7-2026/PERFORMANCE_AUDIT.md at
the repo root. Work inside the forms-flow-admin/ package only.

SCOPE & SAFETY:
- Only implement items tagged [SAFE] in section A (plus any [DISCUSS] item I explicitly
  approve in this message). Skip everything else.
- Admin flows are permission-gated (formsflow-admin role): visibility rules, toasts,
  redirects, and error messages stay byte-identical.
- Data layer is local state + src/services/: keep fetch triggers, loading states, and
  error handling behavior identical; add unmount guards/cleanup only where section A
  tags them [SAFE].
- Route paths and single-spa lifecycle exports are contracts. Do NOT upgrade/add/remove
  dependencies; do NOT touch webpack.config.js or externals.
- NOTE: `npm install` in this package may need `--force` (known legacy conflict) — use
  it only if install is actually required; never regenerate the lockfile.
- Dep arrays are tool-unverified: trimmed arrays may be intentional — only change one
  when the section-A finding explicitly covers it as [SAFE].

CHANGE DISCIPLINE:
- Work from forms-flow-admin/. One logical change per commit.
- After EACH change: `npm run lint`, `npm run check-format` (fix with
  `npm run format`), `npm test` green; extend tests where a screen's logic was
  extracted into a hook/helper.
- Comment non-trivial changes with what/why; trivial fixes need no comment.
- If a fix turns out to carry behavior-change risk mid-implementation, STOP that item
  and report back instead of guessing.

Work in small batches. After each batch, summarize: section-A items covered, what
changed, lint/test result. Commit to the working branch; no PR unless I ask.
```

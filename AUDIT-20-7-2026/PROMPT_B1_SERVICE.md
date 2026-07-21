# Prompt B1 — Implement Safe Fixes (forms-flow-service)

**Run order: 1 of 8.** The service layer loads on every page of every deployment before
any UI renders — fixes here pay off everywhere, so it goes first.

**How to use:** run Prompt A first and review **section S** of `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`
(especially its [DISCUSS] items — the Keycloak/auth ones stay untouched unless you
explicitly approve them). Then paste the prompt below into Claude Code. It implements
**only** the items tagged [SAFE] in section S; to include a [DISCUSS] item, name it
explicitly when you paste (e.g. *"…also include S.1 (keycloak refresh math) — approved"*).

---

```
Implement the [SAFE] fixes from section S (forms-flow-service) of AUDIT-20-7-2026/PERFORMANCE_AUDIT.md
at the repo root. Work inside the forms-flow-service/ package only.

SCOPE & SAFETY:
- Only implement items tagged [SAFE] in section S (plus any [DISCUSS] item I explicitly
  approve in this message). Skip everything else.
- AUTH-CRITICAL GUARD: do NOT touch Keycloak init/refresh/logout behavior unless I
  explicitly approved that specific finding. Even for approved auth items, preserve the
  exact login/logout/token-refresh user experience.
- This package has NO React UI. Every export from src/formsflow-services.ts is a
  cross-repo public API consumed by every other micro-frontend AND by forms-flow-web in
  the separate forms-flow-ai repo: never rename, remove, or change the signature or
  observable behavior of an existing export. Additive exports are allowed only if a
  section-S finding calls for one.
- Do NOT upgrade, add, or remove any dependency. Do NOT touch webpack.config.js or the
  externals list unless I approved a build-config item.
- Preserve error semantics: no swallowing, no reshaping of thrown/rejected values that
  callers may depend on.

CHANGE DISCIPLINE:
- Work from forms-flow-service/. One logical change (or tightly-related group) per
  commit, clear message.
- After EACH change: `npm run lint` and `npm run check-format` must pass (run
  `npm run format` to fix), and `npm test` stays green. The suite is thin
  (--passWithNoTests): when you fix or extract a PURE function (date/format/url/storage
  helpers), add a small unit test for it in the same commit.
- For any non-trivial change (timer/interval lifecycle, interceptor wiring, memoized or
  restructured logic) add a concise code comment saying what changed and why, so a
  reviewer can verify no behavior change. Trivial fixes need no comment.
- If, while implementing, a fix turns out to carry any behavior-change risk, STOP that
  item, leave the code as-is, and report it back instead of guessing.

Work in small batches. After each batch, summarize: which section-S items it covers,
what changed, and the lint/test result. Commit to the working branch; no PR unless I ask.
```

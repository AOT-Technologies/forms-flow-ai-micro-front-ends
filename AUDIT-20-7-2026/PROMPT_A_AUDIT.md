# Prompt A — Performance / Maintainability / Reusability Audit (all micro-frontends)

**How to use:** paste the prompt below into Claude Code from the repo root
(`forms-flow-ai-micro-front-ends`). It produces `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md` at the repo root
(report only — **no code changes**). Run this first; the per-package implementation
prompts (`PROMPT_B1`–`PROMPT_B8`) and the cross-package consolidation prompt (`PROMPT_C`)
all consume the report.

> Status note: this prompt has already been executed once — the current report exists at
> `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md` (generated 2026-07-19 by a 9-agent parallel audit). Re-run it to
> regenerate the report after major code changes.

---

```
Audit ALL micro-frontends in this repo (forms-flow-ai-micro-front-ends) for performance,
maintainability, and reusability improvements. This is a NON-BREAKING pass: the goal is a
written report, not code changes yet.

Run it as a PARALLEL multi-agent audit — one read-only agent per package plus one
cross-package duplication agent (9 total):
  forms-flow-service (S.*)      — shared logic layer: Keycloak/auth lifecycle, axios
                                  RequestService, storage, moment, i18n, router helpers
  forms-flow-components (C.*)   — shared UI library: MUI DataGrid wrappers, bpmn-js
                                  lifecycle, export-barrel bundle weight, customHooks
  forms-flow-nav (N.*)          — persistent navbar: per-render cost, single-spa event
                                  cleanup, why formio is in its deps
  forms-flow-review (R.*)       — Redux perf, STOMP/SockJS lifecycle, formio inline
                                  options/handlers, task-list rendering
  forms-flow-submissions (U.*)  — react-query v4 defaults & key hygiene, Redux/RQ
                                  double-fetch, dead forked slices
  forms-flow-admin (A.*)        — re-renders, service/endpoint layer, effect cleanup
  forms-flow-integration (I.*)  — full sweep (small), unused formio deps, admin clones
  forms-flow-theme (T.*)        — Bootstrap import strategy, duplication, !important
                                  density, dead selectors, CSS-variable bypasses
  cross-package (X.*)           — diff-verified duplication BETWEEN packages
                                  (review↔submissions fork debt, admin↔integration,
                                  resourceBundles, local copies of @formsflow/service
                                  exports, local UI duplicating @formsflow/components,
                                  webpack/jest/babel config drift)

HARD CONSTRAINTS (apply to every agent and every proposed fix):
- READ-ONLY: no code changes, no npm install, no builds, no tests.
- Every file:line cited must be verified by reading those exact lines — no guessed
  citations. Cross-package duplication claims must be diff-verified and labeled
  IDENTICAL / NEAR-IDENTICAL (+delta) / SIMILAR.
- Do NOT propose upgrading/adding/removing any dependency, and do NOT propose aligning
  version drift between packages (each deploys independently).
- Do NOT propose changes that alter functionality, UI, routing, network behavior, or
  public APIs. `@formsflow/*` (+ react/react-dom where externalized) are runtime
  externals via SystemJS import map — never propose bundling or deep-importing them.
- Everything exported from each package's src/formsflow-<name>.ts(x) is a CROSS-REPO
  public contract (consumed by forms-flow-web in the forms-flow-ai repo). Renames and
  removals are breaking; dead-looking exports are report-only [DISCUSS].
- eslint-plugin-react-hooks is not installed anywhere: dep arrays are tool-unverified.
  Changes to intentional-looking trimmed dep arrays are [DISCUSS], never [SAFE].
- Auth-critical findings (Keycloak refresh, token handling) are always [DISCUSS].

For EACH finding include: verified path:line · what/why it hurts · [SAFE] (zero
behavior-change confidence) or [DISCUSS] (any risk/behavior decision/contract impact) ·
IMPACT and CONFIDENCE (HIGH/MED/LOW) · minimal fix shape (short snippet when it
clarifies). Each package section must also include a "Checked & clean" list of verified
negative results, and an API-call inventory table where the package has a service layer.

REPORT STRUCTURE (single file, AUDIT-20-7-2026/PERFORMANCE_AUDIT.md):
- Header: generation date, method, tag legend.
- §0 Baseline: per-package size/stack table, measurement caveats (no builds run).
- §1 Executive summary: prioritized top-10 table across ALL packages
  (# | issue | package | impact | confidence | effort).
- §2–§10: one section per package (S, C, N, R, U, A, I, T) + cross-package (X), each
  with findings grouped by category, impact-sorted, then Checked & clean + inventories.
- §11 Bucket index: every [SAFE] id vs every [DISCUSS] id, listed.
- §12 Reusability map: proposed shared homes and consolidation targets.
- §13 Suggested implementation order: the per-package batch order the PROMPT_B files
  will follow.

Make NO code changes in this step — report generation only.
```

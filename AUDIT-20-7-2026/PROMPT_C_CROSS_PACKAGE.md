# Prompt C — Cross-Package Consolidation (run after B1–B8)

**How to use:** run Prompt A first — its **section X** and **Reusability map** in
`AUDIT-20-7-2026/PERFORMANCE_AUDIT.md` are the map this consolidation follows. Run this LAST, after the
per-package prompts (B1–B8), so in-package cleanups have landed. Paste the prompt below
into Claude Code. Because every consolidation touches the cross-repo API surface of
`@formsflow/components` or `@formsflow/service`, expect most items to be [DISCUSS]:
approve the specific X.* items you want when you paste.

**Why it stays non-breaking:** additions to components/services are additive exports
(existing exports untouched); consumer switches happen per-package with tests green;
local copies are deleted only after every in-repo consumer has switched; consumers in
OTHER repos (forms-flow-web) keep working because nothing existing is renamed, removed,
or changed in behavior.

---

```
Implement cross-package consolidations from section X of AUDIT-20-7-2026/PERFORMANCE_AUDIT.md at the
repo root. Only implement the X.* items I explicitly list in this message, plus any
tagged [SAFE]; skip the rest.

HARD RULES:
- ADDITIVE-ONLY on shared surfaces: new exports may be ADDED to
  forms-flow-components/src (with a Storybook story for new components) or
  forms-flow-service/src, but NO existing export in either package may be renamed,
  removed, or changed in signature or behavior — forms-flow-web in the separate
  forms-flow-ai repo imports these at runtime.
- Consolidation recipe, per item, in this order (separate commits):
    1. Add the canonical implementation to the shared home named in the Reusability
       map (verbatim behavior of the duplicates — if the duplicates differ AT ALL,
       stop and report the delta instead of picking a winner silently).
    2. Switch each in-repo consumer package to import the shared version — one package
       per commit, that package's `npm run lint` + `npm run check-format` +
       `npm test` green each time.
    3. Delete the now-dead local copies ONLY after a fresh grep shows zero remaining
       in-repo references. If forms-flow-web also duplicates the code, note it for
       that repo — do not try to fix it from here.
- Translation/resourceBundle consolidation: never delete a key; only deduplicate
  identical key/value pairs where section X verified them IDENTICAL.
- Do NOT consolidate webpack/babel/jest/tsconfig files unless I approved that
  [DISCUSS] item — build-system change. The existing root webpack.formio.js is the
  pattern to follow if approved.
- Do NOT upgrade/add/remove dependencies in any package. Respect externals everywhere.
- Version note: consumer packages import `@formsflow/service`/`@formsflow/components`
  as runtime externals — new shared exports are only available to consumers once
  components/service deploy. Keep each consolidation self-contained so partial
  deployment stays safe, and say so in the batch summary.

CHANGE DISCIPLINE:
- One consolidation (one X.* item) at a time, following the 3-step recipe above.
- After each item: run lint/format/tests in EVERY touched package; summarize what
  moved, which packages switched, what was deleted (with fresh-grep evidence), and
  what remains for forms-flow-web to adopt later.
- If duplicates that the report called IDENTICAL turn out to differ, STOP that item
  and report the diff instead of merging.
Commit to the working branch; no PR unless I ask.
```

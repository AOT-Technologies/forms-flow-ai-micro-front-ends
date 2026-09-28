# Prompt B5 — Implement Safe Fixes (forms-flow-submissions)

**Run order: 5 of 8.** The submission-analysis MFE — the one package running Redux and
@tanstack/react-query v4 side by side.

**How to use:** run Prompt A first and review **section U** of `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`.
Then paste the prompt below into Claude Code. It implements **only** the items tagged
[SAFE] in section U; to include a [DISCUSS] item (e.g. setting QueryClient
defaultOptions — a behavior decision), name it explicitly when you paste.

---

```
Implement the [SAFE] fixes from section U (forms-flow-submissions) of
AUDIT-20-7-2026/PERFORMANCE_AUDIT.md. Work inside the forms-flow-submissions/ package
only.

SCOPE & SAFETY:
- Only implement items tagged [SAFE] in section U (plus any [DISCUSS] item I explicitly
  approve in this message). Skip everything else.
- react-query v4: do NOT change QueryClient defaultOptions, staleTime/cacheTime, or
  refetch behavior unless I approved that [DISCUSS] item — those are user-visible
  freshness decisions. Query-KEY hygiene fixes (stable keys, shared key constants) are
  fine when tagged [SAFE].
- Dual data layer: where a query dispatches into Redux, keep dispatching the same
  action with the same payload — components read from the slice; do not move a
  component off Redux and onto query data in this pass.
- Dead forked slices/actions/components: delete ONLY items section U lists as dead AND
  re-verify each with a fresh grep immediately before deletion (imports, string
  references, lazy references).
- formio <Form> sites: memoize options/handlers per the report; note manual
  typing/language-switch verification in the batch summary.
- Route paths and single-spa lifecycle exports are contracts. Do NOT upgrade/add/remove
  dependencies; do NOT touch webpack.config.js or externals.
- Dep arrays are tool-unverified: trimmed arrays may be intentional — only change one
  when the section-U finding explicitly covers it as [SAFE].

CHANGE DISCIPLINE:
- Work from forms-flow-submissions/. One logical change per commit; dead-code deletions
  in their own commits (easy to revert).
- After EACH change: `npm run lint`, `npm run check-format` (fix with
  `npm run format`), `npm test` green; add/adjust tests where behavior-adjacent code
  moved.
- Comment non-trivial changes (memoized selectors/options, key factories, kept-Redux
  dispatch parity) with what/why.
- If a fix turns out to carry behavior-change risk mid-implementation, STOP that item
  and report back instead of guessing.

Work in small batches. After each batch, summarize: section-U items covered, what
changed, what was deleted (with the fresh-grep evidence), lint/test result. Commit to
the working branch; no PR unless I ask.
```

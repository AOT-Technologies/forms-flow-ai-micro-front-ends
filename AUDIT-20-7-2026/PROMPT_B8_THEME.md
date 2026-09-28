# Prompt B8 — Implement Safe Fixes (forms-flow-theme)

**Run order: 8 of 8.** The shared stylesheet — last because CSS changes carry visual
risk and the verification bar is "provably identical compiled CSS".

**How to use:** run Prompt A first and review **section T** of `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`.
Then paste the prompt below into Claude Code. It implements **only** the items tagged
[SAFE] in section T; to include a [DISCUSS] item (e.g. selective Bootstrap imports —
a compiled-output change), name it explicitly when you paste.

---

```
Implement the [SAFE] fixes from section T (forms-flow-theme) of AUDIT-20-7-2026/PERFORMANCE_AUDIT.md at
the repo root. Work inside the forms-flow-theme/ package only.

SCOPE & SAFETY:
- Only implement items tagged [SAFE] in section T (plus any [DISCUSS] item I explicitly
  approve in this message). Skip everything else.
- THE BAR IS PROVABLE EQUIVALENCE: [SAFE] here means the compiled CSS is identical (or
  differs only by removed exact-duplicate rules). VERIFY IT: run `npm run build` BEFORE
  starting (save dist/forms-flow-theme.min.css aside), rebuild after each change, and
  diff the two outputs. Any unexplained diff → revert that change and mark the item
  back to [DISCUSS].
- CSS variable names, class names, and the output filename are cross-repo contracts —
  never rename or remove them. Unused-looking variables/selectors are reported, not
  deleted, unless section T tagged the deletion [SAFE] with in-repo evidence AND I
  approved it (external repos may use them).
- Do NOT change the Bootstrap import strategy, !important usage, or selector
  specificity unless that exact [DISCUSS] item was approved — cascade changes are
  visual changes.
- Do NOT upgrade/add/remove dependencies; do NOT touch webpack.config.js beyond what an
  approved item requires.

CHANGE DISCIPLINE:
- Work from forms-flow-theme/. One logical change per commit; include the before/after
  compiled-CSS diff summary (identical / N duplicate rules removed) in each commit
  message body.
- After EACH change: `npm run lint` and `npm run check-format` pass (fix with
  `npm run format`); rebuild + diff as above. There is no test suite here — the CSS
  diff IS the test.
- If a change produces any cascade-order or output diff you didn't predict, STOP,
  revert, and report it back instead of guessing.

Work in small batches. After each batch, summarize: section-T items covered, what
changed, and the compiled-CSS diff verdict per change. Commit to the working branch; no
PR unless I ask.
```

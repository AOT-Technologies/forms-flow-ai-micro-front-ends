# forms-flow-ai-micro-front-ends — Before/After Performance Report (B1–B6)

**Before:** `develop` fork point `dc2182fc` · **After:** `feature/FWF-6530-codebase-refactoring` @ `7db7acf1` (29 commits)
**Method:** both trees built with the identical toolchain and shared `node_modules`
(baseline built in-place at the fork point, then the branch rebuilt clean, 2026-07-21);
sizes are emitted `dist/*.js`, gzip −9 over the wire. Static counts come from the
grep-verified findings in `PERFORMANCE_AUDIT.md` and the per-batch verification runs.
Scope: the six refactored packages (integration and theme pending B7/B8).

---

## 1. Bundle & network payload (measured)

| Package (entry bundle, gz) | Before | After | Δ | Lazy chunks added |
|---|---|---|---|---|
| forms-flow-nav *(mounted on every page)* | 51,666 B | 46,784 B | **−4,882 B (−9.4%)** | — |
| forms-flow-admin | 77,990 B | 73,873 B | **−4,117 B (−5.3%)** | — |
| forms-flow-submissions | 641,588 B | 641,581 B | ≈0 | **2** (7.5 KB gz deferred: detail view) |
| forms-flow-review | 620,999 B | 622,890 B | +1,891 B (+0.3%)¹ | **1** (2.9 KB gz deferred: task detail) |
| forms-flow-service | 319,565 B | 319,571 B | ≈0² | — |
| forms-flow-components | 1,788,789 B | 1,788,625 B | ≈0² | — |

¹ Review's main grew slightly: webpack's chunk-loading runtime (+~8 KB raw) outweighs the
dead code removed; in exchange, the task-detail screen no longer loads for users who never
open it. First code-split boundaries in this repo — the pattern is now proven for both
router styles.
² **Expected and honest:** the big byte levers for service (~712 KB eager translations,
moment locales — S.18/S.22) and components (eager formio + bpmn-js in the 1.75 MB-gz
shared bundle — C.1/C.2) are `[DISCUSS]` items awaiting approval; this pass was
[SAFE]-only. Bundle bytes are therefore **not** the headline of B1–B6 — render-path
mechanics, dead code, and gate repair are (§3–§5).

Deleted-but-never-imported files (dead code) cost 0 bundle bytes by definition — webpack
only bundles reachable modules — which is why 2,370 deleted lines (§5) barely move these
numbers. What did move them: nav's dead-but-imported Navbar + react-helmet chain, admin's
dead react-select import + package.json-embedding footer.

## 2. Core Web Vitals (expected movement — not measured)

Real Lighthouse runs need the running shell + Keycloak (protocol: identical to
`forms-flow-web/PERF_COMPARISON_REPORT.md` §2 — 3–5 passes per side, cold cache). Derived
expectations: **FCP/LCP** improve modestly on every page (nav −4.9 KB gz is on the
critical path everywhere; admin pages −4.1 KB); **INP/interaction cost** is where the real
movement is — the §3 mechanics remove per-keystroke and per-dispatch render storms on the
task list, submissions list, and every DataGrid screen; **CLS** unchanged by design (lazy
fallbacks reuse the pre-existing full-area `<Loading/>`).

## 3. Re-render mechanics (grep-verified counts, implemented in this change-set)

| Mechanism | Before | After |
|---|---|---|
| `ReusableTable` (every list screen in every MFE): inline default props + per-render closures defeating the DataGrid's memoization | 8 defaults + 5 closures fresh per render | **0** (module constants + useCallback/useMemo) |
| Render-body `getComputedStyle` forced style reads (components) | 11 sites | **0** (memoized, Search.tsx pattern) |
| Skeleton rows re-keyed with `crypto.randomUUID()` per render | 1 table | 0 |
| nav: full-sidenav re-render per route change from never-read `ES_ROUTE` state | every navigation | **removed** |
| nav: `localStorage` JSON.parse + 15 role scans in render body | every Sidebar render | memoized `[instance]` |
| submissions: constant array invalidating 5 memos → full column pipeline rebuild | every render | module scope |
| submissions: per-cell filter/sort in `getCellValue` (O(fields·log fields) × rows × cols) | every cell | hoisted `useMemo` |
| Fresh-object selector sites re-rendering on every store action (submissions View/Bundle/Analyze) | 3 | **0** (createSelector / scalar selectors) |
| formio `<Form>` options + deep-cloned submission rebuilt per render (submissions) | 2 sites (cloneDeep per keystroke) | memoized |
| review: `JSON.parse(localStorage)` per render | 2 sites | memoized |
| review: no-op dispatch on every task-list fetch (ran every subscriber's selectors) | 1 per fetch | removed |
| review: store rebuilt (all state wiped) if `Root` re-renders | latent hazard | closed + identity test |
| admin: forced full re-render per popover open (write-only `show` state) | 2 screens | removed |
| CustomButton: 8 copy-pasted variant branches | 8 | 1 renderer — **byte-verified** across 49 rendered combos |

Not addressed (all `[DISCUSS]`): review's whole-slice subscriptions incl. the per-row
Assigne widget (R.9), socket teardown per fetch (R.1–R.3), formio options in review
(R.14/R.15), admin search-per-keystroke re-renders (A.7/A.8).

## 4. Network & event behavior (measured request/dispatch deltas)

| Scenario | Before | After |
|---|---|---|
| nav profile-modal open | fetched `languageData.json` every open (fed only commented-out UI) | fetch removed |
| review task-list fetch | +1 dead Redux dispatch through all subscribers | removed |
| submissions/review/admin/integration event bus | `ES_CHANGE_LANGUAGE` handler registered twice (submissions) | deduped |
| Fire-and-forget filter POSTs (submissions ×6 sites) | unhandled rejections on failure | `.catch` + console.error |
| redux-logger (review, submissions) | evaluated in prod bundles | dev-only `require` (bytes still ship — noted) |

All other request timing/counts intentionally identical.

## 5. Code health

| Metric | Before | After |
|---|---|---|
| Dead files deleted (grep-verified zero importers) | — | **27 files / 2,370 lines** (nav 12/948 · submissions 8/957 · admin 4/75 · review 3/390) + in-file dead code (commented blocks, dead exports/state) |
| ESLint gate | **could not run in ANY of the 6 packages** (invalid `.eslintrc` crashed ESLint; components additionally hung on a 1.27 MB base64 file) | runs everywhere; ~16,000 accumulated prettier errors cleared; new errors introduced: **0** (remaining: 3 deliberate Keycloak markers + 58 inventoried pre-existing) |
| Runnable green unit tests | 6 (3 review + 3 submissions; service had none; nav & admin suites unrunnable; components 72P/55F) | **47 green** across service 30 · review 4 · submissions 6 · nav 3 · admin 2 · components +ReusableTable suite (72P/55F stale set unchanged, now failing on assertions instead of import crashes) |
| `React.lazy` boundaries | 0 in the whole repo | 3 (review task detail, submissions detail view ×2 chunks) |
| Duplication consolidated | — | auth-header builder ×8→1 (service) · router helpers deduped + route-map memo · click-outside/positioning ×2 verbatim→internal hooks (components) · 16 permission strings→1 module (nav) · tenant-URL literals→`getRedirectUrl` (review) · config constants→`@formsflow/service` exports (submissions) |
| Case-typo filenames fixed | `userSrvices.ts`, `AttributeFIlterModalBody.tsx`, `userContants.js` | renamed (imports updated; zero cross-package refs) |

## 6. Caveats (honesty section)

1. Bundle deltas for service/components are ≈0 **because their big levers are pending
   `[DISCUSS]` approval** — this report will change materially if C.1/C.2 (lazy
   formio/bpmn-js) and S.18/S.22 (moment locales, lazy translations) are approved.
2. Whole-package before/after LOC totals are **not comparable** this cycle: the one-time
   prettier pass reformatted ~16k lines (line counts inflate as long lines split — e.g.
   service "grew" 2,272 lines with zero functional additions). The dead-code numbers in §5
   count lines in deleted files only, measured at the baseline revision.
3. CWV numbers in §2 are derived expectations, not measurements; capture real runs against
   a deployed stack per the forms-flow-web protocol.
4. Re-render rows in §3 are static mechanism counts; a React Profiler session
   (task list + submissions list, before/after) would quantify commit counts/durations.
5. Behavior was intentionally preserved everywhere — including known bugs; every
   `[DISCUSS]` finding and pre-existing failure is inventoried in
   `AUDIT-20-7-2026/TODO.md`. This report claims no functional changes.

*Generated 2026-07-21. Baseline `dc2182fc` built in-place with identical node_modules;
branch rebuilt clean at `7db7acf1`; both measured with gzip −9.*

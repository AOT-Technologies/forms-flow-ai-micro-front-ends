# forms-flow-ai-micro-front-ends — Engineering Standards

Working standard for ALL work in this repo — features, bug fixes, refactoring — for every
developer and AI assistant, across all eight packages. Enterprise production code:
stability outranks stylistic improvement. These packages are consumed **at runtime** by
each other and by `forms-flow-web` in the separate `forms-flow-ai` repo, so a "private"
change here can break an app you cannot see. (Updated 2026-07-19 after the B1–B6
performance/maintainability refactor.)

## Work Modes

- **Feature / bug-fix mode:** changing behavior is the point. Implement the intended change
  precisely; everything OUTSIDE it must keep working exactly as before.
- **Refactoring mode:** ZERO behavior change — preserve business logic, UI output, component
  props/APIs, state behavior, routing, accessibility, user workflows; existing tests keep
  passing.

Read every "do not change X" below as: *never as a side effect; in feature mode only as the
explicit, reviewed intent of the change.*

## Hard Constraints (all packages)

- Do NOT upgrade, add, remove, or replace dependencies, React, the build system, or bundler
  config unless explicitly requested. Do NOT align version drift between packages (jest
  27/29, eslint 7/8, i18next 21/23/25 differ on purpose — each package installs and deploys
  independently). If a better solution needs new packages, propose it separately.
- **Cross-repo public API:** everything exported from a package's entry
  (`src/formsflow-<name>.ts(x)` — single-spa lifecycles and the `@formsflow/components` /
  `@formsflow/services` barrels) is consumed by other repos. Never rename, remove, or
  change signatures/observable behavior. Dead-looking exports are report-only — external
  consumers may import them. Additive exports are fine.
- **Runtime externals:** `@formsflow/*` (plus `react`/`react-dom` where externalized) load
  via the SystemJS import map — never bundle them, never deep-import
  (`@formsflow/components/dist/...` is forbidden), never remove them from `externals`.
  Dev ports (3005–3012) and output filenames (`forms-flow-<name>.js`,
  `forms-flow-theme.min.css`) are load-bearing — do not change.
- **Cross-MFE communication** goes through `@formsflow/service` (auth/storage/request/i18n/
  router helpers) and the root-config pub/sub events (`FF_AUTH`, `ES_ROUTE`,
  `ES_CHANGE_LANGUAGE`, …). The bus's unsubscribe contract lives in the external
  root-config — adding/removing subscription cleanup is a behavior decision, not a cleanup.
- **Auth is critical:** never change `KeycloakService` init/refresh/logout behavior without
  explicit approval. Its 3 remaining lint errors are deliberate markers for open findings
  (S.6/S.37 in `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`).
- **Preserved-on-purpose list:** every `[DISCUSS]` finding in `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md` and
  every pre-existing failure inventoried in `AUDIT-20-7-2026/TODO.md` is a tracked decision — never a
  drive-by "fix".

## Routing

Existing routes are frozen public contract — the root-config shell and `forms-flow-web`
route INTO these packages. Route ownership: nav triggers navigation app-wide; review owns
`task` / `task/:taskId`; submissions owns `submissions` / `submissions/:id`; admin and
integration own their subtrees. Paths, URL structure, redirects, guards, multitenant
`/tenant/:tenantId/` prefixing: unchanged unless the change IS the requested feature.

**Adding NEW routes is allowed and expected.** A new route must: live in the owning
package's route tree; load heavy screens via `React.lazy` behind the package's existing
`<Suspense>`/`<Loading/>` (precedent: review's TaskDetails, submissions' detail view);
build paths with the tenant-aware helpers (`getRoute`, `getRedirectUrl`, `navigateTo*`
from `@formsflow/service`) — never hard-code `/tenant/...`; carry the same
permission-guard pattern as sibling routes; alter no existing path/redirect/guard.

## Feature & Bug-Fix Workflow

**Features:**
1. Code lives in the OWNING package; UI needed by 2+ packages goes to
   `@formsflow/components` (additive export + Storybook story), shared logic to
   `@formsflow/service` (additive barrel export).
2. ALL HTTP via `RequestService` from `@formsflow/service` — no raw axios/fetch, no new
   axios instances (the interceptor handles 401-retry and token injection).
3. Every user-facing string (including `aria-label`s) goes through react-i18next; keys in
   the package's `src/resourceBundles/`; never delete/rename existing keys.
4. Follow the Performance and Accessibility/Test-ID/Styling standards below.
5. Tests in the package's own suite (see Testing Standard).
6. Before pushing, in the touched package: `npm run lint` + `npm run check-format` +
   `npm test` (+ `npx tsc --noEmit` where TS) — never reduce the passing-test count or add
   lint errors beyond the documented pre-existing baseline (`AUDIT-20-7-2026/TODO.md` §4).

**Bug fixes:** reproduce first (failing test where feasible) → minimal diff fixing the ROOT
CAUSE (no drive-by refactors — file those separately) → regression test → never "fix"
preserved quirks or `[DISCUSS]` findings in passing.

## Commit Convention

Format: `<TICKET>: [Prefix] <package>: concise description` — e.g.
`FWF-6530: [Modified] service: extract shared auth-header builders`.

- `[Feature]` — new functionality · `[Bugfix]` — bug corrections · `[Hotfix]` — urgent
  out-of-sprint fixes · `[Modified]` — cleanup/refactor/dead-code/comments ·
  `[Documentation]` — docs/changelog only
- Name the touched package in the subject (multi-package commits are rare — prefer one
  package per commit). Mechanical formatting goes in its own `[Modified]`-style commit,
  separate from functional changes (established pattern on FWF-6530).

## Data Fetching Standard

- One transport: `RequestService` (`httpGETRequest`, `httpPOSTRequest`, …). It already
  handles bearer tokens, the 401 refresh-retry, and formio's `x-jwt-token` exclusion.
- **Match the owning package's state stack** (see Package Specifics) — do not introduce a
  new data layer into a package: review/submissions use classic-style Redux (RTK
  installed → `createSelector` is free); admin/integration/nav use local state +
  callback services; react-query exists ONLY in submissions (v4, provider mounted, zero
  live queries — adopting or dropping it is pending decision U.3; don't add queries
  elsewhere).
- Fetch-on-mount effects: guard against setState-after-unmount (`cancelled` flag /
  AbortController — reference: admin `organization/index.tsx`, `plans/index.tsx`); no
  fetches in render bodies; no unconditional POST/PUT side effects from mount effects.
- Every promise chain ends in a handler — fire-and-forget writes get at least
  `.catch((err) => console.error(...))`; never an empty catch.

## Performance Standards

- **The shared bundle multiplies:** `forms-flow-components` ships as ONE file loaded on
  every page of every deployment — anything exported from its barrel is paid everywhere.
  Heavy libraries inside it (formio, bpmn-js) must not gain new eager import paths.
- **Tables (`ReusableTable`/DataGrid):** `useCallback` every handler referenced by column
  defs, THEN `useMemo` the `columns`; hoist static defaults/field maps to module scope
  (never inline `= []` / `= {}` / arrow defaults in props — they defeat downstream memos);
  stable `getRowId`; stable ids as keys — never array index on reorderable lists.
- **Selectors:** never return a fresh object/array from `useSelector`/`mapStateToProps`
  without `shallowEqual` or `createSelector`; subscribe to leaf fields, not whole slices
  (a per-row component subscribing to a whole slice re-renders every row on every
  dispatch); never mutate store objects in render.
- **formio `<Form>`:** `options`, `submission`, and every handler prop must be
  memoized/stable — the library reference-compares `options`, deep-`isEqual`s the form
  JSON per render, and re-subscribes its emitter on any fresh handler object. No
  `cloneDeep` in render bodies.
- **Imperative libraries** (bpmn-js viewers etc.): create once per mount, `.destroy()` in a
  dedicated unmount-only effect (reference: components `BpmnDiagramView.tsx`).
- **CSSOM reads** (`StyleServices.getCSSVariable`, `getComputedStyle`): wrap in
  `useMemo(..., [])` — reference: components `Search.tsx`.
- **lodash:** per-method deep imports only (`import cloneDeep from "lodash/cloneDeep"`).
- **Dev-only modules** (redux-logger): `require()` inside the dev branch, never a
  top-level import.
- **Cleanup:** every timer/listener/observer gets cleanup — EXCEPT root-config pub/sub
  subscriptions (see Hard Constraints; the unsubscribe API is unverified).
- `eslint-plugin-react-hooks` IS active (inside the `*-important-stuff` shared configs;
  `exhaustive-deps` = warnings). Several existing effects have intentionally trimmed dep
  arrays (single-spa mount-once lifecycles) — changing an existing dep array is a
  behavior decision, never automatic. New hooks you write get complete dep arrays.

## Accessibility (WCAG 2.1 AA), Test-IDs & Styling

- **Semantic HTML first:** real `<button>`/`<a>`/`<label>`/`<table>` over clickable divs; a
  non-native interactive element needs `role` + `tabIndex={0}` + Enter/Space handlers.
- Every input has a label (`htmlFor`/`aria-label`); icon-only buttons get `aria-label`;
  images get meaningful `alt` (`""` if decorative); aria strings go through i18n.
- Keyboard-operable everything; never remove focus outlines without a visible replacement;
  modals trap/restore focus — reuse `@formsflow/components` modals.
- Never convey state by color alone; text contrast ≥ 4.5:1 (3:1 large) via theme
  variables — no hard-coded colors (theme's CSS variables are the contract).
- **`data-testid`** on every interactive element/landmark a test would target: kebab-case,
  feature-scoped (`task-filter-save-btn`). Existing testids are a contract.
- **No inline styles** in new code — SCSS/theme classes only; no `!important` (the theme
  package is already fighting a specificity war — don't escalate it).

## Testing Standard

- Jest + RTL per package; run from the package dir. The `@formsflow/*` runtime externals
  do not exist in node_modules — mock them via `moduleNameMapper` (reference setups: nav
  and admin `src/__mocks__/formsflowService|Components.js`; components
  `__mocks__/@formsflow/service.js` exports a REAL i18next instance so the i18n bootstrap
  runs genuinely). `.scss` maps to identity-obj-proxy; add a `matchMedia` shim where
  react-bootstrap Offcanvas renders.
- **jest-29 landmine:** with `rootDir: "src"`, babel-jest never finds the package-root
  `babel.config.json` — set `transform: ["babel-jest", { rootMode: "upward" }]` (admin) or
  pass `configFile` explicitly (review/submissions). Nav is on jest 27 — no jest-28+ APIs
  there.
- Known baselines you must never contort code to satisfy: components has 16 stale suites
  (55 failing tests — expectations from older component versions; modernization tracked in
  `AUDIT-20-7-2026/TODO.md`); never reduce any package's passing count.
- Byte-equivalence testing is the house pattern for risky refactors: encode the OLD
  computation as the test oracle (service `helperServices.test.ts`), or diff rendered
  innerHTML across variants (components CustomButton, 49 combos).

## Engineering Principles (compressed)

- **Quality model:** ISO/IEC 25010 maintainability — modularity, reusability, analysability,
  modifiability, testability; every refactor improves at least one.
- **SOLID · DRY · KISS · YAGNI**; composition over inheritance and over duplication;
  self-documenting code over comments.
- **Separation of concerns:** rendering, business logic, API, state, validation, and data
  transformation live apart — no multi-responsibility components.
- **Components:** small, focused, predictable props; no god components, deep nesting, or
  duplicate UI — decompose rather than grow. Group related props into objects instead of
  10+ positional props.
- **Hooks:** extract reusable logic into custom hooks (components' internal ones live in
  `src/customHooks/internal/` and stay un-exported); no duplicate hook implementations.
- **Readability/complexity:** clear names, small functions/files, early returns, flat
  logic, no magic numbers/strings (permission strings live in constants modules);
  continuously reduce cognitive/cyclomatic complexity; avoid unnecessary abstraction.
- **Cross-package dedup direction:** leaf MFEs may depend on `@formsflow/components` /
  `@formsflow/service` / theme — never the reverse, never on each other. Before writing a
  helper, check the service barrel — `MULTITENANCY_ENABLED`, `getRedirectUrl`,
  `HelperServices` date formatting, `StorageService` already exist; never re-implement
  them locally (raw `localStorage` access for keys StorageService brokers is drift).
- **Errors:** every promise handled; failures user-perceivable where a UI exists; improve
  handling without changing business behavior.
- **Security:** no unsafe rendering/XSS sinks, no sensitive-data exposure, validate
  inputs; never build query payloads by string-interpolating user input; never change
  auth behavior unless explicitly requested.

## Refactoring Workflow & Philosophy

Audit → explain the issues and why they matter → smallest safe refactor → verify identical
behavior → summarize (what/why/benefit/risk) + remaining debt, including anything
intentionally not done because it would need dependency upgrades, breaking API/routing
changes, or major redesign. When in doubt: behavior > optimization · compatibility >
modernization · maintainability > cleverness · simple > complex · incremental > rewrite ·
every change needs a measurable engineering benefit.

## Repo Shape, Stack & Commands

- **Eight independent npm packages, NOT a workspace monorepo** — no root package.json;
  each package has its own package.json/node_modules/webpack/.eslintrc/jest config/
  Dockerfile. Always `cd` into the package before npm commands. One shared version from
  the root `VERSION` file (release workflows bump it — never hand-edit versions).
- Common stack: React 18.3.1 · single-spa 6 (`webpack-config-single-spa-react(-ts)` +
  `webpack-merge`) · react-router v6 where routing exists · formio via
  `@aot-technologies/formiojs`/`formio-react` · Sass. Root `webpack.formio.js` (formio
  aliases + sass rule) is shared by nav/components/review/submissions — extend it there,
  don't duplicate aliases.
- Commands (inside each package): `npm start` (dev server on the package's port) ·
  `npm run start:standalone` · `npm run build` (webpack + `build:types` where TS) ·
  `npm run lint` · `npm run format` / `check-format` (prettier IS installed — unlike
  forms-flow-web) · `npm test` / `coverage` · `npm run analyze`.
- Local all-at-once dev: `./start-mfes.sh` (macOS + VS Code; does NOT include
  integration — start it manually on 3009). CI: per-package path-filtered workflows,
  Node 20, `npm ci --force`, tests only (components/review/submissions); PRs target
  `develop`.

| Package | Port | Stack notes |
|---|---|---|
| forms-flow-nav | 3005 | Plain JS/JSX (no TS) · persistent sidenav · jest 27 |
| forms-flow-admin | 3006 | TS · local state + callback services · no Redux |
| forms-flow-service | 3007 | TS, NO React UI · Keycloak/axios/storage/i18n/router |
| forms-flow-theme | 3008 | SCSS only → `forms-flow-theme.min.css` · no tests |
| forms-flow-integration | 3009 | TS · Workato iframe embeds · smallest package |
| forms-flow-components | 3010 | TS · shared UI lib · MUI v7 + DataGrid v8 · Storybook 7 |
| forms-flow-review | 3011 | TS · classic-style Redux (RTK) · STOMP/SockJS sockets |
| forms-flow-submissions | 3012 | TS · Redux + react-query v4 (dual, decision pending) |

## Package Specifics (deltas only — everything above applies everywhere)

- **service** — loads on every page before any UI; weight and auth lifecycle are
  system-wide. No React (react is devDep-only; keep it that way). Barrel
  `formsflow-services.ts` is the cross-repo contract. Jest runs in `node` env with a
  `window` shim (`jest.setup.js`). The 3 KeycloakService lint errors are deliberate.
- **components** — one 4+ MB bundle on every page: treat every new export as a global
  cost; lazy-load heavy internals where approved. Refactor bar is byte-identical DOM.
  New shared components need a Storybook story. `SvgImages/index.tsx` is eslint-ignored
  (1.27 MB base64 line hangs ESLint — don't inline large assets). Known debts (tracked
  in `AUDIT-20-7-2026/TODO.md`): 16 stale test suites, `build:types` TS2688.
- **nav** — mounted persistently for the whole session: per-render cost matters most
  (memoize role/CSSOM derivations, module-scope static menu structures). Plain JS —
  don't introduce TS files. The old `Navbar.jsx` was deleted as dead code — don't
  resurrect it; sidenav is the live UI.
- **review** — socket lifecycle (`SocketIOService` connect/reconnect/refetch strategy) is
  approval-gated (findings R.1–R.3): don't restructure it in passing. Store must be
  created once (lazy `useState` in `root.component.tsx` — keep it that way).
- **submissions** — dual data layer: server data lives in Redux today; react-query is
  mounted but unused (decision U.3 pending — don't add queries or rip the provider
  without it). Config constants come from `@formsflow/service`, not local copies.
- **admin** — admin-role-gated screens; full-list refetch after mutations is the current
  (known) pattern — don't add new fetch triggers on top of it. `npm install` may need
  `--force` (legacy conflict); never regenerate the lockfile casually.
- **integration** — three Workato embed tabs fetch signed URLs into iframes; don't add
  `message` listeners or change embed origins/payloads. Not in `start-mfes.sh`.
- **theme** — refactor bar is byte-identical compiled CSS: build before/after and diff
  `dist/forms-flow-theme.min.css` (there is no test suite — the diff IS the test). CSS
  variable names and class names are cross-repo contracts; `--ff-*` vars are generated by
  Bootstrap's `$prefix: "ff-"` + the merged `$theme-colors` map. Never rename variables;
  never add `!important`.

## Key Documents (repo root)

- `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md` — 9-agent audit: per-package findings (S/C/N/R/U/A/I/T),
  cross-package duplication (X), bucket index, reusability map
- `AUDIT-20-7-2026/TODO.md` — living tracker: prompts left to run, queued follow-ups, the full
  `[DISCUSS]` approval list, pre-existing-debt baselines per package
- `PROMPT_A_AUDIT.md` — regenerate the audit · `PROMPT_B1`–`PROMPT_B8` — per-package
  safe-fix executors · `PROMPT_C_CROSS_PACKAGE.md` — cross-package consolidation
- `CHANGELOG.md` / `VERSION` — release record · `start-mfes.sh` — local dev launcher

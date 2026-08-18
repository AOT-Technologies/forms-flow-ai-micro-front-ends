# TODO — Performance/Maintainability Refactor (FWF-6530)

> Status as of 2026-07-19. Source of truth for findings: `AUDIT-20-7-2026/PERFORMANCE_AUDIT.md`
> (finding IDs referenced below). Execution prompts: `PROMPT_B1`–`PROMPT_B8`,
> `PROMPT_C`. Executed so far: **B1 service, B2 components, B3 nav, B4 review,
> B5 submissions, B6 admin** — 28 commits pushed to
> `feature/FWF-6530-codebase-refactoring` (`dc2182fc..c717522f`). Every package
> verified: tests + lint + tsc + production build green; all remaining failures
> below are pre-existing and unchanged by the refactor.

---

## 1. Prompts still to execute

- [ ] **PROMPT_B7 — forms-flow-integration** ([SAFE]: I.8, I.9, I.13, I.15, I.17)
      — dead code cluster, headerList memo, EmbedTab triplication dedup, i18n
      strings, misc. Small package; quick pass.
- [ ] **PROMPT_B8 — forms-flow-theme** ([SAFE]: T.2, T.9, T.10, T.16) — ~3,560
      dead SCSS lines (incl. the two commented-out flagship partials), duplicate
      keyframes/rules, zero-use mixins. Verification bar: byte-identical
      compiled CSS (build + diff before/after each change).
- [ ] **PROMPT_C — cross-package consolidation** (run after B7/B8) — additive
      Loading/SpinnerSVG + AccessDenied + PageHead into @formsflow/components
      (X.5.1/X.5.2/X.2.2); checklist helper, `replaceUrl`, formio-token header
      builder, common `API` endpoints, `ROLES` map into @formsflow/service
      (X.1.3/X.4.2/X.1.5/X.6.2/X.4.5); consumer switches onto already-exported
      constants (X.6.1); StorageService instead of ~35 raw storage reads
      (X.4.3). Additive-first, two-deploy ordering per the prompt.

## 2. Small follow-ups queued during execution

- [ ] **components: modernize the 16 stale test suites** (55 failing tests,
      pre-existing). The service mock now provides a real i18next instance, so
      failures are honest assertion mismatches — the tests were written against
      older component behavior (missing test-ids, changed DOM/text, unfired
      handlers). Rewrite suite-by-suite against current components.
- [ ] **components: fix `build:types`** — pre-existing TS2688: the deprecated
      stub package `@types/testing-library__jest-dom` breaks automatic @types
      inclusion. Fix belongs in a deps PR (drop the stub; @testing-library/
      jest-dom v6 ships its own types).
- [ ] **components: format `src/components/SvgIcons/index.tsx`** once the
      in-flight edit on that file lands (carries the package's remaining 265
      prettier lint errors; was excluded from the format pass as WIP).
- [ ] **review: delete now-orphaned files** — `src/helper/user.js`,
      `src/helper/access.js` (their only importer was the deleted
      initialDetailReducer), the dead `redirectUrl` ref in TasklistTable, and
      the zero-reader `lastUpdated` reducer key.
- [ ] **nav: leftover dead code** — `manageOptions()` in Sidebar.jsx is defined
      but never called; `helper/helper.js` exports and the `LANG_UPDATE`
      endpoint are likely unreferenced after the Navbar deletion (verify, then
      delete).
- [ ] **redux-logger bytes** (review R.23 / submissions U.18 note): prod no
      longer *evaluates* the logger, but the bytes still ship because the dev
      gate is a runtime check. Optional: `import()` split (adds async first
      dispatch in dev) or a build-time-decidable gate.
- [ ] **jest-29 landmine for siblings**: any package upgrading to jest 29 with
      `rootDir: "src"` silently loses `babel.config.json` discovery — fix is
      `rootMode: "upward"` in the babel-jest transform (already applied in
      admin; nav still on jest 27).
- [ ] **Manual smoke checks** (thin automated coverage; from agent reports):
      nav — login/logout, language switch via profile save, menu items per
      role, hamburger at <1200px; review — task list live updates, task
      detail open (new lazy chunk), typing in filter modal; submissions —
      detail route first load (Suspense fallback), save-fields modal flow,
      language switch on both formio viewers; admin — billing screens
      (wrapped strings), roles/users/dashboard flows.

## 3. [DISCUSS] approvals needed (nothing implemented without sign-off)

**Highest value first:**
- [ ] **Keycloak lifecycle S.1–S.5** (+ decide **S.25/S.26** together): refresh
      scheduled at 100% of token lifetime; second `initKeycloak()` throws and
      is swallowed; forced refresh every load; timer never cleared on logout;
      `process.env` crash path + divergent MULTITENANCY derivations. Requires
      manual login/refresh/logout testing.
- [ ] **Latent bug fixes** (each restores intended behavior): N.3.1 nav
      `setLoginUrl` crash; A.22 AccessDenied logout crash; A.2 stuck spinners;
      A.1 triple user fetch; I.1 integration errors never rendered; R.11
      reducer wrong key; R.18/U.8 creators called without dispatch; R.19
      `isConnected` never invoked; T.5 undefined CSS vars; T.6 SCSS var emitted
      literally; U.7 GraphQL string interpolation of user input.
- [ ] **Sockets R.1 + R.3 (approve together) and R.2**: connect-once socket
      lifecycle; re-enable auto-reconnect (`reconnectDelay` never matches the
      real routes); stop full-list refetch from every client per event.
- [ ] **Bundle levers**: C.1/C.2 lazy formio + bpmn-js out of the 4.19 MB
      shared components bundle; C.6 i18n re-init at module load; S.22 lazy
      language catalogs (~712 KB); S.18 moment locales IgnorePlugin; T.1
      selective Bootstrap; T.3/T.4 import-order/!important war + conflicting
      token systems.
- [ ] **Behavior decisions**: U.3 react-query stance (provider mounted, zero
      live queries — adopt properly or drop); U.4 submissions mount chain
      (3×GET + 2 unconditional POSTs); A.10 dead count/tab plumbing; N.2.1
      pub/sub unsubscribe contract (confirm root-config bus API).
- [ ] **Structural**: god-component decompositions (R.26/R.27, U.20, A.23,
      C.26); X.7 root shared webpack/babel/jest config; X.4.1 tenant-key helper
      unification (4 incompatible semantics); X.2.3 keycloak `/auth` path
      drift.
- [ ] **Dedicated deps PR** (blocked by no-dep-change rule): remove unused
      formio deps (nav N.6.2, integration I.5, admin A.21, service S.33),
      react-helmet (nav), react-date-range-adjacent leftovers; add missing
      `lodash` declaration in submissions; drop `react-bootstrap` there;
      `@types/*` out of dependencies (integration I.17).

## 4. Known pre-existing debts (unchanged by this refactor — for context)

| Package | Lint (pre-existing) | Tests | Types/build |
|---|---|---|---|
| service | 3 errors (KeycloakService — S.6/S.37 territory) | 30 ✓ | ✓ |
| components | 24 non-prettier + 265 in the WIP SvgIcons file | 72 ✓ / 55 stale-failing (16 suites) | webpack ✓ · build:types TS2688 |
| nav | 0 errors / 1 warning | 3 ✓ | ✓ |
| review | 24 errors / 30 warnings (console, a11y, deps) | 4 ✓ | ✓ |
| submissions | 1 error (a11y) / 23 warnings | 6 ✓ | ✓ |
| admin | 9 errors (a11y) / 18 warnings | 2 ✓ | ✓ |

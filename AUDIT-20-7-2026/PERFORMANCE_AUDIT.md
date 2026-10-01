# forms-flow-ai-micro-front-ends — Performance, Maintainability & Reusability Audit

> Generated 2026-07-19 by a **9-agent parallel audit** — one read-only agent per package
> (service · components · nav · review · submissions · admin · integration · theme) plus a
> cross-package duplication agent that diff-verified every duplication claim. Read-only
> pass — **no code was changed**. Every file/line cited was verified against the current
> tree; duplication claims are labeled IDENTICAL / NEAR-IDENTICAL / SIMILAR from actual
> diffs.
> Tags: **[SAFE]** = high confidence of zero behavior change · **[DISCUSS]** = any
> behavior-change risk, auth-critical area, dependency change, dep-array change, or
> cross-repo contract impact — do not implement without human sign-off.
> Finding IDs: **S** service · **C** components · **N** nav (N.<category>.<n>) · **R**
> review · **U** submissions · **A** admin · **I** integration · **T** theme · **X**
> cross-package. The PROMPT_B1–B8 / PROMPT_C files at the repo root consume these
> sections one package at a time.

---

## §0 Baseline & measurement notes

| Package | npm name | Lang | Dev port | Source size | Data/stack highlights |
|---|---|---|---|---|---|
| forms-flow-service | @formsflow/services | TS (no React) | 3007 | 23 files, ~12,000 lines (~85% = 7 translation catalogs) | Keycloak 26, axios RequestService, StorageService, moment, i18n, router helpers — loaded first on every page |
| forms-flow-components | @formsflow/components | TS/TSX | 3010 | 120 files, ~23,800 lines | MUI v7 + X DataGrid 8, Emotion, bpmn-js, sortablejs, Storybook 7; **dist ≈ 4.19 MB min**, ~170 exported symbols |
| forms-flow-nav | @formsflow/nav | JS/JSX | 3005 | 30 files, ~3,340 lines | Persistent sidenav; pub/sub event bus; react-helmet (dead); Jest 27 |
| forms-flow-review | @formsflow/review | TS/TSX | 3011 | 65 files, ~9,950 lines | RTK classic Redux (60-key task slice), STOMP/SockJS, formio ×3 sites, crypto-js |
| forms-flow-submissions | @formsflow/submissions | TS/TSX | 3012 | 53 files, ~4,610 lines | RTK Redux + react-query v4 (only consumer is a dead file), formio, GraphQL search |
| forms-flow-admin | @formsflow/admin | TS/TSX | 3006 | 34 files, ~3,920 lines | Local state + callback services; react-select (dead import); react-bootstrap |
| forms-flow-integration | @formsflow/integration | TS/TSX | 3009 | 25 files, ~780 lines | Workato iframe embeds; admin skeleton clone; **not in start-mfes.sh** |
| forms-flow-theme | @formsflow/theme | SCSS | 3008 | 66 files, 17,108 lines | Full Bootstrap 5.3 import; 3 style generations; ~21% dead lines; 1,049 `!important` |

- **No builds or tests were run** during the audit. The components dist size is read from
  the existing `dist/` output; all other bundle figures are inferred from import graphs +
  known library sizes and are marked so. To measure for real: `npm run analyze` inside
  each package.
- Render-hot priority areas identified: the shared `ReusableTable` DataGrid wrapper
  (every list screen in every MFE renders through it), the persistently-mounted nav
  Sidebar, the review task list + its per-row `Assigne` widget + socket loop, and every
  formio `<Form>` site (review ×3, submissions ×2 — the formio-react create-instance
  effect deep-compares the full form JSON whenever `options`/handlers get fresh
  identities).
- Two load-bearing environment facts that shape impact scores:
  1. `@formsflow/service` and `@formsflow/components` load on **every page of every
     deployment before any UI renders** — their bundle weight and module-eval side
     effects are paid system-wide (service: 7 eager language catalogs + all moment
     locales; components: eager formio + bpmn-js + a module-load i18n re-`init()`).
  2. `eslint-plugin-react-hooks` is installed **nowhere** in this repo — no dependency
     array is tool-verified, so every dep-array finding is hand-reasoned and changes to
     intentional-looking trimmed arrays are always [DISCUSS].

---

## §1 Executive summary — top 10 wins

| # | Issue | Package | Impact | Confidence | Effort |
|---|-------|---------|--------|------------|--------|
| 1 | WebSocket torn down + reconnected after **every task-list fetch**; auto-reconnect accidentally disabled on the real routes (`pathname.includes("review")` never matches `/task`); every socket event makes every client refetch the list (R.1–R.3) | review | HIGH | HIGH | S–M |
| 2 | Keycloak lifecycle: token refresh scheduled at **100% of token lifetime** (fires at/after expiry), second `initKeycloak()` throws in keycloak-js 26 and is swallowed (callback never fires), forced refresh wasted on every page load (S.1–S.3) — auth-critical [DISCUSS] | service | HIGH | HIGH | S |
| 3 | formio renderer + bpmn-js **eagerly bundled into the 4.19 MB shared components bundle** loaded by every page, even pages that never render them (C.1, C.2) | components | HIGH | HIGH | M |
| 4 | Always-first-loaded service bundle ships **all 7 language catalogs (~712 KB source)** + **all ~160 moment locales** eagerly (S.22, S.18) | service | HIGH | HIGH | M |
| 5 | Theme: **full Bootstrap import** multiplied by 12 extra theme colors; **~3,560 dead SCSS lines** incl. the two biggest partials which are commented out of the build; two `:root` token systems silently conflict (`--font-size-xs` = 10px, not the documented 0.875rem) (T.1, T.2, T.4) | theme | HIGH | HIGH | M |
| 6 | `ReusableTable` inline default props (`getRowId`, `customSlots`, `sx`, …) defeat its own memoization for **every list screen in every MFE**; consumers (admin ×3 tables, submissions) rebuild `columns` with fresh closures per render on top (C.8, C.9, A.8, U.14) | components + consumers | HIGH | HIGH | S |
| 7 | Nav: dead 514-line `Navbar.jsx` (+ react-helmet chain) still imported → ships in the every-page bundle; latent `setLoginUrl` ReferenceError can blank the entire nav (error boundary returns `null`); Sidebar re-renders on every route change for state it never reads (N.6.1, N.3.1, N.1.1–N.1.2) | nav | HIGH | HIGH | S |
| 8 | Mount-time fetch storms: admin Users tab fetches the user list **3×** on mount (A.1); submissions list fires **3× GET + 2 unconditional POST writes** per visit before any user action (U.4) | admin, submissions | HIGH | HIGH | S–M |
| 9 | Dead-code sweep: 841-line dead `SubmissionListOld.tsx` is the only react-query consumer + a dead second QueryClient (U.1–U.3); ~750 dead lines in review (R.25); dead `react-select` import bundles the whole library in admin (A.19); 8 dead files in nav (N.6.3); ~3,560 dead SCSS lines (T.2) | all | MED–HIGH | HIGH | S |
| 10 | **~1,400–1,800 diff-verified duplicated lines across packages**: Loading kit byte-identical ×4, i18n init shim ×5 (review/submissions init the shared singleton twice), `MULTITENANCY_ENABLED` re-derived ×6, keycloak `/auth` path drift (works only in admin), 4 incompatible tenant-key helpers (X.*) | cross-package | HIGH (maint.) | HIGH | M |

---

# §2 forms-flow-service (S.*)

**Package summary.** ~12,000 lines of TS in 23 files, but ~10,200 of those lines (85%) are seven eagerly-imported i18n translation objects; the actual logic layer is ~1,300 lines (KeycloakService 210, RequestService 239, routerHelper 494, StorageService 66, helpers ~240). Structure is clean and small, but this bundle is the SystemJS module every other micro-frontend (and forms-flow-web in a separate repo) imports before any UI renders, so its weight (7 language bundles + moment with all locales + axios + i18next + keycloak-js) and its auth lifecycle are system-wide. Overall health: logic is mostly sane (no interceptor stacking, no seconds-vs-ms timer bug), but the hottest risk is the Keycloak refresh lifecycle: the refresh timer is scheduled at **100% of token lifetime** (i.e. at/after expiry), the loop force-refreshes on every init, and `initKeycloak()` on the shared singleton throws in keycloak-js 26 when a second MFE calls it — with the error swallowed and the consumer callback never invoked. Zero tests exist for any of this, and the entire cross-repo contract is `any`-typed on the consumer side.

## 1. Keycloak / auth lifecycle (all findings auth-critical → [DISCUSS] even where the bug is clear)

**S.1 [DISCUSS] Token refresh scheduled at 100% of token lifetime — refresh runs at/after expiry — IMPACT: HIGH, CONFIDENCE: HIGH**
`src/keycloak/KeycloakService.ts:57-67, 105`
`getTokenExpireTime()` returns `(exp − iat) × 1000` = the *full* token lifetime, and `refreshLoop` schedules the next refresh with exactly that delay (`this.timerId = setTimeout(refreshLoop, this.getTokenExpireTime())`, line 105). The new token obtained at each loop iteration expires at exactly the moment the next iteration fires, so there is always a window where in-flight requests carry an expired access token (masked for API calls by the 401 retry interceptor in RequestService, but generating 401 noise and extra latency; formio `x-jwt-token` requests are explicitly excluded from that retry, requestService.ts:32). Fix shape: schedule at a safety margin, e.g. `Math.max(this.getTokenExpireTime() - 30_000, 10_000)` — behavior change in an auth-critical path, so [DISCUSS]. (Note: the sibling-repo `.getMilliseconds()` near-0ms loop bug is **not** present here — math at lines 61-62 is correct unix-seconds → ms.)

**S.2 [DISCUSS] Second `initKeycloak()` on the shared singleton throws in keycloak-js 26; error is swallowed and the consumer callback is never called — IMPACT: HIGH, CONFIDENCE: HIGH (code shape) / MED (runtime symptom)**
`src/keycloak/KeycloakService.ts:124-133, 140-182`; `node_modules/keycloak-js/lib/keycloak.js:176-177` (`throw new Error("A 'Keycloak' instance can only be initialized once.")`)
`getInstance()` returns a singleton, but four MFEs each call `instance.initKeycloak(cb)` at mount (`forms-flow-admin/src/index.tsx:84-93`, `forms-flow-review/src/index.tsx:89-95`, `forms-flow-submissions/src/index.tsx:77-83`, `forms-flow-integration/src/index.tsx:52-58`). keycloak-js 26 hard-throws on a second `init()`; the rejection lands in the `.catch` at lines 179-181 which only `console.error`s — the caller's `callback` never fires, leaving that MFE stuck pre-auth unless it happened to receive the instance via the `FF_AUTH` pub/sub. Fix shape: track `initialized`/in-flight promise inside KeycloakService and invoke the callback from cached state on re-init. Cross-MFE auth behavior — [DISCUSS].

**S.3 [DISCUSS] Refresh loop force-refreshes (`updateToken(-1)`) immediately on every successful init — IMPACT: MED, CONFIDENCE: HIGH**
`src/keycloak/KeycloakService.ts:74, 94-114, 168`
`refreshToken()` runs `refreshLoop()` immediately (line 114), whose first act is `updateToken(-1)` (forced refresh, line 74) — a wasted Keycloak round-trip on every page load, discarding the seconds-old token from `init()`. Fix shape: schedule the first `setTimeout` without an immediate forced call, or pass a positive `minValidity`.

**S.4 [DISCUSS] `loadUserInfo()` has no `.catch` — on failure the auth callback never fires — IMPACT: MED, CONFIDENCE: HIGH**
`src/keycloak/KeycloakService.ts:160-167`
`callback(true)` only runs inside `loadUserInfo().then(...)`. A transient failure there means the consumer app never renders (and the error is an unhandled rejection). Fix shape: `.catch` that still invokes `callback(true)` (token is valid) or `callback(false)` — behavior decision, [DISCUSS].

**S.5 [DISCUSS] Refresh timer never cleared on logout; no guard against installing a second loop — IMPACT: MED, CONFIDENCE: HIGH**
`src/keycloak/KeycloakService.ts:48-51, 105-110, 186-189`
`logout()`/`userLogout()` never `clearTimeout(this.timerId)`; the timer is only cleared on refresh *failure* (line 109). In practice `kc.logout()` redirects the page so the timer dies with it, but any logout path that fails/blocks leaves a loop force-refreshing a dead session. `refreshToken()` also has no re-entry guard — nothing clears an existing `timerId` before starting a new loop. Fix shape: unconditional `clearTimeout` at the top of `refreshToken()` and in `userLogout()`.

**S.6 [DISCUSS] `updateToken()` contract: throws a string literal; resolves `null` on "not refreshed"/no-instance — feeds `Bearer null` into the retry path — IMPACT: MED, CONFIDENCE: HIGH**
`src/keycloak/KeycloakService.ts:69-86` and `src/request/requestService.ts:38-51`
Line 84 `throw "error updating token"` discards the real error (and breaks `instanceof Error` handling). Lines 71/81 return `null`, which RequestService interpolates directly: `Authorization: Bearer ${newToken}` (requestService.ts:48) → literal `"Bearer null"` on the retried request. Fix shape: reject with an `Error`, and in the interceptor fall back to `StorageService.get(AUTH_TOKEN)` when the resolved token is falsy.

**S.7 [DISCUSS] `getInstance()` silently ignores all arguments after first construction — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/keycloak/KeycloakService.ts:124-133`
Different MFEs pass url/realm/clientId/tenantId, but only the first caller's config wins; a tenant switch in-session keeps the stale `${tenantId}-${clientId}`. Consumers already rely on the loophole: `forms-flow-submissions/src/components/AccessDenied/index.js:14` calls `KeycloakService.getInstance()` with **no** arguments (would construct Keycloak with `undefined` config if it ever ran first). Report-only on the API shape; at minimum log when args are ignored.

**S.8 [DISCUSS] No-roles path calls `callback(false)` but leaves the Keycloak SSO session alive; init `.catch` leaves app hung — IMPACT: LOW, CONFIDENCE: MED**
`src/keycloak/KeycloakService.ts:148-152, 179-181`
A token without `roles|role|client_roles` claims yields `callback(false)` with no logout — user is stuck half-authenticated (refresh/login loop potential on next mount). `init()` failure (line 179) only logs; callback never called.

## 2. RequestService / axios layer

**S.9 [SAFE] Authorization-header construction copy-pasted 7 times — IMPACT: MED (maintainability), CONFIDENCE: HIGH**
`src/request/requestService.ts:74-82, 95-103, 114-122, 138-144, 159-167, 186-193, 204-210, 220-226`
The identical `Bearer ${token || StorageService.get(...)}` ternary appears in every method. A private `static authHeaders(token, isBearer, headers?)` collapses ~70 lines with zero behavior change (internal only; public signatures untouched).

**S.10 [DISCUSS] No cancellation support on 8 of 9 request methods — IMPACT: MED, CONFIDENCE: HIGH**
`src/request/requestService.ts:65-229` — only `httpPOSTRequestWithHAL` accepts `signal?: AbortSignal` (line 183). Every list/search screen in every MFE therefore cannot abort stale requests through this layer. Adding an optional trailing `signal` param is additive (non-breaking) but touches the cross-repo contract → [DISCUSS].

**S.11 [SAFE] Circular import through the package barrel — IMPACT: MED (fragility), CONFIDENCE: HIGH**
`src/request/requestService.ts:8` imports `KeycloakService` from `"../formsflow-services"` while `src/formsflow-services.ts:1-3` imports RequestService — a module cycle that only works because usage is deferred to the interceptor callback. Import `"../keycloak/KeycloakService"` directly; same symbol, cycle gone, zero behavior change.

**S.12 [SAFE] Redundant `new Promise` wrapper around `updateToken()` — IMPACT: LOW, CONFIDENCE: HIGH**
`src/request/requestService.ts:38-44` — `await KeycloakService.updateToken()` inside the existing try/catch is equivalent; the explicit-promise-constructor anti-pattern just re-wraps an existing promise.

**S.13 [DISCUSS] All public methods return `any`; `headers: object | null` unvalidated — IMPACT: MED (contract quality), CONFIDENCE: HIGH**
`src/request/requestService.ts:71, 91, 112, 133, 155, 170, 184, 202, 218` — every return type is `any`, so no consumer in any repo gets `AxiosResponse` typing. Changing to `Promise<AxiosResponse>` is type-only but on the cross-repo surface → [DISCUSS].

**S.14 [DISCUSS] `httpPOSTRequestWithoutToken` / `httpPUTRequestWithoutToken` bypass the instance (bare `axios`) — IMPACT: LOW, CONFIDENCE: HIGH**
`src/request/requestService.ts:170-176, 230-236` — intentional (no auth, no 401 retry) but undocumented; they also skip any future shared interceptor (telemetry, error normalization). Report-only.

## 3. StorageService

**S.15 [DISCUSS] `clear()` wipes the ENTIRE localStorage + sessionStorage for the origin — IMPACT: MED-HIGH, CONFIDENCE: HIGH**
`src/storage/storageService.ts:61-64` — called on logout and from `KeycloakService.logout()` (KeycloakService.ts:50). Nukes non-auth keys: `i18nextLng` (language preference lost every logout — forms-flow-admin reads it at `forms-flow-admin/src/index.tsx:105`), `checklistItems`, `tenantData`, `roleIds`, and anything any co-hosted app stored. Fix shape: delete only the known `User` enum keys + package-owned keys — behavior change, [DISCUSS].

**S.16 [DISCUSS] `save()` writes both sessionStorage AND localStorage; `get()` reads only sessionStorage — IMPACT: MED, CONFIDENCE: HIGH**
`src/storage/storageService.ts:15-17, 35-38` — the localStorage copy of `AUTH_TOKEN`/`USER_DETAILS` is never read by this package (dead duplicate write persisting tokens beyond the session — a security-adjacent smell), yet cannot be removed safely because other repos may read localStorage directly. Report-only.

**S.17 [DISCUSS] `getParsedData()` has no try/catch — corrupt stored JSON throws to the caller — IMPACT: LOW, CONFIDENCE: HIGH**
`src/storage/storageService.ts:25-28` — inconsistent with `checklistService.getStoredChecklistItems` (src/helpers/checklistService.ts:4-11) which guards the identical pattern. Used by `forms-flow-review/src/root.component.tsx` — a hardened version changes error behavior, so [DISCUSS].

## 4. moment usage

**S.18 [DISCUSS] All ~160 moment locales bundled — no IgnorePlugin/ContextReplacementPlugin — IMPACT: HIGH (bundle), CONFIDENCE: HIGH**
`webpack.config.js:1-31` (no plugins added) and verified absent from the base `webpack-config-single-spa` config; `node_modules/moment/locale` is 752KB raw. Since moment is imported only in `src/helpers/helperServices.ts:1`, the locale directory rides along on every page of every deployment. Fix shape (build-only, no behavior change unless a locale was implicitly relied on — hence [DISCUSS]): `new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ })`.

**S.19 [SAFE] Date formatters create two moment instances per call; called per-render by consumers — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/helpers/helperServices.ts:17-22, 29-34, 52-56` — pattern is `moment.utc(str).toDate()` then re-wrap in `moment(...)`; `moment.utc(str).local().format(...)` is one instance, same output. Also `date?.replace` at lines 17/29/52 is redundant after the `!date` guard.

**S.20 [DISCUSS] `getISODateTime` comment says "strict ISO with colon" but `ZZ` emits offset WITHOUT colon — IMPACT: LOW, CONFIDENCE: HIGH**
`src/helpers/helperServices.ts:5-10` — `"YYYY-MM-DDTHH:mm:ss.SSSZZ"` produces `+0530`; `Z` produces `+05:30`. Either the comment or the format is wrong; backends may depend on the current non-colon form, so [DISCUSS].

**S.21 [DISCUSS] `getMoment(date): any` leaks the moment API into the cross-repo contract — IMPACT: MED (lock-in), CONFIDENCE: HIGH**
`src/helpers/helperServices.ts:59-61` — any future move off moment becomes a breaking change for every consumer. Report-only.

## 5. i18n / resourceBundles

**S.22 [DISCUSS] ~712KB of translations across 7 languages eagerly imported into the always-loaded bundle — IMPACT: HIGH, CONFIDENCE: HIGH**
`src/resourceBundles/i18n.ts:2-8, 16-38` — file sizes: bg 148K, de 112K, fr 112K, pt 108K, zh 96K, es 72K, en 64K (1,100–1,600 keys each). A user browsing in one language downloads and parses all seven on every page load, before UI. Fix shape: lazy `import()` per language with `addResourceBundle` on `languageChanged` — loading behavior change + contract timing, [DISCUSS].

**S.23 [DISCUSS] English bundle is 97% identity mappings (1,068 of 1,101 entries are `"X": "X"`) — IMPACT: MED, CONFIDENCE: HIGH**
`src/resourceBundles/en/resourceBundles.ts` (verified by script) — i18next returns the key itself when a key is missing, so ~64KB is redundant weight; only the 33 non-identity entries do work. Removing identity entries depends on fallback config assumptions → [DISCUSS]. Related drift data: fr has 512 keys absent from en (mostly formio-builder strings — expected, since en uses key-as-text), en has 17 keys absent from fr (genuine translation gaps).

**S.24 [DISCUSS] `checkCustomResourceBundleAndUpdate` throws if `window._env_` is undefined — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/resourceBundles/i18n.ts:52-53` — `envValue.REACT_APP_CUSTOM_RESOURCE_BUNDLE_URL` with no optional chaining; in standalone/test contexts this is an unhandled async rejection at module init (the instance is built as a module side effect, lines 82-83). One-char fix (`envValue?.`) but in init path → [DISCUSS].

## 6. routerServices

**S.25 [DISCUSS] Latent `process is not defined` crash path at module load — IMPACT: MED, CONFIDENCE: MED**
`src/routerServices/routerConstants.ts:7-10` — `window._env_?.REACT_APP_MULTI_TENANCY_ENABLED || process.env.REACT_APP_MULTI_TENANCY_ENABLED || false` evaluates `process.env.*` whenever the `_env_` value is falsy/absent; no DefinePlugin/EnvironmentPlugin exists in `webpack.config.js` or the base single-spa config (only `NODE_ENV` is auto-substituted), and browsers have no `process` global. Deployments survive because config.js usually sets the var (even `"false"` is a truthy string that short-circuits) — but a config omitting it would throw at bundle evaluation and take down every page. MED confidence because I could not run the build to inspect emitted code.

**S.26 [SAFE] Duplicated MULTITENANCY_ENABLED derivation in two modules with different fallback logic — IMPACT: MED, CONFIDENCE: HIGH**
`src/routerServices/routerConstants.ts:7-13` vs `src/constants/constants.ts:7-11` — the router copy consults `process.env`, the constants copy doesn't; `HelperServices` uses the constants one, routing uses the router one. Two sources of truth that can disagree. Consolidate to one internal module (both exports preserved).

**S.27 [SAFE] `navigateTo`, `navigateWithHistory`, `syncRouterPath` are three names for the identical body; `navigateToTaskListingFromReview` duplicates `navigateToTaskListing` — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/routerServices/routerHelper.ts:7-18, 124-126, 317-323` — all just call `navigate(url)`. Exports must stay (contract), but internals can delegate to one function.

**S.28 [SAFE] `.replace("/formflow", "")` base-route surgery duplicated in 4 helpers — IMPACT: LOW, CONFIDENCE: HIGH**
`src/routerServices/routerHelper.ts:188-191, 203, 211, 216` — fragile string surgery (breaks if a tenant id ever contains "/formflow"); `getRedirectUrl(tenantId)` (routerConstants.ts:70-72) already yields the same base and is used by `navigateToProcessEdit` (line 221). Unify internally.

**S.29 [SAFE] `getRoute()` allocates a fresh 20-key object per navigation call — IMPACT: LOW, CONFIDENCE: HIGH**
`src/routerServices/routerConstants.ts:42-63` — every `navigateTo*` builds the full route map to read one key. Cold path (navigation), so LOW; memoize per tenantId if desired.

**S.30 [DISCUSS] Contract typos/patterns frozen into the public surface — IMPACT: LOW, CONFIDENCE: HIGH**
`src/routerServices/routerConstants.ts:35` `INTEGRETIONS` (sic) key; line 19 `FORM_ENTRIES: "form/:formId/entries"` mixes a route *pattern* into a map otherwise used for navigation *paths* (navigating with it would emit a literal `:formId`). Renames are breaking — report-only. Also ~15 helper params are implicitly `any` (e.g. `routerHelper.ts:112, 118, 128, 158, 215, 230, 279-282`).

## 7. apiManager

**S.31 [DISCUSS] Package imports itself through the SystemJS external `@formsflow/service` — IMPACT: MED (fragility), CONFIDENCE: HIGH**
`src/apiManager/services/formioRoleService.ts:1` imports `RequestService, StorageService` from `"@formsflow/service"`; `webpack-config-single-spa` marks `^@formsflow/` external by default (verified `node_modules/webpack-config-single-spa/lib/webpack-config-single-spa.js:24-25, 121-123`), so at runtime the bundle asks SystemJS for *itself* (also note npm name is `@formsflow/services`, plural, while the module id is singular). Works via SystemJS circular-namespace handling but is fragile and defeats tree-shaking. Fix: relative imports (`../../request/requestService`) — zero behavior change in principle, but module-graph change in the shared loader → [DISCUSS].

**S.32 [DISCUSS] `fetchAndStoreFormioRoles` swallows errors into `{success:false}` and writes raw string keys — IMPACT: LOW, CONFIDENCE: HIGH**
`src/apiManager/services/formioRoleService.ts:48-57` — mixes `StorageService.save("formioToken", ...)` (dual-write) with direct `localStorage.setItem("roleIds", ...)`; keys are not in the `StorageService.User` enum; error detail reaches callers only if they check `.error` (forms-flow-review does, `forms-flow-review/src/api/services/userSrvices.ts:9-33`).

## 8. Bundle size & dead code

**S.33 [DISCUSS] Unused runtime dependencies declared: `@aot-technologies/formio-react`, `@aot-technologies/formiojs`, `single-spa`; `@types/*` in `dependencies` — IMPACT: MED (install/docker weight, not bundle), CONFIDENCE: HIGH**
`package.json` dependencies block — grep of `src/` shows zero imports of formio-react/formiojs/single-spa (only the string id `"single-spa-style-overrides"` in compactViewFormService.ts:7). They aren't bundled (unimported / external) but inflate every install and image build. No dep changes allowed → report-only.

**S.34 [DISCUSS] The three big weight drivers of the always-first-loaded bundle — IMPACT: HIGH, CONFIDENCE: HIGH**
(1) 7 eager language bundles (~712KB source, S.22); (2) moment + all locales (S.18); (3) i18next + axios + keycloak-js (necessary). Items 1-2 are the actionable ~70-80% of the payload. No lodash anywhere (verified). No unused source files found — all 23 files are reachable from `src/formsflow-services.ts`.

## 9. Maintainability

**S.35 [DISCUSS] Entire cross-repo contract is `any`-typed at the consumer boundary — IMPACT: MED-HIGH, CONFIDENCE: HIGH**
`src/declarations.d.ts:40-126` declares `module "@formsflow/service"` as `export const { ...79 names }: any` — and each consumer repo carries its own copy (e.g. `forms-flow-review/src/declarations.d.ts`). The package *does* emit real declarations (`tsconfig.json` `declaration: true`, `types: dist/formsflow-services.d.ts`) that nobody consumes. Every rename/signature error across 9 MFEs compiles silently. Fix shape: point consumer `declarations.d.ts` at the generated types — cross-repo coordination, [DISCUSS].

**S.36 [DISCUSS] No `strict` TypeScript; zero tests for the auth-critical shared layer — IMPACT: MED, CONFIDENCE: HIGH**
`tsconfig.json` extends `ts-config-single-spa` (verified: no `strict` flag) — hence the implicit-`any` params throughout routerHelper and `(authenticated)` in KeycloakService.ts:140; `package.json` test script is `jest --passWithNoTests` and `src/` contains no test files. The most security-sensitive package in the system has no safety net.

**S.37 [SAFE] Error-handling style is inconsistent across the package — IMPACT: LOW-MED, CONFIDENCE: HIGH**
Four patterns coexist: throw string literal (KeycloakService.ts:84), console-and-continue (KeycloakService.ts:179-181), `{success:false, error}` result object (formioRoleService.ts:55-57), silent swallow (checklistService.ts:52-54, documented). Six `console.*` calls ship to production (KeycloakService.ts:99, 108, 145, 175, 180; requestService.ts:53). Internal normalization is safe; anything observable is [DISCUSS].

**S.38 [DISCUSS] `removeTenantKeyFromData` builds an unescaped, case-sensitive RegExp from `tenantKey`, then compares lowercased — IMPACT: LOW, CONFIDENCE: HIGH**
`src/helpers/helperServices.ts:64-86` — regex metacharacters in a tenant key would corrupt the pattern; a value whose tenant prefix differs in case from `tenantKey` fails the `.exec` yet the subsequent comparison/replace assume lowercase — convoluted and edge-case-prone. Simple `startsWith` on lowercased strings expresses the intent; output could differ on today's edge cases → [DISCUSS].

## Checked & clean (verified negatives)

- **No seconds-vs-milliseconds timer bug**: `getTokenExpireTime` correctly does `new Date(exp*1000) − new Date(iat*1000)` (KeycloakService.ts:61-62); grepped `getMilliseconds|getSeconds|getTime()` — the sibling-repo near-0ms refresh-loop bug is absent.
- **No axios interceptor stacking**: the response interceptor is installed exactly once inside the one-time static initializer (`requestService.ts:17-22`); grepped `interceptors.` — single site. Exactly one shared `AxiosInstance` plus intentional bare-`axios` use for the two unauthenticated helpers.
- **401-retry guard is correct**: `_retry` flag prevents loops, and requests carrying `x-jwt-token` (formio) are correctly excluded from Bearer retry (requestService.ts:31-35).
- **No duplicate keys inside any translation file**: perl dup-key scan over en/fr/de/zh/es/pt/bg — zero duplicates in all 7.
- **No lodash anywhere; no React imports in `src/`** (react is devDep-only, as intended); grepped both — zero hits.
- **No dead source files**: all 23 files under `src/` are reachable from the `src/formsflow-services.ts` entry; `checklistService`, `getParsedData`, `saveDataToSessionStorage`, `fetchAndStoreFormioRoles` all have live consumers in this repo (forms-flow-review) — none of the contract exports could be shown dead, so no delete candidates even at [DISCUSS] level beyond S.30's typo keys.
- **routerHelper purity**: every `navigateTo*` takes the router `navigate` as an injected parameter — no direct `window.history`/`location.href` mutation; the only window access is `getOrigin()` (routerConstants.ts:78-80) and one-time module-load env reads. No hot-path window reads.
- **StorageService JSON costs**: no repeated `JSON.parse` loops in-package; parse sites are single-shot (`checklistService.ts:6`, `getParsedData`).

## apiManager inventory

| Function | Endpoint | Verb | In-package callers | Cross-repo consumers (this repo) |
|---|---|---|---|---|
| `fetchAndStoreFormioRoles` (`src/apiManager/services/formioRoleService.ts:35`) | `MULTITENANCY_ENABLED ? ${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenant : ${WEB_BASE_URL}/formio/roles` (`src/apiManager/endPoints/index.ts:8-9`) | GET | none (exported via barrel only) | `forms-flow-review/src/api/services/userSrvices.ts:1,9` |
| — endpoint constant `API.GET_TENANT_DATA` | `${MT_ADMIN_BASE_URL}/v1/tenant` | — | `fetchAndStoreFormioRoles` only | — |
| — endpoint constant `API.FORMIO_ROLES` | `${WEB_BASE_URL}/formio/roles` | — | `fetchAndStoreFormioRoles` only | — |

That is the entire apiManager: one service function, two endpoint constants, no dead functions (the single function has a verified live consumer). Note S.31 (self-import through the external) and S.32 (storage-key hygiene) apply to this module.

---

# §3 forms-flow-components (C.*)

**Package summary:** ~23,700 lines TS/TSX in `src/` (~15,900 excluding tests/stories across 120 files), built by single-spa webpack into one `forms-flow-components.js` (**dist output: 4.19 MB minified**) loaded as a runtime external by every MFE page. Public surface is very large: ~60 exported components from `CustomComponents`, **98 SVG icon components**, 6 SVG images, 3 custom hooks, plus `ProcessDiagram`, `FileUploadPanel`, and `DownloadPDFButton` — ~170 symbols, all cross-repo contract. Overall health: individual newer components (`V8CustomButton`, `Switch`, `DateRangePicker`, `Search`) are well-memoized, but the hottest shared paths have serious issues: the barrel eagerly pulls **formiojs + formio-react and bpmn-js into every page**, `ReusableTable` (the DataGrid wrapper used by every list screen) defeats its own memoization via inline default props, the legacy `CustomButton` registers a window listener **and re-triggers i18n language change on every mount** (it renders per table row), and the library **re-initializes the host app's shared i18n instance at module load**. Ten dropdown implementations (~3,540 lines) and twelve modal variants (~1,875 lines) contain heavy copy-paste.

## Bundle weight of the shared library

**C.1 [DISCUSS] formio renderer bundled eagerly into the shared bundle via the barrel — IMPACT: HIGH, CONFIDENCE: HIGH**
`src/components/CustomComponents/FormComponent.tsx:2-3` imports `Form` from `@aot-technologies/formio-react` and `Utils` from `@aot-technologies/formiojs` at module top-level; `FormComponent` is re-exported from `src/components/index.ts:40` (and reached again via `VariableSelection`/`AutoVariableSelection`). Only `@formsflow/*`, `react`, `react-dom` are externals (`webpack.config.js:20`), so the entire formio renderer (plus its lodash) ships in the 4.19 MB `forms-flow-components.js` paid by every page, even pages that never render a form preview. Fix shape: dynamic `import()` of the formio modules inside `FormComponent` (lazy component with same exported name/props) — allowed per constraints, but introduces an async first paint → DISCUSS.

**C.2 [DISCUSS] bpmn-js viewer eagerly imported at module top-level — IMPACT: HIGH, CONFIDENCE: HIGH**
`src/components/CustomComponents/BpmnDiagramView.tsx:6` — `import BpmnJS from "bpmn-js/dist/bpmn-navigated-viewer.production.min.js"`; exported as `ProcessDiagram` from `src/components/index.ts:37`. Every page in every MFE pays for the bpmn viewer even though it renders only in history/diagram modals. Fix shape: `const { default: BpmnJS } = await import(...)` inside the mount path (state-gated), keeping export name/props identical.

**C.3 [DISCUSS] react-toastify + its CSS pulled in by DownloadPDFButton; one ToastContainer per button instance — IMPACT: MED, CONFIDENCE: HIGH**
`src/service/ExportAsPdf/downloadPdfButton.tsx:9-10` imports `toast`, `ToastContainer` and `react-toastify/dist/ReactToastify.css` (barrel export at `src/formsflow-components.ts:3`). Adds toastify to the shared bundle, and lines 131-142 render a full `<ToastContainer>` inside every button instance — N buttons = N containers = duplicated toasts. Fix shape: render toasts via the host's container or a single module-level container; report-only since toast placement is visible behavior.

**C.4 [SAFE] Whole-package lodash import for a single `cloneDeep` — IMPACT: LOW, CONFIDENCE: HIGH**
`src/components/CustomComponents/FormComponent.tsx:4` `import _ from "lodash"` used only at line 60 (`_.cloneDeep(form)`). lodash is not even a declared dependency (transitive via formiojs), so this also relies on hoisting. Change to `import cloneDeep from "lodash/cloneDeep"` — no dependency change, no behavior change. (Impact LOW because formiojs's CJS build already drags lodash into the bundle.)

**C.5 [SAFE] Dead code in the icon module and barrel — IMPACT: LOW, CONFIDENCE: HIGH**
`src/components/SvgIcons/index.tsx` carries 136 commented-out lines (e.g., dead `AddIcon` at 84-94, dead `CloseIcon` at 984+). `src/components/index.ts:33` re-exports `../customHooks/useSuccessCountdown` via `export *`, but that file only has a default export (`src/customHooks/useSuccessCountdown.ts:75`), so the line exports nothing (the real export is `src/customHooks/index.ts:1`). Removing the comments/no-op line changes nothing.

## i18n / resourceBundles

**C.6 [DISCUSS] Library re-initializes the host app's shared i18n instance at module load — IMPACT: HIGH, CONFIDENCE: MED**
`src/resourceBundles/i18n.js:8-19` — at import time (via `src/components/CustomComponents/Button.tsx:7` → barrel → every page) it grabs `i18nService` from `@formsflow/service` and calls `.use(LanguageDetector).use(initReactI18next).init({... Storybook-only English resources ...})` on the **shared instance**. Re-`init()` on an already-initialized i18next instance can clobber host config/resources depending on load order. Fix shape: guard with `if (!i18nService.isInitialized)` or use `addResourceBundle` instead of `init` — behavior-affecting, must be discussed.

**C.7 [DISCUSS] `i18n.changeLanguage()` fired on every legacy CustomButton mount — IMPACT: MED, CONFIDENCE: HIGH**
`src/components/CustomComponents/Button.tsx:102-105` — the mount effect reads `localStorage.i18nextLng` and calls `i18n.changeLanguage(locale)` for **every button instance**. Tables using `ReusableProcessTableRow` (one `CustomButton` per row, `ReusableProcessTableRow.tsx:39-45`) trigger N language-change events per page render cycle; each event notifies all `useTranslation` subscribers. Fix shape: remove from the per-instance effect (language detection belongs to the host) — behavior-adjacent → DISCUSS.

## MUI DataGrid wrappers

**C.8 [SAFE] `ReusableTable`: inline default props defeat every internal `useMemo` and change DataGrid prop identity per render — IMPACT: HIGH, CONFIDENCE: HIGH**
`src/components/CustomComponents/ReusableTable.tsx:50-78` — defaults `sortModel = []`, `getRowId = (row) => row.id || row._id`, `pageSizeOptions = [10,25,50,100]`, `sx = {height:"100%",width:"100%"}`, `dataGridProps = {}`, `customSlots = {}`, `customSlotProps = {}`, `customLocaleText = {}` are fresh identities on every render whenever the caller omits them. `getRowId` is a dep of the `memoizedRows` memo (line 235), `customSlots` of `defaultSlots` (line 123), `customLocaleText` of `defaultLocaleText` (line 134) — so rows, slots and localeText are rebuilt each render and the DataGrid (used by every list page in every MFE) re-processes rows/slots continuously. Fix: hoist all defaults to module-level constants — identical values, stable identity.

**C.9 [SAFE] `ReusableTable`: per-render closures passed to DataGrid — IMPACT: MED, CONFIDENCE: HIGH**
`ReusableTable.tsx:237-253` (`getRowClassName`, `defaultGetRowHeight`), line 285 (`getRowId={(row) => row.id}`), lines 295-301 (inline `slotProps` object), line 306 (`sortingOrder={['asc','desc']}` fresh array). All get new identities per render, invalidating DataGrid's internal memoization. Fix: `useCallback`/hoisted constants (no dep-array trimming involved).

**C.10 [DISCUSS] `ReusableTable`: `sortingOrder` placed after `{...dataGridProps}` silently overrides consumers; `enableRowExpansion` kills virtualization; deprecated `autoHeight` — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`ReusableTable.tsx:305-306` — `sortingOrder` is applied after the `dataGridProps` spread, so a consumer's `sortingOrder` inside `dataGridProps` is silently ignored. Line 292 — `enableRowExpansion` forces `disableVirtualization`, an O(n)-DOM trap for large pages. Line 294 forwards `autoHeight`, deprecated in installed `@mui/x-data-grid` 8.13.1 (`node_modules/@mui/x-data-grid/models/props/DataGridProps.d.ts:84-90`). All report-only (fix changes observable behavior).

**C.11 [DISCUSS] `HistoryPage`: rows/columns rebuilt per render + `JSON.parse` of user roles per cell — IMPACT: MED, CONFIDENCE: HIGH**
`src/components/CustomComponents/HistoryPage.tsx:259-260` calls `generateRows(allHistory)` / `generateColumns()` inline, handing new arrays to `ReusableTable` each render (rebuilding all renderCell closures). Lines 225-227: `JSON.parse(StorageService.get(USER_ROLE))` runs inside `renderCell` — once per action cell per render. Fix shape: `useMemo` for rows/columns and hoist the roles parse; dep arrays are tool-unverified → DISCUSS.

**C.12 [DISCUSS] `VariableSelection`: columns/rows rebuilt and `getComputedStyle` called per cell per keystroke — IMPACT: MED, CONFIDENCE: HIGH**
`src/components/CustomComponents/VariableSelection.tsx:245-284` — `rowVariables` and `columns` are rebuilt on every render (state changes on each keystroke in the alt-label input), and `renderCell` at line 256 calls `StyleServices.getCSSVariable` (a `getComputedStyle` forced style read, verified at `forms-flow-service/src/helpers/styleService.ts:7`) per cell. Line 269 does `SystemVariables.find` per cell (O(n²)). Fix: memoize rows/columns/color.

## Re-renders

**C.13 [DISCUSS] `VariableSelection`/`AutoVariableSelection`: fresh `ignoreKeywords` Set per render defeats `FormComponent`'s memo → full form clone + rebuild per keystroke — IMPACT: HIGH, CONFIDENCE: HIGH**
`VariableSelection.tsx:67-76` and `AutoVariableSelection.tsx:41-50` create `new Set([...])` in the render body and pass it to `FormComponent` (`VariableSelection.tsx:320`, `AutoVariableSelection.tsx:323`). `FormComponent` is `React.memo` but its effect deps are `[form, ignoreKeywords]` (`FormComponent.tsx:93`), so **every parent render** (each keystroke in the alternative-label input) re-runs `_.cloneDeep(form)` + `Utils.eachComponent` + `setUpdatedForm`, remounting the formio form. Fix: hoist the constant Set to module scope. Marked DISCUSS only because it changes how often the effect fires (visibly stops form re-mounting) — almost certainly the intended behavior.

**C.14 [DISCUSS] Legacy `CustomButton` mounts a window resize listener per instance, including for all non-dropdown variants — IMPACT: MED-HIGH, CONFIDENCE: HIGH**
`src/components/CustomComponents/Button.tsx:99-107` — every instance registers `window.addEventListener("resize", updateMenuStyle)` even though `updateMenuStyle`/`menuStyle` only matter for the `isDropdown` branch (line 110). A 100-row table via `ReusableProcessTableRow.tsx:39-45` = 100 live resize listeners each calling `getBoundingClientRect` (layout reads) on window resize. Fix shape: gate the effect on `isDropdown` — behaviorally identical for non-dropdown buttons but the effect also hosts the `changeLanguage` call (C.7), so bundle the change → DISCUSS.

**C.15 [SAFE] `getComputedStyle` forced style reads in render bodies across 24 call sites — IMPACT: MED, CONFIDENCE: HIGH**
`StyleServices.getCSSVariable` calls `getComputedStyle(...).getPropertyValue(...)` per call. Unmemoized render-body usage: `ReusableTable.tsx:81`, `SortableHeadder.tsx:29-31` (2 calls per header per render), `MultiSelect.tsx:51-54` (4 calls), `InputDropdown.tsx:70-71`, `ButtonDropdown.tsx:56-57`, `FilterableDropdown.tsx:337-339`, `FilterDropDown.tsx:179`, `DragandDropSort.tsx:37`, `ReusableStandardModal.tsx:120`, `ReusableLargeModal.tsx:55`, `VariableSelection.tsx:53`. The package already has the correct pattern — `Search.tsx:52-54` wraps it in `useMemo(..., [])`. Fix: apply the same memoization at each site.

**C.16 [DISCUSS] `SvgIcons` reads CSS variables at module evaluation time — IMPACT: MED, CONFIDENCE: MED**
`src/components/SvgIcons/index.tsx:1-8` calls `getComputedStyle(document.documentElement)` and captures 7 color defaults **at import time** of the shared bundle. If theme CSS (`--ff-primary` etc.) isn't loaded before `forms-flow-components.js` evaluates (real risk in single-spa load ordering), all 98 icons' default colors are permanently empty. Also forces a style recalc during startup. Fix shape: lazy getter / read-on-render — could visibly change icon colors where the current empty-string behavior is being relied on → DISCUSS.

**C.17 [DISCUSS] `DragandDropSort`: Sortable instance rebuilt per state change; `onUpdate` effect loops with inline callbacks; `items` prop ignored after mount — IMPACT: MED, CONFIDENCE: MED**
`src/components/CustomComponents/DragandDropSort.tsx:71-103` recreates the sortablejs instance on every `filterItems` change (destroy is correctly paired, but churn per checkbox toggle). Lines 49-53 call `onUpdate(filterItems)` on mount and whenever `onUpdate` identity changes — a consumer passing an inline callback and setting state in it re-renders → new identity → effect refires (loop risk). Line 36 initializes state from `items` once; later `items` changes are silently ignored.

**C.18 [SAFE] `ReusableResizableTable`: `crypto.randomUUID()` used as React keys inside render — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/components/CustomComponents/ResizableTable.tsx:112,116,141` generate new UUID keys every render during `loading`, forcing full skeleton DOM teardown/recreate per render. `TableFooter.tsx:34-37` and `TableSkeletonLoader.tsx:13-20` show the correct memoized pattern. Fix: precompute keys with `useMemo` (or stable index keys for static skeleton rows).

## bpmn-js lifecycle

**C.19 [DISCUSS] `ProcessDiagram`: viewer survives container detach; un-cleared `setTimeout` can touch a destroyed viewer — IMPACT: LOW-MED, CONFIDENCE: MED**
`src/components/CustomComponents/BpmnDiagramView.tsx:23-28` — the callback ref only handles `node != null`; when the container unmounts while the component stays mounted (e.g., `isProcessDiagramLoading` toggles true at line 77), the old viewer keeps a detached DOM tree until a new viewer replaces it or the component unmounts. Lines 55-61: the `addMarker` `setTimeout` is never cleared, so it can fire after `destroy()`. Destroy-on-unmount and `.on("import.done")` cleanup via `destroy()` are otherwise correct (lines 40-44). Fix: destroy on `node === null` in the ref; store/clear the timeout.

## customHooks

**C.20 [DISCUSS] `useSuccessCountdown`: callback invoked inside a setState updater; interval torn down and recreated every tick — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/customHooks/useSuccessCountdown.ts:54-62` — `onCountdownEnd()` is called inside the `setSuccessState` updater (side effect in updater; double-invocation risk under React 18 StrictMode dev), and because `successState.countdown` is an effect dep (line 67) the interval is cleared and recreated every second. Fix shape: move the callback into the effect body and key the interval off `showSuccess` only.

**C.21 [DISCUSS] `useDownloadFile`: unstable `download` identity and unused url/name state churn — IMPACT: LOW, CONFIDENCE: MED**
`src/customHooks/useDownloadFile.ts:29-50` — `download` is recreated per render (no `useCallback`), and `setUrl`/`setName` (lines 35-36) trigger a re-render even though lines 39-42 already set href/download directly on the DOM node. Public return shape includes `url`/`name`, so removal is contract-breaking → report-only. `useProgressBar` is clean.

## Effects & listeners (residual)

**C.22 [DISCUSS] `MultiSelect`: click-outside handler closes over stale `disabled` — IMPACT: LOW, CONFIDENCE: HIGH**
`src/components/CustomComponents/MultiSelect.tsx:62-80` — `handleClick` reads `disabled` but is registered in a `[]`-dep effect; if `disabled` flips after mount the handler uses the initial value. Trimmed-dep pattern → DISCUSS per ground rules.

**C.23 [SAFE] `HistoryPage`: dead listener cleanup and no-op state writes — IMPACT: LOW, CONFIDENCE: HIGH**
`src/components/CustomComponents/HistoryPage.tsx:125-135` — the effect removes a `resize` listener (`adjustTimelineHeight`) that is never added in this component, and conditionally sets `hasLoadedMoreForm/Workflow` to values they already hold. `adjustTimelineHeight` (lines 105-123) and its refs are dead here (the live version exists in `SubmissionHistoryWithViewButton.tsx:53-66` with correct cleanup). Deleting the dead code is behavior-neutral.

## Maintainability

**C.24 [SAFE] Legacy `CustomButton` is 8 copy-pasted branches differing only by className — IMPACT: MED, CONFIDENCE: HIGH**
`src/components/CustomComponents/Button.tsx:157-309` — `iconOnly`/`actionTable`/`actionTableSmall`/`action`/`iconWithText`/`secondary`/`dark`/`darkPrimary` branches render the identical `<button>` skeleton with a different class string; `getButtonClassName` (line 40) takes 11 parameters and ignores 9 of them. Collapse to one return with a variant→class map producing byte-identical DOM.

**C.25 [SAFE] Ten dropdown implementations (~3,540 lines) with verbatim copy-paste of positioning/click-outside logic — IMPACT: MED, CONFIDENCE: HIGH**
`SelectDropdown.tsx:166-231` and `SelectWithCustomValue.tsx:257-318` are near-verbatim duplicates (`updatePosition`, scroll/resize reposition effects, click-outside); `FilterableDropdown.tsx:291-315`, `InputDropdown.tsx:99-113`, `UserSelect.tsx:114-132`, `MultiSelect.tsx:74-80`, `DateFilter.tsx:509-544` each reimplement click-outside. Fix: extract internal (non-exported) `useClickOutside` / `useDropdownPosition` hooks — public APIs untouched.

**C.26 [DISCUSS] Twelve modal variants (~1,875 lines) and parallel "old/new" component generations — IMPACT: MED, CONFIDENCE: MED**
Two button systems (`CustomButton` in `Button.tsx` vs `V8CustomButton` in `CustomButton.tsx` — the file/export naming is itself a trap), `ConfirmModal` vs `PromptModal` (HistoryPage.tsx:277-291 shows ConfirmModal usage commented out in favor of PromptModal), `ReusableStandardModal`/`ReusableLargeModal`/`AppModal` overlap. Consolidation is API-visible → report-only. Also naming debt: `SortableHeadder.tsx` (typo) and `DateFilter.tsx` exporting `DateRangePicker`.

**C.27 [SAFE] Components import from the package's own root barrel (circular imports) — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`VariableSelection.tsx:3-8` and `AutoVariableSelection.tsx:3-5` import `FormComponent` etc. from `"../../formsflow-components"`, creating a cycle barrel → component → barrel (init-order fragility, defeats future code-splitting). Fix: import sibling modules directly.

**C.28 [DISCUSS] `any` on public props of the most-used component — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`ReusableTable.tsx:9-18` types `columns: any[]`, `rows: any[]`, `sortModel: any[]`, `paginationModel: any` (14 `any`s in the file); `AutoVariableSelection.tsx` has 10, `FormComponent.tsx` `form: any`. Tightening to `GridColDef[]`/generics is compile-visible to two repos → DISCUSS.

**C.29 [DISCUSS] `FormComponent`: stale `getParentKeys` closure and setState inside a traversal loop — IMPACT: LOW-MED, CONFIDENCE: MED**
`FormComponent.tsx:40-56` — `getParentKeys` reads `nestedDataKeys` state but is captured by `handleClick` whose deps (`line 193`) don't cover it → stale nested-key resolution possible. Lines 72-77 call `setNestedDataKeys` per container component inside `Utils.eachComponent` (O(n) state writes per form load). Possibly-intentional trimmed deps → DISCUSS.

**C.30 [DISCUSS] `withFeature` flag frozen at module-eval time — IMPACT: LOW, CONFIDENCE: MED**
`src/api/config.ts` — `featureFlags.exportPdf = getEnv(...)` reads `window._env_` when the shared bundle first evaluates; if the host's `config.js` loads later, `DownloadPDFButton` is permanently hidden. Fix shape: evaluate inside the HOC render — behavior-affecting on misconfigured hosts → DISCUSS.

## Checked & clean (verified negatives)

- **Listener cleanup is correct** in: `SelectDropdown.tsx:182-226`, `SelectWithCustomValue.tsx:273-301`, `FilterableDropdown.tsx:291-315`, `InputDropdown.tsx:99-113`, `UserSelect.tsx:114-132`, `MultiSelect.tsx:74-80`, `DateFilter.tsx:538-543`, `ButtonDropdown.tsx:99-103`, `SubmissionHistoryWithViewButton.tsx:61-66`, `ResizableTable.tsx:98-107` (mousemove/mouseup), `FormComponent.tsx:219-222`, `Alert.tsx:71-78` (timer), `FileUploadArea.tsx:149-159` (outer timer; only a trivial nested 500 ms ref-reset at 155 is uncleared), `useProgressBar.ts:166-170` (unmount cleanup), `DragandDropSort.tsx:99-102` (`sortable.destroy()` paired).
- **bpmn-js**: exactly one entry point (`BpmnDiagramView.tsx`); viewer destroyed on unmount; no orphaned `.on` handlers beyond `destroy()`'s scope (C.19 nuances aside).
- **Storybook files are excluded from the production bundle**: nothing in the export chain from `src/formsflow-components.ts` imports `src/components/Stories/*` (grep-verified); webpack entry is the barrel.
- **MUI import hygiene is fine**: named imports from `@mui/material`/`@mui/x-data-grid` plus one path import (`ReusableTable.tsx:3`); no `@mui/icons-material`, no whole-package imports.
- **No moment/dayjs/date-fns** anywhere; date formatting delegates to external `HelperServices`.
- **DataGrid virtualization intact by default** in `ReusableTable` (only disabled via explicit `disableVirtualization` or the documented `enableRowExpansion` path, C.10).
- **Runtime externals respected**: all `@formsflow/service` usage is shallow named imports; no deep imports into `@formsflow/*`, react, or react-dom.
- **No duplicate live icon exports** in `SvgIcons` (the `AddIcon`/`CloseIcon` doubles are commented out); `SvgImages` exports are unique.
- **Well-built components (good internal memoization)**: `V8CustomButton` (`CustomButton.tsx`), `Switch.tsx:69-117`, `DateRangePicker` (`DateFilter.tsx` — extensively `useCallback`/`useMemo`'d), `Search.tsx` (memoized CSS-var read), `TableSkeletonLoader.tsx` and `TableFooter.tsx` (stable memoized skeleton keys).
- **i18n resource payload is small** (~70 English strings in `resourceBundles/i18n.js`) — size itself is not a problem; the init side effect is (C.6).
- **No DOMParser / `JSON.parse(JSON.stringify(...))` / structuredClone** in render paths anywhere in the package.

---

# §4 forms-flow-nav (N.* — IDs are N.<category>.<finding>)

**Package summary.** `@formsflow/nav` is the persistently-mounted sidenav MFE (~3,300 lines). The active render tree is `Root → HamburgerMenu + Sidebar (+ a second Sidebar inside the Offcanvas on mobile)`; the 514-line `Navbar.jsx` top-bar is commented out of the tree but **still imported**, so it and `react-helmet` ship in the every-page bundle as dead weight. The package's dominant costs are: an unconditional crash bug (`setLoginUrl` undefined in Sidebar), per-render `localStorage` reads + `JSON.parse` + ~15 role scans, a route-change re-render driven by an ES_ROUTE subscription whose state is never read, un-cleaned pub/sub subscriptions that pile up on every hamburger open/close, an API call whose result is never used, and 8 fully dead files — one of which is the *only* reason the heavy `@aot-technologies/formiojs` / `formio-react` deps exist in package.json.

## 1. Persistent-mount cost

**N.1.1 [SAFE] Sidebar re-renders on every route change to update state it never reads — IMPACT: HIGH (paid on every navigation, all session), CONFIDENCE: HIGH**
`src/sidenav/Sidebar.jsx:90` declares `const [location, setLocation] = React.useState({ pathname: "/" })`; `Sidebar.jsx:231-235` subscribes to `ES_ROUTE` and calls `setLocation(data)`. Grep confirms `location` is never read anywhere in the component (active-route logic uses `currentLocation` from `useLocation()`, line 98). Every route change therefore triggers an extra full Sidebar render (fresh object identity → always re-renders), on top of the `useLocation` context update and the `setActiveKey` effect (lines 322-338). Fix shape: delete the `location` state and the `ES_ROUTE` subscription in Sidebar (Root already has its own ES_ROUTE subscription for hiding the sidebar).

**N.1.2 [SAFE] `localStorage` read + `JSON.parse` + 15 `includes()` scans in render body — IMPACT: HIGH frequency (every Sidebar render: every route change, every hover in collapsed mode), CONFIDENCE: HIGH**
`src/sidenav/Sidebar.jsx:105-128`: `JSON.parse(StorageService.get(...USER_ROLE))` executes in the render body, followed by 15 `userRoles?.includes(...)` calls and derived flags — none memoized. Same pattern in the (dead) `src/Navbar.jsx:96-114`. Roles change only on auth events; fix shape: compute once via `useMemo` keyed on `instance`, or move into the `FF_AUTH`-driven state.

**N.1.3 [SAFE] Per-render DOM/CSSOM reads and object rebuilds in Sidebar — IMPACT: MED, CONFIDENCE: HIGH**
- `Sidebar.jsx:102-104` `document.documentElement.style.getPropertyValue("--navbar-logo-path")` per render; `Sidebar.jsx:142` `StyleServices?.getCSSVariable("--hide-formsflow-logo")` per render.
- `Sidebar.jsx:294-320` `SectionKeys` object literal rebuilt per render (pure constants — hoist to module scope; also silently omitted from the effect deps at line 338, which only works because it's recreated).
- `Sidebar.jsx:454-649` all `subMenu` arrays are fresh literals per render, and `manageOptions()`/`manageAnalyseOptions()` (lines 354-409) rebuild arrays per call — `MenuComponent` is not memoized, so every Sidebar render re-renders all 6-7 menu items.
- `src/sidenav/hamburgerMenu.jsx:31` `getComputedStyle(...)` in render body.
Fix shape: hoist static structures to module scope, `useMemo` the role-dependent ones.

**N.1.4 [DISCUSS] `useState(props.getKcInstance())` — initializer called on every render — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/sidenav/Sidebar.jsx:88` and `src/Navbar.jsx:32`: the non-lazy form evaluates `props.getKcInstance()` on every render and discards the result after mount. Fix shape: `useState(() => props.getKcInstance())`. DISCUSS only because behavior of `getKcInstance` (side effects?) is defined in the external root-config.

**N.1.5 [DISCUSS] Hover-driven full-sidebar re-render in collapsed mode — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`Sidebar.jsx:160-175, 436-437`: `onMouseEnter`/`onMouseLeave` on the whole sidenav flips `hoverToggled` state, re-rendering the entire menu tree (with all costs from 1.2/1.3) on every pointer pass. Timer cleanup exists (177-183, good). Fix shape: CSS-driven expand-on-hover, or isolate hover state below the expensive subtree. DISCUSS: the 120 ms close-delay UX is deliberate.

## 2. Event subscriptions

**N.2.1 [DISCUSS] Six un-cleaned pub/sub subscriptions per Sidebar mount; pileup on every hamburger open/close — IMPACT: HIGH on mobile (leak + duplicate fetch storm), CONFIDENCE: HIGH for the leak mechanism, MED for volume**
`src/sidenav/Sidebar.jsx:216-247` registers 6 subscriptions (`FF_AUTH`, `FF_PUBLIC`, `ES_TENANT`, `ES_ROUTE`, `ES_FORM`, `profileUpdated`) with no cleanup returned. The desktop Sidebar mounts once — tolerable. But `src/sidenav/hamburgerMenu.jsx:41-57` mounts a **second** `<Sidebar props={props} />` inside `Offcanvas`, which mounts/unmounts its body on each open/close. Every hamburger open therefore adds 6 more subscriptions that permanently call `setState` on an unmounted component, plus re-fires the whole auth fetch block (see 4.2). Same missing-cleanup pattern in `src/root.component.js:32-40` (`ES_ROUTE`, mounts once — low risk) and dead `src/Navbar.jsx:43-68`. Fix shape: capture and invoke the unsubscribe tokens in the effect cleanup — DISCUSS because the `subscribe` prop's unsubscribe contract lives in the external root-config (no `unsubscribe` usage exists anywhere in this repo, so the API surface must be confirmed first).

**N.2.2 Verified clean subscriptions:** `Sidebar.jsx:414-428` window `resize` listener has correct cleanup; `Sidebar.jsx:177-183` hover timer cleanup; `MenuComponent.jsx:204-228` fade timer cleanup. Dead `Navbar.jsx:139-145` resize cleanup is also correct.

## 3. Sidenav specifics

**N.3.1 [DISCUSS] `setLoginUrl` is undefined in Sidebar — ReferenceError crashes the entire nav — IMPACT: CRITICAL when triggered (error boundary in `src/formsflow-nav.js:10-13` returns `null` → nav disappears app-wide), CONFIDENCE: HIGH it's a latent crash; MED on trigger frequency**
`src/sidenav/Sidebar.jsx:340-344`:
```js
useEffect(() => {
    if (!isAuthenticated && formTenant && MULTITENANCY_ENABLED) {
      setLoginUrl(`/tenant/${formTenant}/`);
    }
  }, [isAuthenticated, formTenant]);
```
There is no `loginUrl` state anywhere in Sidebar (grep confirms line 342 is the only `setLoginUrl` occurrence) — this was copy-pasted from `Navbar.jsx:153/171-175` where the state exists. Trigger path: multitenancy + unauthenticated + any `ES_FORM` publish carrying `tenantKey` (the anonymous-form scenario documented in `Navbar.jsx:147-151`). Fix shape: delete the effect (its output is unused) or add the state — deleting is behavior-preserving today but flag as DISCUSS since it silently disables an intended anonymous-tenant redirect feature.

**N.3.2 [SAFE] `MenuComponent.setActiveTab` is a dead, byte-identical duplicate of `isActive` — IMPACT: LOW (maintainability), CONFIDENCE: HIGH**
`src/sidenav/MenuComponent.jsx:50-59` vs `64-74` — identical logic; `setActiveTab` is never referenced. Delete it.

**N.3.3 [SAFE] `subscribe` prop passed to every MenuComponent but never used — IMPACT: TRIVIAL, CONFIDENCE: HIGH**
`Sidebar.jsx:461, 477, 504, 592, 617, 629, 647` pass `subscribe={props.subscribe}`; `MenuComponent.jsx:30-38` never destructures it and propTypes (321-349) don't declare it. Remove the prop.

**N.3.4 [DISCUSS] `requestAnimationFrame` in fade effect has no cancel on unmount — IMPACT: TRIVIAL, CONFIDENCE: HIGH**
`MenuComponent.jsx:215` — the rAF callback can call `setIconVisible` after unmount; the timeout branch is cleaned but the rAF is not. Cosmetic in React 18; fix shape: store/cancel the rAF id.

## 4. Data fetching

**N.4.1 [DISCUSS] `checkIntegrationEnabled()` fetched on every auth but the result is never used — IMPACT: MED (wasted API round-trip on every session start, doubled per hamburger open), CONFIDENCE: HIGH**
`src/sidenav/Sidebar.jsx:269-275` fetches and stores `integrationEnabled`; grep confirms it is read **only** inside a commented-out block (`Sidebar.jsx:553`, "Hide because v8 out of scope - will be restored later"). Fix shape: comment out the fetch alongside the feature it serves. DISCUSS because the comment signals planned restoration.

**N.4.2 [DISCUSS] Auth fetch block re-fires per Sidebar instance/remount — IMPACT: MED on mobile, CONFIDENCE: HIGH**
`Sidebar.jsx:250-277`: on `isAuthenticated`, fires `fetchUserLoginDetails()` + `getOnBoardingUserRole()` (+ conditional `fetchChecklist()`) + `checkIntegrationEnabled()`. Because the Offcanvas Sidebar (hamburgerMenu.jsx:54) remounts on every open, all four calls repeat per open; the desktop and offcanvas instances also both call `fetchTenantDetails` (`Sidebar.jsx:210-214`). No unmount guards on any `.then(setState)` (`Sidebar.jsx:271`). Fix shape: session-level once-guard (module flag or storage check) and/or mounted-ref guard.

**N.4.3 [DISCUSS] `instance?.isAuthenticated` — method referenced, not called — tenant fetch can fire pre-auth — IMPACT: MED (401/wasted call in multitenancy), CONFIDENCE: HIGH**
`src/sidenav/Sidebar.jsx:211` and `src/Navbar.jsx:71`: `if (MULTITENANCY_ENABLED && !tenant.tenantId && instance?.isAuthenticated)` — truthy whenever the method *exists*, unlike the correct call at `Sidebar.jsx:139`. Fix shape: add `()`. DISCUSS: changes when the tenant fetch fires (arguably the intended behavior, but it is a behavior change).

**N.4.4 [SAFE] Language JSON re-fetched per profile-modal open — IMPACT: LOW, CONFIDENCE: HIGH**
`src/sidenav/ProfileSettingsModal.jsx:104-113` runs on every mount, and the modal is conditionally mounted (`Sidebar.jsx:663-670`), so `/languageConfig/languageData.json` is re-fetched on each open — and its result feeds only the commented-out language dropdown (see 6.4).

## 5. Effects & timers

**N.5.1 [DISCUSS] `i18n.changeLanguage` fired on every `userDetail` change with trimmed deps — IMPACT: MED (app-wide i18next `languageChanged` event → re-render of all MFEs' translated text), CONFIDENCE: MED**
`src/sidenav/Sidebar.jsx:279-282`: deps `[userDetail]` but reads `tenant?.tenantData?.details?.locale`; runs on every `profileUpdated`/`FF_AUTH` even when the locale is unchanged (userDetail is re-parsed to a fresh object at lines 204-208 and 243-246). Fix shape: guard with `if (locale !== i18n.language)` and include `tenant` in deps. DISCUSS: dep-array trimming may be intentional (no hooks linting), and i18n switching must stay behaviorally identical.

**N.5.2 Timers otherwise clean** — see 2.2/3.4.

## 6. Bundle & dead code

**N.6.1 [SAFE] Dead 514-line `NavBar` still imported → it and `react-helmet` ship in the every-page bundle — IMPACT: HIGH (bundle bytes + parse cost on every page load; react-helmet + react-side-effect chain for zero rendered output), CONFIDENCE: HIGH**
`src/root.component.js:1` imports `NavBar` but line 53 shows the only usage is commented out: `{/* <NavBar props={props} /> */}`. `Navbar.jsx` has import side effects (`Navbar.scss` line 21, i18n line 24) and package.json declares no `sideEffects: false`, so webpack cannot drop it — its whole tree (`react-helmet` at `Navbar.jsx:28` — its **only** consumer in the package — plus `helper/user.js`, `helper/regExp/pathMatch.js`, nested duplicate `BrowserRouter` at `Navbar.jsx:254`) is bundled. Fix shape: remove the import (behavior-preserving); optionally drop `react-helmet` from package.json once Navbar is deleted (dep change → separate DISCUSS).

**N.6.2 [DISCUSS] `@aot-technologies/formiojs` + `formio-react` deps exist solely for a dead file — IMPACT: HIGH on install/build (two heavy deps + `webpack.formio.js` aliases/ProvidePlugin in `webpack.config.js:4,22-23` maintained for nothing), ZERO on runtime bundle, CONFIDENCE: HIGH**
The only formio import in `src/` is `src/constants/applicationComponent.js:1` (`Utils` from formiojs), and grep confirms **nothing imports `applicationComponent.js`** — it's outside the module graph, so formiojs never enters `forms-flow-nav.js`. The bundle is safe; the `package.json:47-48` deps, lockfile weight, and formio alias plumbing are pure overhead. Fix shape: delete the file; dep removal is a dep change → DISCUSS per constraints.

**N.6.3 [SAFE] Eight fully dead files (~600 lines) — IMPACT: MED (maintenance noise; some are misleading), CONFIDENCE: HIGH (grep-verified zero importers)**
`src/constants/submissionConstants.js`, `src/constants/taskConstants.js`, `src/constants/applicationConstants.js`, `src/constants/applicationComponent.js`, `src/constants/socketIOConstants.js`, `src/constants/tenantConstant.js`, `src/helper/access.js`, `src/helper/regExp/validResourceId.js`. Note `helper/access.js:10` contains an always-true condition (`role.type !== "RESOURCE_ID" || role.type !== "ANONYMOUS"`) — a real bug, but in dead code. Also dead-if-Navbar-deleted: `helper/user.js`, `helper/regExp/pathMatch.js`.

**N.6.4 [SAFE] Dead code inside live files — IMPACT: LOW-MED, CONFIDENCE: HIGH**
- `ProfileSettingsModal.jsx:148-150` (`handleLanguageChange`) and `:350` (`selectedLangLabel`) are used only inside the commented-out `SelectDropdown` (543-557); the language fetch at 104-113 exists only to feed them (see 4.4).
- `Sidebar.jsx:130-137` route constants (`DASHBOARD_ROUTE` etc.) duplicate literals that `manageOptions`/`manageAnalyseOptions` could inline; `Sidebar.jsx:516-591` carries ~60 lines of commented submenu variants including a constant-false ternary `false ? [] : [...]` (533-535).
- `root.component.js:26` `sidenavRef` is attached (line 71) but never read.
- Large commented blocks in `hamburgerMenu.jsx` (7, 10-11, 30, 34, 43-49) and `Sidebar.jsx:27, 43-47, 100, 112, 126, 134`.

## 7. Maintainability

**N.7.1 [SAFE] Navbar↔Sidebar copy-paste is the root cause of bug 3.1 — IMPACT: HIGH, CONFIDENCE: HIGH**
The subscription block (`Navbar.jsx:43-68` ↔ `Sidebar.jsx:216-247`), role flags (`Navbar.jsx:104-114` ↔ `Sidebar.jsx:107-125`), tenant effects (`Navbar.jsx:70-90` ↔ `Sidebar.jsx:210-214,284-291`), logout (`Navbar.jsx:238-241` ↔ `Sidebar.jsx:349-352`), and language-list filtering (`Navbar.jsx:177-190` ↔ `ProfileSettingsModal.jsx:104-113`) are near-identical clones; the `setLoginUrl` crash is a clone that lost its state declaration. Deleting Navbar (6.1) removes most of it.

**N.7.2 [SAFE] Magic permission strings — IMPACT: MED, CONFIDENCE: HIGH**
15+ raw strings (`"create_submissions"`, `"manage_advance_workflows"`, `"analyze_submissions_view"`, …) at `Sidebar.jsx:107-125` and `Navbar.jsx:104-114,361`; `ProfileSettingsModal.jsx:127-134` repeats five of them in filter logic. Fix shape: single `PERMISSIONS` constant module.

**N.7.3 [SAFE] `userContants.js` — misspelled filename and `getEnv(env_string)` ignores its argument — IMPACT: LOW, CONFIDENCE: HIGH**
`src/constants/userContants.js:15-25`: parameter `env_string` unused; hardcoded key inside; file name typo ("Contants") — even flagged `//TODO Make this function Common` at line 14.

**N.7.4 [DISCUSS] Hardcoded English strings bypassing i18n — IMPACT: LOW-MED, CONFIDENCE: HIGH**
Menu names are passed untranslated and translated inside MenuComponent (`t(mainMenu)` at `MenuComponent.jsx:282`) — but `Sidebar.jsx:470` `mainMenu="Tasks"`, `:490` `"Submit"`, `:606` `"Build"`, `:627` `"Analyze"`, `:639` `"Manage"` are raw literals while only line 515 wraps with `t("Build")` — inconsistent (double-translation risk); `ProfileSettingsModal.jsx:362` builds a translation key by string concatenation (`t(\`Access to ${category...}\`)`), which defeats extraction; `ProfileSettingsModal.jsx:439,451,461,479,494` placeholders/labels ("First Name", "Reset Password", "Resetting password") are untranslated.

**N.7.5 [DISCUSS] `props`-as-a-prop pattern — IMPACT: LOW, CONFIDENCE: HIGH**
`root.component.js:70-72` passes `<Sidebar props={props} />`, so children destructure `{ props }` and the declared propTypes (`Sidebar.jsx:675-680`) describe the *inner* shape, which never matches what validation sees. Fix shape: spread the needed callbacks (`subscribe`, `publish`, `getKcInstance`) as named props.

## 8. JSX/JS quality

**N.8.1 [SAFE] Index-as-key on dynamic language lists — IMPACT: LOW, CONFIDENCE: HIGH**
`src/Navbar.jsx:451` (`key={i}`) and `:471` (`key={index}`) on `selectLanguages` (dead code — dissolves with 6.1). Live lists are fine: `MenuComponent.jsx:291` uses `path`-based keys, `ProfileSettingsModal.jsx:569/576` use category/name keys.

**N.8.2 [SAFE] `role="button"` on the whole sidenav container and on a wrapper div — IMPACT: LOW (a11y), CONFIDENCE: HIGH**
`Sidebar.jsx:438` puts `role="button"` on the entire sidebar `div` and `:440` on the toggle wrapper with the click handler on an inner `span` (441) — non-interactive elements with button roles, no keyboard handling.

## Checked & clean (verified negatives)

- **No `dangerouslySetInnerHTML`** anywhere in `src/`.
- **No `setInterval`**; both `setTimeout` uses have cleanup (`Sidebar.jsx:171-183`, `MenuComponent.jsx:220-227`).
- **No whole-package lodash** or moment imports; no direct axios (all HTTP via `@formsflow/service` external).
- **Window `resize` listeners** in live code all have symmetric cleanup (`Sidebar.jsx:414-428`).
- **`webpack.config.js:15` externals `["@formsflow/*"]` intact** — service/components stay external; formio aliases exist but nothing in the module graph reaches them (6.2).
- **`MenuComponent` memoization internals are sound**: `ICON_MAP` (107-114), `IconComponent` (142), `iconColors` (130-136), `intendedIconElement` (148-189) are correctly `useMemo`'d with complete deps; icon component identities are stable module imports from `@formsflow/components`.
- **`ProfileSettingsModal` is mounted only while open** (`Sidebar.jsx:663`), so its 20+ state hooks cost nothing during normal navigation.
- **`storeChecklistItems` error path** falls back to `null` explicitly (`Sidebar.jsx:265-267`) rather than stale data.
- **i18n init** (`src/resourceBundles/i18n.js`) delegates to the shared `i18nService` external — no duplicate i18next instance is bundled.
- **Root's ES_ROUTE subscription** (`root.component.js:32-40`) does minimal work (one boolean state) — the correct place for route-driven state, mounted once per session.
- **No storage-event or history listeners** registered; no `single-spa:*` window listeners in this package (routing arrives via the `ES_ROUTE` pub/sub instead).

## API inventory

| # | Method | Endpoint (from `src/endpoints/index.js`) | Caller | Trigger | Notes |
|---|--------|--------|--------|---------|-------|
| 1 | GET | `{MT_ADMIN}/v1/tenant` | `services/tenant/index.js:24` ← `Sidebar.jsx:212` | `instance` change, if multitenant & no tenantId | Bug 4.3: auth check doesn't call the function; fires per Sidebar instance |
| 2 | GET | `{WEB_BASE}/integrations/embed/display` | `services/integration/index.js:4` ← `Sidebar.jsx:269` | every `isAuthenticated` transition + every offcanvas remount | **Result never used** (finding 4.1); also called by dead `Navbar.jsx:228` |
| 3 | GET | `{WEB_BASE}/user/{id}/login-details` | `services/user/index.js:15` ← `Sidebar.jsx:253` | on auth + per offcanvas remount | Writes `USER_LOGIN_DETAILS` to localStorage; consumed by ProfileSettingsModal |
| 4 | GET | `{WEB_BASE}/user/info` | `services/user/index.js:33` ← `Sidebar.jsx:254` | on auth + per offcanvas remount | Stores `ONBOARDINGUSERROLE`; internal catch returns `undefined` → checklist still fetched on failure |
| 5 | GET | `{WEB_BASE}/user/checklist` | `services/user/index.js:49` ← `Sidebar.jsx:259` | on auth, unless `checklistSkipped` | Result → `storeChecklistItems` |
| 6 | GET | `{WEB_BASE}/roles/permissions` | `services/permissions/index.js:4` ← `ProfileSettingsModal.jsx:124` | every profile-modal open | Filtered client-side (5 hardcoded exclusions) |
| 7 | GET | `/languageConfig/languageData.json` (static, raw `fetch`) | `services/language/index.js:4` ← `ProfileSettingsModal.jsx:106`; dead `Navbar.jsx:178` | every modal open; (dead: per tenant change) | Feeds only commented-out dropdown (6.4); no error handler on the fetch chain |
| 8 | PUT | `{WEB_BASE}/user/locale` | `services/language/index.js:17` ← dead `Navbar.jsx:223` | language switch (dead path) | Live language change is currently only via profile update (#10) |
| 9 | PUT | `{WEB_BASE}/user/{id}/reset-password?redirect_uri=…` | `services/user/index.js:57` ← `ProfileSettingsModal.jsx:178` | user clicks Reset Password | |
| 10 | PUT | `{WEB_BASE}/user/{id}/profile` | `services/user/index.js:87` ← `ProfileSettingsModal.jsx:287` | user saves profile | Publishes `profileUpdated` on success |

**Top three actions by leverage:** (1) fix/remove the `setLoginUrl` crash effect (`Sidebar.jsx:340-344`); (2) drop the dead `NavBar` import from `root.component.js:1` (removes react-helmet + ~600 lines from the every-page bundle); (3) delete the unread `ES_ROUTE` location state in Sidebar to cut one full nav re-render per route change.

---

# §5 forms-flow-review (R.*)

**Package summary.** ~9,950 lines of TS/TSX. Structure: classic Redux (`src/actions/` + `src/reducers/taskReducer.ts` as one 60-key `task` slice), thunk-style services in `src/api/services/`, two routes (`task`, `task/:taskId`) under a single-spa root, STOMP-over-SockJS live updates wired in `src/index.tsx`, and formio `<Form>` rendered in three places (TaskForm, BundleTaskForm, via TaskDetailsModal). The hot paths are: the task list table (server-paginated MUI grid, per-row assignee widget), the socket callback → task-list refetch loop, and formio form rendering per keystroke. Health: functional but carrying real defects — the WebSocket is torn down and reconnected after **every** task-list fetch, several dispatched actions hit no reducer or the wrong state key, two API calls discard their results, and ~700+ lines are dead code. Nearly every container subscribes to the whole `task` slice. Copy-paste between the modal task view and the task-details route is extensive.

## 1. STOMP / SockJS lifecycle (top priority)

**R.1 [DISCUSS] WebSocket fully torn down and reconnected after every task-list fetch — IMPACT: VERY HIGH, CONFIDENCE: HIGH**
`src/index.tsx:168-210` — the connect effect depends on `SocketIOCallback`, whose `useCallback` deps are `[taskId, taskDetails, lastRequestedPayload, activePage, limit]`. `lastRequestedPayload` is set to a fresh object on **every** `fetchServiceTaskList` dispatch (`src/api/services/filterServices.ts:102`), and `taskDetails` changes on every detail fetch. So every pagination/filter/sort/refresh — and every socket event, since the callback itself triggers `getTasks()` — recreates the callback → cleanup `disconnect()` → new `SockJS` + new AES-encrypted token (`src/services/SocketIOService.ts:39-43`) → resubscribe. Fix shape: hold the callback in a `useRef` updated each render, connect once on mount with `[]` deps, and have the service read `ref.current`. Marked DISCUSS only because the churn currently masks R.3.

**R.2 [DISCUSS] Every socket event makes every connected client refetch the task list — IMPACT: HIGH (server thundering herd), CONFIDENCE: HIGH**
`src/index.tsx:126-136` — `checkTheTaskIdExistThenRefetchTaskList` ignores the commented `taskIds` membership check and unconditionally calls `getTasks()`; the comment says this is a known temporary state. Any create/update/complete event on `/topic/task-event` fans out a POST task-filter query from every open review tab. Fix shape: restore the taskId-membership guard (behavior change — needs product sign-off).

**R.3 [DISCUSS] Auto-reconnect is disabled on the actual review routes — IMPACT: HIGH (dropped connections never recover), CONFIDENCE: HIGH**
`src/services/SocketIOService.ts:44` — `reconnectDelay: window.location.pathname.includes("review") && 5000`. The MFE's routes are `/task` and `/tenant/:tenantId/task` (`forms-flow-service/src/routerServices/routerConstants.ts:22`, `src/index.tsx:225-235`), which do not contain `"review"`, so this evaluates to `false` → stompjs treats it as 0 → automatic reconnection off. Today it's masked by R.1's constant reconnects; fixing R.1 without fixing this would leave dead sockets. Fix shape: `reconnectDelay: 5000`.

**R.4 [SAFE] Dead code in socket service — IMPACT: LOW, CONFIDENCE: HIGH**
`src/services/SocketIOService.ts:30, 80-82` — `reconnectTimeOut` is declared and cleared but never assigned. `src/services/SocketIOService.ts:17-27` — `tenantKey` is read from localStorage once at module load; a tenant set after load is never seen (multitenancy filtering at line 52 then mismatches). First part is a safe deletion; the tenant staleness is worth a look.

Verified clean: subscription is created in `onConnect` and dies with the client; `disconnect()` calls `deactivate()`; effect cleanup runs before the next connect, so no client leak; no StrictMode double-mount (root has no `<React.StrictMode>`).

## 2. Data fetching

**R.5 [DISCUSS] `getBPMGroups` result is fetched and thrown away on every task open — IMPACT: MED (pure wasted request), CONFIDENCE: HIGH**
`src/api/services/bpmTaskServices.ts:69-89` — the thunk only forwards data to the `done` callback; it dispatches nothing. Both callers pass no callback: `src/components/TaskList/TasklistTable.tsx:140` and `src/Routes/TaskDetails.tsx:169` (`dispatch(getBPMGroups(taskId))`). Every task-detail open issues `GET /v1/task/<id>/identity-links?type=candidate` and discards the response. Fix shape: delete the two dispatches (no observable behavior change) — DISCUSS because removing a network call technically changes traffic.

**R.6 [DISCUSS] form → submission fetch waterfall on task open — IMPACT: MED, CONFIDENCE: HIGH**
`src/components/TaskList/TasklistTable.tsx:367-398` and duplicate `src/Routes/TaskDetails.tsx:194-238` — sequence is `getBPMTaskDetail` → effect on `task.formUrl` → `getForm` → on success `getSubmission`/`getCustomSubmission`. `formId`+`submissionId` are both known from `formUrl` before `getForm` starts; form and submission could be fetched in parallel (the serialization exists only to reuse the Bad-Token retry). Also note `src/api/services/bpmTaskServices.ts:32-35`: the two GETs inside `getBPMTaskDetail` start when the action creator is *called*, before dispatch.

**R.7 [DISCUSS] `getBPMTaskDetail` never clears loading flags on error — IMPACT: MED (stuck spinners on API failure), CONFIDENCE: HIGH**
`src/api/services/bpmTaskServices.ts:63-65` — catch only calls `done(error)`; `setTaskDetailsLoading(false)` / `setBPMTaskDetailLoader(false)` are set true by callers (`TasklistTable.tsx:138`, `TaskDetails.tsx:166-168`) and never reset on failure.

**R.8 [DISCUSS] Page-size inconsistency: state says 10, fetch asks for 25 — IMPACT: LOW-MED (pagination mismatch), CONFIDENCE: HIGH**
`src/components/TaskList/TaskList.tsx:276-283` (default-filter effect: `setTaskListLimit(10)` then `fetchServiceTaskList(currentFilter, null, 1, 25)`), same pattern at `TaskList.tsx:206-213` (clear-all), and `src/components/TaskList/TaskFilterDropdown.tsx:88` (fetch 25, limit untouched). The grid's `paginationModel` uses `limit` (`TasklistTable.tsx:514-517`), so the server returns 25 rows while the UI believes the page size is 10/5.

Verified: `fetchServiceTaskList` has proper in-flight dedup via a module-level `AbortController` (`src/api/services/filterServices.ts:73-100`) — that's the **only** AbortController/isMounted usage in the package (component-level effects have no unmount guards, but the abort-on-next-call covers the list; detail/history fetches have none).

## 3. Redux performance

**R.9 [DISCUSS] Whole-`task`-slice subscriptions everywhere — IMPACT: HIGH (every dispatch re-renders every container and every table row), CONFIDENCE: HIGH**
Destructuring from `useSelector(state => state.task)` — the selector returns the slice object, so any of the ~40 task actions re-renders the subscriber:
- `src/index.tsx:46-54` (`Task` shell)
- `src/components/TaskList/TaskList.tsx:57-70`
- `src/components/TaskList/TasklistTable.tsx:91-101`
- `src/components/Assigne/Assigne.tsx:35-42` — **rendered once per table row** (`TasklistTable.tsx:241`), so every dispatch re-renders all rows' `UserSelect`s
- `src/components/TaskFilterModal/TaskFilterModalBody.tsx:106-111`
Fix shape: leaf selectors (the files already use them elsewhere) or one object selector + `shallowEqual`; `createSelector` available free via installed RTK. DISCUSS only for dep-array interactions; the selector change itself is behavior-safe.

**R.10 [DISCUSS] `mapStateToProps` returns fresh `options` object and `errors` array on every state change — IMPACT: MED, CONFIDENCE: HIGH**
`src/components/TaskForm.tsx:120-127` and `src/components/BundleTaskForm.tsx:218-223` — `options: { noAlerts: false }` and `errors: [...]` are new references per call, defeating connect's shallow compare: both connected forms re-render on every store dispatch. Fix: hoist `options` to a module constant; memoize errors via `createSelector`.

**R.11 [DISCUSS] `BUNDLE_LOADING` writes the wrong state key — `bundleLoading` can never change — IMPACT: MED (bug), CONFIDENCE: HIGH**
`src/reducers/taskReducer.ts:174-175` — `return { ...state, setBundleLoading: action.payload }` (key is the action-creator's name, not `bundleLoading`). `BundleTaskForm.tsx:47` reads `state.task.bundleLoading`, which stays at its initial `false` forever; the "Next Form" disable at `BundleTaskForm.tsx:206` never engages. Fixing the key is a behavior change (buttons would start disabling) → DISCUSS.

**R.12 [SAFE] `setVisibleAttributes` dispatches an action no reducer handles — IMPACT: LOW (dead dispatch per list fetch), CONFIDENCE: HIGH**
`src/api/services/filterServices.ts:176` dispatches `BPM_VISSIBLE_ATTRIBUTES` (`src/actions/taskActions.ts:77-82`); `taskReducer.ts` has no case for it (verified full switch, lines 65-191). Every task-list response fires a no-op action (which still runs every subscriber's selectors). Safe to remove.

**R.13 [DISCUSS] Impure reducer: `localStorage.setItem` inside `tenants` reducer — IMPACT: LOW, CONFIDENCE: HIGH**
`src/reducers/tenantReducer.ts:10`. Side effect belongs in the action creator (`src/actions/tenantActions.ts`). Behavior-identical move, but touching persistence ordering → DISCUSS.

Verified clean: **redux-logger is correctly gated to development at runtime** — `src/services/StoreService.ts:12-16` pushes it only when `NODE_ENV === "development"`; not a prod-perf issue (see R.23 for bundle weight). No dispatch-during-render found. React 18 `createRoot` auto-batching mitigates the multi-dispatch thunks (e.g. 5 dispatches per list response, `filterServices.ts:102-190`).

## 4. formio rendering

**R.14 [DISCUSS] BundleTaskForm: `cloneDeep` + fresh `submission`/`options`/handlers per render, per keystroke — IMPACT: HIGH, CONFIDENCE: HIGH**
`src/components/BundleTaskForm.tsx:162-189` — `submission={{ data: { ..._.cloneDeep(bundleSubmission?.data), ...submission?.data } }}` (line 165) runs `cloneDeep` in render; `options={{...}}` (166-174), inline `onSubmit` (175-180, with two more `cloneDeep`s), inline `onChange` (183-188) which calls `setSubmission` on every formio change event → re-render → repeat. Confirmed against the library: `node_modules/@aot-technologies/formio-react/lib/components/Form.js:237` has `options` in the create-instance effect deps (reference compare), bailing out only via a **deep `isEqual` of the full form JSON** (Form.js:188-193) every render; fresh `handlers` re-runs the `onAny`/`offAny` emitter re-subscription (Form.js:238-249); fresh `submission` runs a deep `isEqual` against `formInstance.submission` (Form.js:250-256). Additionally the inline `formReady={(e) => ...}` (line 182) is in the create-instance deps as `formReadyCallback`. Fix shape: `useMemo` the options and submission, `useCallback` all handlers. Console.log on every render at line 55.

**R.15 [DISCUSS] TaskForm: inline `options` object per render — IMPACT: MED, CONFIDENCE: HIGH**
`src/components/TaskForm.tsx:101-113` — `options={{ ...options, i18n: RESOURCE_BUNDLES_DATA, readOnly: isReadOnly }}` rebuilt per render (compounded by R.10's fresh `options` prop), plus `onSubmit={isReadOnly ? undefined : onFormSubmit}` / `onCustomEvent` producing a fresh `handlers` object → per-render deep isEqual of form JSON + emitter re-subscribe. `modifiedForm` and `safeSubmission` are correctly memoized (lines 44-72). Fix: `useMemo` the options on `[isReadOnly]`.

## 5. Effects & timers

**R.16 [DISCUSS] `setTimeout` dispatch without cleanup — IMPACT: LOW-MED (dispatch after unmount), CONFIDENCE: HIGH**
`src/Routes/TaskDetails.tsx:104-106` — assignee-change effect schedules `setTimeout(() => dispatch(setTaskFormSubmissionReload(false)), 100)` and never clears it on unmount/re-run.

**R.17 [DISCUSS] Duplicate `ES_CHANGE_LANGUAGE` subscriptions, never unsubscribed — IMPACT: LOW-MED (handler pileup), CONFIDENCE: HIGH**
`src/index.tsx:56-61` (mount effect) and `src/index.tsx:109-112` (isAuth effect) both call `subscribe("ES_CHANGE_LANGUAGE", ...)` with no unsubscribe — at least two live handlers after login, more if `isAuth` re-toggles; `publish("ES_ROUTE")` is also fired from both.

**R.18 [DISCUSS] Action creators invoked without `dispatch` — silent no-ops — IMPACT: MED (bug: bundle error/loading paths dead), CONFIDENCE: HIGH**
`src/Routes/TaskDetails.tsx:124` `setBundleLoading(false);`, `:144` `setBundleErrors(err);`, `:147` `setBundleLoading(false);` — these thunk-creators (`src/actions/taskActions.ts:302-314`) are called but the returned thunk is never dispatched. Bundle fetch errors on the details route vanish. Fixing means dispatching = behavior change → DISCUSS.

**R.19 [DISCUSS] `Assigne` checks `SocketIOService.isConnected` without calling it — IMPACT: LOW-MED (dead fallback branch), CONFIDENCE: HIGH**
`src/components/Assigne/Assigne.tsx:85` `if(!SocketIOService.isConnected){` and `:163` — `isConnected` is a function; `!fn` is always false, so the "refetch when socket down" fallback never runs. (Line 163's branch would double-fetch if "fixed" naively — needs thought.)

Verified clean: `src/components/TaskHistory.tsx:65-76` resize listener has a proper `removeEventListener` cleanup. `BundleTaskForm.tsx:116-119` effect uses state from outside its `[formStep]` deps (`isReadOnly`, caches) — flagged only as [DISCUSS] per the no-hooks-lint rule.

## 6. Expensive computations

**R.20 [DISCUSS] Deep-equal of a freshly built filter payload on every modal render — IMPACT: MED (runs per keystroke while modal open), CONFIDENCE: HIGH**
`src/components/TaskFilterModal/TaskFilterModalBody.tsx:627-629` — `isEqual(getData(), selectedFilterExistingData)` executes in render body; `getData()` (lines 236-269) itself maps/searches variable arrays. Typing the filter name re-runs it each keystroke. Fix: `useMemo` on the inputs.

**R.21 [SAFE] `JSON.parse(localStorage)` per render — IMPACT: LOW, CONFIDENCE: HIGH**
`src/components/TaskList/TasklistTable.tsx:126-128` and `src/Routes/TaskDetails.tsx:77-79` parse `UserDetails` from localStorage every render. Hoist/memoize (note `state.task.userDetails` already holds this — `taskReducer.ts:7`).

Verified: crypto-js AES runs only at socket connect (hot only because of R.1); `customSubmissionReducer.ts:11` does one `cloneDeep` per submission action (minor, TaskForm then JSON-deep-clones again at `TaskForm.tsx:51-53` — double clone of the same data).

## 7. List rendering

**R.22 [DISCUSS] `renderCell` closes over stale `getCellValue` — multiline/format settings can lag — IMPACT: LOW-MED, CONFIDENCE: MED**
`src/components/TaskList/TasklistTable.tsx:538-600` — `muiColumns` is memoized on `[columns, t, handleRefresh, handleOpenModal]` but `renderCell: (params) => getCellValue(col, params.row)` (line 552) captures `getCellValue`, an unmemoized closure over `taskvariables`, `isMultiLineEnabled`, `maxTextLines`, `tenantKey` (lines 194-335). If `selectedFilter.properties.displayLinesCount` changes while `columns` stays reference-equal (the `isEqual` guard at 478-481 keeps it stable), cells render with the old clamp.

Verified clean: no `key={index}` on reorderable lists (`TaskHistory.tsx:124` uses `entry.id || index` on an append-only history; DragandDropSort manages its own items); rows memoized (`TasklistTable.tsx:604-610`); per-row `View` button handler is inside memoized `muiColumns`; `disableVirtualization`+`autoHeight` (`TasklistTable.tsx:713-714`) is acceptable at server page sizes ≤25. Per-row cost concern is R.9's Assigne subscription, not keys.

## 8. Bundle

**R.23 [SAFE] redux-logger statically imported into the production bundle — IMPACT: LOW-MED (dep is ~dev-only but always shipped), CONFIDENCE: HIGH**
`src/services/StoreService.ts:1` — `import logger from "redux-logger"` at top level; only used inside the `NODE_ENV === "development"` branch (lines 12-16). A guarded `require`/dynamic import keeps dev behavior identical and drops it from prod output. (It's also listed under `dependencies` in `package.json:75`.)

**R.24 [SAFE] Whole-package lodash import in BundleTaskForm — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/components/BundleTaskForm.tsx:7` — `import _ from "lodash"` (uses only `cloneDeep`). Every other file already imports per-method (`lodash/isEqual`, `{ cloneDeep }`); align this one.

**R.25 [SAFE] Dead files/exports (~750 lines) — IMPACT: MED (bundle + reader confusion), CONFIDENCE: HIGH**
- `src/components/TaskList/TaskList-old.tsx` (335 lines) — zero importers (grep verified).
- `src/reducers/initialDetailReducer.ts` (39 lines) — never registered in `src/reducers/index.ts` (combines only task/form/customSubmission/tenants/submission); consequently `setRoleIds`/`setAccessForForm` dispatches from `src/api/services/userSrvices.ts:13-16` hit no reducer (the call's real effect is only the token refresh inside `fetchAndStoreFormioRoles`).
- `getOnlyTaskDetails` (`src/api/services/bpmTaskServices.ts:9-16`) — referenced only in a comment (`src/index.tsx:142`).
- Commented-out blocks: `Assigne.tsx:284-295`, `TaskHistory.tsx:22-51 + 152-177` (`HistoryField`), `TaskList.tsx:332-346`.
- formio-leftover keys in task initial state (`taskReducer.ts:52-57`: `id`, `isActive`, `form`, `url`, `errors`).

Verified clean: crypto-js imported modularly (`crypto-js/aes`); `dist/` is git-ignored; externals (`react`, `react-dom`, `@formsflow/*`) intact in `webpack.config.js:21`.

## 9. Maintainability

**R.26 [DISCUSS] Task-view logic duplicated wholesale between modal table and details route — IMPACT: HIGH (double maintenance, already diverging), CONFIDENCE: HIGH**
`src/components/TaskList/TasklistTable.tsx:350-475` vs `src/Routes/TaskDetails.tsx:175-272` — `handleFormRetry`, `handleSuccessfulFormFetch`, `getFormSubmissionData`, `onFormSubmitCallback`, `onCustomEventCallBack` are near-identical copies; the bundle-setup effect is also duplicated (`TasklistTable.tsx:401-440` vs `TaskDetails.tsx:120-155`) and has **already diverged** (the route copy contains the R.18 missing-dispatch bugs; the table copy dispatches correctly). The `getUserRoles` fetch effect is duplicated in both modal bodies (`TaskFilterModal/TaskFilterModalBody.tsx:376-380`, `AttributeFilterModal/AttributeFIlterModalBody.tsx:291-295`). `TaskFilterModal` is instantiated twice in the same tree (`TasklistTable.tsx:742-746` and `TaskFilterDropdown.tsx:273-277`). Extract a `useTaskFormLoader` hook / single modal host.

**R.27 [SAFE] God components — IMPACT: MED, CONFIDENCE: HIGH**
`TaskFilterModal/TaskFilterModalBody.tsx` 1050, `AttributeFilterModal/AttributeFIlterModalBody.tsx` 842, `TaskList/TasklistTable.tsx` 750, `TaskList/TaskDetailsModal.tsx` 430, `TaskList/TaskList.tsx` 393, `Routes/TaskDetails.tsx` 362, `TaskList/AttributeFilterDropdown.tsx` 339, `actions/taskActions.ts` 337. TaskFilterModalBody mixes wizard state, intro cards, three tab renderers, payload assembly and five fetches.

**R.28 [DISCUSS] Prop drilling into TaskDetailsModal that Redux already provides — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/components/TaskList/TaskDetailsModal.tsx:60-89` takes ~27 props, while lines 94-96 read `taskDetail`/`submission` from the store anyway (so `taskDetail` prop and store `task` coexist in the same component).

**R.29 [DISCUSS] Error handling is inconsistent and mostly silent — IMPACT: MED, CONFIDENCE: HIGH**
`src/actions/taskActions.ts:34-39` — `serviceActionError` discards the actual error and stores the literal string `"Error Handling API"`; nothing renders `state.task.error`, and no toasts exist in the package (the `Toastify` div at `TaskList.tsx:319` is an empty shell). Services mix `console.log("Error", error)` (`filterServices.ts:332,356,376`; `bpmTaskServices.ts:104,126`) with bare `console.error`. 13 stray `console.log`s including per-render/per-event logs (`index.tsx:139,146,178`; `TaskDetails.tsx:117`; `BundleTaskForm.tsx:55`).

**R.30 [SAFE] Naming/typos and hand-rolled helpers — IMPACT: LOW, CONFIDENCE: HIGH**
Filenames `userSrvices.ts`, `AttributeFIlterModalBody.tsx`; constant `BPM_VISSIBLE_ATTRIBUTES`. Hand-rolled tenant URLs `/tenant/${tenantKey}/` at `TasklistTable.tsx:176-178` and `TaskHistory.tsx:63` duplicate `getRedirectUrl` from `@formsflow/service` (already used in `index.tsx:45`, `TaskDetails.tsx:85`). Nearly all action creators are needlessly wrapped as thunks (`taskActions.ts:55-118` etc.). Test coverage: a single trivial test (`src/__tests__/Loading.test.tsx`) for the whole package.

**R.31 [SAFE] `Root` builds a new Redux store on every render — IMPACT: MED (latent full-state wipe), CONFIDENCE: HIGH**
`src/root.component.tsx:11` — `const store = StoreService.configureStore();` in the component body; any re-render of `Root` (e.g. single-spa prop update) creates a fresh store and swaps the `Provider`, discarding all state. Fix: `useState(() => StoreService.configureStore())[0]` — identical behavior today, removes the hazard.

## 10. Routing

**R.32 [SAFE] No code-splitting inside the MFE — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/index.tsx:13-14` eagerly imports both routes; `src/Routes/TaskListing.tsx` is a pass-through to `TaskList`. `TaskDetails` (+ `TaskForm`/`BundleTaskForm`/`TaskHistory`) and the two giant filter-modal bodies are good `React.lazy` candidates with the existing `<Loading />` as Suspense fallback. Route paths (`task`, `task/:taskId`, `BASE_ROUTE` in `src/constants/index.ts`) and the single-spa lifecycle export (`src/formsflow-review.tsx`) untouched.

## Checked & clean (verified negatives)

- **redux-logger not active in prod** — env-gated at `StoreService.ts:12-16` (bundle weight only, R.23).
- **fetchServiceTaskList dedup** — module-level AbortController aborts superseded list requests (`filterServices.ts:73-100`); loader-flag logic accounts for aborts.
- **No interceptor bypass** — all HTTP goes through `RequestService` from `@formsflow/service`; the sole direct `axios` import (`bpmTaskServices.ts:4`) is only `axios.all/spread` over RequestService promises (could be `Promise.all`, cosmetic).
- **No `key={index}` on reorderable lists**; table rows memoized; formio `form`/`submission` props memoized in TaskForm.
- **TaskHistory resize listener** has cleanup (`TaskHistory.tsx:75`).
- **No StrictMode double-mount hazard** for the socket (no StrictMode wrapper in `root.component.tsx`/`index.tsx`).
- **crypto-js** imported per-module (`crypto-js/aes`); lodash per-method everywhere except R.24.
- **`dist/` git-ignored**; externals config intact; `formsflow-review.tsx` contract is a clean 21-line lifecycle export.
- **Modal bodies are not mounted while closed** — `AppModal` wraps react-bootstrap `Modal` (verified `forms-flow-components/src/components/CustomComponents/AppModal.tsx`), so `TaskFilterModalBody`'s fetch effects run per open, not per page load.
- **No dispatch-during-render** found.

## API inventory

| Function (file) | Endpoint | Verb | Callers | Stored in |
|---|---|---|---|---|
| `fetchServiceTaskList` (filterServices) | `{BPM}/engine-rest-ext/v1/task-filters?firstResult&maxResults` | POST | index.tsx (socket cb), TaskList, TasklistTable, Assigne, TaskFilterModal(+Body), AttributeFilterDropdown, AttributeFIlterModalBody, TaskFilterDropdown | `task.tasksList`, `tasksCount`, `lastRequestedPayload` (+dead `BPM_VISSIBLE_ATTRIBUTES`) |
| `fetchBPMTaskCount` (filterServices) | `.../v1/task-filters/count` | POST | TaskList, Assigne, TaskFilterModal(+Body), ReorderTaskFilterModal | `task.filtersAndCount` |
| `fetchFilterList` (filterServices) | `{WEB}/filter/user` | GET | TaskList, ReorderTaskFilterModal | via `setBPMFilterList` → `task.filterList` |
| `fetchAttributeFilterList` (filterServices) | `{WEB}/filter/<filter_id>` | GET | TaskList, TaskFilterDropdown, ReorderAttributeFilterModal | `task.attributeFilterList` |
| `createFilter` / `updateFilter` / `deleteFilter` (filterServices) | `{WEB}/filter[/{id}]` | POST/PUT/DELETE | TaskFilterModal(+Body), AttributeFilterModal(+Body), ReorderTaskFilterModal | local + list re-dispatch |
| `updateDefaultFilter` (filterServices) | `{WEB}/user/default-filter` | POST | TaskList, TaskFilterDropdown, TaskFilterModal(+Body), ReorderTaskFilterModal | fire-and-forget |
| `saveFilterPreference` (filterServices) | `{WEB}/filter/filter-preference` | POST | Reorder modals | fire-and-forget |
| `fetchUserList` (filterServices) | `{WEB}/user?permission=manage_tasks` | GET | index.tsx, Assigne | `task.userList` |
| `fetchUsersByMemberOfGroup` (filterServices) | `{WEB}/user?memberOfGroup=` | GET | Assigne | local (`memberGroupOptions`) |
| `getUserRoles` (filterServices) | `{WEB}/roles` | GET | both filter-modal bodies | `task.userGroups` |
| `fetchTaskVariables` (filterServices) | `{WEB}/form/formid/{formId}` | GET | TaskFilterModalBody, TasklistTable, TaskDetails | local state |
| `executeRule` (filterServices) | `{WEB}/form/<mapper_id>/bundles/execute-rules` | POST | TasklistTable, TaskDetails | `task.selectedForms` |
| `fetchAllForms` (filterServices) | `{WEB}/form?activeForms=true` | GET | TaskFilterModalBody | local (`forms`) |
| `fetchFormById` (filterServices) | `{FORMIO}/form/{id}` | GET | BundleTaskForm, FormSelectionModal | local |
| `fetchBundleSubmissionData` / `getBundleCustomSubmissionData` (filterServices) | `{FORMIO or CUSTOM}/form/{bundleId}/submission/{sid}?formId=` | GET | BundleTaskForm | `task.bundleSubmission` |
| `claimBPMTask` / `unClaimBPMTask` / `updateAssigneeBPMTask` (filterServices) | `.../v1/task/<id>/claim|unclaim|assignee` | POST | Assigne | none (callbacks refetch) |
| `getBPMTaskDetail` (bpmTaskServices) | `.../v1/task/<id>` + `.../v1/task/<id>/variables` (parallel) | GET×2 | index.tsx, Assigne, TasklistTable, TaskDetails | `task.taskDetail`, `taskAssignee` |
| `getOnlyTaskDetails` (bpmTaskServices) | `.../v1/task/<id>` | GET | **none (dead)** | — |
| `getBPMGroups` (bpmTaskServices) | `.../v1/task/<id>/identity-links?type=candidate` | GET | TasklistTable, TaskDetails | **discarded (R.5)** |
| `onBPMTaskFormSubmit` (bpmTaskServices) | `.../v1/task/<id>/submit-form` | POST | TasklistTable, TaskDetails | none |
| `onBPMTaskFormUpdate` (bpmTaskServices) | `{WEB}/tasks/<id>/complete` | POST | TaskDetailsModal | none |
| `getCustomSubmission` (bpmTaskServices) | `{CUSTOM}/form/<form_id>/submission/{sid}` | GET | TasklistTable, TaskDetails | `customSubmission.submission` |
| `getApplicationHistory` (bpmTaskServices) | `{WEB}/application/<id>/history` | GET | TasklistTable, TaskDetails | `task.appHistory` |
| `getForm` / `getSubmission` (formio-react, external) | formio project API | GET | TasklistTable, TaskDetails | `form` / `submission` slices |
| `getFormioRoleIds` (userSrvices) | via `fetchAndStoreFormioRoles` | GET | token-retry paths | dispatches to **unregistered reducer** (R.25) |
| `completeChecklistItem` (checklistService) | `{WEB}/user/checklist/{trackingId}` | PUT | Assigne (via routeKey helper) | fire-and-forget |

**Suggested fix order:** R.1+R.3 (socket lifecycle), R.9/R.10 (selector churn), R.14/R.15 (formio props), R.5 (dead getBPMGroups calls), R.11/R.18/R.19 (latent bugs, need product confirmation), then bundle/dead-code sweeps (R.23-R.25) and the duplication refactor (R.26).

---

# §6 forms-flow-submissions (U.*)

**Package summary.** `@formsflow/submissions` (~4,600 lines TS/TSX) is the "Analyze Submissions" micro-frontend: one list route (`Routes/SubmissionListing.tsx`, 1,088 lines) and one detail route (`components/AnalyzeSubmissionView.tsx`, 495 lines) plus a bundle-form viewer. It is a fork-and-trim of the larger formsflow web app and it shows: an 841-line dead predecessor of the list page is still shipped, react-query is mounted but its only consumer is that dead file (the live list regressed to manual `useState`/`useEffect` fetching with no cache and no abort), Redux carries 9 slices of which all are technically read but several actions/files are dead, and the list page fires duplicate GETs plus **unconditional POST writes from render effects** at mount. The biggest wins here are deleting dead code (~1,100 lines), fixing the mount-effect fetch chain, and stabilizing memo dependencies that currently invalidate on every render.

## Findings

### Dead code & double-maintained list page

**U.1 [SAFE] 841-line dead `SubmissionListOld.tsx` is the package's only react-query consumer — IMPACT: HIGH (bundle size + double maintenance), CONFIDENCE: HIGH**
- `src/Routes/SubmissionListOld.tsx` — imported nowhere (`grep -rn "SubmissionListOld" src/` matches only the file itself; `src/index.tsx:14` imports `./Routes/SubmissionListing`).
- It duplicates ~60–70% of `SubmissionListing.tsx` verbatim (same `DEFAULT_SUBMISSION_FIELDS` L112–118 vs L128–134, same effect chain L148–280, same `handleSaveVariables` L647–701 vs L750–804).
- It contains the package's **only** `useQuery` (`SubmissionListOld.tsx:348–373`, with `staleTime: 0, cacheTime: 0` — caching explicitly disabled even there).
- Fix shape: delete the file. Zero-risk: not reachable, not exported.

**U.2 [SAFE] More dead files (fork residue) — IMPACT: MED (bundle only for the imported ones, cognitive load for all), CONFIDENCE: HIGH**
Verified no importer for each (grep evidence in parentheses):
- `src/react-query-client.ts` (only self-match; `root.component.tsx:8` creates its **own** `new QueryClient()` instead — two clients defined, one used, one dead).
- `src/components/NotFound.tsx` — never imported; `index.tsx:139` navigates to `/404` handled by root-config.
- `src/constants/permissions.ts` — never imported; also calls `useSelector` inside a plain function (`permissions.ts:4`, hook-rule violation) and reads `state.applications.roles` which is only ever `""` (`applicationReducer.ts:5`, no action updates it).
- `src/actions/applicationHistoryActions.ts` — never imported; its 3 creators are verbatim duplicates of `applicationActions.ts:19–38`.
- `src/services/ServiceManagement/index.ts` (self-described "sample code", L3) + `src/endpoints/index.ts` (`SAMPLE` endpoint) + `src/endpoints/config.ts` (duplicate of `api/config.ts` keycloak block) — an entire dead scaffold trio.
- `src/services/applicationServices.ts:42–48` — `fetchFormById` export is dead (all callers import the `api/queryServices` version); it also contains a latent bug (`localStorage.getItem("formioToken") ?? {}` then spreads a *string* as headers), harmless only because it's dead.
- Dead symbols inside the live list: `SubmissionListing.tsx:53` (`SystemVariables` imported, never used), `:156–160` (`handleClearSearch` never referenced), `:233–264` (`initialInputFields` — a `useMemo` recomputed every render whose value is never read; leftover from the old CollapsibleSearch UI).
- Fix shape: delete files/symbols; pure removal, no behavior change.

### react-query v4 usage

**U.3 [DISCUSS] QueryClient mounted with v4 defaults but zero live queries; live list regressed to uncached manual fetching — IMPACT: HIGH, CONFIDENCE: HIGH**
- `src/root.component.tsx:8,14` — `new QueryClient()` with no `defaultOptions` wrapped around the app. v4 defaults (`staleTime: 0`, `refetchOnWindowFocus: true`, `retry: 3`) would be a refetch-storm surface — but currently **no live component calls useQuery/useMutation** (grep: only dead `SubmissionListOld.tsx:348`). So the provider + `@tanstack/react-query` are bundled dead weight (react-query is *not* in the webpack externals list — `webpack.config.js` externals are only `["@formsflow/*", "react", "react-dom"]`).
- The live replacement `SubmissionListing.tsx:411–447` (`fetchSubmissions` via `useCallback` + effect at L483–485) lost what even the old `useQuery` gave: request de-dup, keepPreviousData potential, and **race safety** — there is no AbortController and no "latest request wins" guard anywhere (grep for `AbortController` across src/: zero hits), so a slow page-1 response can overwrite a fast page-2 response in `setSubmissionsData`.
- Fix shape (behavior decision, hence DISCUSS): either re-adopt `useQuery` for `getSubmissionList`/`fetchAllForms`/`fetchSubmissionList` with explicit `staleTime`/`retry`/`refetchOnWindowFocus: false` defaults on the client, or drop the provider + dependency usage entirely. Half-in/half-out is the worst position.

### Data fetching correctness

**U.4 [DISCUSS] Mount-time effect chain fires ~3 duplicate GETs and 2 unconditional POST writes — IMPACT: HIGH (server load + writes without user intent), CONFIDENCE: HIGH**
On every visit to the list page, `SubmissionListing.tsx` runs:
- L274–280: `fetchSubmissionList()` GET on `[defaultSubmissionFilter]` (runs at mount, and again whenever the default filter id changes);
- L284–311: `fetchSubmissionList()` GET again in the `[]` mount effect;
- L164–174: effect on `[dropdownSelection, filterList]` that **POSTs** `updateDefaultSubmissionFilter({ defaultSubmissionsFilter: filter?.id })` unconditionally — at first mount `filterList` is `[]` so it POSTs `{defaultSubmissionsFilter: undefined}`, then when the mount fetch dispatches `setSubmissionFilterList` (L293) the effect re-runs and POSTs again; the `setDefaultSubmissionFilter` dispatch (L171) also re-triggers the L274 GET.
Net: 3× GET `/submissions-filter` + 2× POST `/user/default-filter` per navigation before the user touches anything, plus a persisted server-side write as a render side-effect. `handleDropdownSelectionChange` (L145) POSTs a third variant. Fix shape: single source-of-truth fetch (one query), and only POST the default filter from explicit user actions. DISCUSS because collapsing the chain changes observable network behavior (currently the last POST "wins" and self-heals server state).

**U.5 [DISCUSS] `fetchFormVariables` refetch duplicates data already held in `formData` — IMPACT: MED, CONFIDENCE: HIGH**
- `SubmissionListing.tsx:120–125` calls `fetchFormVariables(dropdownSelection)` on every form-dropdown change solely to read `res.data?.formType` — but `fetchAllForms()` (L450–459) already returns `formType` per form (used at L934 `f?.formType === "bundle"` and in `formTypeByName`, L726–732). One redundant GET per dropdown change. Fix shape: derive `selectedFormType` from `formData` lookup; DISCUSS only because `fetchFormVariables` hits the mapper endpoint whose `formType` could theoretically diverge from the list payload.

**U.6 [DISCUSS] Bundle step viewer double-fetches every form — IMPACT: MED, CONFIDENCE: HIGH**
- `components/BundleSubmissionView.tsx:116` — `getFormAndSubmission` is a `useCallback` depending on `cacheSubmissions` and `formCache`, which the function itself sets (L102, L109); the effect at L118–121 depends on `getFormAndSubmission`. First run populates `cacheSubmissions` → callback identity changes → effect re-runs → `fetchFormById(formId)` fires a second time (it is unconditionally in `promises`, L86) and `setBundleSubmissionData` dispatches again. Every step navigation = 2× form fetch + duplicate dispatch. Fix shape: use a ref for the caches or functional guards so the callback identity is stable. (Dep-array change → DISCUSS per constraints.)

**U.7 [DISCUSS] GraphQL query built by string interpolation of raw user search input — IMPACT: MED-HIGH (robustness/injection), CONFIDENCE: HIGH**
- `api/queryServices/analyzeSubmissionServices.ts:33` — `return `"${value}"`` inside `formatValue`, fed from the free-text search filters (`SubmissionListing.tsx:981` `handleFieldSearch({ [selectedSearchFieldKey]: searchText })`). A search term containing `"` (or `\`) breaks the query or injects arbitrary GraphQL arguments; there is no escaping anywhere in L18–101. Fix shape: use GraphQL variables (`{ query, variables }` payload) or at minimum `JSON.stringify(value)` instead of manual quoting. DISCUSS: payload shape changes are backend-contract-adjacent.

**U.8 [DISCUSS] Silent no-op: Redux action creators called without dispatch — IMPACT: MED (bundle loading state never set), CONFIDENCE: HIGH**
- `components/AnalyzeSubmissionView.tsx:152` `setBundleLoading(true);` and `:169` `setBundleLoading(false);` — `setBundleLoading` is a thunk creator (`actions/bundleSubmissionActions.ts:32–34`); calling it without `dispatch(...)` returns a function and discards it. `state.submissionBundle.bundleLoading` therefore stays `false` forever, and `BundleSubmissionView.tsx:43,177` (Next-button `disabled={bundleLoading}`) never disables. Fixing is a one-word change but *is* a behavior change → DISCUSS.

### Redux performance

**U.9 [SAFE] `mapStateToProps` returns fresh object/array literals → `View` re-renders on every store action — IMPACT: HIGH (it wraps the formio `<Form>`), CONFIDENCE: HIGH**
- `components/View.tsx:18–27` — `options: { readOnly: true }` and `errors: [...]` are new references on every store notification, so `connect`'s shallow prop compare always fails; `React.memo` at L33 is defeated the same way. Every dispatch anywhere (including the list page's sort/page dispatches while the modal `View` at `AnalyzeSubmissionView.tsx:489` is mounted) re-renders the formio form wrapper.
- Same pattern: `components/BundleSubmissionView.tsx:190–195`.
- Fix shape: hoist `options` to module scope and memoize `errors` via a selector — no behavior change.

**U.10 [SAFE] Object-literal `useSelector` without `shallowEqual` — IMPACT: LOW-MED, CONFIDENCE: HIGH**
- `components/AnalyzeSubmissionView.tsx:82–90` — the `useMemo` memoizes the *selector function*, not its result; the selector still returns a new `{appHistory, isHistoryListLoading}` object per store notification → re-render of the 495-line detail component on every dispatch. Fix: two scalar `useSelector`s or pass `shallowEqual`.

**U.11 [DISCUSS] In-place `.sort()` mutates a Redux-held array inside a render memo — IMPACT: MED (correctness), CONFIDENCE: HIGH**
- `Routes/SubmissionListing.tsx:346–347` — `sourceFields.sort(...)` where `sourceFields` is `selectedSubmissionFilter.variables` (Redux state, L341–343). `Array.prototype.sort` mutates in place; RTK's dev-mode immutability check will throw for this path, and field order in the store silently changes outside a reducer. Fix shape: `[...sourceFields].sort(...)`. (Technically SAFE, but the store contents change → flagged DISCUSS.)

**U.12 [SAFE] `serializableCheck: false` globally + side effect in reducer — IMPACT: LOW, CONFIDENCE: HIGH**
- `services/StoreServices.ts:20` disables serializable checks store-wide; `reducers/tenantReducer.ts:10` writes `localStorage.setItem` inside the reducer (side effect in a pure function; also redundant — `index.tsx:55` *reads* the same key it wrote). redux-logger itself is correctly dev-gated (`StoreServices.ts:13–16`) — but see U.18.

### formio rendering

**U.13 [SAFE] Inline `options` object on every `<Form>` site — IMPACT: MED-HIGH (formio compares options by reference; per-parent-render form teardown risk), CONFIDENCE: HIGH**
- `components/View.tsx:97–102` — `options={{ ...options, i18n: RESOURCE_BUNDLES_DATA, viewAsHtml: true, buttonSettings: {...} }}` — new reference every render, compounded by U.9 making renders frequent.
- `components/BundleSubmissionView.tsx:151–157` — same inline options, **plus** the `submission` prop at L145–150 is rebuilt with `_.cloneDeep(bundleSubmission?.data)` + `_.cloneDeep(submission?.data)` on *every render* — an expensive deep clone of potentially large submission data per keystroke/re-render, and a fresh object identity that forces formio-react's deep `isEquals` walk each time.
- Fix shape: `useMemo` the options per site (deps: none/`RESOURCE_BUNDLES_DATA`) and memoize the merged submission on `[bundleSubmission?.data, submission?.data]`.

### List rendering

**U.14 [SAFE] `DEFAULT_SUBMISSION_FIELDS` re-created every render and used as a memo dependency → the entire column pipeline recomputes per render — IMPACT: HIGH, CONFIDENCE: HIGH**
- `Routes/SubmissionListing.tsx:128–134` — plain `const` array literal in the component body (not memoized), then listed in deps at L366 (`columns`), L382 (`columnVisibilityModel`), L633 (`getCellValue`), L803, L903. Every render: new array → all these memos invalidate → `muiColumns` (deps `[columns, t, getCellValue]`, L724) rebuilds → MUI DataGrid receives a brand-new column definition array every render and re-processes columns. Fix shape: hoist to module scope (it's constant); pure reference stabilization, no behavior change.

**U.15 [SAFE] Per-cell re-filter/re-sort in `getCellValue` — IMPACT: MED, CONFIDENCE: HIGH**
- `Routes/SubmissionListing.tsx:580–584` — `fieldsToRender = (...).filter(...).sort(...)` then `.find(...)` executes inside the cell renderer, i.e., O(fields·log fields) **per cell** per render (× rows × columns). Fix: hoist `fieldsToRender`/`fieldKeyMap` (L590–595, also rebuilt per cell) into a `useMemo` above `getCellValue`.

**U.16 [DISCUSS] `disableVirtualization` + `autoHeight` with up to 100 rows; unstable grid props; index-fallback row ids — IMPACT: MED, CONFIDENCE: HIGH**
- `Routes/SubmissionListing.tsx:1067–1068` — virtualization explicitly disabled with `pageSizeOptions={[10, 25, 50, 100]}` (L1048): 100 rows × N columns fully rendered.
- L1049–1065 — `dataGridProps` object (with inline `getRowId` and `onColumnWidthChange` closures) and L1037–1043 `emptyStateAction` are recreated every render, feeding the shared `ReusableTable`.
- L738 — row id fallback `` `row-${index}` `` (index-derived key) if both `id` and `_id` are missing.
- DISCUSS: `disableVirtualization` may be intentional for sticky-column CSS; the prop-identity fixes are safe.

### Effects & timers

**U.17 [SAFE] Duplicate event subscription with no cleanup — IMPACT: LOW-MED (leak across remounts), CONFIDENCE: HIGH**
- `src/index.tsx:45–50` and `:102–105` — `subscribe("ES_CHANGE_LANGUAGE", ...)` is registered twice (mount effect + `isAuth` effect), `publish("ES_ROUTE")` fired twice, and neither effect returns a cleanup. Each single-spa remount of the MFE adds two more listeners on the shared event bus. Fix: subscribe once; return unsubscribe if the bus API supports it. Verified negative elsewhere: **no** `setTimeout`/`setInterval`/`addEventListener` anywhere in src/ (grep).
- Related [DISCUSS]: `components/AnalyzeSubmissionView.tsx:125–131` — the app-detail fetch effect deps are `[dispatch]` only; navigating from `/submissions/:id` to another id would not refetch (may be unreachable today; eslint-plugin-react-hooks is not installed, so trimmed deps may be deliberate).

### Bundle & dead weight

**U.18 [SAFE] redux-logger statically imported into the production bundle — IMPACT: MED, CONFIDENCE: HIGH**
- `services/StoreServices.ts:1` — top-level `import logger from "redux-logger"` cannot be tree-shaken because the dev gate (`:13–16`) is a *runtime* check on `window._env_?.NODE_ENV`. The logger ships to prod even though it's never used there. Fix shape: `await import()`/`require` inside the dev branch — behavior identical.
- Also bundled-but-unused: `@tanstack/react-query` (only live use is the provider wrapper, see U.3). Declared-but-never-imported dep: `react-bootstrap` (grep: zero imports). **Undeclared** dep actually imported: `lodash` (`BundleSubmissionView.tsx:5` — `import _ from "lodash"`, whole-package import, only `_.cloneDeep` used at L98, 147–148; lodash is absent from `package.json` dependencies — resolves only via hoisting). No dep changes allowed per constraints; report only.

### Maintainability

**U.19 [SAFE] Triplicated `MULTITENANCY_ENABLED` / config duplication — IMPACT: MED (drift risk), CONFIDENCE: HIGH**
Three independent definitions/sources used simultaneously: `constants/index.ts:6–10` (used by `SubmissionListOld.tsx:49`, `index.tsx:9`), `constants/constants.ts:4–5` (used by `View.tsx:8`), and the `@formsflow/service` export (used by `SubmissionListing.tsx:51`). Likewise `CUSTOM_SUBMISSION_URL` in both `api/config.ts:25` and `constants/constants.ts:1`, and the whole keycloak block duplicated in `api/config.ts` vs dead `endpoints/config.ts`. Fix: converge on the `@formsflow/service` export + one local config module.

**U.20 [DISCUSS] God component: `SubmissionListing.tsx` (1,088 lines, ~20 `useState` + 12 `useSelector` + 10 effects) — IMPACT: MED, CONFIDENCE: HIGH**
Filter state is split across Redux (`sort/page/limit/dateRange/searchFieldValues/selectedForm/columnWidths`) *and* local state (`dropdownSelection`, `fieldFilters`, `filtersApplied`, `searchText`, `submissionFields`…), with effects synchronizing the two (L164–174, 176–198, 200–205, 218–226, 314–323) — the classic double-source-of-truth that produced U.4. `handleSaveVariables` (L750–804) is a near-verbatim copy of dead `SubmissionListOld.tsx:647–701` and overlaps `ManageFieldsSortModal.handleSaveSubmissionFields` (`Modals/ManageFieldsSortModal.tsx:145–154` — same POST + same two dispatches). Fix shape: extract a `useSubmissionFilters` hook + one save-filter helper.

**U.21 [SAFE] Inconsistent/silent error handling; toast placeholders with no toast system — IMPACT: LOW-MED, CONFIDENCE: HIGH**
- Fire-and-forget POSTs with no `.catch`: `SubmissionListing.tsx:145,172` (`updateDefaultSubmissionFilter`), `:794–801` and `ManageFieldsSortModal.tsx:146–153` (`createOrUpdateSubmissionFilter` — a rejection here leaves the modal open with no feedback and an unhandled rejection).
- All other failures are `console.error` only (`SubmissionListing.tsx:307–309, 429, 456–458`); `<div className="Toastify">`/`toast-section` placeholders exist (`SubmissionListing.tsx:912–913`) but no toast library is used anywhere (grep).
- Stray debug logging: `index.tsx:66` `console.log("No tenant data found in storage")`.

### Routing

**U.22 [SAFE] No code-splitting inside the MFE — IMPACT: MED, CONFIDENCE: HIGH**
- Route structure is `index.tsx:122–140` (`submissions`, `submissions/:id`, `*`→`/404`) — route paths untouched by this. Zero `React.lazy`/`Suspense` in src/ (grep). The detail view (`AnalyzeSubmissionView` + `BundleSubmissionView` + `ProcessDiagram`/bpmn) and `ManageFieldsSortModal` load in the main chunk even for users who only view the list. Fix shape: `React.lazy` the `submissions/:id` element and the modal — in-MFE only, contract-safe.

## Checked & clean (verified negatives)

- **redux-logger in prod**: correctly gated to `NODE_ENV === "development"` at runtime (`services/StoreServices.ts:13–16`) — only the *bundling* is the issue (U.18).
- **No GETs modeled as useMutation** — there are zero `useMutation` calls in the package.
- **No direct axios** — every network call goes through `RequestService` from `@formsflow/service` (grep for `axios`: zero hits).
- **No timers/global listeners** — zero `setTimeout`/`setInterval`/`addEventListener` in src/.
- **Externals respected** — `webpack.config.js` externals `["@formsflow/*", "react", "react-dom"]`; no local import bypasses them.
- **Single-spa lifecycle export intact** — `src/formsflow-submissions.tsx:21` exports `bootstrap/mount/unmount`; nothing else touches it (note: `errorBoundary` returns `null`, i.e., silent blank on crash — cosmetic observation).
- **No dead Redux slices** — all 9 combined slices have at least one live `useSelector`/`selectRoot` reader (table below); the dead weight is in *files*, not slices.
- **`useSelector` scalar subscriptions** in `SubmissionListing.tsx:85–97` are per-field and stable (the `?? {}` fallbacks only apply to never-undefined initialized state) — no object-literal selector problem in the live list itself.
- **View.tsx submission deep-clone is memoized** (`View.tsx:51–68`) — correct pattern, unlike BundleSubmissionView.
- **`key={index}` in live code**: none — the only index-keyed cells are in dead `SubmissionListOld.tsx:451`; live rows use `id`/`_id` with only a fallback to index (U.16).

## API inventory

| Function | Endpoint (verb) | Callers (live) | Result stored in |
|---|---|---|---|
| `getSubmissionList` (`api/queryServices/analyzeSubmissionServices.ts:7`) | `GRAPHQL_API` (POST, GraphQL) | `SubmissionListing.fetchSubmissions` L411 (+dead Old useQuery) | local state `submissionsData` |
| `fetchAllForms` (:140) | `WEB_BASE_URL/form?viewSubmissions=true` (GET) | `SubmissionListing` L451 | local state `formData` |
| `fetchFormVariables` (:144) | `WEB_BASE_URL/form/formid/<id>` (GET) | `SubmissionListing` L122; `AnalyzeSubmissionView` L145 | local state (`selectedFormType` / `formType`) |
| `executeRule` (:150) | `WEB_BASE_URL/form/<mapper_id>/bundles/execute-rules` (POST) | `AnalyzeSubmissionView` L154 | Redux `submissionBundle.submissionBundleForms` |
| `getBundleCustomSubmissionData` (:155) | `CUSTOM_SUBMISSION_URL/form/<form_id>/submission/...` (GET) | `BundleSubmissionView` L52 | Redux `submissionBundle.bundleSubmission` + local cache |
| `fetchBundleSubmissionData` (:161) | `PROJECT_URL/form/<bundleId>/submission/<id>` (GET) | `BundleSubmissionView` L54 | same as above |
| `fetchFormById` (:170) | `PROJECT_URL/form/<id>` (GET, formio) | `SubmissionListing` L471; `BundleSubmissionView` L86 | local state `form` (×2 due to U.6) |
| `fetchSubmissionList` (:184) | `WEB_BASE_URL/submissions-filter` (GET) | `SubmissionListing` L275, L289 (duplicate — U.4) | Redux `analyzeSubmission.submissionFilterList` |
| `createOrUpdateSubmissionFilter` (:187) | `WEB_BASE_URL/submissions-filter` (POST) | `SubmissionListing` L794; `ManageFieldsSortModal` L146 | Redux `selectedFilter`/`defaultFilter` |
| `updateDefaultSubmissionFilter` (:192) | `WEB_BASE_URL/user/default-filter` (POST) | `SubmissionListing` L145, **L172 (render effect — U.4)**, L795; modal L147 | server-side only |
| `getApplicationById` thunk (`services/applicationServices.ts:14`) | `WEB_BASE_URL/application/<id>` (GET) | `AnalyzeSubmissionView` L128 | Redux `applications.applicationDetails` |
| `getCustomSubmission` thunk (:51) | `CUSTOM_SUBMISSION_URL/form/<form_id>/submission/<id>` (GET) | `AnalyzeSubmissionView` L192, L247 | Redux `customSubmission.submission` |
| `fetchApplicationAuditHistoryList` thunk (:80) | `WEB_BASE_URL/application/<id>/history` (GET) | `AnalyzeSubmissionView` L204, L290 | Redux `taskAppHistory.appHistory` |
| `getProcessActivities` thunk (`services/processServices.ts:9`) | `BPM_BASE_URL_EXT/v1/process-instance/<id>/activity-instances` (GET) | `AnalyzeSubmissionView` L216 | Redux `process.processActivityList` |
| `getProcessDetails` (:42) | `WEB_BASE_URL/process/key/<key>` (GET) | `AnalyzeSubmissionView` L217 | local state `diagramXML`/`processType` |
| `completeChecklistItem` (`services/checklist/index.ts:8`) | `WEB_BASE_URL/user/checklist/<id>` (PUT) | `index.tsx` L107 | none |
| formio `getForm`/`getSubmission` (from `@aot-technologies/formio-react`) | formio project API (GET) | `AnalyzeSubmissionView` L190–195, L245–250 | Redux `form` / `submission` slices |
| Dead: `sampleCreate` (`ServiceManagement/index.ts:8`), `applicationServices.fetchFormById` (:42) | — | none | — |

**Notable**: no thunk/query double-fetch of the *same* resource in live code (the Redux thunks own the detail page, manual fetches own the list) — the duplication is *within* the list page's own effects (U.4) and the formType refetch (U.5), plus dead-vs-live file duplication (U.1).

## Slice liveness

| Slice (`reducers/index.ts`) | Readers found |
|---|---|
| `analyzeSubmission` | LIVE — 12 `useSelector`s in `SubmissionListing.tsx:85–97`; `ManageFieldsSortModal.tsx:69` |
| `applications` | LIVE — `AnalyzeSubmissionView.tsx:67–72` (`applicationDetails`, loading); `roles` field itself is write-never/read-only-by-dead-file |
| `taskAppHistory` | LIVE — `AnalyzeSubmissionView.tsx:82–90` |
| `submission` (formio) | LIVE — `selectRoot("submission")` in `View.tsx:21`, `BundleSubmissionView.tsx:192` |
| `customSubmission` | LIVE — `View.tsx:39–41` |
| `form` (formio) | LIVE — `selectRoot("form")` `View.tsx:20`, `BundleSubmissionView.tsx:191`; `state?.form` error `BundleSubmissionView.tsx:47` |
| `process` | LIVE — `AnalyzeSubmissionView.tsx:77–79` |
| `submissionBundle` | LIVE — `BundleSubmissionView.tsx:43–46` (though `bundleLoading` is never truthy due to U.8) |
| `tenants` | LIVE — `SubmissionListing.tsx:89`, `AnalyzeSubmissionView.tsx:74` (note `state.tenants?.tenantId` at :74 is a dead path — reducer never sets `tenantId`, only `tenantData`) |

---

# §7 forms-flow-admin (A.*)

**Package summary.** forms-flow-admin (~3,900 LOC TS/TSX) is a small single-spa micro-frontend with a clean container/presenter split (`components/{roles,users,dashboard}/index.tsx` fetch, `roles.tsx`/`users.tsx`/`dashboard.tsx` render) over callback-style services in `src/services/` that all go through `RequestService` from `@formsflow/service`. Its main problems are: a triple-fetch of the user list on mount caused by child-effect prop-sync, error paths that leave spinners stuck forever, a latent runtime crash in AccessDenied, a whole unused `react-select` library bundled via a dead import, substantial dead code left over from a pre-`ReusableTable`/pre-header refactor (dead pagination widgets, dead `Head` container, dead count-plumbing), and two 600–800-line god components that rebuild table column definitions (with inline closures) on every render — including on every search-box keystroke.

## 1. Data fetching

**A.1 [DISCUSS] User list fetched 3× on Users tab mount — IMPACT: HIGH (2 immediate duplicate requests + 1 delayed, wasted backend load and UI flicker), CONFIDENCE: HIGH (code-path verified, not runtime-profiled)**
`components/users/users.tsx:68-71` — child `Users` runs on mount:
```js
React.useEffect(() => {
  props?.setFilter(selectedFilter);   // undefined -> null
  props?.setSearch(searchKey);        // undefined -> ""
}, [selectedFilter, searchKey]);
```
In the parent `components/users/index.tsx`, the guards are `if (filter === undefined) return;` (line 27) and `if (search === undefined) return;` (line 52) — `null` and `""` both pass. So on first mount: (1) the mount effect at `index.tsx:103-130` fetches, (2) `filter: undefined→null` triggers the effect at `index.tsx:26-49` and fetches again, (3) `search: undefined→""` triggers `index.tsx:51-77` and fetches a third time after the 1500 ms debounce. Fix shape: make child guards skip initial-null/empty sync (e.g. only call `setFilter`/`setSearch` when values are non-initial), or tighten parent guards to `filter == null` / falsy search.

**A.2 [DISCUSS] Error paths leave loading spinner stuck forever — IMPACT: HIGH (user-visible hang on any API failure), CONFIDENCE: HIGH**
- `components/roles/index.tsx:13-23`: invalidated refetch does `setLoading(true); fetchRoles(cb, setError)` — the error handler is bare `setError`; `setLoading(false)` is never called, so after a failed refetch (e.g. after deleting a role) the Roles tab shows `<Loading />` permanently.
- `components/dashboard/dashboard.tsx:70-94` (`removeDashboardAuth`) and `96-117` (`addDashboardAuth`): `setIsLoading(true)` then `updateAuthorization(dashboard, cb, setErr)` — on error only `setErr` runs; spinner never clears. Even the nested `fetchdashboards` error branch (`dashboard.tsx:87-90`, `110-113`) toasts but never calls `setIsLoading(false)`.
Fix shape: every error handler mirrors the success handler's loading reset.

**A.3 [DISCUSS] No unmount guards / AbortController on any list fetch — IMPACT: MED (setState-after-unmount on tab switches; out-of-order responses can clobber newer results, e.g. slow filter fetch overwriting a later search fetch), CONFIDENCE: HIGH for the pattern**
All fetches in `components/users/index.tsx:26-130`, `components/roles/index.tsx:13-36`, `components/dashboard/index.tsx:21-46` and `roles.tsx:324-344` call `setState` in callbacks with no cancellation. Contrast: `components/organization/index.tsx:184-227` (`cancelled` flag) and `components/plans/index.tsx:22-81` (`isMounted`) do it right. Fix shape: copy the `cancelled`-flag pattern into the four fetch effects (no behavior change on the happy path).

**A.4 [DISCUSS] Full-list refetch after every mutation — IMPACT: MED (report only, per constraints), CONFIDENCE: HIGH**
- Roles: create/update/delete all call `props.setInvalidated(true)` → full `fetchRoles` (`roles.tsx:198,277,312` → `roles/index.tsx:13-23`).
- Users: add/remove role and invite → `setInvalidated(true)` → full `fetchUsers` (`users.tsx:123,319,421` → `users/index.tsx:79-101`).
- Dashboard: each chip add/remove does `updateAuthorization` then a full `fetchdashboards` (`dashboard.tsx:79-93,102-116`) even though the updated row is already known locally.

**A.5 [DISCUSS] Duplicate filter triggers in Roles (effect + handler) — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`roles.tsx:185-191` (`handlFilter` calls `setSearch` **and** `setRoles(filterList(...))`) while the effect at `roles.tsx:146-161` already re-derives `roles` from `[props.roles, search, ...]`. The handler's `setRoles` result is immediately recomputed by the effect (and the handler's version skips the `candidateGroupFull` mapping — transient inconsistent rows). Fix shape: handler only sets `search`; the effect is the single source of derivation.

**A.6 [DISCUSS] Roles "Users" popover fetches on every open with no cache and shared state — IMPACT: LOW, CONFIDENCE: HIGH**
`roles.tsx:324-344` — every click on "View" refetches the member list; results go into component-level `users`/`loading` state (`roles.tsx:50,56`) shared by **all** row popovers (see A.11).

## 2. Re-renders

**A.7 [DISCUSS] Search state held at page level — whole table re-renders per keystroke — IMPACT: HIGH on large role/user lists, CONFIDENCE: HIGH**
- `roles.tsx:732-740`: `CustomSearch` gets `setSearch` directly, so each keystroke updates `search` in the 815-line `Roles` component → the effect at `roles.tsx:146-161` re-runs `filterList` + `removingTenantId` + per-role `resolveFullCandidateGroup` (a `.find` over `props.roles` per role = O(n²), `roles.tsx:114-125,155-158`), and the whole component (columns, both modals) re-renders per keystroke.
- Same shape in `users.tsx:464-473` (`setSearch={setSearchKey}` → child effect `users.tsx:68-71` fires per keystroke; the parent debounce at `users/index.tsx:53-76` saves the network, not the renders).
- Modal typing has the same problem: `payload`/`editCandidate` live in `Roles` (`roles.tsx:57,73`), so typing a role name re-renders the table + column array underneath the modal.
Fix shape: move search input state (and the create/edit form state) into small child components; pass debounced/committed values up.

**A.8 [DISCUSS] Table `columns` + inline object/function props rebuilt every render in all three tables — IMPACT: MED (defeats memoization inside `ReusableTable`/DataGrid; every parent state change reprocesses columns), CONFIDENCE: HIGH**
`roles.tsx:597-726`, `users.tsx:183-377`, `dashboard.tsx:124-217` define `columns` (with per-row closures) inline; plus unstable per-render props: `paginationModel` object + `onPaginationModelChange` arrow + `getRowId` arrow + `dataGridProps={{ getRowHeight: () => "auto" }}` at `roles.tsx:758-776`, `users.tsx:595-613`, `dashboard.tsx:231-249`. Notably `DEFAULT_SORT_MODEL` **was** hoisted (`roles.tsx:38`, `users.tsx:25`, `dashboard.tsx:18`), so the identity concern is half-applied. Fix shape: `useMemo` columns (deps: `t`, handlers), `useCallback` the pagination handler, hoist `getRowHeight`.

**A.9 [DISCUSS] `Admin` root: `JSON.parse` per render + effect with unstable dep runs every render — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/index.tsx:32-34` parses `USER_ROLE` from storage on every render; that fresh array is a dep of the effect at `index.tsx:109-117`, so the effect body runs after **every** render (it's idempotent, so no loop, but it's per-render work). Same per-render `JSON.parse` in `components/manage/index.tsx:30-32`, and per-render `StorageService.get` reads in `users.tsx:41-44` / `dashboard.tsx:29-32`. Fix shape: `useMemo` the parse once (storage doesn't change without a remount).

**A.10 [DISCUSS] Dead count/tab plumbing forces root re-renders — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`src/index.tsx:27-30` — `page`, `dashboardCount`, `roleCount`, `userCount` are stored but **never read anywhere** (the `Head` header that displayed them is dead, see A.20). Every fetch success calls `setCount(...)` (`roles/index.tsx:18,30`; `users/index.tsx:114`; `dashboard.tsx:53,84,107`), re-rendering `Admin` → `Manage` → active tab for nothing. Fix shape: delete the `setTab`/`setCount` plumbing (touches index.tsx, manage, all three tab containers — hence DISCUSS).

## 3. List rendering

**A.11 [DISCUSS] Popover content state shared across all rows — IMPACT: MED (correctness smell: every row's popover renders the same data; stale content when opening a second row), CONFIDENCE: HIGH**
- `roles.tsx:663-681`: each row's Users popover renders the single component-level `users`/`loading` state — all popovers show whichever role was clicked last.
- `dashboard.tsx:33,58-66,184-199`: `remainingGroups` computed on click into shared state; every row's popover maps over it.
Fix shape: per-row popover component owning its own fetch/derived state.

**A.12 [SAFE] Missing `key` on Roles popover user list — IMPACT: LOW (React warning, wasted reconciliation), CONFIDENCE: HIGH**
`roles.tsx:669-671`: `users?.map((item, key) => (<div className="role-user">{item.username}</div>))` — the map index is named `key` but never passed as a prop. Fix: `key={item.id ?? item.username}`.

**A.13 [DISCUSS] `disableVirtualization` + `getRowHeight: "auto"` with page sizes up to 100 — IMPACT: LOW-MED (100 auto-height rows with per-row OverlayTrigger/Popover trees fully materialized), CONFIDENCE: MED (may be a deliberate workaround for auto-height)**
`roles.tsx:773-776`, `users.tsx:610-613`, `dashboard.tsx:246-249`. Index keys on chip sub-lists (`users.tsx:225`, `dashboard.tsx:145`, `users.tsx:493`) are display-only/stable-order — acceptable, noted for completeness. Pagination is DataGrid-model based (no react-js-pagination); Roles/Dashboard paginate client-side, Users server-side.

## 4. Effects & timers

**A.14 [DISCUSS] Pubsub subscriptions never unsubscribed — IMPACT: MED under single-spa remounts (duplicate `ES_CHANGE_LANGUAGE`/`ES_TENANT` handlers accumulate across mount cycles), CONFIDENCE: MED (subscribe API comes from the shell; token semantics not visible here)**
`src/index.tsx:43-58`: `subscribe("ES_CHANGE_LANGUAGE", ...)` and `subscribe("ES_TENANT", ...)` in a mount effect with no cleanup return.

**A.15 [DISCUSS] Stripe script injected without cleanup; silent failure after retry — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`components/plans/index.tsx:45-50` appends `pricing-table.js` to `document.body`, never removed (acceptable for a singleton script, but it leaks across the SPA). Worse: on fetch failure the code retries once (`plans/index.tsx:65-72`) and on the second failure only clears `loading` — `setError` is never called, so the user sees a blank page with a Back button (silent failure).

**A.16 [checked-clean-adjacent] Debounce race window — IMPACT: LOW, CONFIDENCE: HIGH**
The 1500 ms search debounce at `users/index.tsx:53-76` has correct `clearTimeout` cleanup; combined with A.3 (no abort) a slow earlier request can still land after a newer one.

## 5. Expensive computations

**A.17 [DISCUSS] O(n²) role-list derivation per keystroke — IMPACT: LOW-MED (only matters with many roles), CONFIDENCE: HIGH**
Covered in A.7: `roles.tsx:155-158` maps every role through `resolveFullCandidateGroup` which does `props.roles.find(...)` per role (`roles.tsx:114-125`), re-run on every `search` change. Fix shape: build an id→raw map once per `props.roles` change with `useMemo`.

**A.18 [SAFE] Debug `console.log` in production paths — IMPACT: LOW, CONFIDENCE: HIGH**
`roles.tsx:177` (`console.log("filteredData", filteredData)` on every permissions fetch) and `users.tsx:324` (raw error object). Fix: delete.

## 6. Bundle & dead code

**A.19 [SAFE] Dead `react-select` import bundles the entire library — IMPACT: HIGH for bundle size (react-select + emotion deps are real dependencies, not webpack externals — only `@formsflow/*`/react/single-spa are externalized by the single-spa default config), CONFIDENCE: HIGH**
`users.tsx:16`: `import Select from "react-select";` — `<Select` is never rendered (the only `.Select` usages are react-bootstrap's `Form.Select` at `users.tsx:478-500`). Companion dead state: `selectedRolesModal`/`handleRoleSelectChange` (`users.tsx:45,99-101`) are set but never rendered. Fix: remove import + dead state.

**A.20 [SAFE] Dead files, exports, and imports (grep-verified: zero references) — IMPACT: MED (bundle + noise), CONFIDENCE: HIGH**
- `src/containers/head.tsx` — entire `Head` component has no importer anywhere in src.
- `src/components/footer/` — `Footer` is imported at `src/index.tsx:11` but never rendered; `footer.tsx:3` imports the whole `package.json` (embeds dep lists into the bundle if ever used).
- `roles.tsx:558-565` `customTotal` and `571-590` `customDropUp` — unreferenced leftovers from the pre-ReusableTable pagination; their removal also frees the `DropdownButton`/`Dropdown` imports (`roles.tsx:14-15`).
- Unused imports: `Form` (`roles.tsx:5`), `navigateToAdminRoles` (`roles.tsx:36`), `baseUrl` (`roles.tsx:44`); `Button`, `DropdownButton`, `Dropdown` (`users.tsx:2,9-10`), `navigateToAdminUsers` (`users.tsx:23`); `BASE_ROUTE`, `Footer` (`src/index.tsx:11-12`).
- Dead functions/exports: `getpageList` (`users.tsx:165-173`), `CreateUser` (`services/users/index.ts:116-132`), `fetchAuthorizations` (`services/dashboard/index.ts:56-72`), `INVITE_USER_ROUTE_KEY` (`services/checklist/index.ts:7`), `ADD_USER` endpoint (`endpoints/index.ts:10`).
- Dead state: `authorizations`/`setAuthorizations` and `authReceived`/`setAuthReceived` (`dashboard/index.tsx:14,19` — never populated/changed), `setInstance` (`src/index.tsx:25` — never called), `show`/`id` in `dashboard.tsx:36,68` (`id` computed, never used), `show` in `roles.tsx:52` (toggled at line 325, never read for rendering — each popover open forces a pointless full re-render).

**A.21 [DISCUSS] Unused runtime dependencies — IMPACT: report only (dep changes out of scope), CONFIDENCE: HIGH**
`@aot-technologies/formio-react` and `@aot-technologies/formiojs` are in `package.json` dependencies but `grep formio` finds zero imports in src. `single-spa` in dependencies is also only implied via tooling.

## 7. Maintainability

**A.22 [DISCUSS] Latent runtime crash: `kcServiceInstance` is undefined — IMPACT: HIGH when triggered (ReferenceError; the "Return to login" button for a zero-role user throws instead of logging out), CONFIDENCE: HIGH**
`components/AccessDenied/index.js:14-17`:
```js
const handleLogout = () => {
  const kcInstance = kcServiceInstance();
  kcInstance.userLogout();
};
```
`kcServiceInstance` is neither imported nor defined anywhere in the package (only `navigateToBaseUrl` is imported from `@formsflow/service`). Every click on that button throws. Fix shape: import the correct factory (e.g. `KeycloakService.getInstance(...)` as used in `src/index.tsx:84-89`) — flagged DISCUSS only because the fix changes (restores) behavior.

**A.23 [DISCUSS] God components with create/edit clone logic — IMPACT: MED-HIGH for maintainability, CONFIDENCE: HIGH**
`roles.tsx` (815 lines) maintains two parallel state machines: `payload` vs `editCandidate` with duplicated handlers — `handlePermissionCheck` (`roles.tsx:216-236`) and `handleEditPermissionCheck` (`roles.tsx:353-373`) are line-for-line identical except for target state; ditto name/description handlers (210-215 vs 346-351), the disable effects (91-98 vs 100-107), and the two near-identical modals (469-509 vs 510-556). `users.tsx` is 640 lines with modal + table + popover logic inline. Fix shape: one `roleDraft` state + `mode` flag; extract modal into its own component.

**A.24 [DISCUSS] Ten near-identical callback-style service wrappers — IMPACT: MED, CONFIDENCE: HIGH**
Every function in `services/roles/index.ts`, `services/users/index.ts`, `services/dashboard/index.ts` repeats the same `.then(res => res.data ? callback : errorHandler).catch(...)` block (including the copy-pasted typo "Faied to post data!" at `services/users/index.ts:129`, `services/roles/index.ts:36,55,73`). Fix shape: one `request(promise, cb, errCb, fallbackMsg)` helper. All calls correctly use `RequestService` (no direct axios) — that part is clean.

**A.25 [DISCUSS] Misc correctness/maintainability smells — IMPACT: LOW-MED each, CONFIDENCE: HIGH**
- `permissionTree.tsx:149-161`: **every child permission checkbox has `disabled`** (line 160) — individual permissions cannot be toggled, only whole categories via the parent checkbox; `handlePermissionCheck` (passed from roles.tsx) is unreachable. If intentional (v8 scope-cut like the filtered permissions at `roles.tsx:166-175`), it deserves a comment; if not, it's a bug.
- `users/index.tsx:132-143`: `removeTenantIdFromUserRoles` mutates fetched objects in place (`user.role = ...`).
- `users.tsx:484-488`: `selected={!props.filter}` attribute on `<option>` — React ignores/warns; should be a controlled `value` on `Form.Select`.
- `props: any` on nearly every component (23 `any` hits across src); tab containers receive `{...props}` spread plus specific props (`manage/index.tsx:153-182`), making data flow untraceable.
- Toast/error inconsistency: some errors toast (`roles.tsx:205,284`), some only `setError` into state that's never rendered (`roles.tsx:48,180-181`; `error` in `users.tsx:32` only surfaces via `emptyStateMessage`).

## 8. i18n

**A.26 [SAFE] Hardcoded strings bypassing `t()` (sample-verified pattern) — IMPACT: LOW-MED (broken localization on visible UI), CONFIDENCE: HIGH**
- `roles.tsx:737-738` `placeholder="Search by role name"`, `title="Search"`; `roles.tsx:745` `label="New Role"`; `roles.tsx:764` `emptyStateMessage={props.error || "No data Found"}` (same at `users.tsx:601`, `dashboard.tsx:237`).
- `users.tsx:576` `loadingText="Inviting"`.
- `organization/index.tsx:139` `description: "You are currently using a free version of formsflow."` — its sibling branch at line 132 uses `t()`.
- `billing-manage/index.tsx:16,78-82` and `billing-return/index.tsx:5,12,27-30` — all status messages are raw English.
resourceBundles itself is minimal and healthy: a single `i18n.js` delegating to the shared `i18nService` from `@formsflow/service` — no duplicated translation payloads in this package.

## Checked & clean (verified negatives)

- **No direct axios** — every network call goes through `RequestService` from `@formsflow/service` (services + organization/plans/billing inline calls).
- **No lodash / moment / whole-package barrel imports**; react-bootstrap is imported per-component in roles.tsx (named-entry imports in users.tsx/manage are tree-shakeable).
- **No `setInterval` / `addEventListener` anywhere in src**; the only `setTimeout` (search debounce, `users/index.tsx:53-76`) has correct `clearTimeout` cleanup.
- **Mount fetches are parallel where they can be** — users+roles (`users/index.tsx:103-130`), dashboards+groups (`dashboard/index.tsx:21-46`); no sequential-that-could-parallelize chains found.
- **Unmount guards exist** in `organization/index.tsx` (`cancelled` flag) and `plans/index.tsx` (`isMounted`).
- **No `key={index}` on reorderable/sortable rows** — all three tables use `getRowId` with stable server ids; index keys appear only on inline chip/option sub-lists.
- **`DEFAULT_SORT_MODEL` hoisted to module scope** in all three table components (someone already started stabilizing identities).
- **No empty catch blocks** except the deliberately commented one at `billing-manage/index.tsx:40-42`.
- **Regex safety**: `utils.js` escapes user/tenant input before building RegExps (`utils.js:6,13`); `users.tsx:397-401` guards email regex against ReDoS.
- **Contracts intact**: `formsflow-admin.tsx` exports `bootstrap/mount/unmount` unchanged; route paths in `root.component.tsx`/`index.tsx` are simple and consistent.
- **No JSON.parse inside row render cells**; per-render parses exist only at page roots (flagged in A.9).

## API inventory

| Function | File | Endpoint | Verb | Callers | Result stored where |
|---|---|---|---|---|---|
| `fetchUsers` | services/users/index.ts:7 | `WEB_BASE_URL/user?role&count[&memberOfGroup&pageNo&limit&search]` | GET | users/index.tsx (4 effects: mount/limit, filter, search-debounced, invalidated); roles.tsx:327 (popover) | `users`,`total` state in users/index; shared `users` state in roles.tsx |
| `AddUserRole` | services/users/index.ts:52 | `WEB_BASE_URL/user/<user_id>/permission/groups/<group_id>` | PUT | users.tsx:314 (`Promise.all` per selected role) | none (triggers `setInvalidated`) |
| `RemoveUserRole` | services/users/index.ts:63 | same as above | DELETE | users.tsx:118 | none (triggers `setInvalidated`) |
| `InviteUser` | services/users/index.ts:87 | `MT_ADMIN_BASE_URL/v1/tenants/<tenant_key>/invite-user?uri=` | POST | users.tsx:413 | `inviteSuccessEmail` state |
| `CreateUser` | services/users/index.ts:116 | `WEB_BASE_URL/user/add-user` | POST | **none — dead** | — |
| `fetchRoles` | services/roles/index.ts:6 | `WEB_BASE_URL/roles` | GET | roles/index.tsx:16,28; users/index.tsx:124 | `roles` state (both containers) |
| `CreateRole` | services/roles/index.ts:23 | `WEB_BASE_URL/roles` | POST | roles.tsx:274 | none (invalidate → refetch) |
| `UpdateRole` | services/roles/index.ts:60 | `WEB_BASE_URL/roles/<roleId>` | PUT | roles.tsx:308 | none (invalidate → refetch) |
| `DeleteRole` | services/roles/index.ts:40 | `WEB_BASE_URL/roles/<payload.id>` | DELETE | roles.tsx:195 | none (invalidate → refetch) |
| `fetchPermissions` | services/roles/index.ts:78 | `WEB_BASE_URL/roles/permissions` | GET | roles.tsx:163-183 (mount) | `permissionData` state |
| `fetchdashboards` | services/dashboard/index.ts:6 | `WEB_BASE_URL/dashboards` | GET | dashboard/index.tsx:25; dashboard.tsx:82,105 (post-mutation refetch) | `dashboards` / `dashboardList` state |
| `fetchGroups` | services/dashboard/index.ts:24 | `WEB_BASE_URL/groups` | GET | dashboard/index.tsx:36 | `groups` state |
| `updateAuthorization` | services/dashboard/index.ts:42 | `WEB_BASE_URL/authorizations/dashboard` | POST | dashboard.tsx:79,102 | none (full refetch after) |
| `fetchAuthorizations` | services/dashboard/index.ts:56 | `WEB_BASE_URL/authorizations/dashboard` | GET | **none — dead** | — |
| `completeChecklistItem` (via `completeChecklistByRouteKey`) | services/checklist/index.ts:9 | `WEB_BASE_URL/user/checklist/<trackingId>` | PUT | users.tsx:422 (invite success) | none |
| inline tenant refresh | organization/index.tsx:210-222 | `MT_ADMIN_BASE_URL/v1/tenant?_t=<now>` | GET | Organization mount / route change | StorageService `tenantData`,`tenantKey` + derived state |
| inline tenant fetch | billing-manage/index.tsx:35 | `MT_ADMIN_BASE_URL/v1/tenant` | GET | BillingManage mount | local var + StorageService |
| inline resolve customer | billing-manage/index.tsx:55 | `MT_ADMIN_BASE_URL/v1/tenants/billing/resolve-customer?customer…` | GET | BillingManage (fallback) | local var |
| inline portal session | billing-manage/index.tsx:65 | `MT_ADMIN_BASE_URL/v1/tenants/<tenant_key>/billing/portal-session` | POST | BillingManage | redirect only |
| inline pricing session | plans/index.tsx:35 | `MT_ADMIN_BASE_URL/v1/tenants/<tenant_key>/billing/pricing-session` | POST | Plans mount | injected into DOM ref |
| browser redirect | billing-return/index.tsx:19-24 | `MT_ADMIN_BASE_URL/v1/tenants/billing/return?session_id=` | (nav) | BillingReturn mount | — |

Highest-priority items: **A.1** (triple fetch), **A.22** (AccessDenied crash), **A.2** (stuck spinners), **A.19** (dead react-select import in the bundle), then the A.20 dead-code sweep and the A.7/A.8 re-render stabilization.

---

# §8 forms-flow-integration (I.*)

## Package summary

`@formsflow/integration` (v8.3.0-alpha, dev port 3009) is the smallest UI package: a single-spa React MFE that gates on Keycloak auth + a `manage_integrations` role + a backend "integration enabled" check, then renders one of three tabs (Recipes / Connected Apps / Library), each of which fetches a signed Workato embed URL and renders it in a plain `<iframe>`. There is no Redux, no react-query, no timers, and no `window.addEventListener` anywhere. The code is a trimmed clone of `forms-flow-admin`'s skeleton — four files are byte-identical to admin's. The two headline problems are (a) a real rendering bug that silently discards all fetch errors in all three tab components (missing `return` before `<Alert/>`), and (b) dead weight: two formio packages in `dependencies` that nothing imports, a 42 KB base64-PNG-inside-SVG that ships in the main bundle for a premium upsell screen most users never see, and a mounted `ToastContainer` + full react-toastify CSS with zero `toast()` calls in the package. **Note: this package is NOT in the root `start-mfes.sh` launcher list** (`start-mfes.sh` `MFES=` array lists admin/components/nav/review/service/submissions/theme only), so it never starts in the standard local dev workflow.

## Findings

### Correctness / error handling

**I.1 [DISCUSS] Fetch errors are computed but never rendered (missing `return`) in all three embed components — IMPACT: HIGH (user sees "No urls found" instead of the real error; error state is dead code), CONFIDENCE: HIGH**
- `src/components/Recipes/index.tsx:30-32`, `src/components/ConnectedApps/index.tsx:28-30`, `src/components/Library/index.tsx:29-31`
- All three read: `if (error) { <Alert variant="danger" message={error} /> }` — the JSX is an expression statement, not returned, so when the POST fails the component falls through to the `recipesUrl ? <iframe/> : <Alert message="No urls found"/>` branch and shows the wrong message. Fix shape: `if (error) { return <Alert .../> }`. Behavior-changing (bug fix), hence DISCUSS.

**I.2 [DISCUSS] `ES_CHANGE_LANGUAGE` subscribed twice, re-subscribed on every auth transition, never unsubscribed — IMPACT: MED (duplicate handlers accumulate on the root-config event bus, which outlives this MFE across single-spa mount/unmount cycles), CONFIDENCE: HIGH for the duplication, MED for leak severity (bus impl lives in the out-of-repo root-config)**
- `src/index.tsx:38-43` (mount effect: `publish("ES_ROUTE", …)` + `subscribe("ES_CHANGE_LANGUAGE", …)`) and `src/index.tsx:74-77` (the `[isAuth]` effect repeats both calls verbatim). Neither effect returns a cleanup. Each auth flip adds another handler; each remount of the MFE adds two more. Fix shape: subscribe once in the mount effect only, and unsubscribe in an effect cleanup if the bus exposes it. (Cleanup addition is behavior-affecting on a cross-repo contract → DISCUSS.)

**I.3 [DISCUSS] Integration-enabled check failure is silently conflated with "Unauthorized" — IMPACT: MED (network/500 error → `console.error` only, then the user is told "Unauthorized Access – You don't have the permission…"), CONFIDENCE: HIGH**
- `src/index.tsx:80-86` (`fetchIntegrationEnableDetails().then(…).catch(err => console.error(err)).then(() => setIntegrationCheckLoading(false))`) leaves `integrationEnabled === false` on error, and `src/index.tsx:112-118` renders the unauthorized Alert for that state. Fix shape: separate error state with a distinct message/retry.

**I.4 [DISCUSS] single-spa `errorBoundary` renders `null` — silent white area on any render crash — IMPACT: LOW-MED, CONFIDENCE: HIGH**
- `src/formsflow-integration.tsx:10-13`: `errorBoundary(err, info, props) { return null; }` with the scaffold comment still in place. Any uncaught render error blanks the region with no message. Fix shape: render a minimal `<Alert>`; the exported `bootstrap/mount/unmount` names (line 17) are the contract and stay untouched.

### Bundle & dead code

**I.5 [DISCUSS] `@aot-technologies/formiojs` + `@aot-technologies/formio-react` are dead dependencies — IMPACT: MED (install/audit weight), CONFIDENCE: HIGH**
- `package.json:56-57`. Verified precisely: `grep -ri formio src/` returns zero hits, and `webpack.config.js` (read in full) adds no entry, alias, or plugin that could pull them in — webpack only bundles imported modules, so **they do not enter the webpack bundle at all**; the cost is node_modules size, install time, and CVE surface only. Fix is a dep removal → prohibited under current constraints ("no dep changes"), flagged for a dedicated deps PR.

**I.6 [DISCUSS] 41.8 KB decorative image ships in the main bundle for a screen most users never see — IMPACT: MED (fixed bundle tax; base64 gzips poorly), CONFIDENCE: HIGH**
- `src/components/PremiumSubscription/integrationImage.tsx` is 41,780 bytes (verified `wc -c`), dominated by a base64 3840×2160 PNG (`integrationImage.tsx:12`) used only to fill a 60×34 `<rect id="Workday-Emblem">` (near end of file) inside a decorative SVG. `PremiumSubscription` is statically imported by `src/index.tsx:16` and rendered only when `ENABLE_INTEGRATION_PREMIUM && isDesigner && !integrationEnabled` (`src/index.tsx:113-114`). Fix shape: `React.lazy(() => import("./components/PremiumSubscription"))` behind that branch, and/or replace the 4K PNG with a correctly sized asset (would shrink it ~40x). Lazy-loading is behavior-neutral but changes chunking → DISCUSS.

**I.7 [DISCUSS] `ToastContainer` + full react-toastify CSS imported, but no `toast()` is ever fired in this package — IMPACT: LOW-MED (dead CSS/JS in bundle, dead DOM node), CONFIDENCE: HIGH for this package (grep: only `src/index.tsx:3-4` reference toastify); each MFE bundles its own react-toastify instance, so toasts fired by other MFEs cannot land in this container**
- `src/index.tsx:3-4,127`. Fix shape: drop the import/container, or keep if toasts are planned → team call.

**I.8 [SAFE] Dead code cluster — IMPACT: LOW, CONFIDENCE: HIGH**
- `src/index.tsx:13` — `MULTITENANCY_ENABLED` imported from `@formsflow/service` and never used (exactly 1 occurrence in the file, verified by grep).
- `src/index.tsx:29` — `setInstance` never called; `instance` state used only to seed `isAuth`, and the keycloak effect at `src/index.tsx:52` shadows it with a local `let instance`.
- `src/constants/index.ts:3-4,14-18` (`KEYCLOAK_ENABLE_CLIENT_AUTH`) and `:22-24` (`ADMIN_ROLE`, `DESIGNER_ROLE`, `REVIEWER_ROLE`) — exported, imported nowhere in the package (grep verified).
- `src/root.component.test.tsx:6-7` — stale single-spa scaffold: expects text "Testapp is mounted!" which no component renders; worse, `render(<Root name="Testapp" />)` makes `Integration` call `props.getKcInstance()` (`src/index.tsx:29`) on an object without that function → the test throws. The only test in the package cannot pass.
- Fix shape: delete unused import/exports, fix or remove the test. No runtime behavior change.

### Re-renders

**I.9 [SAFE] `headerList()` builds a fresh array + three fresh closures every render, defeating `Head`'s `React.memo` — IMPACT: LOW (Integration re-renders are infrequent: page/tenant/auth/loading state changes), CONFIDENCE: HIGH**
- `src/index.tsx:91-106` (builder), `src/index.tsx:126` (`<Head items={headerList()} …/>`); `src/containers/head.tsx:4` is memoized but receives a new `items` identity each time. Fix shape: `useMemo(() => [...], [navigate, tenantId])`. Note: no `useMemo`/`useCallback` exists anywhere in the package (grep verified).

**I.10 [DISCUSS] `page` tab state is set by each child in an effect instead of derived from the route — IMPACT: LOW (one extra parent re-render per tab navigation; parent/child coupling via `setTab`), CONFIDENCE: HIGH**
- `src/index.tsx:32,134,144,154` (state + `setTab={setPage}` on every route) and `src/components/Recipes/index.tsx:15`, `ConnectedApps/index.tsx:15`, `Library/index.tsx:15` (`setTab("…")` on mount). Fix shape: derive `page` from `useLocation().pathname` in `Integration` and delete the prop — removes the state, the effects, and the `{...props}` spread need. Route paths (`integration/recipes` etc., `src/index.tsx:130,140,150`) are contracts and stay unchanged.

### Data fetching

**I.11 [DISCUSS] No unmount guard on any of the four fetches — IMPACT: LOW (setState after unmount when switching tabs before a response; React 18 no longer warns, but state updates on dead components are wasted work), CONFIDENCE: HIGH**
- `src/index.tsx:80-86`, `src/components/Recipes/index.tsx:14-24`, `ConnectedApps/index.tsx:14-23`, `Library/index.tsx:14-23` — all `.then(setState)` with `[]` deps and no cancelled flag/AbortController. Fix shape: `let active = true; … return () => { active = false; }`. (Effect-cleanup additions in a package without eslint-plugin-react-hooks → DISCUSS per constraints.)
- Related [DISCUSS]: the `[isAuth]` effect (`src/index.tsx:66-88`) uses `baseUrl`/`tenantId`/`publish`/`subscribe` but lists only `[isAuth]`; the mount effect (`:38-43`) uses `baseUrl` with `[]`. Trimmed arrays may be intentional — do not "fix" blindly.

**I.12 [SAFE-report] Iframe embed pattern itself is sound — noted for completeness — IMPACT: n/a, CONFIDENCE: HIGH**
- The iframe `src` lives in state and the component only remounts on tab navigation, so the iframe is **not** recreated per render; each tab visit re-POSTs for a fresh signed URL (likely intentional for expiring Workato embed links). Minor hardening/consistency notes: hardcoded `height="700"` in all three (`Recipes/index.tsx:37`, `ConnectedApps/index.tsx:35`, `Library/index.tsx:35`), no `sandbox`/`allow` attributes on third-party embeds, and `setError('')` reset exists only in Recipes (`Recipes/index.tsx:16`), not the other two.

### Maintainability / copy-paste

**I.13 [SAFE] Recipes / ConnectedApps / Library are triplicates of one 44-line component — IMPACT: MED (3 files differ only in service fn, tab name, and iframe title; bug I.1 was faithfully copied into all three), CONFIDENCE: HIGH**
- `src/components/Recipes/index.tsx`, `src/components/ConnectedApps/index.tsx`, `src/components/Library/index.tsx`. Fix shape: one `EmbedTab({ fetchUrl, tabName, title })` component + three 3-line wrappers (or config-driven routes). Pure refactor, no behavior change.

**I.14 [DISCUSS] Package is a partial clone of forms-flow-admin; four files byte-identical, two drifted — IMPACT: MED (fixes must be applied N times; drift already visible), CONFIDENCE: HIGH (diff-verified)**
- Byte-identical to admin: `src/components/Loading/Loading.tsx`, `src/components/Loading/SpinnerSVG.js`, `src/components/Footer/footer.tsx`, `src/resourceBundles/i18n.js` (vs `forms-flow-admin/src/components/loading/*`, `components/footer/footer.tsx`, `resourceBundles/i18n.js`).
- Near-clones with drift: `src/containers/head.tsx` (admin has an `sr-only` `<h1>` + `<h2>` for a11y; integration uses a bare clickable `<h3>` — `head.tsx:17`); `src/endpoints/config.ts` (admin types `_env_` as `Record<string, string|undefined>`, integration regressed to `any` — `config.ts:3`); `src/index.tsx` mirrors `forms-flow-admin/src/index.tsx:20-58` (same keycloak-init/publish/subscribe/StorageService skeleton).
- Fix shape: promote Loading/Spinner/Footer/Head/Alert to `@formsflow/components` (already an external) — cross-package change → DISCUSS.

**I.15 [SAFE] Hardcoded, untranslated user-facing strings — IMPACT: LOW, CONFIDENCE: HIGH**
- `src/index.tsx:117` ("Unauthorized Access - You don't have the permission…"), `Recipes/index.tsx:40` / `ConnectedApps/index.tsx:38` / `Library/index.tsx:38` ("No urls found" — also grammatically off: "URLs"), and `src/containers/Alert.tsx:7` renders `message` raw with no `Translation` wrapper, unlike every other component in the package. Also hardcoded role string `'manage_integrations'` at `src/index.tsx:69` belongs in `constants/`. Fix shape: wrap via i18n, hoist strings to constants (keys unchanged → no visible behavior change for `en`).

**I.16 [DISCUSS] `any`-typed throughout a TypeScript package — IMPACT: LOW-MED (TS provides near-zero safety here), CONFIDENCE: HIGH**
- `src/index.tsx:25` (`({ props }: any)`), `Recipes/ConnectedApps/Library/head.tsx/Alert.tsx` all `(props: any)`; every `.then((res: any))`/`.catch((err: any))`; `src/declarations.d.ts:41-61` declares the entire `@formsflow/service` surface as one destructured `: any`. Fix shape: a small `MfeProps` interface (publish/subscribe/getKcInstance) + response types; the `declarations.d.ts` fix ideally comes from `@formsflow/service` shipping real types (cross-package → DISCUSS).

**I.17 [SAFE] Misc small items — IMPACT: LOW, CONFIDENCE: HIGH**
- `src/components/Footer/footer.tsx:3` imports the whole `../../../package.json` into the bundle for one version string (dep lists included; identical in admin).
- `package.json:58-61`: `@types/react`, `@types/react-dom`, `@types/systemjs`, `@types/webpack-env` sit in `dependencies` instead of `devDependencies` (dep change → defer with I.5).
- `src/containers/head.tsx:9-11` uses array-index keys (`key={key}`) — harmless here (static 3-item list) but a copy-paste hazard.

## Checked & clean (verified negatives)

- **No listener/timer leaks beyond I.2**: `grep -rn "addEventListener|setTimeout|setInterval|postMessage" src/` → zero hits. In particular, there is **no** `window.addEventListener("message")` for the Workato iframes — the classic embed-listener leak does not exist here; the iframes are display-only.
- **Iframes are not recreated per render** — `src` held in state, recreated only on tab remount (see I.12).
- **Externals intact**: `webpack.config.js` only adds devServer headers, output filename, and a sass rule on top of `webpack-config-single-spa-react-ts` defaults (which externalize `react`, `react-dom`, `single-spa`, and `@formsflow/*` by orgName). No externals overridden, no formio references.
- **Services layer is consistent**: all four service files are 6-line one-liners using `RequestService` from `@formsflow/service` — no duplicated axios/fetch helpers, no auth-token handling copy-pasted locally.
- **List rendering**: the only list is Head's static 3-item map; no recipe data lists are rendered client-side (Workato renders inside the iframe), so keys/per-row-handler concerns don't apply beyond I.17.
- **No redundant fetch loops**: every fetch runs exactly once per mount (`[]` / `[isAuth]` deps); no fetch-in-render, no polling.
- **Lifecycle contract**: `src/formsflow-integration.tsx:17` exports `bootstrap/mount/unmount` exactly per the cross-repo contract; route paths under `integration/*` untouched by any proposed fix.
- **formio does not enter the bundle** (I.5 — confirmed absence of imports and of any webpack mechanism that could include it).
- **Launcher gap confirmed**: `start-mfes.sh` `MFES` array (repo root) does not include `forms-flow-integration`; devs must `npm start` it manually on port 3009.

## API inventory

| Function | File (src/) | Endpoint | Verb | Callers | Stored where |
|---|---|---|---|---|---|
| `fetchIntegrationEnableDetails` | `services/integration/index.ts:6` | `{WEB_BASE_URL}/integrations/embed/display` | GET | `index.tsx:80` | `integrationEnabled` state (`res.data?.enabled`) |
| `fetchRecipesUrls` | `services/recipes/index.ts:6` | `{WEB_BASE_URL}/integrations/embed/recipes/url` | POST (no body) | `components/Recipes/index.tsx:18` | `recipesUrl` state (`res.data?.url`) → iframe src |
| `fetchConnectedApps` | `services/connectedApps/index.ts:6` | `{WEB_BASE_URL}/integrations/embed/connected-apps/url` | POST (no body) | `components/ConnectedApps/index.tsx:17` | `connectedApps` state (`res.data?.url`) → iframe src |
| `fetchLibrary` | `services/library/index.ts:6` | `{WEB_BASE_URL}/integrations/embed/library/url` | POST (no body) | `components/Library/index.tsx:17` | `libraryUrl` state (`res.data?.url`) → iframe src |

All endpoints defined in `src/endpoints/index.ts:3-8` from `WEB_BASE_URL` (`src/endpoints/config.ts:6`, no fallback if `window._env_` is absent — URLs become `undefined/...`). All four are auth-bearing via the shared `RequestService`; errors are swallowed at every call site (I.1, I.3).

---

# §9 forms-flow-theme (T.*)

**Package summary.** 66 SCSS files, **17,108 lines** across three coexisting generations: legacy root partials (`_button`, `_modal`, `_table`, `_forms`…), a "MAX" design-system layer (`_mixins.scss`, parts of `_theme.scss`/`_variables.scss`), and a `v8-scss/` redesign (27 files, ~6,300 lines). Entry `scss/index.scss` imports **all of Bootstrap 5.3** (line 42) sandwiched *between* legacy partials and v8 partials. Roughly **3,560 lines (~21%) are dead weight** (two huge partials commented out of the build, one never-imported partial, one fully-commented-out file, one empty file). The `--ff-*` theming contract is generated implicitly by Bootstrap's `_root.scss` via `$prefix: "ff-"` + a merged `$theme-colors` map — grep-invisible and undocumented in-tree. 1,049 `!important` (~687 in live files) betray a specificity war caused by import order. Health: functional but layered like sediment; two token systems silently conflict.

| file | lines | | file | lines |
|---|---|---|---|---|
| `_button.scss` | 1,799 **(DEAD — not imported)** | | `v8-scss/_bundle.scss` | 350 |
| `_modal.scss` | 1,705 **(DEAD — not imported)** | | `_variables.scss` | 331 |
| `_table.scss` | 1,050 | | `v8-scss/_formbuilder.scss` | 325 |
| `v8-scss/_modal.scss` | 825 | | `v8-scss/_button.scss` | 302 |
| `_forms.scss` | 771 | | `_theme.scss` | 237 |
| `v8-scss/_theme.scss` | 739 | | `fileUpload.scss` | 245 |
| `_card.scss` | 513 | | `_mixins.scss` | 358 |
| `v8-scss/_aiFormBuilder.scss` | 477 | | `v8-scss/_mixins.scss` | 392 |
| `v8-scss/_selectDropdown.scss` | 463 | | `_aiAssistant.scss` | 203 |
| `v8-scss/_table.scss` | 427 | | 46 more files | ≤ 300 ea. |

## Findings (impact-sorted)

**T.1 [DISCUSS] Full Bootstrap imported for every page — IMPACT: VERY HIGH (single biggest payload lever), CONFIDENCE: HIGH on facts, report-level on external usage**
`index.scss:42` — `@import "bootstrap/scss/bootstrap";` (the comment at `index.scss:39` says "rest of bootstrap" but it is the *entire* framework; `bootstrap/dist/css/bootstrap.css` is 281 KB raw / 232 KB min as a size reference, and this build is *larger* because `_theme.scss:28-55` merges 12 colors into `$theme-colors`, multiplying every color-looped component/utility: `.btn-gray-medium-dark`, `.alert-primary-light`, `.text-bg-green`, per-color `-text-emphasis`/`-bg-subtle`/`-border-subtle` root vars, etc.). Grep of the 7 sibling MFE `src/` trees found **zero** usage of: carousel, spinner-grow, toast (react-toastify is used instead — `.Toastify` in 5 files), list-group, placeholders, figures, blockquote, form-floating, input-group, btn-group, navbar-toggler (1), accordion (1), offcanvas (1). Heavy users: pagination (15 files), tooltip (8), btn/modal/dropdown (16). formio.js markup does need badge/breadcrumb (`external/formio.scss:14-40` styles them). **Fix shape:** switch to Bootstrap's documented selective imports (functions→variables→maps→mixins→utilities→used modules→utilities API) in `index.scss` — build-behavior change, needs a rendered-CSS diff and confirmation against forms-flow-web (other repo) before dropping any module. No dependency change needed.

**T.2 [SAFE] ~3,560 dead lines: two flagship partials are not even compiled — IMPACT: HIGH (maintainer time, false mental model), CONFIDENCE: verified**
- `index.scss:18` `// @import "./button";` and `index.scss:23` `// @import "./modal";` — so `_button.scss` (1,799 lines, the biggest file, 247 `!important`) and `_modal.scss` (1,705 lines) **contribute nothing to the compiled CSS**. Their replacements are `v8-scss/_button.scss` and `v8-scss/_modal.scss`.
- `_global.scss` (16 lines) is imported by nothing (verified against every `@import`/`@use` in the tree); it near-duplicates live `.svgIcon-*` classes in `_layout.scss:49-98` (only `.svgIcon-success`, `_global.scss:11`, has no live twin).
- `customTextArea.scss` — **all 38 lines are commented out** yet it is still imported at `index.scss:28` (emits zero CSS).
- `utils/_overflow.scss` is a **0-byte file** imported at `utils/_index.scss:2`.
Deleting these files + the two comment lines + the two no-op imports provably produces byte-identical compiled CSS. If `_button`/`_modal` are being kept "for reference", git history already does that.

**T.3 [DISCUSS] Import order forces the 1,049-strong `!important` war — IMPACT: HIGH (root cause of most specificity debt), CONFIDENCE: HIGH**
`index.scss:11-41` compile ~20 legacy partials that override Bootstrap components (`.form-control` at `_forms.scss:267`, `.container` at `_variables.scss:193`, `.card` at `_card.scss:12`…) **before** Bootstrap itself lands at `index.scss:42`. At equal specificity, later source wins, so every legacy override of a Bootstrap selector needs `!important` to survive. The v8 partials (`index.scss:44-76`, after Bootstrap) demonstrate the fix works — yet legacy habits persist. `!important` per live file: `_forms.scss` 119, `v8-scss/_table.scss` 108, `v8-scss/_formbuilder.scss` 81, `_table.scss` 39, `_variables.scss` 28, `_mixins.scss` 28 (baked into every `paddingLvl*` include), `_card.scss` 26, `external/formio.scss` 25. **Fix shape:** move the legacy component-override imports below line 42 and strip now-redundant `!important`s — cascade-affecting, must be done selector-by-selector with a compiled-CSS diff.

**T.4 [DISCUSS] Two `:root` token systems silently fight; v8 wins — IMPACT: HIGH (live values differ from what the code says), CONFIDENCE: HIGH**
Both `_theme.scss:115-213` and `v8-scss/_theme.scss:95-231` emit `:root` blocks; v8 is imported later (`index.scss:13` vs `:12`), so for same-named variables the v8 declaration wins:
- `--font-size-xs`: `0.875rem` (`_theme.scss:158`) is overridden to **`10px`** (`v8-scss/_theme.scss:87` via the `$font-tokens` loop at `:181`). 12 files still consume `var(--font-size-xs)` (`_card`, `_forms`, `_table`, `formHistoryModal`, `external/formio`…) presumably expecting 14px.
- `--font-size-xl`: `2rem` (`_theme.scss:162`) → **`20px`** (`v8-scss/_theme.scss:83`); consumed by `_card.scss` and by sibling MFEs (`forms-flow-admin/src/components/organization/organization.scss`, `.../users/users.scss`).
- `--navbar-width`: `10rem` (`_theme.scss:146`) → **`3rem`** (`v8-scss/_theme.scss:226`).
- `--spacer-025…-300` are defined **twice with identical values** (`_theme.scss:178-189`, `v8-scss/_theme.scss:212-223`) — harmless today, a trap the day one side is edited.
CSS-variable names are cross-repo contract — do not rename; but the shadowed old declarations are dead weight and actively misleading. Fix shape: delete the losing duplicates *only after* confirming winners are intended (visual no-op by definition of the cascade, but confirm no consumer reads the sheet order-sensitively).

**T.5 [DISCUSS] Variables consumed but defined nowhere (silent fallback bugs) — IMPACT: MED-HIGH (declarations silently invalid), CONFIDENCE: HIGH for this repo; forms-flow-web could define them at runtime**
Verified zero definitions anywhere in this repo (theme + all 7 MFE src trees), and not Bootstrap-generated (not in the `$theme-colors`/`$custom-colors` maps, `_theme.scss:28-55`):
- `--font-size-15`, `--font-size-12` — consumed at `fileUpload.scss:19-20` (feeding `mixins.font-style` at `:82,89,161`), `v8-scss/_textInput.scss:9`, `v8-scss/_dropdownMultiselect.scss`. v8 tokens define `--font-size-m: 15px`/`--font-size-s: 12px` instead (`v8-scss/_theme.scss:85-86`) — looks like a naming drift.
- `--ff-gray-x-light` (`_card.scss:512`) — only `--gray-x-light` exists (`v8-scss/_theme.scss:36`).
- `--ff-font-weight-xs` (`_table.scss:670`), `--ff-badge-font-md` (`_forms.scss:379`).
An unset `var()` without fallback makes the whole declaration invalid-at-computed-value (font-size/weight fall back to inherited). Fixing changes visuals → DISCUSS, but these are latent bugs, not style.

**T.6 [DISCUSS] SCSS variable inside a custom property is emitted literally — IMPACT: MED (broken declaration shipped), CONFIDENCE: HIGH**
`_skeletonLoader.scss:13` — `--highlight-color: $gray-medium-dark;`. Dart Sass does not resolve SCSS variables in custom-property values without interpolation, so the compiled CSS literally contains `--highlight-color: $gray-medium-dark`, which react-loading-skeleton's `var(--highlight-color)` can never resolve. Fix is `#{$gray-medium-dark}` — one character class of fix, but it *changes* rendered skeleton highlight → DISCUSS.

**T.7 [DISCUSS] Two different "danger" reds — IMPACT: MED, CONFIDENCE: HIGH**
`_theme.scss:51` puts `"danger": $danger` into `$custom-colors` while `$danger` still holds Bootstrap's default `#dc3545` (Bootstrap variables load at `index.scss:7`; the theme's own `$danger: var(--default-danger-color)` is only assigned *later* at `_theme.scss:215`). Result: `--ff-danger`, `.text-danger`, `.btn-danger` = `#dc3545`, while components using `$danger`/`--default-danger-color` get `#FF4242` (`_theme.scss:212`). `.is-invalid { background-color: $danger-color }` (`_variables.scss:35-37`) rides the `#dc3545` branch. Consolidating requires choosing a red → visual change → DISCUSS.

**T.8 [DISCUSS] Global SCSS-variable churn: `$primary` has 4 meanings across 17 redefinitions — IMPACT: MED-HIGH (fragile import-order semantics), CONFIDENCE: HIGH**
`$primary` is redefined at file top in 17 partials: `#253DF4` (`_theme.scss:8`), `var(--ff-primary)` (13 files, e.g. `_forms.scss:3`, `external/formio.scss:2`), `var(--primary-btn-bg-color)` (`_button.scss:3`, dead), `var(--primary-dark)` (`v8-scss/_modal.scss:5`). `$gray-darkest` similarly 18× with 3 meanings (`#303436`, `var(--ff-gray-darkest)`, `var(--gray-darkest)`). Because old-style `@import` shares one global scope, the value of `$primary` at any point depends on which file happened to load last — e.g. `external/toastify.scss:2` (`background: $primary`) inherits whatever `formio.scss` set one line earlier, and mixin defaults like `svgIcon($color: $primary)` (`_mixins.scss:325`) resolve per-include-site. Related hidden coupling: `historyModal.scss:8` uses `paddingLvl2`/`$base`/`$fontSmallest` that are only in scope because `_card.scss:1` imported `_mixins.scss` earlier in the compilation — remove the `_card` import and `historyModal` breaks. Fix shape: single canonical alias partial imported once from `index.scss`; delete per-file alias headers (compiled output identical if values match — verify each).

**T.9 [SAFE] `@keyframes mltShdSpin` + `@keyframes round` emitted twice — IMPACT: small payload, zero risk, CONFIDENCE: HIGH**
`_mixins.scss:1-48` contains two top-level `@keyframes`; the file is `@import`ed (textual include, no dedup) by both live files `_card.scss:1` and `_forms.scss:1` → both keyframes appear twice in compiled CSS (identical bodies; last wins → removing the duplicate is provably identical). Fix: move the keyframes out of `_mixins.scss` into a partial imported once (or import `_mixins` once from `index.scss` and drop the per-file imports).

**T.10 [SAFE] Provable no-op duplicates — IMPACT: small, CONFIDENCE: HIGH**
- `.w-15 { width: 15% !important; }` defined identically at `_layout.scss:44-46` **and** `_table.scss:682-684` — remove one.
- `utils/_cursor.scss` generates `.cursor-pointer`/`.cursor-default` *without* `!important`, but `_variables.scss:181-187` already defines both *with* `!important` in the same sheet — the util versions can never take effect (same selector, `!important` beats normal). Removing `utils/_cursor.scss` output (and then the whole `utils/` dir, per T.2's empty `_overflow`) is provably behavior-identical.
- `.active-tab-dropdown>#dashboard-dropdown` and `>#task-dropdown` (`_variables.scss:44-52`) have byte-identical bodies — mergeable into one selector list (compiled text changes, behavior provably identical).
- `.custom-tables-wrapper-application` split into two adjacent rules (`_table.scss:15-19` and `:24-26`) — merge.

**T.11 [DISCUSS] `.overflow-x-auto`/`.overflow-y-auto` defined three times with conflicting semantics — IMPACT: MED, CONFIDENCE: HIGH**
(1) `_variables.scss:277-293` `generate-overflow` mixin → `overflow-x: auto !important`; (2) `_layout.scss:19-27` → `overflow-x: auto; overflow-y: hidden;` (adds a cross-axis side effect!); (3) Bootstrap 5.3's own overflow-x/y utilities (`node_modules/bootstrap/scss/_utilities.scss:57`) land at `index.scss:42`. An element with `.overflow-x-auto` gets `overflow-x` from the `!important` rules plus a sneaky `overflow-y: hidden` from `_layout`. Consolidating to Bootstrap's utility alone changes the `overflow-y` side effect → DISCUSS.

**T.12 [DISCUSS] Global scrollbar suppression fought by 10 partials — IMPACT: MED (perf trivial, maintainability real), CONFIDENCE: HIGH**
`_layout.scss:8-12` — unscoped `::-webkit-scrollbar { display: none; }` hides every scrollbar in the app; then `inputBox.scss`, `_aiAssistant.scss`, `_table.scss`, `v8-scss/_theme.scss:632`, `v8-scss/_mixins.scss` (`custom-scroll`, the sanctioned mixin, used by 14 MFE files), `v8-scss/_selectDropdown.scss`, `v8-scss/_modal.scss`, `v8-scss/_aiFormBuilder.scss`, `v8-scss/_filterableDropdown.scss` each re-enable/restyle it. Also broad element selectors that fight Bootstrap: `hr` (`_variables.scss:189`), `a` (`_typography.scss:9`), the 11-selector cursor block (`_layout.scss:29-41`), `div[disabled]` (`_variables.scss:127`), `select option:hover` (`_forms.scss:23`).

**T.13 [DISCUSS] Deep nesting → long compiled descendant selectors — IMPACT: MED, CONFIDENCE: HIGH**
Worst, verified: `v8-scss/_modal.scss:104-109` — `.prompt-modal .modal-sm.info-modal .modal-content .modal-footer .buttons-row .custom-button--primary` (6 levels, 28-space indentation at `:109`); the file has 227 lines at ≥3 nesting levels. Also `v8-scss/_theme.scss:238-346` (`.base-container .page-container .page-layout .body-section.formedit-layout.variables-tab` — layout skeleton nested 5 deep with `!important` max-heights at `:327-341`), `_aiAssistant.scss:63-140` (`.ai-modal … .loading-dots` ~6 levels, with `@keyframes loading` *defined inside the nesting* at `:140` — emitted globally under a collision-prone generic name), `_table.scss` (65 deep lines), `v8-scss/_checklist.scss` (41). Flattening changes specificity → per-block work.

**T.14 [DISCUSS] Dead-weight candidates (unused in all 7 sibling MFEs — may still be used by forms-flow-web in the other repo; report-only, never delete-safe)**
Verified zero hits in `forms-flow-{admin,components,integration,nav,review,service,submissions}/src`:
- **`_aiAssistant.scss` (203 lines)** — `ai-modal`, `ai-chat`, `welcome-container`: no consumers here; `v8-scss/_aiFormBuilder.scss` (477 lines) is the current AI UI.
- `_variables.scss` legacy nav/task styles: `.taskDropdown` (`:54-76`), `.active-tab-dropdown` (`:44-52`), `.task-container` (`:10`), `.admin-container` (`:169`), `div.upload` (`:143-167`), `.MuiTab-wrapper` (`:135`).
- `_icon.scss:2` `.icon-wp-forms`; `collapsibleSidebar.scss` (`collapsible-toggle`, 234 lines); `inputBox.scss` `.input-error`/`.validation-astrisk`; `_card.scss:11` `.wraper` (sic) / `.flow-edit` / `.form-edit`; `v8-scss/_theme.scss:472-739` `.ff-home-*` home-page suite (~270 lines); `.base-container` grid skeleton (likely web-repo-only).
- Four near-duplicate rotation keyframes: `rotating` (`_layout.scss:67`, 5-prefix), `round` (`_mixins.scss:40`), `button-spin` (`v8-scss/_button.scss:298`), plus `mltShdSpin` — consolidation candidate once consumers are mapped.

**T.15 [DISCUSS] Hardcoded colors bypassing the package's own tokens — IMPACT: MED (breaks advertised theming), CONFIDENCE: HIGH**
Counts of hex literals outside token definitions: `v8-scss/_aiFormBuilder.scss` 22, `v8-scss/_dateRangePicker.scss` 15, `v8-scss/_checkbox.scss` 8, `v8-scss/_filterableDropdown.scss` 5. Egregious cases where the hex *equals an existing token*: `v8-scss/_theme.scss:713-715` — `#0087D9`/`#00C49A`/`#E57373` are exactly `--blue-100`/`--green-100`/`--red-100` (`:22,20,25`); `:594,640` `#E5E5E5` = `--gray-x-light`; `v8-scss/_mixins.scss:61,72` defaults `#E5E5E5`/`#EDEDED`/`#FCFCFC`/`#B8ABFF` = `gray-x-light`/`secondary`/`white-200`/`primary-dark` tokens; brand-new `v8-scss/_bundleStepper.scss:11-16` hardcodes `#5467fc`, `#8d9afd`, `#636365` (no matching tokens — new colors smuggled in). Swapping hex→`var()` is theming-behavior change (vars can be overridden at runtime) → DISCUSS each.

**T.16 [SAFE] Zero-use mixins and orphaned duplicate variable blocks — IMPACT: small-MED, CONFIDENCE: HIGH**
- Never `@include`d anywhere: `dividerDarker` (`_mixins.scss:84`), `paddingLvl2-outter` (`:156`), `paddingLvl2-buttons` (`:174`). Used **only by dead files** (`_button`/`_modal`): `text-modal-content` (`:59`), `clickableFeedback3` (`:306`), `textModalHighlight` (`:348`); `buttonBase` and `modalBodyContent` are defined *inside* the dead files themselves (`_button.scss:631`, `_modal.scss:15`). Mixins emit nothing unless included — removal is compiled-CSS-identical.
- `_variables.scss:298-332` ("VARIABLES ADDED BY MAX") duplicates the same-named block in `_theme.scss:65-102` with **conflicting values** (`$base: 1rem` vs `0.5rem`, so `$fontSmallest`, `$modalWidthSmall/Large` all differ); since `_theme` loads after `_variables` and no consumer runs in between (`index.scss:5→12`, only `_typography` between, which uses none of them), the `_variables` copy is fully shadowed except `$modalWidthMedium: 50vw` (`:325`) — which is *also* re-declared identically at `v8-scss/_modal.scss:20`. The `_variables` block is removable with identical output (verify `$modalWidthMedium` chain first).
- `_theme.scss:204-208` re-declares `$borderRadiusHeight*` *inside* the `:root{}` block — locally-scoped, unused, emits nothing.

**T.17 [DISCUSS] Structure & organization — IMPACT: MED (long-term velocity), CONFIDENCE: HIGH**
- `_variables.scss` is mislabeled: 8 lines of variables, then ~290 lines of live component CSS (`.loader`, `.main-container`, `.navbar-*`, media queries). Anything importing "variables" for values drags rules with it.
- `_typography.scss` is likewise mostly app-specific classes (`.application-head`, `.task-head` — still used by 2 MFE files each), not typography.
- Naming: root mixes `_partial.scss` and bare `fileUpload.scss` conventions; `v8-scss/` has no `_index.scss` (33 hand-listed imports at `index.scss:44-76`); `index.scss:39` comment is wrong (see T.1).
- Mixed `@use`/`@import` for the *same* file: `v8-scss/_mixins.scss` is `@use`d by 21 files and `@import`ed by 8 (e.g. `v8-scss/_table.scss:4`, `v8-scss/_modal.scss:3`) — currently harmless (no top-level CSS in it, verified) but one added keyframe there would duplicate 8×. Also `sass ^1.58` + `@import` everywhere: Dart Sass has deprecated `@import` (removal announced) — migration debt, no dep change proposed.
- `v8-scss/_theme.scss:598` styles a generated Emotion hash `.css-15lx25q-MuiDataGrid-footerContainer` — breaks on any MUI version bump; use the stable `.MuiDataGrid-footerContainer` class instead (visual-equivalence check required).
- Fully-commented blocks worth purging: `_forms.scss` (57 comment lines incl. dead rule blocks at `:50-52`, `:269-274`, `:339`), `_table.scss` (43), `formHistoryModal.scss:27-53` (27-line dead `::before/::after` block), `v8-scss/_theme.scss:122-206` (~75 lines of token documentation comments — fine to keep, but they inflate the file).

## Checked & clean (verified negatives)

- **Compiled-artifact contract intact**: `webpack.config.js` emits `forms-flow-theme.min.css` (prod) from `scss/index.scss` via MiniCssExtract; config is minimal and sane; no filename drift.
- **`--ff-*` contract is real, not missing**: `$prefix: "ff-"` (`_variables.scss:1`) + merged `$theme-colors` (`_theme.scss:28-55`) make Bootstrap's `_root.scss` generate `--ff-primary`, `--ff-white`, `--ff-gray-*`, `--ff-danger`, `--ff-body-bg`, etc. All consumed `--ff-*` names resolve except the three flagged in T.5. No CSS variable renames proposed anywhere.
- **Bootstrap is imported exactly once** (`index.scss:42`); the earlier `functions`/`variables`/`mixins` imports (`:2,7,8`) are re-run inside it but emit no CSS (`!default` guards) — no duplicate Bootstrap output.
- **`v8-scss/_mixins.scss` emits zero top-level CSS** (no selectors/keyframes outside `@mixin`), so its dual `@use`/`@import` currently causes no duplication; all 14 of its mixins have ≥1 use (incl. `reusable-standard-modal-popover` at `v8-scss/_modal.scss:453`, hidden from naive grep by the `mixins.` namespace).
- **No `@keyframes` name collisions** across the 10 definitions (all unique names); only near-duplicate *content* (T.14).
- **No runtime `@import url(...)`** anywhere — no network waterfall from the compiled sheet; fonts referenced only via `--font-family-base` token (Figtree), loaded by consumers.
- **`--spacer-*` duplication is value-identical** in both `:root` blocks — no live conflict today (flagged as a trap in T.4, but currently harmless).
- **`external/toastify.scss` and `external/formio.scss` are live and consumed** (`.Toastify` in 5 MFE files; formio builder classes used by the form-edit flows); `custom-scroll` mixin is genuinely reused (14 MFE files) — the mixin system works where adopted.
- **Legacy classes verified live (NOT dead weight)**: `.application-head`, `.task-head`, `.head-rule`, `.footer-text`, `.loader-container` (9 files), `.scrollable-overview` (review MFE), `.main-header` (3 MFEs), `.medium-search-container`, `.svgIcon-primary`/`-dark` (live via `_layout.scss`, not the dead `_global.scss`), `.ff-stepper`, `.bundle-stepper`, `.table-skeleton`, `.file-upload`, `.assign-user`, `.history-modal-body`, `.form-history-modal-body`, `.date-range-picker-container`, `.form-input`.
- **`historyModal.scss` vs `formHistoryModal.scss`**: same domain, but not copy-paste duplicates (container-query timeline vs grid layout) — no consolidation finding.
- **No universal `*` selectors in hot paths**: the only `> *` usages are inside scoped `paddingLvl*` mixins and modal bodies, not at document level.

---

# §10 Cross-package duplication & reusability (X.*)

**Summary.** Verified cross-package duplication totals roughly **1,400–1,800 lines** (excluding domain-diverged fork code): ~800 lines byte-identical (Loading/Spinner kit ×4, AccessDenied ×2, footer ×2, i18n shim ×5, tenant actions/reducers ×2, babel/jest configs ×5/×3), ~450 lines near-identical (checklist wrappers ×3, store setup, webpack configs ×8, declarations.d.ts ×4, shared formio-token fetchers), and several hundred lines of similar-pattern reimplementation of things `@formsflow/service` already exports (`MULTITENANCY_ENABLED` derived independently in 6 files, env-config extraction in 6 files, tenant-key strip/add helpers in 4 variants, `replaceUrl` defined 4 times). The three biggest wins: **(1)** an "MFE skeleton kit" — Loading/Spinner, AccessDenied, footer, breadcrumb head, checklist wrapper — moved additively into `@formsflow/components`/`@formsflow/service` (~450 lines deleted across 4 packages); **(2)** deleting the 6 local env-constant derivations in favor of the `MULTITENANCY_ENABLED`/constants service already exports (kills real semantic drift, e.g. hardcoded `/auth` keycloak path in 3 packages vs configurable in admin); **(3)** hoisting webpack/babel/jest boilerplate to root shared config next to the existing `webpack.formio.js` (admin/integration have already drifted from the review/submissions style).

## X.1 review vs submissions fork debt

Totals: review src = 9,949 lines, submissions src = 4,611 lines. Shared-skeleton overlap is real but smaller than the folder symmetry suggests — the domain layers (actions/reducers/endpoints) have **diverged**, the infrastructure layer has **not**.

**X.1.1 [SAFE] Byte-identical skeleton files — IMPACT: MED, CONFIDENCE: HIGH (cmp-verified)**
- `forms-flow-review/src/actions/tenantActions.ts` = `forms-flow-submissions/src/actions/tenantActions.ts` — IDENTICAL (8 lines)
- `forms-flow-review/src/reducers/tenantReducer.ts` = `forms-flow-submissions/src/reducers/tenantReducer.ts` — IDENTICAL (20 lines; both write `tenantData` to localStorage inside the reducer)
- `forms-flow-review/src/hooks.ts` = `forms-flow-submissions/src/hooks.ts` — IDENTICAL (6 lines)
- `forms-flow-review/src/config/i18n.js` = `forms-flow-submissions/src/config/i18n.js` — IDENTICAL (12 lines, see X.3.1)
- `forms-flow-review/src/__tests__/Loading.test.tsx` = submissions counterpart — IDENTICAL (26 lines)
- Loading kit — see X.5.1.
Canonical home: tenant action/reducer pair could become a `@formsflow/service`-provided helper, but it's redux-coupled → keep as fork debt note; the Loading kit and i18n shim have clean homes (X.5.1, X.3.1).

**X.1.2 [SAFE] Near-identical store setup — IMPACT: LOW, CONFIDENCE: HIGH**
`forms-flow-review/src/services/StoreService.ts` vs `forms-flow-submissions/src/services/StoreServices.ts` — NEAR-IDENTICAL (30 lines; delta = one line, `||` vs `??` on `NODE_ENV`). A shared `configureStore(reducers)` would need redux in `@formsflow/service` deps → violates no-dep-change → leave, or [DISCUSS].

**X.1.3 [SAFE] Near-identical checklist wrappers ×3 packages — IMPACT: MED, CONFIDENCE: HIGH**
`forms-flow-review/src/services/checklistService.ts` vs `forms-flow-submissions/src/services/checklist/index.ts` vs `forms-flow-admin/src/services/checklist/index.ts` — NEAR-IDENTICAL (13 lines each; deltas = import path + one route-key constant). All three re-bind `completeChecklistByRouteKey` (already exported by service) to `httpPUTRequest(${API.CHECKLIST}/${id})`, and `CHECKLIST = ${WEB_BASE_URL}/user/checklist` is itself duplicated in 4 packages (see X.6.2). Proposed: additive export of a fully-bound `completeChecklistByRouteKey` from `@formsflow/service` (it already owns `RequestService`, `WEB_BASE_URL`, and the generic helper); consumer switch is in-repo. Two-deploy ordering applies (service first).

**X.1.4 [DISCUSS] Behavior drift inside a "duplicate": customSubmissionReducer — IMPACT: bug-risk, CONFIDENCE: HIGH**
`forms-flow-review/src/reducers/customSubmissionReducer.ts` vs submissions counterpart — NEAR-IDENTICAL except review does `cloneDeep(action.payload)` and submissions stores the payload by reference. This is drift in forked code, exactly the maintainability failure mode fork debt causes. Any consolidation must pick one semantic → [DISCUSS].

**X.1.5 [SAFE] Identical service functions duplicated across the fork — IMPACT: MED, CONFIDENCE: HIGH**
- `forms-flow-review/src/api/services/filterServices.ts:293-320` vs `forms-flow-submissions/src/api/queryServices/analyzeSubmissionServices.ts:155-180`: `fetchFormById`, `fetchBundleSubmissionData`, `getBundleCustomSubmissionData` — IDENTICAL bodies (~30 lines), including the formio-token header idiom `sessionStorage.getItem("formioToken") → {"x-jwt-token": …}` repeated 4 times across the two files.
- `forms-flow-review/src/api/services/bpmTaskServices.ts:132` vs `forms-flow-submissions/src/services/applicationServices.ts:51`: `getCustomSubmission` — NEAR-IDENTICAL (same thunk shape; submissions adds `?? {}` and a `done(null, …)` call).
Proposed: the pure request functions (not the dispatch wrappers) are additive candidates for `@formsflow/service` (it owns RequestService); at minimum the formio-token header builder should be one exported helper.

**X.1.6 [SAFE] Scaffolding cruft crossed the family line — IMPACT: LOW, CONFIDENCE: HIGH**
`forms-flow-submissions/src/endpoints/config.ts` is **BYTE-IDENTICAL** to `forms-flow-integration/src/endpoints/config.ts` (9 lines) — a second, dead-ish endpoints dir in submissions (its `index.ts` defines only `SAMPLE`, consumed by `services/ServiceManagement/index.ts` marked "this is sample code"). Deletable in-package; evidence of the copy-paste chain between families.

## X.2 admin vs integration skeleton

**X.2.1 [SAFE] Identical components (modulo dir-name case) — IMPACT: MED, CONFIDENCE: HIGH (md5-verified)**
- `forms-flow-admin/src/components/footer/{footer.tsx,index.ts}` = `forms-flow-integration/src/components/Footer/*` — IDENTICAL (26 lines)
- `loading/{Loading.tsx,SpinnerSVG.js,index.ts}` = integration's `Loading/*` — IDENTICAL (63 lines) — same md5 as review/submissions copies (see X.5.1)
- `resourceBundles/i18n.js` — IDENTICAL (12 lines); `root.component.test.tsx` — IDENTICAL (9 lines)

**X.2.2 [SAFE] Near-identical breadcrumb `head.tsx` — IMPACT: LOW-MED, CONFIDENCE: HIGH**
`forms-flow-admin/src/containers/head.tsx` (49) vs `forms-flow-integration/src/containers/head.tsx` (48) — NEAR-IDENTICAL; delta = `h1.sr-only`+`h2` vs `h3`, and integration's `hideLine` prop. Proposed: additive `PageHead` in `@formsflow/components` with `hideLine`/heading-level props; the h2-vs-h3 delta must be preserved per-consumer (no behavior change).

**X.2.3 [DISCUSS] Drifted twin `endpoints/config.ts` — IMPACT: bug-risk, CONFIDENCE: HIGH**
`forms-flow-admin/src/endpoints/config.ts` (18) vs `forms-flow-integration/src/endpoints/config.ts` (9) — SIMILAR-PATTERN with **semantic drift**: admin honors `REACT_APP_KEYCLOAK_URL_HTTP_RELATIVE_PATH` (default `/auth`); integration — and also `forms-flow-review/src/api/config.ts`, `forms-flow-submissions/src/api/config.ts`, `forms-flow-submissions/src/endpoints/config.ts` — hardcode `${KEYCLOAK_URL}/auth`. A keycloak deployment on a non-`/auth` path works only in admin. Canonical home: `@formsflow/service` constants (see X.6.1). [DISCUSS] because unifying changes effective behavior for the hardcoded copies.

**X.2.4** `index.tsx` (177 vs 170 lines, only 53 sorted-lines common) and `root.component.tsx` — SIMILAR-PATTERN only (shared Keycloak-bootstrap idiom, see X.4.4), domain content diverged. Not file-level duplicates.

## X.3 resourceBundles

**X.3.1 [DISCUSS] i18n init shim ×5 byte-identical copies (+2 variants) — IMPACT: MED, CONFIDENCE: HIGH (md5)**
One 12-line shim (`i18nService.use(LanguageDetector).use(initReactI18next).init({fallbackLng:'en'})`) is byte-identical in **five** places: `forms-flow-admin/src/resourceBundles/i18n.js`, `forms-flow-integration/src/resourceBundles/i18n.js`, `forms-flow-nav/src/resourceBundles/i18n.js`, `forms-flow-review/src/config/i18n.js`, `forms-flow-submissions/src/config/i18n.js`. review and submissions additionally each carry a NEAR-IDENTICAL second variant (`src/resourceBundles/i18n.js`, 14/13 lines, delta = export default line) that also builds `RESOURCE_BUNDLES_DATA` from `formioResourceBundle` — so those two packages init the shared i18n singleton **twice**. Every MFE re-runs `.init()` on the same `i18nService` singleton exported by service. Proposed canonical home: an exported `initI18n()` (or pre-initialized instance) in `@formsflow/service` — but the shim's `react-i18next`/`i18next-browser-languagedetector` imports would move a dep into service → [DISCUSS].
**Clean:** the actual translation catalogs (~10,300 lines, 7 languages) exist **only** in `forms-flow-service/src/resourceBundles/` — no package duplicates them. `forms-flow-components/src/resourceBundles/i18n.js` (75 lines) is a distinct Storybook-fallback variant, not a copy.

## X.4 helper/storage/request duplication vs @formsflow/service

Service export surface verified from `forms-flow-service/src/formsflow-services.ts`: `KeycloakService, StorageService, RequestService, i18nService, HelperServices, StyleServices, MULTITENANCY_ENABLED, getRedirectUrl, getOrigin, getFullUrl, getLinkTo, getRoute, MAIN_ROUTE`, ~80 `navigateTo*` helpers, checklist helpers, `formioResourceBundle`, `fetchAndStoreFormioRoles`.

**X.4.1 [DISCUSS] Tenant-key strip/add reimplemented in 4 variants — IMPACT: HIGH (drift), CONFIDENCE: HIGH**
Service canonical: `HelperServices.removeTenantKeyFromData` / `removeTenantFromRoles` (`forms-flow-service/src/helpers/helperServices.ts:64-125`). Local variants with *different semantics*:
- `forms-flow-nav/src/helper/helper.js:5-22` — `addTenankey`/`removeTenantKey` (split-on-`-`; `removeTenantKey` returns **false** on miss)
- `forms-flow-review/src/helper/helper.js:18-42` — `removeTenantKey(value, tenantkey, multitenancyEnabled)` + `addTenantPrefixIfNeeded` (regex; returns value on miss)
- `forms-flow-admin/src/utils/utils.js:39-49` — `removeTenantKey` (match-based, returns **false** on miss) + `removingTenantId`, `formatRoleDisplayName`
SIMILAR-PATTERN, not copies — which is worse: four behaviors for one concept. Consolidation to `HelperServices` requires reconciling miss-semantics → [DISCUSS].

**X.4.2 [SAFE] `replaceUrl` defined 4 times — IMPACT: LOW, CONFIDENCE: HIGH**
Identical 3-line body in `forms-flow-nav/src/helper/helper.js:1`, `forms-flow-review/src/helper/helper.js:45`, `forms-flow-submissions/src/helper/helper.ts:19`, `forms-flow-components/src/helper/helper.js:1`. Additive export from `@formsflow/service` (or components), consumer switch in-repo.

**X.4.3 [SAFE] Raw storage access bypassing StorageService — IMPACT: MED, CONFIDENCE: HIGH**
~35 direct `localStorage`/`sessionStorage` calls outside service (grep-verified), for keys StorageService already brokers: `tenantKey` (`forms-flow-review/src/components/TaskHistory.tsx:59`, `forms-flow-submissions/src/Routes/SubmissionListing.tsx:88,626`, `SubmissionListOld.tsx:87,445`, `View.tsx:58`, `AnalyzeSubmissionView.tsx:73`, `forms-flow-review/src/Routes/TaskDetails.tsx:68`), `tenantData` (`review/src/index.tsx:66`, `submissions/src/index.tsx:55`, both `tenantReducer.ts:10`, `review/src/services/SocketIOService.ts:17`), `UserDetails` (`review/src/actions/taskActions.ts:27`, `TasklistTable.tsx:127`, `TaskDetails.tsx:78`), `formioToken` (`review/src/api/services/filterServices.ts:294,308`, `submissions/src/api/queryServices/analyzeSubmissionServices.ts:162,171`, `submissions/src/services/applicationServices.ts:43` — this one reads **localStorage** while the others read **sessionStorage**: drift bug), `i18nextLng` ×6 files. Mixed storage backends for the same logical keys is a live inconsistency. Fix is in-package (use StorageService) → SAFE.

**X.4.4 [DISCUSS] Keycloak/pubsub bootstrap effect repeated in 4 MFEs — IMPACT: MED, CONFIDENCE: HIGH**
Same ~40-60-line idiom (`props.getKcInstance()` → `KeycloakService.getInstance(...).initKeycloak(cb)` → `publish("FF_AUTH")` → parse `USER_ROLE` → locale sync from `i18nextLng` → `publish("ES_ROUTE")` / `subscribe("ES_CHANGE_LANGUAGE")`) in `forms-flow-admin/src/index.tsx:25-105`, `forms-flow-integration/src/index.tsx:29-75`, `forms-flow-review/src/index.tsx:37-115`, `forms-flow-submissions/src/index.tsx:28-103`. SIMILAR-PATTERN (verified by grep of the six markers). A `useMfeBootstrap()` hook in service would need React as peer of service → [DISCUSS].

**X.4.5 [SAFE] Role/permission checks — role literals scattered — IMPACT: MED, CONFIDENCE: HIGH**
`forms-flow-review/src/helper/permissions.ts` (reads `StorageService USER_ROLE`) vs `forms-flow-submissions/src/constants/permissions.ts` (reads redux state) — SIMILAR-PATTERN `userRoles()` factory; 5 role literals shared. Plus inline `userRoles?.includes("...")` in `forms-flow-nav/src/Navbar.jsx:96-114,361`, `forms-flow-nav/src/sidenav/Sidebar.jsx:105-118`, `forms-flow-admin/src/index.tsx:34-40`, and `forms-flow-review/src/index.tsx:24-30` (`authorizedRoles` set). ~25 role-name strings have no single source of truth. Proposed: additive `ROLES`/`PERMISSIONS` const map export from `@formsflow/service`.

**X.4.6 Clean/near-clean:** No local axios-token wrappers exist — all 5 consumer packages use `RequestService` (only `forms-flow-review/src/api/services/bpmTaskServices.ts:38-41` imports axios, and only for `axios.all/spread` over RequestService promises). No local date-formatting reimplementations (moment usage outside service: none found; review/submissions correctly call `HelperServices.*` 12/13 times). Note admin/integration use `HelperServices` zero times — they simply have no date needs, not a shadow copy.

**X.4.7 [SAFE] `access.js` nav vs review — IMPACT: LOW, CONFIDENCE: HIGH**
`forms-flow-nav/src/helper/access.js` (79) vs `forms-flow-review/src/helper/access.js` (75) — NEAR-IDENTICAL (delta = one 4-line commented block). `setFormAndSubmissionAccess` formio-ACL builder duplicated. Candidate for `@formsflow/service` (formio-adjacent, no UI).

## X.5 UI duplication vs @formsflow/components

**X.5.1 [SAFE] Loading/Spinner kit ×4 — IMPACT: HIGH, CONFIDENCE: HIGH (md5-identical)**
`components/{loading|Loading}/{Loading.tsx (9), SpinnerSVG.js (51), index.ts (3)}` byte-identical in **admin, integration, review, submissions**. `@formsflow/components` exports `TableSkeletonLoader` but no plain spinner. Proposed: additive `<Loading/>`+`<SpinnerSVG/>` export in components; delete 4 copies (189 redundant lines). Two-deploy ordering (components first), consumer switch in-repo.

**X.5.2 [SAFE] AccessDenied ×2 — IMPACT: MED, CONFIDENCE: HIGH**
`forms-flow-admin/src/components/AccessDenied/{AccessDenied.js,accessDenied.scss}` vs `forms-flow-submissions/src/components/AccessDenied/*` — IDENTICAL ignoring whitespace (the .js pair differs **only** in CRLF vs LF; 46-line inline SVG illustration + 11-line scss). `index.js` differs slightly. Proposed home: components' `SvgImages` + a shared `AccessDenied` view. Also related: `forms-flow-submissions/src/components/NotFound.tsx` has no shared counterpart.

**X.5.3 [SAFE] Footer ×2 — IMPACT: LOW, CONFIDENCE: HIGH** — see X.2.1; candidate for components.

**X.5.4 Clean:** Tables/pagination/modals are *not* duplicated against the library — review's `TasklistTable.tsx` and submissions' `SubmissionListing.tsx` consume `@formsflow/components` (ReusableTable/TableFooter family); the only raw local `<table>` in any consumer package is `forms-flow-submissions/src/Routes/SubmissionListOld.tsx` (legacy screen). No local re-implementations of exported SvgIcons found (the only local SVGs are SpinnerSVG ×4, AccessDenied ×2, and integration's one-off `PremiumSubscription/integrationImage.tsx`).

## X.6 constants/endpoints duplication

**X.6.1 [SAFE] `MULTITENANCY_ENABLED` + env-config extraction ×6 — IMPACT: HIGH, CONFIDENCE: HIGH**
`@formsflow/service` already exports `MULTITENANCY_ENABLED` (and `WEB_BASE_URL`, `MT_ADMIN_BASE_URL(_VERSION)`, `DATE_FORMAT`, `TIME_FORMAT` internally in `forms-flow-service/src/constants/constants.ts`). Yet it is re-derived in: `forms-flow-admin/src/constants/index.ts:1-10`, `forms-flow-integration/src/constants/index.ts:1-2`, `forms-flow-nav/src/constants/constants.js:35`, `forms-flow-review/src/constants/index.ts:1-11`, `forms-flow-submissions/src/constants/index.ts:1-10` **and again** in `forms-flow-submissions/src/constants/constants.ts:4-5` (two derivations in one package). All six are semantically equivalent today (each ends in `==="true" || ===true`), so switching imports to `@formsflow/service` is behavior-preserving and in-repo → SAFE. Same for `BASE_ROUTE = MULTITENANCY_ENABLED ? "/tenant/:tenantId/" : "/"` (admin, integration via constants, submissions) and `KEYCLOAK_ENABLE_CLIENT_AUTH` (admin, review, submissions). The `WEB_BASE_URL`/`KEYCLOAK_*` window-env extraction exists in 6 files (`admin/endpoints/config.ts`, `integration/endpoints/config.ts`, `nav/endpoints/config.js`, `review/api/config.ts`, `submissions/api/config.ts`, `submissions/endpoints/config.ts`) — consolidating the keycloak ones hits the `/auth` drift → that part [DISCUSS] (X.2.3).

**X.6.2 [SAFE] Endpoint path constants — IMPACT: MED, CONFIDENCE: HIGH**
- `CHECKLIST: ${WEB_BASE_URL}/user/checklist` ×4: `forms-flow-admin/src/endpoints/index.ts:18`, `forms-flow-nav/src/endpoints/index.js:12`, `forms-flow-review/src/api/endpoints.ts:29`, `forms-flow-submissions/src/api/endpoints.ts:15`
- `GET_TENANT_DATA` ×3 + service (`forms-flow-service/src/apiManager/endPoints/index.ts` already defines it, un-exported); `FORMIO_ROLES` duplicated in `review/api/endpoints.ts` vs service.
- review↔submissions endpoints overlap: `FORM`, `FORM_PROCESSES`, `GET_FORM_BY_ID`, `CUSTOM_SUBMISSION`, `UPDATE_DEFAULT_FILTER`, `GET_APPLICATION_HISTORY_API`, `BUNDLE_EXECUTE_RULE`, `CHECKLIST` — verified in the endpoints.ts diff; the remainder has diverged (task-* vs submission-*).
Proposed: additively export a common `API` object from `@formsflow/service` `apiManager/endPoints`; packages keep domain-specific endpoints local.

**X.6.3 Pagination defaults:** no shared numeric-default constant duplication found worth citing (review's task payload defaults live in `constants/allTasksPayload.ts`, unique).

## X.7 webpack/babel/jest/tsconfig duplication

**X.7.1 [DISCUSS] babel.config.json ×5 byte-identical — CONFIDENCE: HIGH (md5)**
admin = components = integration = review = submissions (30 lines). nav differs only by dropping `@babel/preset-typescript`; service only by dropping preset-react; theme is env-preset-only. Hoistable to a root `babel.config.shared.json` (pattern already proven by root `webpack.formio.js`).

**X.7.2 [DISCUSS] jest.config.js in 3 identical clusters — CONFIDENCE: HIGH (md5)**
admin = integration = nav; review = submissions (these two add an explicit `configFile: require.resolve("./babel.config.json")` workaround with a 3-line comment — a fix the admin cluster never received: drift); service = theme (no `rootDir: "src"`, no single-spa parcel mapping, no jest-dom setup). One root factory would erase the drift.

**X.7.3 [DISCUSS] webpack.config.js ×8 near-identical with style drift — CONFIDENCE: HIGH**
review vs submissions: NEAR-IDENTICAL (delta = projectName/port/filename only). nav/components/review/submissions/service/theme consume root `webpack.formio.js` (`sassRule`, `getFormioAliases`, `getFormioPlugins`); **admin and integration do not** — they inline their own sass rule (`forms-flow-admin/webpack.config.js:24-35`) and skip formio aliases and the explicit `externals: ["@formsflow/*", "react", "react-dom"]` line the others carry. Admin/integration are NEAR-IDENTICAL to each other (delta = name/port/filename). This is exactly "drift in copy-pasted config": a shared `makeMfeWebpackConfig({projectName, port})` at root would reduce each file to ~6 lines.

**X.7.4 [DISCUSS] tsconfig + declarations.d.ts — CONFIDENCE: HIGH**
tsconfig: admin↔integration and review↔submissions differ only in the `files` entry; admin-family vs review-family drift = `lib`/`target: es5` and test-exclude glob. `declarations.d.ts` asset-module boilerplate: ~78 common lines across review/submissions (and similar blocks in admin/integration) — hoistable to one shared `.d.ts` via tsconfig `include`.

**X.7.5 Dependency drift (config-adjacent):** `react-i18next` is `^11.15.3` in nav vs `^12.1.4/^12.3.1` everywhere else (package.json grep) — same singleton i18n instance driven by two majors.

## Reusability map

| Proposed shared home | What consolidates | Packages affected | Risk |
|---|---|---|---|
| `@formsflow/components` (additive) | Loading + SpinnerSVG, AccessDenied (+SVG), Footer, PageHead breadcrumb | admin, integration, review, submissions | SAFE (deploy components first) |
| `@formsflow/service` (additive) | bound checklist helper; `replaceUrl`; formio-token header builder + `fetchFormById`/bundle fetchers; exported `API` common endpoints (`CHECKLIST`, `GET_TENANT_DATA`, `FORMIO_ROLES`, form/submission paths); `ROLES` literal map; `setFormAndSubmissionAccess` | admin, nav, review, submissions | SAFE |
| `@formsflow/service` (already exported — consumer switch only) | `MULTITENANCY_ENABLED`, `BASE_ROUTE`, `KEYCLOAK_ENABLE_CLIENT_AUTH`, `WEB_BASE_URL`/`MT_ADMIN_*`; StorageService instead of raw local/sessionStorage | all 5 consumers | SAFE |
| `@formsflow/service` [DISCUSS] | `initI18n()` shim (dep move), Keycloak bootstrap hook (React peer), tenant-key helpers (semantics reconcile), keycloak `/auth` path (behavior unify), `configureStore` (redux dep) | all | DISCUSS |
| Root shared config (beside `webpack.formio.js`) | webpack factory, babel.config, jest factory, tsconfig base, shared declarations.d.ts | all 8 | DISCUSS (build-system) |

## Checked & clean (diffed, NOT duplicates)

- `review/src/actions/actionConstants.ts` vs `submissions/src/actions/actionConstants.ts` — diverged domain constants (79 changed lines / 62+29); same filename only.
- `review/src/api/endpoints.ts` vs `submissions/src/api/endpoints.ts` — partial overlap (X.6.2) but majority diverged; not a file-level duplicate.
- `review/src/reducers/index.ts` vs submissions — different reducer sets.
- `nav/src/helper/user.js` vs `review/src/helper/user.js` — different content entirely.
- `nav/src/helper/helper.js` vs `review/src/helper/helper.js` — only `replaceUrl` + tenant-key *concept* shared; bodies differ.
- `nav/src/variables.scss` (53) vs `admin/src/variables.scss` (5) — different.
- `components/src/resourceBundles/i18n.js` — Storybook-fallback variant, not a copy of the 12-line shim.
- Translation catalogs — exist only in service; zero duplication.
- Date formatting — no local moment implementations outside `HelperServices`.
- Axios wrappers — none local; `RequestService` used everywhere (review's axios import is `axios.all` only).
- Tables/pagination/modals — consumer packages use `@formsflow/components`; only `SubmissionListOld.tsx` has a raw table.
- `admin/src/index.tsx` vs `integration/src/index.tsx` — shared bootstrap idiom (X.4.4) but only 53 common sorted lines; domain-diverged.
- `admin/src/utils/utils.js` `removingTenantId`/`formatRoleDisplayName` — admin-specific, no counterpart elsewhere.
- single-spa lifecycle files (`formsflow-*.tsx`) — near-identical but this is 17-line generator boilerplate; not worth consolidating.

---

# §11 Bucket index

**SAFE fixes** (implement via the matching PROMPT_B file; lint + format + tests green after each change):

- **S (service)** — S.9, S.11, S.12, S.19, S.26, S.27, S.28, S.29, S.37 (internal normalization only)
- **C (components)** — C.4, C.5, C.8, C.9, C.15, C.18, C.23, C.24, C.25, C.27
- **N (nav)** — N.1.1, N.1.2, N.1.3, N.3.2, N.3.3, N.4.4, N.6.1, N.6.3, N.6.4, N.7.1, N.7.2, N.7.3, N.8.1, N.8.2
- **R (review)** — R.4, R.12, R.21, R.23, R.24, R.25, R.27, R.30, R.31, R.32
- **U (submissions)** — U.1, U.2, U.9, U.10, U.12, U.13, U.14, U.15, U.17, U.18, U.19, U.21, U.22
- **A (admin)** — A.12, A.18, A.19, A.20, A.26
- **I (integration)** — I.8, I.9, I.13, I.15, I.17
- **T (theme)** — T.2, T.9, T.10, T.16 (bar: byte-identical compiled CSS, verified by build diff)
- **X (cross-package)** — X.1.1, X.1.2, X.1.3, X.1.5, X.1.6, X.2.1, X.2.2, X.4.2, X.4.3, X.4.5, X.4.7, X.5.1, X.5.2, X.5.3, X.6.1, X.6.2 — all via PROMPT_C's additive-first, two-deploy recipe

**NEEDS DISCUSSION** (risk / behavior decision / auth-critical / dep change / build change / cross-repo contract):

- **S** — S.1–S.8 (**auth-critical Keycloak lifecycle** — highest-value DISCUSS items in the repo), S.10 (AbortSignal on contract), S.13–S.18, S.20–S.25, S.30–S.36, S.38
- **C** — C.1/C.2 (lazy-load formio/bpmn in shared bundle — biggest components wins), C.3, C.6 (i18n re-init at module load), C.7, C.10–C.14, C.16, C.17, C.19–C.22, C.26, C.28–C.30
- **N** — N.3.1 (**setLoginUrl crash effect**), N.2.1 (pub/sub cleanup — unsubscribe API must be confirmed in root-config), N.1.4, N.1.5, N.3.4, N.4.1–N.4.3, N.5.1, N.6.2, N.7.4, N.7.5
- **R** — R.1–R.3 (**socket lifecycle — fix R.1 and R.3 together**), R.5–R.8, R.9 (selector churn; mechanical but dep-array-adjacent), R.10, R.11 (reducer writes wrong key), R.13–R.20, R.22, R.26, R.28, R.29
- **U** — U.3 (react-query stance: adopt properly or drop the provider), U.4 (mount fetch/POST chain), U.5–U.8, U.11, U.16, U.20
- **A** — A.1 (triple fetch), A.2 (stuck spinners), A.22 (**AccessDenied crash**), A.3–A.11, A.13–A.15, A.17, A.21, A.23–A.25
- **I** — I.1 (**missing `return` hides all fetch errors ×3**), I.2–I.7, I.10, I.11, I.14, I.16
- **T** — T.1 (selective Bootstrap), T.3 (import-order/!important war), T.4–T.8, T.11–T.15, T.17
- **X** — X.1.4 (cloneDeep drift), X.2.3 (keycloak `/auth` drift), X.3.1 (i18n shim dep move), X.4.1 (tenant-key semantics), X.4.4 (bootstrap hook), X.7.1–X.7.4 (root shared build config)

**Latent bugs surfaced by the audit** (all [DISCUSS] because fixing restores intended behavior — decide product stance first):
N.3.1 (nav crash) · A.22 (admin logout crash) · A.2 (stuck spinners) · I.1 (errors never rendered) · R.11 (reducer writes wrong key) · R.18/U.8 (action creators called without dispatch) · R.19 (`isConnected` never called) · R.3 (reconnect off) · S.1/S.2 (token refresh timing / double-init swallow) · S.25 (`process is not defined` crash path) · T.5 (CSS vars consumed but defined nowhere) · T.6 (SCSS var emitted literally) · U.7 (GraphQL string interpolation of user input) · X.4.3 (`formioToken` read from localStorage in one file, sessionStorage elsewhere)

---

# §12 Reusability map (proposed shared homes)

| Proposed shared home | What consolidates | Packages affected | Risk |
|---|---|---|---|
| `@formsflow/components` (additive exports) | `Loading` + `SpinnerSVG` (X.5.1), `AccessDenied` + its SVG (X.5.2), `Footer` (X.5.3), `PageHead` breadcrumb (X.2.2) | admin, integration, review, submissions | SAFE via PROMPT_C recipe (components deploys first) |
| `@formsflow/service` (additive exports) | bound `completeChecklistByRouteKey` (X.1.3); `replaceUrl` (X.4.2); formio-token header builder + shared `fetchFormById`/bundle fetchers (X.1.5); common `API` endpoint constants (X.6.2); `ROLES`/`PERMISSIONS` map (X.4.5); `setFormAndSubmissionAccess` (X.4.7) | admin, nav, review, submissions | SAFE via PROMPT_C recipe (service deploys first) |
| `@formsflow/service` (already exported — consumer switch only) | `MULTITENANCY_ENABLED` / `BASE_ROUTE` / `KEYCLOAK_ENABLE_CLIENT_AUTH` / env extraction (X.6.1); `StorageService` instead of ~35 raw storage reads (X.4.3); `getRedirectUrl` instead of hand-rolled tenant URLs (R.30) | all 5 consumers | SAFE |
| `@formsflow/service` [DISCUSS] | `initI18n()` shim (moves react-i18next dep, X.3.1); `useMfeBootstrap` keycloak/pubsub hook (needs React peer, X.4.4); unified tenant-key helpers (4 semantics to reconcile, X.4.1); keycloak `/auth` relative-path unification (X.2.3) | all | DISCUSS |
| Root shared config (beside the existing `webpack.formio.js`) | `makeMfeWebpackConfig({projectName, port})` (X.7.3), shared babel.config (X.7.1), jest factory (X.7.2), tsconfig base + shared declarations.d.ts (X.7.4) | all 8 | DISCUSS (build system) |
| In-package extractions (per-package prompts) | integration `EmbedTab` (I.13); components `useClickOutside`/`useDropdownPosition` (C.25) and `CustomButton` variant map (C.24); review `useTaskFormLoader` (R.26); submissions `useSubmissionFilters` (U.20); admin `request()` service helper (A.24); nav `PERMISSIONS` module (N.7.2) | each package | mostly SAFE (R.26/U.20/A.23 = DISCUSS decompositions) |

---

# §13 Suggested implementation order (maps to the prompt files)

Run one prompt at a time, in this order; each is scoped to one report section and only its [SAFE] bucket unless you explicitly approve DISCUSS items when pasting.

1. **PROMPT_B1 (service, S)** — internal cleanups (S.9, S.11, S.12, S.19, S.26–S.29). The Keycloak items S.1–S.5 are the most valuable DISCUSS approvals in the whole audit: approve them together and test login/refresh/logout manually.
2. **PROMPT_B2 (components, C)** — ReusableTable identity fixes (C.8, C.9) first — every list screen in every MFE benefits; then C.15 CSS-var memoization, dead code C.5/C.23, dedup C.24/C.25/C.27, lodash C.4. Approving C.1/C.2 (lazy formio/bpmn) is the single biggest bundle win in the repo.
3. **PROMPT_B3 (nav, N)** — N.6.1 (drop the dead Navbar import) first, then render-path memoization N.1.1–N.1.3, dead files N.6.3/N.6.4, magic strings N.7.2. Approve N.3.1 (crash effect) explicitly.
4. **PROMPT_B4 (review, R)** — dead code R.25 + bundle R.23/R.24, store hazard R.31, JSON.parse R.21, no-op dispatch R.12, lazy routes R.32. The socket items R.1+R.3 (approve together) are the top runtime win.
5. **PROMPT_B5 (submissions, U)** — dead files U.1/U.2 first (~1,100 lines), then identity fixes U.14/U.15/U.9/U.10/U.13, listener U.17, logger U.18, config convergence U.19, lazy detail route U.22. U.3/U.4 need a decision on the react-query stance.
6. **PROMPT_B6 (admin, A)** — dead code A.19/A.20 first (react-select out of the bundle), then A.12, A.18, A.26. A.1/A.2/A.22 are high-value DISCUSS approvals.
7. **PROMPT_B7 (integration, I)** — I.8 dead code, I.9 memoization, I.13 EmbedTab dedup, I.15 i18n strings. Approve I.1 (error rendering) explicitly.
8. **PROMPT_B8 (theme, T)** — T.2 dead files (with before/after compiled-CSS diff), T.9/T.10/T.16 provable no-ops. T.1 (selective Bootstrap) and T.3/T.4 need sign-off + visual regression pass.
9. **PROMPT_C (cross-package, X)** — after B1–B8 land: Loading kit → service constants switch → checklist/replaceUrl/API exports → storage hygiene, one X-item at a time via the additive-first recipe. Build-config consolidation (X.7) last, if approved.

Re-run PROMPT_A to regenerate this report after major changes.

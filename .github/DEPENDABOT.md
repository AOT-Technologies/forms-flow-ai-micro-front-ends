# Dependabot runbook

Security first. A Dependabot security fix gets its own PR the moment an alert
has a fix, ahead of the schedule, and is merged before anything else. Patch
bumps arrive as one grouped PR that takes a single review pass. Everything
else (minor and major) arrives as one batch PR per ecosystem, badged by the
highest bump inside it and reviewed entry by entry.

## Review tiers

| Badge in title | Label | What it is | Routine |
|---|---|---|---|
| `[🔒 SECURITY]` | `deps: security 🔒` | **One** grouped PR for Dependabot security updates (`security-fixes` group), opened as soon as a fix exists. | Priority over everything else. CI green → merge. |
| `[✅ PATCH-ONLY]` | `deps: patch ✅ one-pass review` | **One** grouped PR with every patch-level bump across all packages (`Bump the patch-only-safe group across N directories with M updates`). | CI green → lockfiles-only diff → merge. One pass. |
| `[🟡 MINOR]` or `[🔴 MAJOR]` | `deps: minor 🟡` or `deps: major 🔴 breaking-risk` | **One** batch PR per ecosystem with every remaining minor and major bump (`minor-and-major`, `docker-minor-and-major`), badged by its highest bump. | Per entry: release notes or migration guide, CI green, smoke-test. Not ready? `@dependabot ignore <dependency> major version` (or `minor`) drops it; the batch is recreated without it. |

Every Dependabot PR also gets a sticky comment: shields badge, metadata
(highest bump, group, directories, dependencies) and the tier checklist. It is
refreshed on every rebase; the PR body is left alone because PR-Agent rewrites it.

## Where things live

| File | Purpose |
|---|---|
| `.github/dependabot.yml` | Schedule, grouping, cooldown. No `ignore` list: every update is surfaced. |
| `.github/workflows/dependabot-triage.yml` | Labels, title badges, sticky comment, opt-in auto-merge. |
| `CODEOWNERS` | Reviewer assignment. The old `reviewers:` key in `dependabot.yml` was removed by GitHub in May 2025. |

## First-time setup (once, by a repo admin)

1. Merge the two files to `develop` (the default branch; Dependabot reads the
   config from there).
2. Actions → **Dependabot Triage** → **Run workflow**. This creates the four
   tier labels. Dependabot never creates custom labels itself.
3. Settings → Code security → confirm **Dependabot alerts** and
   **Dependabot security updates** are enabled. Leave **Grouped security
   updates** as is: the `security-fixes` group in the config overrides it.
4. Optional, for hands-off patch merging:
   - Settings → General → enable **Allow auto-merge**.
   - Branch protection on `develop` with the three CI suites as required checks.
   - Settings → Secrets and variables → Actions → **Variables** → add
     `DEPENDABOT_AUTOMERGE_PATCH` = `true`.
   Until that variable exists, nothing merges on its own.

## Cadence

| What | When |
|---|---|
| Security fixes | The moment an alert with a fix is raised. Schedule and cooldown do not apply. |
| npm: patch group and batch | Daily, 09:00 IST. |
| Docker base images, GitHub Actions | Monday, 09:00 IST. |

At most three open Dependabot PRs per ecosystem: security, patch, batch
(docker has no security alerts, so two). An open group PR is updated in place,
so a new entry joins the existing PR rather than opening another one.

To refresh on demand: **Insights → Dependency graph → Dependabot → Check for
updates** (per ecosystem). Config errors show on the same page.

## Cooldown (supply-chain guard)

A release is not proposed until it has been public for:

| Bump | Days |
|---|---|
| patch | 7 |
| minor | 14 |
| major | 30 |

Security updates ignore cooldown. Lower the numbers in `dependabot.yml` if a
needed fix is being held back.

## Policy-frozen dependencies

There is no `ignore` list: every available update is surfaced so nothing is
missed. Some majors are still frozen by policy (see the Hard Constraints in
`CLAUDE.md`): `react`/`react-dom` and the single-spa mesh, `webpack*`, the
intentional `jest`/`eslint`/`i18next` drift between packages, and the heavy
shared-bundle libraries (`@aot-technologies/formio*`, `@mui/*`, `bpmn-js`).

When one of those shows up in the `[🔴 MAJOR]` batch and is not planned, drop
it with `@dependabot ignore <dependency> major version`. Dependabot closes the
batch, remembers the condition per dependency and recreates the batch without
it on the next run; `@dependabot unignore <dependency>` reverses it.

## Useful PR commands

Every Dependabot PR here is grouped, so the commands name the dependency:

```text
@dependabot rebase
@dependabot recreate
@dependabot ignore <dependency> minor version
@dependabot ignore <dependency> major version
@dependabot ignore <dependency>
@dependabot show <dependency> ignore conditions
@dependabot unignore <dependency>
```

`recreate` is the fix when a group PR has drifted after other merges.

## Gotchas

- **Target branch.** Do not add `target-branch:` to the npm block. Security
  updates only ever target the default branch, and a non-default
  `target-branch` detaches them from the groups and labels (this is why the
  sibling `forms-flow-ai` repo still receives one-off security PRs).
- **Labels.** Unknown labels in `dependabot.yml` are silently ignored. Keep
  custom labels in the triage workflow, which creates them.
- **Secrets.** Dependabot-triggered workflow runs cannot read Actions secrets.
  The triage workflow uses only `GITHUB_TOKEN`; keep it that way.
- **Grouped PR title.** Dependabot regenerates it on `recreate`; the triage
  workflow re-applies the badge on every `synchronize` event.
- **Batch badge.** The batch is badged by its highest bump: one major among
  ten minors makes the whole PR `[🔴 MAJOR]`. Drop that entry and the
  recreated batch comes back as `[🟡 MINOR]`.
- **Ecosystem.** Each directory has its own `package.json` + `package-lock.json`,
  so the ecosystem is `npm` with the directories listed one by one (no workspace
  root). A new package must be added to the npm and docker lists or it never updates.

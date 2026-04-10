# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Grafana panel plugin providing a highly customizable D3-based gauge visualization.
Built with React 18, TypeScript, and D3.js v7.
Outputs an AMD module compatible with Grafana's plugin system.

## Commands

**Package manager:** `pnpm` (v8.9.2+, Node >= 24)

```bash
pnpm dev              # Webpack watch mode (development)
pnpm build            # Production build → dist/
pnpm test             # Jest watch mode (changed files only)
pnpm test:ci          # Jest CI mode (max 4 workers)
pnpm lint             # ESLint
pnpm lint:fix         # ESLint + Prettier fix
pnpm typecheck        # tsc --noEmit
pnpm e2e              # Playwright e2e tests
pnpm server           # Start Grafana via Docker Compose
pnpm spellcheck       # cspell across all source files
```

**Run a single test file:**

```bash
pnpm exec jest --testPathPattern=needle_utils
```

**Run tests matching a name pattern:**

```bash
pnpm exec jest --testNamePattern="Min Needle"
```

## Architecture

### Plugin Entry Chain

1. **`src/module.ts`** — Plugin bootstrap. Exports the `PanelPlugin<GaugeOptions>` instance,
   registers `GaugePanel`, configures all panel options (organized into categories: Standard,
   Font, Needle, Limits, Coloring, Radial, Degrees, Readings, Tick Maps, Thresholds).

2. **`src/components/GaugePanel.tsx`** — React wrapper (`FC<PanelProps<GaugeOptions>>`).
   Extracts data series, computes display values, auto-scales radius, spreads options
   with computed overrides, then renders `<Gauge>`.

3. **`src/components/Gauge/Gauge.tsx`** — Component orchestration. Wires up custom hooks
   and memoized render calls, produces the final SVG layout.

4. **`src/migrations.ts`** — `PanelMigrationHandler()` migrates persisted panel configs
   across plugin versions. Defines typed Angular migration interfaces
   (`AngularPanel`, `AngularPanelProperties`, `AngularFieldConfig`, `AngularOptions`).

### Gauge Internals (`src/components/Gauge/`)

| File                     | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `gauge_render.tsx`       | Pure SVG render functions (circles, needle, ticks, labels, |
|                          | thresholds) and `scaleLabelFontSize`                       |
| `useNeedleAnimation.ts`  | Custom hook: D3 needle animation with ref-based tracking,  |
|                          | cross-limit clamping, and buried-needle skip logic         |
| `useTickComputations.ts` | Custom hook: tick spacing, angle, label computation, and   |
|                          | `ticksClamped` flag (MAX_TICKS = 100 with iteration guard) |
| `tick_spacing.ts`        | `computeTickSpacing` utility: nice-number tick intervals   |
|                          | using 1-2-5 series for any value range                     |
| `useGaugeDimensions.ts`  | Custom hook: SVG geometry, edge radii, tick/needle lengths |
| `needle_utils.tsx`       | Needle angle math for the "crossing limits" feature;       |
|                          | uses `maxNeedleAngle` (not `maxTickAngle`) for clamping    |
| `utils.tsx`              | D3 helpers: `drawBand`, `needleCalc`, `labelXCalc`, etc.   |
| `gauge_styles.ts`        | Emotion CSS styles for the Gauge SVG wrapper               |
| `index.ts`               | Barrel export for the `Gauge` component                    |

### Other Key Files

| File                           | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `src/components/types.ts`      | `GaugeOptions` interface and all other TypeScript types     |
| `src/components/TickMaps/`     | Custom editor UI for tick value mappings                    |
| `src/components/editors/`      | Custom panel option editors (`RangeEditor` for min/max with |
|                                | auto tick spacing when ticks would exceed limit)            |

### Build & Config

- **Webpack** config lives in `.config/webpack/webpack.config.ts` (Grafana-scaffolded).
  Outputs AMD format. SWC transpiles to ES2015. Grafana runtime libs are externals.
- **tsconfig.json** extends `.config/tsconfig.json`, with `noUnusedLocals` disabled.
- **ESLint** extends Grafana's base rules (see Code Style for details).
- **Jest** uses SWC transformer, jsdom environment, and `jest-setup.js` which
  filters jsdom SVG tag warnings and i18next promotional banners from test output.
- CSS modules are mocked with `identity-obj-proxy` in tests.

## CI/CD

### Checking CI Status

```bash
gh pr checks <PR-number>
```

### Workflows

| Workflow                 | File                         | Trigger                       |
| ------------------------ | ---------------------------- | ----------------------------- |
| CI                       | `ci.yml`                     | Push to `main`, PRs to `main` |
| Release                  | `release.yml`                | `workflow_dispatch`           |
| Release Please           | `release-please.yml`         | `workflow_dispatch`           |
| Version Bump & Changelog | `version-bump-changelog.yml` | `workflow_dispatch`           |
| Compatibility Check      | `is-compatible.yml`          | `workflow_dispatch`           |
| Bundle Stats             | `bundle-stats.yml`           | PRs                           |
| Coverage Report          | `coverage.yml`               | PRs                           |
| PR File Changes          | `pr-files.yml`               | PRs                           |
| Create Plugin Update     | `cp-update.yml`              | `workflow_dispatch`           |

### CI Pipeline

The CI workflow (`ci.yml`) is an inline workflow (not a reusable workflow call) with three jobs:

1. **build** — pnpm install, typecheck, lint, unit tests, production build, plugin signing,
   packaging, and validation. Conditionally builds/tests Go backend if `Magefile.go` exists.
2. **resolve-versions** — uses `grafana/plugin-actions/e2e-version` to resolve the Grafana
   image matrix (skips `grafana-dev`, includes React 19 preview).
3. **playwright-tests** — runs Playwright e2e tests against each resolved Grafana version
   in a Docker Compose environment. Uploads test reports as artifacts.

### Action Pinning

Pin all GitHub Actions to **version tags** (e.g., `@v6`, `@v4.0.0`), not commit SHAs.
This keeps workflows readable and consistent.

## Version Bumping & Changelog

Use the **Version bump, changelog** GitHub Actions workflow
(`.github/workflows/version-bump-changelog.yml`) to bump the version and optionally
generate a changelog. Trigger it manually via `workflow_dispatch` with:

- **version**: `patch`, `minor`, or `major`
- **generate-changelog**: `true` (default) or `false`

## Release Please

Use the **release please** GitHub Actions workflow (`.github/workflows/release-please.yml`)
to automate version bumping and changelog generation.
Trigger it manually via `workflow_dispatch` — no inputs required.

## Grafana Compatibility Check

Before releasing, verify the built plugin is compatible with a target Grafana version
using `levitate`. Requires a production build first.

```bash
pnpm build
npx @grafana/levitate@latest is-compatible \
  --target @grafana/data@<version>,@grafana/ui@<version>,@grafana/runtime@<version> \
  --path dist/module.js
```

To check against the latest Grafana version, first look up the current `@grafana/data` version on npm:

```bash
npm view @grafana/data version
```

Then substitute that version into the `--target` flag above.

## Updating Plugin Scaffolding

To update the `.config` directory (Webpack, tsconfig, Jest config, etc.)
to the latest Grafana plugin scaffolding:

```bash
npx @grafana/create-plugin@latest update
```

## Docker Development

`docker-compose.yaml` extends `.config/docker-compose-base.yaml` and adds:

- Port mapping (3000:3000)
- Healthcheck (wget against `/api/health`)
- Volume mounts for `dist/` (plugin) and `provisioning/` (dashboards, datasources)
- `GF_DEFAULT_APP_MODE=development`

The `provisioning/` folder contains pre-configured dashboards and a TestData datasource.
Run `pnpm server` to start it.

## E2E Testing (Playwright)

Uses `@grafana/plugin-e2e` with Playwright. Config is in `playwright.config.ts`.

- Auth project logs in as admin and stores session state
- Chromium project runs tests from `tests/` directory with stored auth
- Base URL defaults to `http://localhost:3000` (override with `GRAFANA_URL` env var)

```bash
pnpm e2e                          # Run all e2e tests
pnpm exec playwright test --ui    # Interactive UI mode
```

## Code Style Guidelines

### Formatting (Prettier)

- Print width: **120**
- Single quotes, no JSX single quotes
- Trailing commas: `es5`
- Semicolons: always
- 2-space indentation, no tabs
- End of line: `auto`

### Naming Conventions

| Element             | Convention                        | Example                                 |
| ------------------- | --------------------------------- | --------------------------------------- |
| Component files     | `PascalCase.tsx`                  | `GaugePanel.tsx`                        |
| Test files          | `<source>.test.tsx` or `.test.ts` | `needle_utils.test.tsx`                 |
| Utility files       | `snake_case.ts` or `camelCase.ts` | `needle_utils.tsx`                      |
| Custom hooks        | `use<Name>.ts`                    | `useNeedleAnimation.ts`                 |
| Style files         | `<scope>_styles.ts`               | `gauge_styles.ts`                       |
| Constants           | `SCREAMING_SNAKE_CASE`            | `DEFAULT_GAUGE_OPTIONS`                 |
| Interfaces          | PascalCase                        | `GaugeOptions`, `TickMapItemType`       |
| Functions/variables | camelCase                         | `computeNeedleAngle`, `getDisplayValue` |

### TypeScript

- Use **interfaces** for component props and options objects.
- Prefer explicit generics: `useState<number>(0)`.

### React Components

- **Functional components only** with arrow functions.
- Styles via `@emotion/css` + Grafana's `useStyles2(getStyles)` pattern when needed.

### Testing Patterns (Jest + Testing Library)

- Mock `d3` and `d3-ease` at file top (ESM modules require `jest.mock`).
- Mock Gauge component when testing GaugePanel to capture props.
- Use `renderHook` from `@testing-library/react` for custom hook tests.
- Use `describe`/`it` blocks.
- Clean up in `beforeEach`/`afterAll` with `jest.clearAllMocks()` / `jest.resetAllMocks()`.
- Compare theme-resolved colors relatively (not by name) since
  `useTheme2` resolves names to hex values.
- Use `Array<T>` syntax for non-simple array types (ESLint rule).

## Critical Rules

- **NEVER add a `Co-Authored-By` line to commit messages.**
  This applies to all agents, subagents, and automated commits.
  When dispatching subagents that will commit, explicitly
  instruct them: "Do NOT add a Co-Authored-By line."
- **Never modify anything inside `.config/`** —
  managed by Grafana plugin tooling.
- **Never change `id` or `type`** in `src/plugin.json`.
- Changes to `plugin.json` require a
  **Grafana server restart**.
- Use webpack from `.config/` for builds;
  do not add a custom bundler.
- Grafana API docs:
  <https://grafana.com/developers/plugin-tools/llms.txt>
- **Always run cspell** after making changes:
  `pnpm spellcheck`
  and fix any issues before committing. Add new words
  to `cspell.config.json` if they are legitimate.
- **Always run `pnpm typecheck`** when `src/` files
  are changed and fix any type errors before committing.
- **NEVER comment on GitHub issues or PRs** unless the
  user explicitly asks. Draft the response and show it
  to the user first. Only post when told to do so.
- **NEVER commit unless the user explicitly asks.**
  Do not commit as part of completing a task.
- **NEVER push unless the user explicitly asks.**
  Do not push as part of completing a task.
  Never chain `git commit && git push` in one command.
  Always wait for the user to explicitly ask to push.
- **After pushing, always update the PR summary** if a
  PR exists for the current branch. Use `gh pr edit`
  to update the title and body with well-formatted text
  that reflects all changes across the entire branch.
- **Prefer subagents** for research, code exploration,
  and multi-step work. Launch multiple agents in parallel
  when tasks are independent.

## Changelog Policy

**Always update `CHANGELOG.md` when making changes.** Every commit that
modifies code, documentation, dependencies, or configuration must have a
corresponding entry in the changelog under the current unreleased version
section. Add entries as part of the same commit or as a follow-up commit
before pushing.

## Markdown Policy

**Always run markdownlint-cli2** on markdown files before committing:

```bash
npx markdownlint-cli2 AGENTS.md README.md CHANGELOG.md
```

Fix any issues before committing. Configuration is in `.markdownlint.yaml`
(120-character line length).

## Branching Policy

- **Never commit directly to `main`**. Always create a new branch for changes.
- Use descriptive branch names (e.g., `feat/add-feature`, `fix/bug-description`).
- When checking out a branch or `main`, always `git fetch` and `git pull`
  to ensure you have the latest changes.
- **Always create pull requests as drafts**
  (`gh pr create --draft`).
- **Never add a "Generated with Claude Code" line** to PR
  summaries. Always organize the PR summary with categorized
  change information (e.g., Dependencies, New Features, Cleanup).

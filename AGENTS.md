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
   Extracts data series, computes display values, auto-scales radius, processes thresholds,
   then renders `<Gauge>`.

3. **`src/components/Gauge.tsx`** — D3 SVG rendering core. Manages needle animation
   (d3-ease), tick generation, threshold bands, and all visual elements.

4. **`src/components/needle_utils.tsx`** — Needle angle math. Handles the "crossing limits"
   feature where the needle can exceed min/max bounds.

5. **`src/migrations.ts`** — `PanelMigrationHandler()` migrates persisted panel configs across plugin versions.

### Key Files

| File                       | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `src/components/types.ts`  | `GaugeOptions` interface and all other TypeScript types |
| `src/components/TickMaps/` | Custom editor UI for tick value mappings                |

### Build & Config

- **Webpack** config lives in `.config/webpack/webpack.config.ts` (Grafana-scaffolded).
  Outputs AMD format. SWC transpiles to ES2015. Grafana runtime libs are externals.
- **tsconfig.json** extends `.config/tsconfig.json`, with `noUnusedLocals` disabled.
- **ESLint** extends Grafana's base rules (see Code Style for details).
- **Jest** uses SWC transformer, jsdom environment, and `jest-setup.js` which sets `TZ=UTC` for snapshot consistency.
- CSS modules are mocked with `identity-obj-proxy` in tests.

## CI/CD

### Checking CI Status

```bash
gh pr checks <PR-number>
```

### Workflows

| Workflow | File | Trigger |
| -------- | ---- | ------- |
| CI | `ci.yml` | Push to `main`, PRs to `main` |
| Release | `release.yml` | `workflow_dispatch` |
| Release Please | `release-please.yml` | `workflow_dispatch` |
| Version Bump & Changelog | `version-bump-changelog.yml` | `workflow_dispatch` |
| Compatibility Check | `is-compatible.yml` | `workflow_dispatch` |
| Bundle Stats | `bundle-stats.yml` | PRs |
| Coverage Report | `coverage.yml` | PRs |
| PR File Changes | `pr-files.yml` | PRs |
| Create Plugin Update | `cp-update.yml` | `workflow_dispatch` |

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

`docker-compose.yaml` + `provisioning/` folder provides a local Grafana instance
for manual testing. Run `pnpm server` to start it.

## Code Style Guidelines

### Formatting (Prettier)

- Print width: **120**
- Single quotes, no JSX single quotes
- Trailing commas: `es5`
- Semicolons: always
- 2-space indentation, no tabs
- End of line: `auto`

### Naming Conventions

| Element             | Convention                              | Example                                      |
| ------------------- | --------------------------------------- | -------------------------------------------- |
| Component files     | `PascalCase.tsx`                        | `GaugePanel.tsx`                             |
| Test files          | `ComponentName.test.tsx`                | `needle_utils.test.tsx`                      |
| Utility files       | `snake_case.ts` or `camelCase.ts`       | `needle_utils.tsx`                           |
| Constants           | `SCREAMING_SNAKE_CASE`                  | `DEFAULT_GAUGE_OPTIONS`                      |
| Interfaces          | PascalCase                              | `GaugeOptions`, `TickMapItem`                |
| Functions/variables | camelCase                               | `computeNeedleAngle`, `getDisplayValue`      |

### TypeScript

- Use **interfaces** for component props and options objects.
- Prefer explicit generics: `useState<number>(0)`.

### React Components

- **Functional components only** with arrow functions.
- Styles via `@emotion/css` + Grafana's `useStyles2(getStyles)` pattern when needed.

### Testing Patterns (Jest + Testing Library)

- Mock external modules at file top: `jest.mock('@grafana/runtime')`.
- Use `describe`/`it` blocks.
- Clean up in `beforeEach`/`afterAll` with `jest.clearAllMocks()` / `jest.resetAllMocks()`.

## Critical Rules

- Do not add a `Co-Authored-By` line to commit messages.
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

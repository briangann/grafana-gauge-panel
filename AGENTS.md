# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

Always create a branch before making any changes. Never commit directly to `main`.

## Project Overview

A Grafana panel plugin providing a highly customizable D3-based gauge visualization. Built with React 18, TypeScript, and D3.js v7. Outputs an AMD module compatible with Grafana's plugin system.

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

1. **`src/module.ts`** — Plugin bootstrap. Exports the `PanelPlugin<GaugeOptions>` instance, registers `GaugePanel`, configures all panel options (organized into categories: Standard, Font, Needle, Limits, Coloring, Radial, Degrees, Readings, Tick Maps, Thresholds).

2. **`src/components/GaugePanel.tsx`** — React wrapper (`FC<PanelProps<GaugeOptions>>`). Extracts data series, computes display values, auto-scales radius, processes thresholds, then renders `<Gauge>`.

3. **`src/components/Gauge.tsx`** — D3 SVG rendering core. Manages needle animation (d3-ease), tick generation, threshold bands, and all visual elements.

4. **`src/components/needle_utils.tsx`** — Needle angle math. Handles the "crossing limits" feature where the needle can exceed min/max bounds.

5. **`src/migrations.ts`** — `PanelMigrationHandler()` migrates persisted panel configs across plugin versions.

### Key Files

| File                       | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `src/components/types.ts`  | `GaugeOptions` interface and all other TypeScript types |
| `src/components/TickMaps/` | Custom editor UI for tick value mappings                |

### Build & Config

- **Webpack** config lives in `.config/webpack/webpack.config.ts` (Grafana-scaffolded). Outputs AMD format. SWC transpiles to ES2015. Grafana runtime libs are externals.
- **tsconfig.json** extends `.config/tsconfig.json`, with `noUnusedLocals` disabled.
- **ESLint** enforces semicolons (`semi: 'error'`) in addition to Grafana's base rules.
- **Jest** uses SWC transformer, jsdom environment, and `jest-setup.js` which sets `TZ=UTC` for snapshot consistency.
- CSS modules are mocked with `identity-obj-proxy` in tests.

## Checking CI Status

```bash
gh pr checks <PR-number>
```

## Version Bumping & Changelog

Use the **Version bump, changelog** GitHub Actions workflow (`.github/workflows/version-bump-changelog.yml`) to bump the version and optionally generate a changelog. Trigger it manually via `workflow_dispatch` with:

- **version**: `patch`, `minor`, or `major`
- **generate-changelog**: `true` (default) or `false`

## Release Please

Use the **release please** GitHub Actions workflow (`.github/workflows/release-please.yml`) to automate version bumping and changelog generation. Trigger it manually via `workflow_dispatch` — no inputs required.

## Grafana Compatibility Check

Before releasing, verify the built plugin is compatible with a target Grafana version using `levitate`. Requires a production build first.

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

To update the `.config` directory (Webpack, tsconfig, Jest config, etc.) to the latest Grafana plugin scaffolding:

```bash
npx @grafana/create-plugin@latest update
```

### Docker Development

`docker-compose.yaml` + `provisioning/` folder provides a local Grafana instance for manual testing. Run `pnpm server` to start it.

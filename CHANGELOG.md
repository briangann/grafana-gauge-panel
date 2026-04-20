# Change Log

All changes noted here.

## v2.1.0 (unreleased)

### Bug Fixes (Rendering and Migration)

- Fix `for...in` iterating array indices instead of values in
  `renderMajorTickLabels`, causing incorrect `maxLabelLength` calculation
  for font scaling
- Fix falsy-zero bug where `displayValue` of `0` skipped threshold
  coloring in `renderCircleGroup`, `valueColor`, and `titleColor`
  (use strict `!== null` check matching the `number | null` type)
- Add React `key` props to threshold band elements to fix missing key
  warnings and prevent incorrect reconciliation
- Fix `migrateTickMaps` missing `enabled` field in return value
- Fix marker shape migration assigning `MarkerType` object to `string`
  field (now correctly extracts `.name`)
- Fix browser hang when gauge max value is very large (e.g., 6 billion)
  by lowering tick cap from 500 to 100, adding an iteration guard to
  prevent runaway loops, and auto-calculating tick spacing when the
  user changes min/max values (fixes #63)
- Fix threshold band angular misalignment with gauge ticks when using
  non-default `zeroTickAngle`/`maxTickAngle` values; the `drawBand`
  rotation is now computed as `2 * zeroTickAngle + 180` instead of
  being hardcoded to `maxTickAngle` (fixes #109)
- Fix Needle Length Stem ignoring decimal values by changing
  `integer: true` to `integer: false` (fixes #110)

### Type Safety

- Replace `any` type on `dToR` parameter with `number`
- Replace `any` types on `panelHeight`/`panelWidth` with `number`
- Add `AngularPanelProperties` interface and `AngularPanel` type for
  migration code, eliminating all 38 `@ts-ignore` suppressions
- Add `AngularFieldConfig` interface for angular fieldConfig migration
- Type `migrateValueAndRangeMaps` parameter (was `any`)
- Replace `return {} as any` with `return {}` in `PanelMigrationHandler`

### Code Quality

- Remove all `eslint-disable` comments from `src/` by inlining
  `getValues` into `useMemo` and narrowing dependency arrays
- Increase tick label gap from 1.0x to 1.3x font size for better
  spacing with unit-formatted labels

### Cleanup

- Remove unused `GaugeModel` interface
- Remove commented-out `MarkerStartShapes`/`MarkerEndShapes` arrays
- Remove unused `GaugePresetOptions` imports and commented-out preset block
- Remove unused `PanelChangedHandler` export
- Remove unused `React` import in `needle_utils.tsx`
- Remove unexposed `needleLengthNegCalc` from `useGaugeDimensions` return

### Testing

- Add 34 migration tests covering `convertOperators`, `migrateTickMaps`,
  `migrateFieldConfig`, `migrateValueAndRangeMaps`, `migrateDefaults`,
  and full `PanelMigrationHandler` integration (threshold migration with
  custom/default colors, format migration, angular property cleanup)
- Migration tests: 4 → 38, total suite: 200 → 234

### Build & Config

- Update `.config/` scaffolding from latest `@grafana/create-plugin`
- Move shared bundler utilities (`constants.ts`, `utils.ts`) to `.config/bundler/`
- Centralize webpack copy patterns into `.config/bundler/copyFiles.ts`
- Add `react/jsx-runtime` and `react/jsx-dev-runtime` to externals for React 19 compatibility
- Add `eslint.config.mjs` scaffolding header and update README with flat config example
- Add `mise.toml` for Node.js version pinning (24.14.1)
- Add AGENTS instructions, e2e testing guide, and build/validate skills
- Change `grafanaDependency` to `>=10.0.0` with no upper limit

### CI

- Replace reusable `grafana/plugin-ci-workflows@v7` with inline workflow
  (build, lint, typecheck, unit tests, Playwright e2e with Grafana version matrix)
- Enable Playwright report artifact uploading
- Bump `grafana/plugin-actions/build-plugin` v1.0.2 → v1.2.0
- Bump `grafana/plugin-actions/e2e-version` v1.1.2 → v1.2.1
- Bump `magefile/mage-action` v3.1.0 → v4.0.0
- Bump `actions/upload-artifact` v6 → v7, `actions/download-artifact` v7 → v8
- Bump `actions/github-script` v8.0.0 → v9.0.0
- Remove `master` branch references, pin actions to version tags
- Clean up scaffolding comments in release.yml
- Replace Dependabot with Renovate: add `renovate.json` with weekly
  Monday schedule, grouped non-major dev/prod bumps, vulnerability
  alerts, `lockFileMaintenance`, a rule blocking `@grafana/**@13.x`
  (pending `grafanaDependency` upper-bound bump), and a rule pinning
  `@types/node` below v25 to match `engines.node >= 24`
- Remove `.github/dependabot.yml` (superseded by Renovate)
- Add `.github/workflows/lint-actions.yml` — runs `actionlint` and
  `zizmor` on PRs and pushes to `main` that touch `.github/workflows/**`
- Fix actionlint findings surfaced by the new workflow:
  - Quote `$GITHUB_OUTPUT`, `$PWD`, and metadata vars in `ci.yml`
    (SC2086); drop useless `cat` and consolidate `>>` redirects in
    the `Get plugin metadata` step (SC2002, SC2129, SC2155)
  - Quote `$GITHUB_OUTPUT` in `is-compatible.yml` and collapse the
    folded-scalar `run:` into a plain block
  - Replace `ubuntu-x64-small` runner label with `ubuntu-latest` in
    `version-bump-changelog.yml` (scaffolding leftover; this repo is
    not on Grafana Labs self-hosted runners)
- Pin all third-party GitHub Actions to full-length commit SHAs with a
  trailing version comment (required by `zizmor`). Covers every
  `uses:` across `ci.yml`, `bundle-stats.yml`, `coverage.yml`,
  `cp-update.yml`, `is-compatible.yml`, `pr-files.yml`,
  `release-please.yml`, `release.yml`, and
  `version-bump-changelog.yml`

### Docs

- Update `AGENTS.md` Action Pinning rule: require full-length commit
  SHAs with a trailing version comment (was: version tags). Reflects
  the `zizmor`-enforced policy.

### New Features

- Add `computeTickSpacing` utility that calculates human-friendly
  ("nice number") tick intervals for any value range
- Auto-fill tick spacing when min/max values change in the panel editor,
  only when the new range would exceed the 100-tick limit (preserves
  user-configured spacing otherwise)
- Show warning icon with tooltip when tick count is clamped, including
  suggested spacing values
- Use `@grafana/ui` `Input` component in `RangeEditor` for theme
  consistency
- Sync `RangeEditor` local state when external value prop changes
  (undo/reset)
- Add "Show Value on Gauge" toggle to hide/show the numeric value
  display (fixes #101)
- Add "Show Tick Labels" toggle to hide/show the tick mark labels
  (fixes #101)
- Add "Wrap Values to Range" option under Limits for compass-style
  gauges; normalizes out-of-range values using modulo arithmetic
  (e.g., -90 becomes 270 for a 0-360 range) (related to #13)
- Remove hardcoded decimals default of 2; now uses Grafana's auto
- Add provisioned compass dashboard for testing
- Add "Format Tick Labels with Unit" option under Gauge Readings;
  formats tick labels using the configured unit and decimals
  (e.g., 100000000 displays as "100 MB/s") (related to #57)

### Panel Editor UX

- Rename "Show title" to "Show Display Name on Gauge" and move above
  Stat in Standard options
- Rename "Title Font/Size" to "Display Name Font/Size"
- Rename "Title Y-Offset" to "Display Name Y-Offset (Vertical)"
- Rename "Value Y-Offset" to "Value Y-Offset (Vertical)"
- Reorder font settings: Display Name, Value, Tick Label
- Add inline description to Tick Maps editor section
- Fix `needleCrossLimitDegrees` default (10 → 5) to match description
- Increase vertical spacing between display name and value labels

### Testing Infrastructure

- Suppress jsdom SVG tag warnings (`<path>`, `<marker>`, `<defs>`) in
  test output via `jest-setup.js` console filter
- Suppress i18next promotional banner in test output

### E2E Testing

- Add Playwright config with `@grafana/plugin-e2e` auth and Chromium project
- Add `tests/grafana-version.spec.ts` smoke test
- Replace Cypress e2e scripts with `playwright test`
- Add `@playwright/test` and `@grafana/plugin-e2e` dev dependencies

### Docker & Provisioning

- Rewrite `docker-compose.yaml` with healthcheck, port mapping, volume mounts
- Add provisioning dashboards, datasource, and provider configs

### Plugin Compatibility

- Bump `grafanaDependency` from `>=9.3.16` to `>=10 <=13.0`
- Remove deprecated `grafanaVersion` field

### Dependencies

- `@testing-library/react` 14.0.0 → 15.0.7 (fixes `ReactDOMTestUtils.act` warnings)
- `@grafana/eslint-config` 8.2.0 → 9.0.0
- `@stylistic/eslint-plugin-ts` 2.13.0 → 4.4.1
- `@types/node` 20.19.37 → 24.x (pinned to match `engines.node >= 24`;
  do not drift to 25 while the engine floor is 24)
- `cspell` 7.3.8 → 10.0.0
- `eslint-config-prettier` 8.10.2 → 10.1.8
- `eslint-plugin-jsdoc` 51.4.1 → 62.9.0
- `eslint-plugin-react-hooks` 5.2.0 → 7.0.1 (held at 7.0.1 via `~` range;
  7.1.x adds `react-hooks/immutability` rule that requires code changes
  in `GaugePanel.tsx`, tracked separately)
- `glob` 10.5.0 → 13.0.6
- `@grafana/plugin-e2e` 3.4.12 → 3.5.1
- `@swc/core` 1.15.24 → 1.15.30
- `@typescript-eslint/eslint-plugin` 8.58.1 → 8.58.2
- `@typescript-eslint/parser` 8.58.1 → 8.58.2
- `webpack` 5.106.0 → 5.106.2
- Remove deprecated `@types/glob` (glob 13 ships own types)

### Refactor

- Replace needle `useRef` with `useId()` + DOM id lookup
  (fixes `react-hooks/refs` lint error from `eslint-plugin-react-hooks@7`,
  gives each gauge instance a unique needle id for multi-panel dashboards)

## v2.0.4 (unreleased)

### Bug Fixes

- Fixed needle animation jumping instead of smoothly transitioning between values
- Replaced two-effect state-based animation with single-effect ref-based pattern
- Clamped values now animate to the limit instead of snapping instantly
- Needle stays buried when consecutive values exceed limits, animates back when value returns in range
- Removed deprecated `collapsible` and `heading` props from TickMaps editor
- Fixed `getNeedleAngleMaximum` to use `maxNeedleAngle` instead of `maxTickAngle`
  for non-buried needle clamping
- Fixed `renderThresholdBands` crash when thresholds are undefined
- Fixed browser hard-lock when using fractional or zero tick spacing values (#114)
- Added safety cap of 500 maximum ticks to prevent runaway computation
- Fixed floating-point comparison for minor/major tick overlap detection

### Performance

- Share a single memoized `valueScale` (d3 `scaleLinear`) across hooks instead of
  creating three independent instances
- Reuse d3 `line()` generator instead of recreating per tick
- Pre-compute tick path strings in `useTickComputations` (skip recomputation on
  value-only updates)
- Memoize metrics computation, SVG dimensions, and font size calculations in GaugePanel
- Memoize all SVG creation functions (circles, ticks, labels, needle, thresholds) in Gauge
- Add stable React keys for tick mark elements
- Narrow `useEffect` dependency arrays to prevent unnecessary re-renders
- Memoize `createNeedleMarkers` in Gauge to avoid recreating SVG defs on every render
- Memoize `gaugeRadiusCalc` and inline dimension styles in GaugePanel

### Features

- Allow fractional tick spacing (e.g., 0.1 Hz) in panel editor for minor and major ticks (#114)

### Refactoring

- Extract render functions to `gauge_render.tsx`, styles to `gauge_styles.ts`
- Extract custom hooks: `useNeedleAnimation`, `useTickComputations`, `useGaugeDimensions`
- Remove all `eslint-disable react-hooks/exhaustive-deps` comments from Gauge component
- Simplify GaugePanel: remove dead code, use prop spread, extract styles
- Organize Gauge files into dedicated `src/components/Gauge/` folder
- Remove unused `margin` state variable
- Consolidate `useGaugeDimensions` from useState+useEffect to single useMemo
- Type all `TickMapItemProps` callbacks (remove `any` types) and remove unused `enabled`/`context` props
- Rewrite `TickMapItem` as a controlled component (remove duplicate local state)
- Consolidate `TickMapEditor` state: merge parallel `isOpen` array into `TickMapItemTracker`
- Replace in-place `arrayMove` mutation with immutable `swapItems`/`reorder` helpers
- Wrap all `TickMapEditor` callbacks in `useCallback`

### Tests

- Added unit tests for `utils.tsx`, `gauge_render.tsx`, `useGaugeDimensions`,
  `useNeedleAnimation`, `useTickComputations`, `GaugePanel`, `Gauge`,
  `TickMapItem`, and `TickMapEditor`
- Restructured `renderThresholdBands` tests with nested describes for early
  returns, 2-step, 3+ step, and Infinity threshold scenarios
- Added edge case tests for `needle_utils` cross-limit clamping branches
- 181 tests across 12 suites

## v2.0.3 - 2026-04-01

- Updated pnpm/action-setup from v4 to v5
- Updated magefile/mage-action from v3.1.0 to v4.0.0
- Aligned release workflow Node version to 24
- Changed release workflow Go version to use go.mod instead of hardcoded v1.21
- Upgraded @grafana/data, i18n, runtime, schema, ui from 12.4.1 to 12.4.2
- Upgraded minor/patch dependencies (@babel/core, @swc/core, @swc/helpers, @swc/jest, swc-loader,
  @types/lodash, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, css-loader,
  eslint-config-prettier, eslint-webpack-plugin, glob, semver, terser-webpack-plugin, webpack)
- Upgraded sass from 1.63.2 to 1.98.0
- Upgraded sass-loader from 13.3.1 to 13.3.3
- Upgraded typescript from 5.5.4 to 5.9.3
- Upgraded uuid from 9.x to 13.0.0, removed @types/uuid (types now bundled)

## v2.0.2 - 2026-03-16

- Removed suggestions supplier
- Upgraded GitHub Actions to latest versions across all workflows
- Renamed CLAUDE.md to AGENTS.md
- Upgraded minor/patch dependencies (@emotion/css, tslib, d3, @testing-library/jest-dom, @types/d3-scale, @grafana packages)

## v2.0.1 - 2023-11-13

- Fix font sizing during migrations
- Autoscales font according to gauge size

## v2.0.0 - 2023-10-20

- Rewritten from Angular to React
- NEW: Needle Width can now be specified
- NEW: Thresholds now use the standard Grafana threshold mechanics
- NEW: Needle can optionally exceed the tick mark (min and max) to show values
  that are outside of limits
- NEW: Needle Center can use all marker types, with arrow-inverse added to options
- Switched to `pnpm`

## v0.0.9 - 2021-04-21

- Add option to display needle arrow
- Update packages

## v0.0.8 - 2020-10-26

- Signed Plugin!
- Updated build process

## v0.0.7 - 2020-04-18

- Fixes
  - Update to typescript and using standardized build process.
  - Simplified value display

## v0.0.1

- Initial commit

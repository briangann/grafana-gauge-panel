# Change Log

All changes noted here.

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

### Performance

- Share a single memoized `valueScale` (d3 `scaleLinear`) across hooks instead of
  creating three independent instances
- Memoize metrics computation, SVG dimensions, and font size calculations in GaugePanel
- Memoize all SVG creation functions (circles, ticks, labels, needle, thresholds) in Gauge
- Add stable React keys for tick mark elements
- Narrow `useEffect` dependency arrays to prevent unnecessary re-renders

### Refactoring

- Extract render functions to `gauge_render.tsx`, styles to `gauge_styles.ts`
- Extract custom hooks: `useNeedleAnimation`, `useTickComputations`, `useGaugeDimensions`
- Remove all `eslint-disable react-hooks/exhaustive-deps` comments from Gauge component
- Simplify GaugePanel: remove dead code, use prop spread, extract styles
- Organize Gauge files into dedicated `src/components/Gauge/` folder
- Remove unused `margin` state variable
- Consolidate `useGaugeDimensions` from useState+useEffect to single useMemo

### Tests

- Added unit tests for `utils.tsx`, `gauge_render.tsx`, `useGaugeDimensions`,
  `useNeedleAnimation`, `useTickComputations`, `GaugePanel`, and `Gauge`
- 148 tests across 10 suites

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

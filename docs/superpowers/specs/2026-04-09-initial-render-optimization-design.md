# Initial Render Optimization

## Problem

The gauge plugin creates redundant D3 objects and recomputes static geometry
on every render. Three independent `scaleLinear()` instances build the same
value-to-angle mapping. The `d3.line()` generator is recreated ~101 times
per render (once per tick). Tick path strings are recomputed even when only
the display value changes.

## Goal

Reduce first-render cost and eliminate redundant work on value-only updates
by sharing memoized D3 objects and pre-computing static SVG paths.

## Approach: Targeted D3 Reuse + Memoized Tick Paths

### 1. Shared memoized scale

Create a single `scaleLinear` instance in `Gauge.tsx` via `useMemo`, pass it
into `useTickComputations` and `useNeedleAnimation` as a parameter.

**Dependencies:** `[minValue, maxValue, zeroTickAngle, maxTickAngle]` -- stable
across value updates.

**Files changed:**

- `Gauge.tsx` -- add `valueScale` useMemo, pass to both hooks
- `useTickComputations.ts` -- accept scale parameter, remove two internal
  `scaleLinear()` calls
- `useNeedleAnimation.ts` -- accept scale parameter, remove internal
  `scaleLinear()` call

### 2. Reuse `line()` generator

Create the `d3.line()` generator once at the top of the tick path computation,
reuse for all ticks instead of creating a new instance per iteration.

**Files changed:**

- `gauge_render.tsx` -- `renderTicks`'s `tickCalcPaths` creates `line()` once
  outside the loop
- `utils.tsx` -- `needleCalc` reuses a single `line()` instance

### 3. Memoize tick path strings

Move tick path string computation from `gauge_render.tsx` into
`useTickComputations` so paths are memoized alongside angles. The hook
gains additional inputs from `useGaugeDimensions` output (`originX`, `originY`,
`tickStartMaj`, `tickStartMin`, `tickLengthMaj`, `tickLengthMin`) and returns
pre-computed path arrays
(`tickPathsMaj`, `tickPathsMin`).

`renderTicks` in `gauge_render.tsx` simplifies to mapping pre-computed
path strings to `<path>` elements with no D3 or trig at render time.

On value-only updates the tick memo deps are unchanged, so cached paths
are reused.

**Files changed:**

- `useTickComputations.ts` -- accept geometry inputs, compute and return
  `tickPathsMaj` and `tickPathsMin` arrays
- `Gauge.tsx` -- pass geometry values to `useTickComputations`, pass
  pre-computed paths to `renderTicks`
- `gauge_render.tsx` -- `renderTicks` accepts path string arrays instead
  of computing them

## Files NOT changed

- `types.ts`, `GaugePanel.tsx`, `gauge_styles.ts`, `gauge_panel_styles.ts`,
  `needle_utils.tsx` -- no changes needed
- Public API and saved dashboard JSON remain compatible

## Estimated Impact

| Optimization | Estimated Gain |
| --- | --- |
| Shared scaleLinear | ~0.15ms per render |
| Reuse line() generator | ~0.3ms per render |
| Memoized tick paths | ~0.5-1ms on value-only updates |

## Verification

1. `pnpm typecheck` -- no type errors
2. `pnpm lint` -- no lint errors
3. `pnpm test:ci` -- all existing tests pass (updated for new hook signatures)
4. `pnpm build` -- production build succeeds
5. `pnpm server` -- manual visual verification that gauge renders identically

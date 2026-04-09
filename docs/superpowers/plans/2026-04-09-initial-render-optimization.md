# Initial Render Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce first-render cost and eliminate redundant D3 work by sharing a memoized scale, reusing the `line()` generator, and pre-computing tick path strings.

**Architecture:** Create a shared `valueScale` in `Gauge.tsx` via `useMemo`, pass it into `useTickComputations` and `useNeedleAnimation`. Move tick path computation into `useTickComputations` so paths are memoized alongside angles. Simplify `renderTicks` to map pre-computed paths to elements.

**Tech Stack:** React 18, D3.js v7 (scaleLinear, line), TypeScript

---

### Task 1: Shared valueScale in Gauge.tsx

**Files:**
- Modify: `src/components/Gauge/Gauge.tsx:1-67`
- Test: `src/components/Gauge/Gauge.test.tsx`

- [ ] **Step 1: Add valueScale useMemo to Gauge.tsx**

Add after `useGaugeDimensions` call (line 57), before `useTickComputations` call:

```typescript
import { scaleLinear } from 'd3';
```

Add to imports at top, then add the memo:

```typescript
  const valueScale = useMemo(() => {
    return scaleLinear()
      .domain([options.minValue, options.maxValue])
      .range([options.zeroTickAngle, options.maxTickAngle]);
  }, [options.minValue, options.maxValue, options.zeroTickAngle, options.maxTickAngle]);
```

- [ ] **Step 2: Pass valueScale to useTickComputations**

Change the `useTickComputations` call to include `valueScale`:

```typescript
  const { tickAnglesMaj, tickAnglesMin, tickMajorLabels } = useTickComputations({
    minValue: options.minValue,
    maxValue: options.maxValue,
    zeroTickAngle: options.zeroTickAngle,
    maxTickAngle: options.maxTickAngle,
    tickSpacingMajor: options.tickSpacingMajor,
    tickSpacingMinor: options.tickSpacingMinor,
    tickMaps: options.tickMapConfig.tickMaps,
    valueScale,
  });
```

- [ ] **Step 3: Pass valueScale to useNeedleAnimation**

Change the `useNeedleAnimation` call to include `valueScale`:

```typescript
  useNeedleAnimation(needleRef, {
    displayValue: options.displayValue ?? NaN,
    minValue: options.minValue,
    maxValue: options.maxValue,
    zeroTickAngle: options.zeroTickAngle,
    maxTickAngle: options.maxTickAngle,
    zeroNeedleAngle: options.zeroNeedleAngle,
    maxNeedleAngle: options.maxNeedleAngle,
    allowNeedleCrossLimits: options.allowNeedleCrossLimits,
    needleCrossLimitDegrees: options.needleCrossLimitDegrees,
    animateNeedleValueTransition: options.animateNeedleValueTransition,
    animateNeedleValueTransitionSpeed: options.animateNeedleValueTransitionSpeed,
    originX,
    originY,
    valueScale,
  });
```

- [ ] **Step 4: Run typecheck (expect errors — hooks not updated yet)**

Run: `pnpm typecheck`
Expected: Type errors in `useTickComputations.ts` and `useNeedleAnimation.ts` (unknown property `valueScale`)

- [ ] **Step 5: Do NOT commit yet** — hooks need updating in Tasks 2 and 3 first.

---

### Task 2: Update useTickComputations to accept shared scale

**Files:**
- Modify: `src/components/Gauge/useTickComputations.ts`
- Test: `src/components/Gauge/useTickComputations.test.ts`

- [ ] **Step 1: Update the interface and remove internal scaleLinear calls**

Replace the `TickComputationOptions` interface and the two `tickSpacingMajDeg`/`tickSpacingMinDeg` memos in `useTickComputations.ts`:

```typescript
import { useMemo } from 'react';

import { TickMapItemType } from '../TickMaps/types';

import type { ScaleLinear } from 'd3';
```

Remove `import { scaleLinear } from 'd3';` — no longer needed.

Update the interface:

```typescript
interface TickComputationOptions {
  minValue: number;
  maxValue: number;
  zeroTickAngle: number;
  maxTickAngle: number;
  tickSpacingMajor: number;
  tickSpacingMinor: number;
  tickMaps: TickMapItemType[];
  valueScale: ScaleLinear<number, number>;
}
```

Replace both `tickSpacingMajDeg` and `tickSpacingMinDeg` memos with:

```typescript
  const tickSpacingMajDeg = useMemo(() => {
    const tickSpacingMajor = opts.tickSpacingMajor ?? 10;
    const scaleZero = opts.valueScale(0) ?? 0;
    const majorA = opts.valueScale(tickSpacingMajor) ?? 0;
    return Math.abs(majorA - scaleZero);
  }, [opts.valueScale, opts.tickSpacingMajor]);

  const tickSpacingMinDeg = useMemo(() => {
    const tickSpacingMinor = opts.tickSpacingMinor ?? 1;
    const scaleZero = opts.valueScale(0) ?? 0;
    const minorA = opts.valueScale(tickSpacingMinor) ?? 0;
    return Math.abs(minorA - scaleZero);
  }, [opts.valueScale, opts.tickSpacingMinor]);
```

The rest of the hook (`generateTickAngles`, `generateTickMajorLabels`, return) stays the same.

- [ ] **Step 2: Update tests**

In `useTickComputations.test.ts`, update the d3 mock to also export `ScaleLinear` type (no-op for runtime), and add a `valueScale` to `defaultOpts`:

Replace the d3 mock with:

```typescript
jest.mock('d3', () => ({
  scaleLinear: () => {
    let domain = [0, 1];
    let range = [0, 1];
    const scale = (val: number) => {
      const ratio = (val - domain[0]) / (domain[1] - domain[0]);
      return range[0] + ratio * (range[1] - range[0]);
    };
    scale.domain = (d: number[]) => { domain = d; return scale; };
    scale.range = (r: number[]) => { range = r; return scale; };
    return scale;
  },
}));
```

After imports, create the shared scale for tests:

```typescript
import { scaleLinear } from 'd3';

const makeScale = (min: number, max: number, zeroAngle: number, maxAngle: number) => {
  return scaleLinear().domain([min, max]).range([zeroAngle, maxAngle]);
};

const defaultOpts = {
  minValue: 0,
  maxValue: 100,
  zeroTickAngle: 60,
  maxTickAngle: 300,
  tickSpacingMajor: 10,
  tickSpacingMinor: 1,
  tickMaps: [],
  valueScale: makeScale(0, 100, 60, 300),
};
```

Update any test that overrides `minValue`/`maxValue`/`zeroTickAngle`/`maxTickAngle` to also
provide a matching `valueScale`. For example, the inverted range test:

```typescript
    it('handles inverted range (minValue > maxValue)', () => {
      const { result } = renderHook(() =>
        useTickComputations({
          ...defaultOpts,
          minValue: 100,
          maxValue: 0,
          valueScale: makeScale(100, 0, 60, 300),
        })
      );
```

- [ ] **Step 3: Run tests**

Run: `pnpm exec jest --testPathPattern=useTickComputations`
Expected: All 12 tests pass

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: Errors remain only in `useNeedleAnimation.ts` (Task 3)

---

### Task 3: Update useNeedleAnimation to accept shared scale

**Files:**
- Modify: `src/components/Gauge/useNeedleAnimation.ts`
- Test: `src/components/Gauge/useNeedleAnimation.test.ts`

- [ ] **Step 1: Update the interface and remove internal scaleLinear call**

In `useNeedleAnimation.ts`, update imports:

```typescript
import { interpolateString, select } from 'd3';
import type { ScaleLinear } from 'd3';
import { easeQuadIn } from 'd3-ease';
```

Remove `scaleLinear` from the d3 import.

Add `valueScale` to the interface:

```typescript
interface NeedleAnimationOptions {
  displayValue: number;
  minValue: number;
  maxValue: number;
  zeroTickAngle: number;
  maxTickAngle: number;
  zeroNeedleAngle: number;
  maxNeedleAngle: number;
  allowNeedleCrossLimits: boolean;
  needleCrossLimitDegrees: number;
  animateNeedleValueTransition: boolean;
  animateNeedleValueTransitionSpeed: number;
  originX: number;
  originY: number;
  valueScale: ScaleLinear<number, number>;
}
```

Inside the effect, replace lines 45-47:

```typescript
    const valueScale = scaleLinear()
      .domain([opts.minValue, opts.maxValue])
      .range([opts.zeroTickAngle, opts.maxTickAngle]);
```

with:

```typescript
    const valueScale = opts.valueScale;
```

Replace `opts.minValue, opts.maxValue, opts.zeroTickAngle, opts.maxTickAngle` in the
dependency array with `opts.valueScale`. Keep `opts.minValue` and `opts.maxValue` since
they're still used for value clamping (lines 39-42). The full deps become:

```typescript
  ], [
    opts.displayValue,
    opts.originX,
    opts.originY,
    opts.minValue,
    opts.maxValue,
    opts.valueScale,
    opts.zeroNeedleAngle,
    opts.maxNeedleAngle,
    opts.animateNeedleValueTransition,
    opts.animateNeedleValueTransitionSpeed,
    opts.allowNeedleCrossLimits,
    opts.needleCrossLimitDegrees,
    needleRef,
  ]);
```

- [ ] **Step 2: Update tests**

In `useNeedleAnimation.test.ts`, add a `valueScale` to `defaultOpts`:

```typescript
import { scaleLinear } from 'd3';

const makeScale = (min: number, max: number, zeroAngle: number, maxAngle: number) => {
  return scaleLinear().domain([min, max]).range([zeroAngle, maxAngle]);
};
```

Add to `defaultOpts`:

```typescript
  valueScale: makeScale(0, 100, 60, 300),
```

- [ ] **Step 3: Run all tests and typecheck**

Run: `pnpm typecheck && pnpm test:ci`
Expected: No type errors. All 148 tests pass.

- [ ] **Step 4: Run lint**

Run: `pnpm lint`
Expected: Clean

- [ ] **Step 5: Commit**

```bash
git add src/components/Gauge/Gauge.tsx src/components/Gauge/useTickComputations.ts \
  src/components/Gauge/useTickComputations.test.ts src/components/Gauge/useNeedleAnimation.ts \
  src/components/Gauge/useNeedleAnimation.test.ts
git commit -m "perf: share memoized valueScale across hooks"
```

---

### Task 4: Reuse line() generator in tick path computation

**Files:**
- Modify: `src/components/Gauge/gauge_render.tsx:119-137`
- Modify: `src/components/Gauge/utils.tsx:109-130`

- [ ] **Step 1: Fix line() in renderTicks tickCalcPaths**

In `gauge_render.tsx`, update `tickCalcPaths` inside `renderTicks` (line 119) to create
the generator once:

```typescript
  const tickCalcPaths = (degrees: number[], tickStart: number, tickLength: number) => {
    const paths: string[] = [];
    const lineFn = line();
    for (const degree of degrees) {
      const tickAngle = degree + 90;
      const tickAngleRad = dToR(tickAngle);
      const y1 = originY + tickStart * Math.sin(tickAngleRad);
      const y2 = originY + (tickStart + tickLength) * Math.sin(tickAngleRad);
      const x1 = originX + tickStart * Math.cos(tickAngleRad);
      const x2 = originX + (tickStart + tickLength) * Math.cos(tickAngleRad);
      const lineSVG = lineFn([
        [x1, y1],
        [x2, y2],
      ]);
      if (lineSVG) {
        paths.push(lineSVG);
      }
    }
    return paths;
  };
```

- [ ] **Step 2: Fix line() in needleCalc**

In `utils.tsx`, update `needleCalc` (line 109) to create the generator once:

```typescript
export const needleCalc = (
  degree: number,
  originX: number,
  originY: number,
  needlePathStart: number,
  needlePathLength: number
) => {
  let path = '';
  const nAngleRad = dToR(degree + 90);
  const y1 = originY + needlePathStart * Math.sin(nAngleRad);
  const y2 = originY + (needlePathStart + needlePathLength) * Math.sin(nAngleRad);
  const x1 = originX + needlePathStart * Math.cos(nAngleRad);
  const x2 = originX + (needlePathStart + needlePathLength) * Math.cos(nAngleRad);
  const lineFn = line();
  const lineSVG = lineFn([
    [x1, y1],
    [x2, y2],
  ]);
  if (lineSVG) {
    path = lineSVG;
  }
  return path;
};
```

- [ ] **Step 3: Run tests**

Run: `pnpm test:ci`
Expected: All tests pass (no signature changes — just internal optimization)

- [ ] **Step 4: Commit**

```bash
git add src/components/Gauge/gauge_render.tsx src/components/Gauge/utils.tsx
git commit -m "perf: reuse d3 line() generator instead of recreating per tick"
```

---

### Task 5: Memoize tick path strings in useTickComputations

**Files:**
- Modify: `src/components/Gauge/useTickComputations.ts`
- Modify: `src/components/Gauge/gauge_render.tsx`
- Modify: `src/components/Gauge/Gauge.tsx`
- Test: `src/components/Gauge/useTickComputations.test.ts`
- Test: `src/components/Gauge/gauge_render.test.tsx`
- Test: `src/components/Gauge/Gauge.test.tsx`

- [ ] **Step 1: Add geometry inputs and path computation to useTickComputations**

Update the interface in `useTickComputations.ts`:

```typescript
interface TickComputationOptions {
  minValue: number;
  maxValue: number;
  zeroTickAngle: number;
  maxTickAngle: number;
  tickSpacingMajor: number;
  tickSpacingMinor: number;
  tickMaps: TickMapItemType[];
  valueScale: ScaleLinear<number, number>;
  originX: number;
  originY: number;
  tickStartMaj: number;
  tickStartMin: number;
  tickLengthMaj: number;
  tickLengthMin: number;
}
```

Add the `line` import and `dToR` import:

```typescript
import { line } from 'd3';
import type { ScaleLinear } from 'd3';

import { TickMapItemType } from '../TickMaps/types';
import { dToR } from './utils';
```

Add a new `useMemo` after `tickAnglesMin` that computes the path strings:

```typescript
  const { tickPathsMaj, tickPathsMin } = useMemo(() => {
    const computePaths = (degrees: number[], tickStart: number, tickLength: number) => {
      const paths: string[] = [];
      const lineFn = line();
      for (const degree of degrees) {
        const tickAngle = degree + 90;
        const tickAngleRad = dToR(tickAngle);
        const y1 = opts.originY + tickStart * Math.sin(tickAngleRad);
        const y2 = opts.originY + (tickStart + tickLength) * Math.sin(tickAngleRad);
        const x1 = opts.originX + tickStart * Math.cos(tickAngleRad);
        const x2 = opts.originX + (tickStart + tickLength) * Math.cos(tickAngleRad);
        const lineSVG = lineFn([[x1, y1], [x2, y2]]);
        if (lineSVG) {
          paths.push(lineSVG);
        }
      }
      return paths;
    };
    return {
      tickPathsMaj: computePaths(tickAnglesMaj, opts.tickStartMaj, opts.tickLengthMaj),
      tickPathsMin: computePaths(tickAnglesMin, opts.tickStartMin, opts.tickLengthMin),
    };
  }, [tickAnglesMaj, tickAnglesMin, opts.originX, opts.originY,
      opts.tickStartMaj, opts.tickStartMin, opts.tickLengthMaj, opts.tickLengthMin]);
```

Update the return:

```typescript
  return { tickAnglesMaj, tickAnglesMin, tickMajorLabels, tickPathsMaj, tickPathsMin };
```

- [ ] **Step 2: Simplify renderTicks in gauge_render.tsx**

Update `renderTicks` to accept pre-computed path arrays instead of computing them:

```typescript
export const renderTicks = (
  tickPathsMaj: string[],
  tickPathsMin: string[],
  tickWidthMajorCalc: number,
  tickWidthMinorCalc: number,
  tickMajorColor: string,
  tickMinorColor: string,
  theme: GrafanaTheme2
) => {
  return (
    <g id="ticks">
      <g id="minorTickMarks">
        {tickPathsMin.length > 0 &&
          tickPathsMin.map((d: string, index: number) => (
            <path
              key={`tick-minor-${index}`}
              d={d}
              stroke={theme.visualization.getColorByName(tickMinorColor)}
              strokeWidth={tickWidthMinorCalc + 'px'}
            />
          ))}
      </g>
      <g id="majorTickMarks">
        {tickPathsMaj.length > 0 &&
          tickPathsMaj.map((d: string, index: number) => (
            <path
              key={`tick-major-${index}`}
              d={d}
              stroke={theme.visualization.getColorByName(tickMajorColor)}
              strokeWidth={tickWidthMajorCalc + 'px'}
            />
          ))}
      </g>
    </g>
  );
};
```

Remove the `dToR` and `line` imports from `gauge_render.tsx` if no longer used there.

- [ ] **Step 3: Update Gauge.tsx to pass new inputs and outputs**

Update the `useTickComputations` call to include geometry:

```typescript
  const { tickAnglesMaj, tickAnglesMin, tickMajorLabels, tickPathsMaj, tickPathsMin } = useTickComputations({
    minValue: options.minValue,
    maxValue: options.maxValue,
    zeroTickAngle: options.zeroTickAngle,
    maxTickAngle: options.maxTickAngle,
    tickSpacingMajor: options.tickSpacingMajor,
    tickSpacingMinor: options.tickSpacingMinor,
    tickMaps: options.tickMapConfig.tickMaps,
    valueScale,
    originX,
    originY,
    tickStartMaj,
    tickStartMin,
    tickLengthMaj: options.tickLengthMaj,
    tickLengthMin: options.tickLengthMin,
  });
```

Update the `ticks` useMemo to use the simplified `renderTicks`:

```typescript
  const ticks = useMemo(
    () =>
      renderTicks(
        tickPathsMaj,
        tickPathsMin,
        tickWidthMajorCalc,
        tickWidthMinorCalc,
        options.tickMajorColor,
        options.tickMinorColor,
        theme2
      ),
    [
      tickPathsMaj,
      tickPathsMin,
      options.tickMinorColor,
      options.tickMajorColor,
      tickWidthMinorCalc,
      tickWidthMajorCalc,
      theme2,
    ]
  );
```

- [ ] **Step 4: Update useTickComputations tests**

Add geometry fields to `defaultOpts` in `useTickComputations.test.ts`:

```typescript
const defaultOpts = {
  minValue: 0,
  maxValue: 100,
  zeroTickAngle: 60,
  maxTickAngle: 300,
  tickSpacingMajor: 10,
  tickSpacingMinor: 1,
  tickMaps: [],
  valueScale: makeScale(0, 100, 60, 300),
  originX: 200,
  originY: 200,
  tickStartMaj: 168,
  tickStartMin: 175,
  tickLengthMaj: 15,
  tickLengthMin: 8,
};
```

Add tests for the new path outputs:

```typescript
  describe('tick paths', () => {
    it('returns pre-computed major tick paths', () => {
      const { result } = renderHook(() => useTickComputations(defaultOpts));
      expect(result.current.tickPathsMaj).toHaveLength(result.current.tickAnglesMaj.length);
      expect(result.current.tickPathsMaj[0]).toMatch(/^M/);
    });

    it('returns pre-computed minor tick paths', () => {
      const { result } = renderHook(() => useTickComputations(defaultOpts));
      expect(result.current.tickPathsMin).toHaveLength(result.current.tickAnglesMin.length);
      expect(result.current.tickPathsMin[0]).toMatch(/^M/);
    });

    it('recomputes paths when geometry changes', () => {
      let opts = { ...defaultOpts };
      const { result, rerender } = renderHook(() => useTickComputations(opts));
      const initialPaths = result.current.tickPathsMaj;

      opts = { ...defaultOpts, originX: 100 };
      rerender();
      expect(result.current.tickPathsMaj).not.toEqual(initialPaths);
    });
  });
```

Also update the d3 mock to include `line`:

```typescript
jest.mock('d3', () => ({
  scaleLinear: () => {
    let domain = [0, 1];
    let range = [0, 1];
    const scale = (val: number) => {
      const ratio = (val - domain[0]) / (domain[1] - domain[0]);
      return range[0] + ratio * (range[1] - range[0]);
    };
    scale.domain = (d: number[]) => { domain = d; return scale; };
    scale.range = (r: number[]) => { range = r; return scale; };
    return scale;
  },
  line: () => {
    return (points: Array<[number, number]>) => {
      if (!points || points.length < 2) {
        return null;
      }
      return `M${points[0][0]},${points[0][1]}L${points[1][0]},${points[1][1]}`;
    };
  },
}));
```

- [ ] **Step 5: Update gauge_render tests**

In `gauge_render.test.tsx`, update `renderTicks` test calls to use the new simplified
signature (pass pre-computed path strings instead of angles/geometry):

```typescript
  describe('renderTicks', () => {
    it('renders major and minor tick marks', () => {
      const result = renderTicks(
        ['M0,0L1,1', 'M2,2L3,3', 'M4,4L5,5'],
        ['M10,10L11,11', 'M12,12L13,13'],
        2, 1, 'black', 'gray', mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const majorPaths = container.querySelector('#majorTickMarks')?.querySelectorAll('path');
      const minorPaths = container.querySelector('#minorTickMarks')?.querySelectorAll('path');
      expect(majorPaths).toHaveLength(3);
      expect(minorPaths).toHaveLength(2);
    });

    it('renders empty groups when no paths provided', () => {
      const result = renderTicks([], [], 2, 1, 'black', 'gray', mockTheme);
      const { container } = render(<svg>{result}</svg>);
      const majorPaths = container.querySelector('#majorTickMarks')?.querySelectorAll('path');
      const minorPaths = container.querySelector('#minorTickMarks')?.querySelectorAll('path');
      expect(majorPaths).toHaveLength(0);
      expect(minorPaths).toHaveLength(0);
    });

    it('applies correct stroke colors', () => {
      const result = renderTicks(
        ['M0,0L1,1'], ['M2,2L3,3'],
        2, 1, 'blue', 'silver', mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const majorPath = container.querySelector('#majorTickMarks path');
      const minorPath = container.querySelector('#minorTickMarks path');
      expect(majorPath?.getAttribute('stroke')).toBe('blue');
      expect(minorPath?.getAttribute('stroke')).toBe('silver');
    });

    it('applies correct stroke widths', () => {
      const result = renderTicks(
        ['M0,0L1,1'], ['M2,2L3,3'],
        3, 1.5, 'black', 'gray', mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const majorPath = container.querySelector('#majorTickMarks path');
      const minorPath = container.querySelector('#minorTickMarks path');
      expect(majorPath?.getAttribute('stroke-width')).toBe('3px');
      expect(minorPath?.getAttribute('stroke-width')).toBe('1.5px');
    });
  });
```

- [ ] **Step 6: Run all checks**

Run: `pnpm typecheck && pnpm lint && pnpm test:ci && pnpm build`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add src/components/Gauge/useTickComputations.ts src/components/Gauge/useTickComputations.test.ts \
  src/components/Gauge/gauge_render.tsx src/components/Gauge/gauge_render.test.tsx \
  src/components/Gauge/Gauge.tsx src/components/Gauge/Gauge.test.tsx
git commit -m "perf: memoize tick path strings in useTickComputations"
```

---

### Task 6: Update changelog and run final verification

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update CHANGELOG.md**

Add under the `### Performance` section of `v2.0.4 (unreleased)`:

```markdown
- Share memoized valueScale across useTickComputations and useNeedleAnimation
- Reuse d3 line() generator instead of recreating per tick
- Pre-compute tick path strings in useTickComputations (skip recomputation on value-only updates)
```

- [ ] **Step 2: Run full verification**

Run: `pnpm typecheck && pnpm lint && pnpm test:ci && pnpm build && pnpm spellcheck`
Expected: All pass

- [ ] **Step 3: Lint markdown**

Run: `npx markdownlint-cli2 CHANGELOG.md AGENTS.md`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update changelog for render optimization"
```

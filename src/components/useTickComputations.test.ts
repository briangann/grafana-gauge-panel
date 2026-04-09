import { renderHook } from '@testing-library/react';

jest.mock('d3', () => ({
  scaleLinear: () => {
    let domain = [0, 1];
    let range = [0, 1];
    const scale = (val: number) => {
      const ratio = (val - domain[0]) / (domain[1] - domain[0]);
      return range[0] + ratio * (range[1] - range[0]);
    };
    scale.domain = (d: number[]) => {
      domain = d;
      return scale;
    };
    scale.range = (r: number[]) => {
      range = r;
      return scale;
    };
    return scale;
  },
}));

import { useTickComputations } from './useTickComputations';

const defaultOpts = {
  minValue: 0,
  maxValue: 100,
  zeroTickAngle: 60,
  maxTickAngle: 300,
  tickSpacingMajor: 10,
  tickSpacingMinor: 1,
  tickMaps: [],
};

describe('useTickComputations', () => {
  describe('tick spacing degrees', () => {
    it('computes major tick spacing in degrees', () => {
      const { result } = renderHook(() => useTickComputations(defaultOpts));
      // range is 240 degrees for 100 value units, so 10 units = 24 degrees
      const { tickAnglesMaj } = result.current;
      // Major ticks should be 24 degrees apart
      if (tickAnglesMaj.length >= 2) {
        const spacing = tickAnglesMaj[1] - tickAnglesMaj[0];
        expect(spacing).toBeCloseTo(24);
      }
    });
  });

  describe('tick angles', () => {
    it('generates major tick angles from zeroTickAngle to maxTickAngle', () => {
      const { result } = renderHook(() => useTickComputations(defaultOpts));
      const { tickAnglesMaj } = result.current;
      expect(tickAnglesMaj.length).toBeGreaterThan(0);
      expect(tickAnglesMaj[0]).toBe(60);
      expect(tickAnglesMaj[tickAnglesMaj.length - 1]).toBeLessThanOrEqual(300);
    });

    it('generates minor tick angles between major ticks', () => {
      const { result } = renderHook(() => useTickComputations(defaultOpts));
      const { tickAnglesMaj, tickAnglesMin } = result.current;
      expect(tickAnglesMin.length).toBeGreaterThan(0);
      // Minor angles should not include any major angle
      for (const minor of tickAnglesMin) {
        expect(tickAnglesMaj).not.toContain(minor);
      }
    });

    it('generates fewer major ticks with larger tick spacing', () => {
      const { result } = renderHook(() =>
        useTickComputations({ ...defaultOpts, tickSpacingMajor: 50 })
      );
      // 0 to 100 by 50 = 3 labels (0, 50, 100)
      expect(result.current.tickAnglesMaj).toHaveLength(3);
    });

    it('generates correct count of major ticks', () => {
      const { result } = renderHook(() => useTickComputations(defaultOpts));
      // 0 to 100 by 10 = 11 labels (0, 10, 20, ..., 100)
      // 60 to 300 by 24 degrees = 11 ticks
      expect(result.current.tickAnglesMaj).toHaveLength(11);
    });
  });

  describe('tick labels', () => {
    it('generates numeric labels matching tick count', () => {
      const { result } = renderHook(() => useTickComputations(defaultOpts));
      expect(result.current.tickMajorLabels).toHaveLength(result.current.tickAnglesMaj.length);
    });

    it('generates labels from minValue to maxValue', () => {
      const { result } = renderHook(() => useTickComputations(defaultOpts));
      const labels = result.current.tickMajorLabels;
      expect(labels[0]).toBe('0');
      expect(labels[labels.length - 1]).toBe('100');
    });

    it('handles decimal tick spacing', () => {
      const { result } = renderHook(() =>
        useTickComputations({ ...defaultOpts, tickSpacingMajor: 0.5, minValue: 0, maxValue: 1 })
      );
      const labels = result.current.tickMajorLabels;
      expect(labels[0]).toBe('0.0');
      expect(labels[1]).toBe('0.5');
      expect(labels[2]).toBe('1.0');
    });

    it('applies tick maps to replace label text', () => {
      const tickMaps = [
        { value: '0', text: 'OFF', label: 'OFF', enabled: true },
        { value: '100', text: 'MAX', label: 'MAX', enabled: true },
      ];
      const { result } = renderHook(() => useTickComputations({ ...defaultOpts, tickMaps }));
      const labels = result.current.tickMajorLabels;
      expect(labels[0]).toBe('OFF');
      expect(labels[labels.length - 1]).toBe('MAX');
      // Middle labels should be unaffected
      expect(labels[5]).toBe('50');
    });

    it('handles inverted range (minValue > maxValue)', () => {
      const { result } = renderHook(() =>
        useTickComputations({ ...defaultOpts, minValue: 100, maxValue: 0 })
      );
      const labels = result.current.tickMajorLabels;
      expect(labels[0]).toBe('100');
      expect(labels[labels.length - 1]).toBe('0');
    });
  });

  describe('reactivity', () => {
    it('recomputes when tickSpacingMajor changes', () => {
      let opts = { ...defaultOpts };
      const { result, rerender } = renderHook(() => useTickComputations(opts));
      const initialCount = result.current.tickAnglesMaj.length;

      opts = { ...defaultOpts, tickSpacingMajor: 20 };
      rerender();

      // 0 to 100 by 20 = 6 labels (0, 20, 40, 60, 80, 100)
      expect(result.current.tickAnglesMaj.length).toBeLessThan(initialCount);
      expect(result.current.tickMajorLabels).toHaveLength(6);
    });

    it('recomputes when min/max values change', () => {
      let opts = { ...defaultOpts };
      const { result, rerender } = renderHook(() => useTickComputations(opts));

      opts = { ...defaultOpts, minValue: 0, maxValue: 50 };
      rerender();

      const labels = result.current.tickMajorLabels;
      expect(labels[0]).toBe('0');
      expect(labels[labels.length - 1]).toBe('50');
    });
  });
});

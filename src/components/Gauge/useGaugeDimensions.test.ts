import { renderHook } from '@testing-library/react';

jest.mock('d3', () => ({}));

import { useGaugeDimensions } from './useGaugeDimensions';

const defaultOpts = {
  gaugeRadius: 200,
  needleWidth: 2,
  ticknessGaugeBasis: 200,
  needleLengthNeg: 0.1,
  tickWidthMajor: 3,
  tickWidthMinor: 1,
  padding: 10,
  edgeWidth: 5,
  tickEdgeGap: 2,
  tickLengthMaj: 15,
  tickLengthMin: 8,
  needleTickGap: 0.05,
  tickLabelFontSize: 12,
};

describe('useGaugeDimensions', () => {
  describe('SVG computed values', () => {
    it('computes SVGSize as gaugeRadius * 2', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      expect(result.current.SVGSize).toBe(400);
    });

    it('computes originX and originY as gaugeRadius', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      expect(result.current.originX).toBe(200);
      expect(result.current.originY).toBe(200);
    });

    it('computes outerEdgeRadius as gaugeRadius - padding', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      expect(result.current.outerEdgeRadius).toBe(190);
    });

    it('computes innerEdgeRadius as gaugeRadius - padding - edgeWidth', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      expect(result.current.innerEdgeRadius).toBe(185);
    });

    it('scales needleWidth by radius / basis ratio', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      // 2 * (200 / 200) = 2
      expect(result.current.needleWidth).toBe(2);
    });

    it('scales needleWidth when radius differs from basis', () => {
      const { result } = renderHook(() => useGaugeDimensions({ ...defaultOpts, gaugeRadius: 100 }));
      // 2 * (100 / 200) = 1
      expect(result.current.needleWidth).toBe(1);
    });

    it('scales tickWidthMajorCalc by radius / basis ratio', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      // 3 * (200 / 200) = 3
      expect(result.current.tickWidthMajorCalc).toBe(3);
    });

    it('scales tickWidthMinorCalc by radius / basis ratio', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      // 1 * (200 / 200) = 1
      expect(result.current.tickWidthMinorCalc).toBe(1);
    });
  });

  describe('effect-computed values', () => {
    it('computes needlePathStart as negative needleLengthNegCalc', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      // needleLengthNegCalc = 200 * 0.1 = 20, so needlePathStart = -20
      expect(result.current.needlePathStart).toBe(-20);
    });

    it('computes needlePathLength', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      // needleLengthNegCalc = 20
      // needleLenPosCalc = 200 - 10 - 5 - 2 - 15 - (0.05 * 200) = 200 - 42 = 158
      // needlePathLength = 20 + 158 = 178
      expect(result.current.needlePathLength).toBe(178);
    });

    it('computes tickStartMaj', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      // 200 - 10 - 5 - 2 - 15 = 168
      expect(result.current.tickStartMaj).toBe(168);
    });

    it('computes tickStartMin', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      // 200 - 10 - 5 - 2 - 8 = 175
      expect(result.current.tickStartMin).toBe(175);
    });

    it('computes labelStart as tickStartMaj minus scaled font size', () => {
      const { result } = renderHook(() => useGaugeDimensions(defaultOpts));
      // tickStartMaj = 168
      // scaleLabelFontSize(12, 200, 200) = 12
      // labelStart = 168 - 12 * 1.3 = 152.4
      expect(result.current.labelStart).toBeCloseTo(152.4);
    });
  });

  describe('reactivity', () => {
    it('recomputes SVG values when gaugeRadius changes', () => {
      let opts = { ...defaultOpts };
      const { result, rerender } = renderHook(() => useGaugeDimensions(opts));
      expect(result.current.SVGSize).toBe(400);

      opts = { ...defaultOpts, gaugeRadius: 100 };
      rerender();
      expect(result.current.SVGSize).toBe(200);
      expect(result.current.originX).toBe(100);
    });

    it('recomputes effect values when tickLengthMaj changes', () => {
      let opts = { ...defaultOpts };
      const { result, rerender } = renderHook(() => useGaugeDimensions(opts));
      expect(result.current.tickStartMaj).toBe(168);

      opts = { ...defaultOpts, tickLengthMaj: 20 };
      rerender();
      // 200 - 10 - 5 - 2 - 20 = 163
      expect(result.current.tickStartMaj).toBe(163);
    });
  });
});

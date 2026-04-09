import { renderHook } from '@testing-library/react';

// Track calls to the D3 transition chain
const mockAttrTween = jest.fn();
const mockEase = jest.fn().mockReturnValue({ attrTween: mockAttrTween });
const mockDuration = jest.fn().mockReturnValue({ ease: mockEase });
const mockTransition = jest.fn().mockReturnValue({ duration: mockDuration });
const mockSelect = jest.fn().mockReturnValue({ transition: mockTransition });

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
  interpolateString: (a: string, b: string) => {
    return (t: number) => (t === 0 ? a : b);
  },
  select: (...args: unknown[]) => mockSelect(...args),
}));

jest.mock('d3-ease', () => ({
  easeQuadIn: (t: number) => t * t,
}));

import { useNeedleAnimation } from './useNeedleAnimation';

const defaultOpts = {
  displayValue: 50,
  minValue: 0,
  maxValue: 100,
  zeroTickAngle: 60,
  maxTickAngle: 300,
  zeroNeedleAngle: 60,
  maxNeedleAngle: 300,
  allowNeedleCrossLimits: false,
  needleCrossLimitDegrees: 5,
  animateNeedleValueTransition: true,
  animateNeedleValueTransitionSpeed: 500,
  originX: 200,
  originY: 200,
  needlePathStart: -20,
  needlePathLength: 178,
};

describe('useNeedleAnimation', () => {
  let mockElement: Partial<SVGPathElement>;
  let needleRef: React.RefObject<SVGPathElement>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockElement = {
      setAttribute: jest.fn(),
    };
    needleRef = { current: mockElement as SVGPathElement } as React.RefObject<SVGPathElement>;
  });

  describe('first render', () => {
    it('snaps to position with duration 0 on first render', () => {
      renderHook(() => useNeedleAnimation(needleRef, defaultOpts));

      expect(mockSelect).toHaveBeenCalledWith(mockElement);
      expect(mockTransition).toHaveBeenCalled();
      expect(mockDuration).toHaveBeenCalledWith(0);
    });

    it('calls attrTween with transform rotation', () => {
      renderHook(() => useNeedleAnimation(needleRef, defaultOpts));

      expect(mockAttrTween).toHaveBeenCalledWith('transform', expect.any(Function));
    });
  });

  describe('value transitions', () => {
    it('uses configured transition speed on subsequent renders', () => {
      let opts = { ...defaultOpts, displayValue: 50 };
      const { rerender } = renderHook(() => useNeedleAnimation(needleRef, opts));

      jest.clearAllMocks();
      opts = { ...defaultOpts, displayValue: 75 };
      rerender();

      expect(mockDuration).toHaveBeenCalledWith(500);
    });

    it('uses 0 duration when animation is disabled', () => {
      let opts = { ...defaultOpts, displayValue: 50 };
      const { rerender } = renderHook(() => useNeedleAnimation(needleRef, opts));

      jest.clearAllMocks();
      opts = { ...defaultOpts, displayValue: 75, animateNeedleValueTransition: false };
      rerender();

      expect(mockDuration).toHaveBeenCalledWith(0);
    });

    it('uses custom transition speed', () => {
      let opts = { ...defaultOpts, displayValue: 50 };
      const { rerender } = renderHook(() => useNeedleAnimation(needleRef, opts));

      jest.clearAllMocks();
      opts = { ...defaultOpts, displayValue: 75, animateNeedleValueTransitionSpeed: 1000 };
      rerender();

      expect(mockDuration).toHaveBeenCalledWith(1000);
    });
  });

  describe('guard conditions', () => {
    it('skips animation when displayValue is NaN', () => {
      renderHook(() => useNeedleAnimation(needleRef, { ...defaultOpts, displayValue: NaN }));

      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('skips animation when needleRef.current is null', () => {
      const nullRef = { current: null } as React.RefObject<SVGPathElement>;
      renderHook(() => useNeedleAnimation(nullRef, defaultOpts));

      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  describe('value clamping', () => {
    it('clamps value above maxValue when cross-limits disabled', () => {
      renderHook(() =>
        useNeedleAnimation(needleRef, { ...defaultOpts, displayValue: 150, allowNeedleCrossLimits: false })
      );

      // Should still call the transition (animates to clamped position)
      expect(mockSelect).toHaveBeenCalled();
      expect(mockTransition).toHaveBeenCalled();
    });

    it('clamps value below minValue when cross-limits disabled', () => {
      renderHook(() =>
        useNeedleAnimation(needleRef, { ...defaultOpts, displayValue: -50, allowNeedleCrossLimits: false })
      );

      expect(mockSelect).toHaveBeenCalled();
      expect(mockTransition).toHaveBeenCalled();
    });
  });

  describe('buried needle behavior', () => {
    it('skips animation when needle stays buried at max', () => {
      let opts = { ...defaultOpts, displayValue: 150, allowNeedleCrossLimits: true };
      const { rerender } = renderHook(() => useNeedleAnimation(needleRef, opts));

      jest.clearAllMocks();
      opts = { ...defaultOpts, displayValue: 200, allowNeedleCrossLimits: true };
      rerender();

      // Both values exceed max, needle should stay buried — no transition call
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('skips animation when needle stays buried at min', () => {
      let opts = { ...defaultOpts, displayValue: -50, allowNeedleCrossLimits: true };
      const { rerender } = renderHook(() => useNeedleAnimation(needleRef, opts));

      jest.clearAllMocks();
      opts = { ...defaultOpts, displayValue: -100, allowNeedleCrossLimits: true };
      rerender();

      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('animates when value returns from buried max to in-range', () => {
      let opts = { ...defaultOpts, displayValue: 150, allowNeedleCrossLimits: true };
      const { rerender } = renderHook(() => useNeedleAnimation(needleRef, opts));

      jest.clearAllMocks();
      opts = { ...defaultOpts, displayValue: 50, allowNeedleCrossLimits: true };
      rerender();

      expect(mockSelect).toHaveBeenCalled();
      expect(mockDuration).toHaveBeenCalledWith(500);
    });

    it('animates when value returns from buried min to in-range', () => {
      let opts = { ...defaultOpts, displayValue: -50, allowNeedleCrossLimits: true };
      const { rerender } = renderHook(() => useNeedleAnimation(needleRef, opts));

      jest.clearAllMocks();
      opts = { ...defaultOpts, displayValue: 50, allowNeedleCrossLimits: true };
      rerender();

      expect(mockSelect).toHaveBeenCalled();
      expect(mockDuration).toHaveBeenCalledWith(500);
    });
  });

  describe('restore transform effect', () => {
    it('sets transform attribute when needlePathStart changes', () => {
      let opts = { ...defaultOpts };
      const { rerender } = renderHook(() => useNeedleAnimation(needleRef, opts));

      (mockElement.setAttribute as jest.Mock).mockClear();
      opts = { ...defaultOpts, needlePathStart: -30 };
      rerender();

      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'transform',
        expect.stringContaining('rotate(')
      );
    });

    it('sets transform attribute when needlePathLength changes', () => {
      let opts = { ...defaultOpts };
      const { rerender } = renderHook(() => useNeedleAnimation(needleRef, opts));

      (mockElement.setAttribute as jest.Mock).mockClear();
      opts = { ...defaultOpts, needlePathLength: 200 };
      rerender();

      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'transform',
        expect.stringContaining('rotate(')
      );
    });

    it('does not set transform when needleRef is null', () => {
      const nullRef = { current: null } as React.RefObject<SVGPathElement>;
      renderHook(() => useNeedleAnimation(nullRef, defaultOpts));

      // No setAttribute should be called on a null ref
      expect(mockElement.setAttribute).not.toHaveBeenCalled();
    });
  });
});

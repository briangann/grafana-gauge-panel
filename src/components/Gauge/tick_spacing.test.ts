import { computeTickSpacing } from './tick_spacing';

describe('computeTickSpacing', () => {
  describe('nice number rounding', () => {
    it('returns exact spacing when range divides evenly', () => {
      const result = computeTickSpacing(0, 100);
      expect(result.majorSpacing).toBe(10);
      expect(result.minorSpacing).toBe(2);
    });

    it('rounds to nearest nice number for uneven ranges', () => {
      const result = computeTickSpacing(0, 255);
      // 255 / 10 = 25.5, nearest nice number is 20
      expect(result.majorSpacing).toBe(20);
      expect(result.minorSpacing).toBe(4);
    });

    it('handles very large ranges', () => {
      const result = computeTickSpacing(0, 6_000_000_000);
      // 6e9 / 10 = 6e8, nearest nice number is 500_000_000
      expect(result.majorSpacing).toBe(500_000_000);
      expect(result.minorSpacing).toBe(100_000_000);
    });

    it('handles ranges in the millions', () => {
      const result = computeTickSpacing(0, 100_000_000);
      expect(result.majorSpacing).toBe(10_000_000);
      expect(result.minorSpacing).toBe(2_000_000);
    });

    it('handles small fractional ranges', () => {
      const result = computeTickSpacing(0, 1);
      // 1 / 10 = 0.1, nice number is 0.1
      expect(result.majorSpacing).toBe(0.1);
      expect(result.minorSpacing).toBeCloseTo(0.02);
    });

    it('handles very small ranges', () => {
      const result = computeTickSpacing(0, 0.001);
      expect(result.majorSpacing).toBe(0.0001);
      expect(result.minorSpacing).toBeCloseTo(0.00002);
    });

    it('rounds 3.5 interval to 5 (nearest nice number)', () => {
      // range=35, raw=3.5 -> nice=5
      const result = computeTickSpacing(0, 35);
      expect(result.majorSpacing).toBe(5);
      expect(result.minorSpacing).toBe(1);
    });

    it('rounds 1.5 interval to 2 (nearest nice number)', () => {
      // range=15, raw=1.5 -> nice=2
      const result = computeTickSpacing(0, 15);
      expect(result.majorSpacing).toBe(2);
      expect(result.minorSpacing).toBeCloseTo(0.4);
    });
  });

  describe('custom target ticks', () => {
    it('accepts custom targetMajorTicks', () => {
      const result = computeTickSpacing(0, 100, 5);
      // 100 / 5 = 20, nice number is 20
      expect(result.majorSpacing).toBe(20);
      expect(result.minorSpacing).toBe(4);
    });

    it('produces fewer ticks with smaller target', () => {
      const few = computeTickSpacing(0, 100, 3);
      const many = computeTickSpacing(0, 100, 20);
      expect(few.majorSpacing).toBeGreaterThan(many.majorSpacing);
    });
  });

  describe('non-zero min values', () => {
    it('handles offset ranges', () => {
      const result = computeTickSpacing(200, 300);
      expect(result.majorSpacing).toBe(10);
      expect(result.minorSpacing).toBe(2);
    });

    it('handles negative min values', () => {
      const result = computeTickSpacing(-50, 50);
      expect(result.majorSpacing).toBe(10);
      expect(result.minorSpacing).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('returns fallback for zero range', () => {
      const result = computeTickSpacing(100, 100);
      expect(result.majorSpacing).toBe(1);
      expect(result.minorSpacing).toBeCloseTo(0.2);
    });

    it('handles inverted range (min > max)', () => {
      const result = computeTickSpacing(100, 0);
      expect(result.majorSpacing).toBe(10);
      expect(result.minorSpacing).toBe(2);
    });
  });
});

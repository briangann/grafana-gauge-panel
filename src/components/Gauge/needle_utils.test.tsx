import { getNeedleAngleMaximum, getNeedleAngleMinimum } from './needle_utils';
describe('Needle Utils', () => {
  const crossLimitDegree = 5;
  describe('Check Min Needle Angle with cross limits disabled', () => {
    it('minimum angle should be at min', () => {
      const atZero = getNeedleAngleMinimum(false, 0, 90, 90, 5);
      expect(atZero).toEqual(0);
      const aboveZero = getNeedleAngleMinimum(false, 30, 90, 90, 5);
      expect(aboveZero).toEqual(30);
      const belowZero = getNeedleAngleMinimum(false, -10, 90, 90, 5);
      expect(belowZero).toEqual(90);
      // this will return a value beyond the max (270), and will be caught by code logic
      const aboveMax = getNeedleAngleMinimum(false, 300, 90, 90, 5);
      expect(aboveMax).toEqual(300);
    });
  });
  describe('Check Min Needle Angle with cross limits enabled', () => {
    it('minimum angle should be bound by min with limit cross of 5 degrees', () => {
      const belowZero = getNeedleAngleMinimum(true, -10, 90, 90, crossLimitDegree);
      expect(belowZero).toEqual(-5);
      const atZero = getNeedleAngleMinimum(true, 0, 90, 90, crossLimitDegree);
      expect(atZero).toEqual(0);
      const aboveZero = getNeedleAngleMinimum(true, 30, 90, 90, crossLimitDegree);
      expect(aboveZero).toEqual(30);
      const aboveMax = getNeedleAngleMinimum(true, 300, 90, 90, crossLimitDegree);
      expect(aboveMax).toEqual(300);
    });
  });

  describe('Check Max Needle Angle with cross limits disabled', () => {
    it('max angle should be bound by maxTickAngle', () => {
      const atMax = getNeedleAngleMaximum(false, 270, 90, 90, 270, 270, crossLimitDegree);
      expect(atMax).toEqual(180);
      const belowMax = getNeedleAngleMaximum(false, 30, 90, 90, 270, 270, crossLimitDegree);
      expect(belowMax).toEqual(-60);
      const aboveMax = getNeedleAngleMaximum(false, 300, 90, 90, 270, 270, crossLimitDegree);
      expect(aboveMax).toEqual(180);
    });
  });
  describe('Check Max Needle Angle with cross limits enabled', () => {
    it('max angle should be bound by max with limit cross of 5 degrees', () => {
      const atMax = getNeedleAngleMaximum(true, 270, 90, 90, 270, 270, crossLimitDegree);
      expect(atMax).toEqual(185);
      const belowMax = getNeedleAngleMaximum(true, 30, 90, 90, 270, 270, crossLimitDegree);
      expect(belowMax).toEqual(-60);
      const aboveMax = getNeedleAngleMaximum(true, 275, 90, 90, 270, 270, crossLimitDegree);
      expect(aboveMax).toEqual(185);
      const aboveMax2 = getNeedleAngleMaximum(true, 320, 90, 90, 270, 270, crossLimitDegree);
      expect(aboveMax2).toEqual(185);
    });
  });

  describe('Inverted range: Check Min Needle Angle with cross limits disabled', () => {
    // Inverted range: minValue=0, maxValue=-20
    // Angles are the same (zeroTickAngle=90, maxTickAngle=270)
    // d3 scale maps 0->90, -20->270, so angles stay in the same range
    it('minimum angle should be at min (same as normal range)', () => {
      const atZero = getNeedleAngleMinimum(false, 0, 90, 90, 5);
      expect(atZero).toEqual(0);
      const aboveZero = getNeedleAngleMinimum(false, 30, 90, 90, 5);
      expect(aboveZero).toEqual(30);
      const belowZero = getNeedleAngleMinimum(false, -10, 90, 90, 5);
      expect(belowZero).toEqual(90);
    });
  });

  describe('Inverted range: Check Min Needle Angle with cross limits enabled', () => {
    it('minimum angle should allow crossing by crossLimitDegrees', () => {
      const belowZero = getNeedleAngleMinimum(true, -10, 90, 90, 5);
      expect(belowZero).toEqual(-5);
      const atZero = getNeedleAngleMinimum(true, 0, 90, 90, 5);
      expect(atZero).toEqual(0);
    });
  });

  describe('Inverted range: Check Max Needle Angle with cross limits disabled', () => {
    it('max angle should be bound by maxTickAngle', () => {
      const atMax = getNeedleAngleMaximum(false, 270, 90, 90, 270, 270, 5);
      expect(atMax).toEqual(180);
      const aboveMax = getNeedleAngleMaximum(false, 300, 90, 90, 270, 270, 5);
      expect(aboveMax).toEqual(180);
    });
  });

  describe('Inverted range: Check Max Needle Angle with cross limits enabled', () => {
    it('max angle should allow crossing by crossLimitDegrees', () => {
      const atMax = getNeedleAngleMaximum(true, 270, 90, 90, 270, 270, 5);
      expect(atMax).toEqual(185);
      const aboveMax = getNeedleAngleMaximum(true, 300, 90, 90, 270, 270, 5);
      expect(aboveMax).toEqual(185);
    });
  });

  describe('Edge cases for cross-limit clamping', () => {
    describe('getNeedleAngleMinimum — cross limits enabled, angle >= zeroTickAngle but sum < zeroTickAngle', () => {
      it('returns zeroNeedleAngle when needleAngle >= zeroTickAngle', () => {
        // needleAngle=91, zeroNeedleAngle=-5, zeroTickAngle=90
        // 91 + (-5) = 86 < 90 → enters outer if
        // allowNeedleCrossLimits = true → enters inner if
        // 91 < 90 is false → hits else branch (line 35): returns zeroNeedleAngle
        const result = getNeedleAngleMinimum(true, 91, 90, -5, 5);
        expect(result).toEqual(-5);
      });
    });

    describe('getNeedleAngleMaximum — cross limits enabled, maxTickAngle near 360', () => {
      it('returns maxNeedleAngle - zeroNeedleAngle when maxTickAngle >= 360 - crossLimitDegree', () => {
        // maxTickAngle=356, crossLimitDegree=5, 360-5=355, 356 >= 355 → true → line 64
        // needleAngle=300, zeroTickAngle=60, maxTickAngle=356, zeroNeedleAngle=60, maxNeedleAngle=356
        // 300 + 60 = 360 > 356 → enters outer if
        // allowNeedleCrossLimits = true → enters inner if
        // testMaxAngle = 360 > 356 → enters next if
        // 356 < 355 is false → hits line 64: returns 356 - 60 = 296
        const result = getNeedleAngleMaximum(true, 300, 60, 60, 356, 356, 5);
        expect(result).toEqual(296);
      });
    });
  });
});

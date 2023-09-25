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
      const atMax = getNeedleAngleMaximum(false, 270, 90, 90, 270, crossLimitDegree);
      expect(atMax).toEqual(180);
      const belowMax = getNeedleAngleMaximum(false, 30, 90, 90, 270, crossLimitDegree);
      expect(belowMax).toEqual(-60);
      const aboveMax = getNeedleAngleMaximum(false, 300, 90, 90, 270, crossLimitDegree);
      expect(aboveMax).toEqual(180);
    });
  });
  describe('Check Max Needle Angle with cross limits enabled', () => {
    it('max angle should be bound by max with limit cross of 5 degrees', () => {
      const atMax = getNeedleAngleMaximum(true, 270, 90, 90, 270, crossLimitDegree);
      expect(atMax).toEqual(185);
      const belowMax = getNeedleAngleMaximum(true, 30, 90, 90, 270, crossLimitDegree);
      expect(belowMax).toEqual(-60);
      const aboveMax = getNeedleAngleMaximum(true, 275, 90, 90, 270, crossLimitDegree);
      expect(aboveMax).toEqual(185);
      const aboveMax2 = getNeedleAngleMaximum(true, 320, 90, 90, 270, crossLimitDegree);
      expect(aboveMax2).toEqual(185);
    });
  });

});

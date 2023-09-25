
import React from 'react';

/**
 * getNeedleAngleMinimum
 *
 * Needle Angle passed in is relative to the "zeroNeedleAngle"
 *
 * To get the actual angle to be used this value is added to the zeroNeedleAngle
 *
 * If the value is "below" the zeroNeedleAngle, the returned value is just the zeroNeedleAngle
 * If "burying the needle" is allowed, then the angle returned will be the zeroNeedleAngle minus 5 degrees.\
 *  - if the value is less than zero, just the zeroNeedleAngle is returned
 *
 * @param allowNeedleCrossLimits boolean
 * @param needleAngle angle to test
 * @param zeroTickAngle angle where the tick label starts
 * @param zeroNeedleAngle angle where the needle starts
 * @param crossLimitDegree how far to cross limits
 * @returns angle to be used (absolute angle, no longer relative)
 */
export const getNeedleAngleMinimum =
  (allowNeedleCrossLimits: boolean, needleAngle: number, zeroTickAngle: number, zeroNeedleAngle: number, crossLimitDegree: number) => {
    // check if the needleAngle is below the zeroTickAngle
    if (needleAngle + zeroNeedleAngle < zeroTickAngle) {
      // check if burying the needle is enabled
      if (allowNeedleCrossLimits) {
        if (needleAngle < zeroTickAngle) {
          return (-crossLimitDegree);
        } else {
          return (zeroNeedleAngle);
        }
      } else {
        return (zeroNeedleAngle);
      }
    }
    return needleAngle;
  };

export const getNeedleAngleMaximum = (allowNeedleCrossLimits: boolean, needleAngle: number, zeroTickAngle: number, zeroNeedleAngle: number, maxTickAngle: number, crossLimitDegree: number) => {
  // angle passed in is relative to zeroTickAngle
  if (needleAngle + zeroTickAngle > maxTickAngle) {
    if (allowNeedleCrossLimits) {
      // check if the needle can be extended beyond max (it is less than 360)
      const testMaxAngle = needleAngle + zeroTickAngle;
      // console.log(`testMaxAngle = ${testMaxAngle}`);
      if (testMaxAngle > maxTickAngle) {
        // make sure it is not above 360 minus cross limit
        if (maxTickAngle < (360 - crossLimitDegree)) {
          // allow it to be set to maxTickAngle plus 5 degrees, without going below zero
          return (maxTickAngle + crossLimitDegree - zeroNeedleAngle);
        } else {
          // console.log(`needle cannot be buried beyond maxNeedleAngle ${testMaxAngle}`);
          return (maxTickAngle - zeroNeedleAngle);
        }
      }
    } else {
      return (maxTickAngle - zeroNeedleAngle);
    }
  }
  return (needleAngle - zeroNeedleAngle);
};

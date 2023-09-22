
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
 * @param crossLimitDegree how far to cross limits
 * @returns angle to be used (relative to the zeroNeedleAnge)
 */
export const getNeedleAngleMinimum =
  (allowNeedleCrossLimits: boolean, needleAngle: number, zeroTickAngle: number, crossLimitDegree: number) => {
    // the angle is relative to the zeroNeedleAngle
    // check if the needleAngle is below the zeroNeedleAngle
    if (needleAngle + zeroTickAngle < zeroTickAngle) {
      // check if burying the needle is enabled
      if (allowNeedleCrossLimits) {
        // make sure it is not below zero when accounting for the zeroNeedleAngle
        if (zeroTickAngle >= crossLimitDegree) {
          // allow it to be set to zeroTickAngle minus 5 degrees, without going below zerp
          return (-crossLimitDegree);
        } else {
          return (zeroTickAngle);
        }
      } else {
        return (zeroTickAngle);
      }
    }
    return needleAngle;
  };

export const getNeedleAngleMaximum = (allowNeedleCrossLimits: boolean, needleAngle: number, zeroTickAngle: number, maxTickAngle: number, crossLimitDegree: number) => {
  // angle passed in is relative to zeroTickAngle
  let needleAngleFinal = needleAngle;
  if (needleAngle + zeroTickAngle > maxTickAngle) {
    if (allowNeedleCrossLimits) {
      // check if the needle can be extended beyond max (it is less than 360)
      const testMaxAngle = needleAngle + zeroTickAngle;
      // console.log(`testMaxAngle = ${testMaxAngle}`);
      if (testMaxAngle > maxTickAngle) {
        // make sure it is not above 360 minus cross limit
        if (maxTickAngle < (360 - crossLimitDegree)) {
          // allow it to be set to maxTickAngle plus 5 degrees, without going below zerp
          needleAngleFinal = maxTickAngle + crossLimitDegree;
        } else {
          // console.log(`needle cannot be buried beyond maxNeedleAngle ${testMaxAngle}`);
          needleAngleFinal = maxTickAngle;
        }
      }
    } else {
      needleAngleFinal = maxTickAngle;
    }
  }
  // remove the zeroTickAngle to get the relative value again
  needleAngleFinal -= zeroTickAngle;
  return needleAngleFinal;
};

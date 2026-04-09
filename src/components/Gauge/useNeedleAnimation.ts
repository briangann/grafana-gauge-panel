import { useEffect, useRef } from 'react';

import { interpolateString, select, type ScaleLinear } from 'd3';
import { easeQuadIn } from 'd3-ease';

import { getNeedleAngleMaximum, getNeedleAngleMinimum } from './needle_utils';

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

export const useNeedleAnimation = (needleRef: React.RefObject<SVGPathElement>, opts: NeedleAnimationOptions) => {
  const lastNeedleAngleRef = useRef<number | null>(null);

  // Animate the needle to the current displayValue
  useEffect(() => {
    if (opts.displayValue === null || isNaN(opts.displayValue)) {
      return;
    }
    if (!needleRef.current) {
      return;
    }

    let newVal = opts.displayValue;

    // Clamp value to bounds when cross-limits are disabled (still animate to clamped position)
    if (!opts.allowNeedleCrossLimits) {
      const lowerBound = Math.min(opts.minValue, opts.maxValue);
      const upperBound = Math.max(opts.minValue, opts.maxValue);
      newVal = Math.max(lowerBound, Math.min(upperBound, newVal));
    }

    const valueScale = opts.valueScale;

    const newScaleVal = valueScale(newVal);
    let needleAngleNew = newScaleVal !== undefined ? newScaleVal - opts.zeroNeedleAngle : 0;

    // Apply cross-limit angle clamping, tracking which limit was hit
    let newClampedAt: 'max' | 'min' | null = null;
    if (needleAngleNew + opts.zeroNeedleAngle > opts.maxTickAngle) {
      needleAngleNew = getNeedleAngleMaximum(
        opts.allowNeedleCrossLimits,
        needleAngleNew,
        opts.zeroTickAngle,
        opts.zeroNeedleAngle,
        opts.maxTickAngle,
        opts.maxNeedleAngle,
        opts.needleCrossLimitDegrees
      );
      newClampedAt = 'max';
    }
    if (needleAngleNew + opts.zeroNeedleAngle < opts.zeroTickAngle) {
      needleAngleNew = getNeedleAngleMinimum(
        opts.allowNeedleCrossLimits,
        needleAngleNew,
        opts.zeroTickAngle,
        opts.zeroNeedleAngle,
        opts.needleCrossLimitDegrees
      );
      newClampedAt = 'min';
    }

    // On first render (ref is null), snap immediately with no animation
    const isFirstRender = lastNeedleAngleRef.current === null;
    let needleAngleOld = lastNeedleAngleRef.current ?? needleAngleNew;

    // Clamp the old angle using the same cross-limit logic as the new angle
    let oldClampedAt: 'max' | 'min' | null = null;
    if (needleAngleOld + opts.zeroNeedleAngle > opts.maxTickAngle) {
      needleAngleOld = getNeedleAngleMaximum(
        opts.allowNeedleCrossLimits,
        needleAngleOld,
        opts.zeroTickAngle,
        opts.zeroNeedleAngle,
        opts.maxTickAngle,
        opts.maxNeedleAngle,
        opts.needleCrossLimitDegrees
      );
      oldClampedAt = 'max';
    }
    if (needleAngleOld + opts.zeroNeedleAngle < opts.zeroTickAngle) {
      needleAngleOld = getNeedleAngleMinimum(
        opts.allowNeedleCrossLimits,
        needleAngleOld,
        opts.zeroTickAngle,
        opts.zeroNeedleAngle,
        opts.needleCrossLimitDegrees
      );
      oldClampedAt = 'min';
    }

    // Skip animation if both old and new angles are clamped to the same limit
    if (!isFirstRender && newClampedAt !== null && newClampedAt === oldClampedAt) {
      lastNeedleAngleRef.current = needleAngleNew;
      return;
    }

    let transitionSpeed = 0;
    if (!isFirstRender && opts.animateNeedleValueTransition) {
      transitionSpeed = opts.animateNeedleValueTransitionSpeed;
    }

    // Update the ref before starting the transition so mid-transition
    // interruptions use the correct target angle
    lastNeedleAngleRef.current = needleAngleNew;

    const needlePath = select(needleRef.current);
    const needleCentre = opts.originX + ',' + opts.originY;

    needlePath
      .transition()
      .duration(transitionSpeed)
      .ease(easeQuadIn)
      .attrTween('transform', () => {
        return interpolateString(
          'rotate(' + needleAngleOld + ',' + needleCentre + ')',
          'rotate(' + needleAngleNew + ',' + needleCentre + ')'
        );
      });
  }, [
    opts.displayValue,
    opts.originX,
    opts.originY,
    opts.minValue,
    opts.maxValue,
    opts.valueScale,
    opts.zeroTickAngle,
    opts.maxTickAngle,
    opts.zeroNeedleAngle,
    opts.maxNeedleAngle,
    opts.animateNeedleValueTransition,
    opts.animateNeedleValueTransitionSpeed,
    opts.allowNeedleCrossLimits,
    opts.needleCrossLimitDegrees,
    needleRef,
  ]);

};

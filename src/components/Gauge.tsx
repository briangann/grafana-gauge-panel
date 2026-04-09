import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useStyles2, useTheme2 } from '@grafana/ui';
import { getActiveThreshold, GrafanaTheme2 } from '@grafana/data';

import { GaugeOptions } from './types';
import { TickMapItemType } from './TickMaps/types';
import { scaleLinear, interpolateString, select } from 'd3';
import { easeQuadIn } from 'd3-ease';

import { createNeedleMarkers, labelYCalc } from './utils';
import { getNeedleAngleMaximum, getNeedleAngleMinimum } from './needle_utils';
import {
  renderCircleGroup,
  renderMajorTickLabels,
  renderNeedle,
  renderThresholdBands,
  renderTicks,
  renderTitleLabel,
  renderValueLabel,
  scaleLabelFontSize,
} from './gauge_render';
import { getWrapperStyles, getSVGStyles } from './gauge_styles';

export const Gauge: React.FC<GaugeOptions> = (options) => {
  // pull in styles
  const divStyles = useStyles2(getWrapperStyles);
  const svgStyles = useStyles2(getSVGStyles);
  // need a Ref to the needle to update it
  const needleRef = useRef<SVGPathElement>(null);
  // tracks the last target angle (in degrees) the needle was animated to
  const lastNeedleAngleRef = useRef<number | null>(null);
  // pull in theme reference
  const theme2 = useTheme2();

  // if (options.processedData && options.processedData.length === 0) {
  //   return <div className={noTriggerTextStyles}>{options.globalDisplayTextTriggeredEmpty}</div>;
  // }
  const [needlePathLength, setNeedlePathLength] = useState(0);
  const [needlePathStart, setNeedlePathStart] = useState(0);
  const [tickStartMaj, setTickStartMaj] = useState(0);
  const [tickStartMin, setTickStartMin] = useState(0);
  const [labelStart, setLabelStart] = useState(0);
  //
  const {
    SVGSize,
    needleWidth,
    needleLengthNegCalc,
    tickWidthMajorCalc,
    tickWidthMinorCalc,
    outerEdgeRadius,
    innerEdgeRadius,
    originX,
    originY,
  } = useMemo(
    () => ({
      SVGSize: options.gaugeRadius * 2,
      needleWidth: options.needleWidth * (options.gaugeRadius / options.ticknessGaugeBasis),
      needleLengthNegCalc: options.gaugeRadius * options.needleLengthNeg,
      tickWidthMajorCalc: options.tickWidthMajor * (options.gaugeRadius / options.ticknessGaugeBasis),
      tickWidthMinorCalc: options.tickWidthMinor * (options.gaugeRadius / options.ticknessGaugeBasis),
      outerEdgeRadius: options.gaugeRadius - options.padding,
      innerEdgeRadius: options.gaugeRadius - options.padding - options.edgeWidth,
      originX: options.gaugeRadius,
      originY: options.gaugeRadius,
    }),
    [
      options.gaugeRadius,
      options.needleWidth,
      options.ticknessGaugeBasis,
      options.needleLengthNeg,
      options.tickWidthMajor,
      options.tickWidthMinor,
      options.padding,
      options.edgeWidth,
    ]
  );

  /*
  useEffect(() => {
    console.log(`presetIndex set to ${options.presetIndex}`);
    options.innerColor = GaugePresetOptions[options.presetIndex].faceColor;
  }, [options]);
  */

  const generateTickMajorLabels = (
    zeroTickAngle: number,
    maxTickAngle: number,
    minValue: number,
    maxValue: number,
    tickSpacingMajor: number,
    majorDegree: number,
    tickMaps: TickMapItemType[]
  ) => {
    let counter = 0;
    const tickLabelText: string[] = [];
    for (let k = zeroTickAngle; k <= maxTickAngle; k = k + majorDegree) {
      const step = minValue <= maxValue ? tickSpacingMajor : -tickSpacingMajor;
      const tickValue = minValue + step * counter;
      const parts = tickSpacingMajor.toString().split('.');
      let tickText = tickValue.toString();
      if (parts.length > 1) {
        tickText = Number(tickValue).toFixed(parts[1].length).toString();
      }
      const tickTextFloat = parseFloat(tickText);
      for (const aTickMap of tickMaps) {
        if (parseFloat(aTickMap.value) === tickTextFloat) {
          tickText = aTickMap.text;
          break;
        }
      }
      tickLabelText.push(tickText);
      counter++;
    }
    return tickLabelText;
  };

  const generateTickAngles = (
    zeroTickAngle: number,
    maxTickAngle: number,
    majorDegree: number,
    minorDegree: number
  ) => {
    const majorAngles: number[] = [];
    let counter = 0;
    for (let i = zeroTickAngle; i <= maxTickAngle; i = i + majorDegree) {
      const tickAngle = zeroTickAngle + majorDegree * counter;
      if (tickAngle - zeroTickAngle < 360) {
        majorAngles.push(zeroTickAngle + majorDegree * counter);
      }
      counter++;
    }
    const minorAngles: number[] = [];
    counter = 0;
    for (let j = zeroTickAngle; j <= maxTickAngle; j = j + minorDegree) {
      let exists = 0;
      majorAngles.forEach((d: number) => {
        if (zeroTickAngle + minorDegree * counter === d) {
          exists = 1;
        }
      });
      if (exists === 0) {
        minorAngles.push(zeroTickAngle + minorDegree * counter);
      }
      counter++;
    }
    return { tickMaj: majorAngles, tickMin: minorAngles };
  };

  const tickSpacingMajDeg = useMemo(() => {
    const tickSpacingMajor = options.tickSpacingMajor ?? 10;
    const valueScale = scaleLinear()
      .domain([options.minValue, options.maxValue])
      .range([options.zeroTickAngle, options.maxTickAngle]);
    const scaleZero = valueScale(0) ?? 0;
    const majorA = valueScale(tickSpacingMajor) ?? 0;
    return Math.abs(majorA - scaleZero);
  }, [options.minValue, options.maxValue, options.zeroTickAngle, options.maxTickAngle, options.tickSpacingMajor]);

  const tickSpacingMinDeg = useMemo(() => {
    const tickSpacingMinor = options.tickSpacingMinor ?? 1;
    const valueScale = scaleLinear()
      .domain([options.minValue, options.maxValue])
      .range([options.zeroTickAngle, options.maxTickAngle]);
    const scaleZero = valueScale(0) ?? 0;
    const minorA = valueScale(tickSpacingMinor) ?? 0;
    return Math.abs(minorA - scaleZero);
  }, [options.minValue, options.maxValue, options.zeroTickAngle, options.maxTickAngle, options.tickSpacingMinor]);

  const { tickMaj: tickAnglesMaj, tickMin: tickAnglesMin } = useMemo(
    () => generateTickAngles(options.zeroTickAngle, options.maxTickAngle, tickSpacingMajDeg, tickSpacingMinDeg),
    [options.zeroTickAngle, options.maxTickAngle, tickSpacingMajDeg, tickSpacingMinDeg]
  );

  const tickMajorLabels = useMemo(
    () =>
      generateTickMajorLabels(
        options.zeroTickAngle,
        options.maxTickAngle,
        options.minValue,
        options.maxValue,
        options.tickSpacingMajor ?? 10,
        tickSpacingMajDeg,
        options.tickMapConfig.tickMaps
      ),
    [
      options.zeroTickAngle,
      options.maxTickAngle,
      options.minValue,
      options.maxValue,
      options.tickSpacingMajor,
      tickSpacingMajDeg,
      options.tickMapConfig.tickMaps,
    ]
  );

  useEffect(() => {
    const needleLenPosCalc =
      options.gaugeRadius -
      options.padding -
      options.edgeWidth -
      options.tickEdgeGap -
      options.tickLengthMaj -
      options.needleTickGap * options.gaugeRadius;
    setNeedlePathLength(needleLengthNegCalc + needleLenPosCalc);
    setNeedlePathStart(needleLengthNegCalc * -1);
    const tickStartMajor =
      options.gaugeRadius - options.padding - options.edgeWidth - options.tickEdgeGap - options.tickLengthMaj;
    setTickStartMaj(tickStartMajor);
    const tickStartMinor =
      options.gaugeRadius - options.padding - options.edgeWidth - options.tickEdgeGap - options.tickLengthMin;
    setTickStartMin(tickStartMinor);
    const tmpTickLabelFontSize = scaleLabelFontSize(
      options.tickLabelFontSize,
      options.gaugeRadius,
      options.ticknessGaugeBasis
    );
    setLabelStart(tickStartMajor - tmpTickLabelFontSize);
  }, [
    options.gaugeRadius,
    options.padding,
    options.edgeWidth,
    options.tickEdgeGap,
    options.tickLengthMaj,
    options.tickLengthMin,
    options.needleTickGap,
    options.tickLabelFontSize,
    options.ticknessGaugeBasis,
    needleLengthNegCalc,
  ]);

  const needleElement = useMemo(
    () =>
      renderNeedle(
        needleRef,
        options.zeroNeedleAngle,
        originX,
        originY,
        needlePathStart,
        needlePathLength,
        options.markerEndShape,
        options.markerStartShape,
        options.markerEndEnabled,
        options.markerStartEnabled,
        options.needleColor,
        needleWidth,
        theme2
      ),
    [
      options.zeroNeedleAngle,
      originX,
      originY,
      needlePathStart,
      needlePathLength,
      options.markerEndShape,
      options.markerStartShape,
      options.markerEndEnabled,
      options.markerStartEnabled,
      options.needleColor,
      needleWidth,
      theme2,
    ]
  );

  const { valueFontSize, titleFontSize, valueLabelY, titleLabelY } = useMemo(() => {
    const vfs = scaleLabelFontSize(options.valueFontSize, options.gaugeRadius, options.ticknessGaugeBasis);
    const tfs = scaleLabelFontSize(options.titleFontSize, options.gaugeRadius, options.ticknessGaugeBasis);
    const vly = labelYCalc(0, vfs, labelStart, originY) + options.valueYOffset;
    const tly = labelYCalc(0, tfs, labelStart, originY) + options.titleYOffset - vfs / 2 - tfs / 2;
    return { valueFontSize: vfs, titleFontSize: tfs, valueLabelY: vly, titleLabelY: tly };
  }, [
    options.valueFontSize,
    options.titleFontSize,
    options.gaugeRadius,
    options.ticknessGaugeBasis,
    options.valueYOffset,
    options.titleYOffset,
    labelStart,
    originY,
  ]);

  // Animate the needle to the current displayValue
  useEffect(() => {
    if (options.displayValue === null || isNaN(options.displayValue)) {
      return;
    }
    if (!needleRef.current) {
      return;
    }

    let newVal = options.displayValue;

    // Clamp value to bounds when cross-limits are disabled (still animate to clamped position)
    if (!options.allowNeedleCrossLimits) {
      const lowerBound = Math.min(options.minValue, options.maxValue);
      const upperBound = Math.max(options.minValue, options.maxValue);
      newVal = Math.max(lowerBound, Math.min(upperBound, newVal));
    }

    const valueScale = scaleLinear()
      .domain([options.minValue, options.maxValue])
      .range([options.zeroTickAngle, options.maxTickAngle]);

    const newScaleVal = valueScale(newVal);
    let needleAngleNew = newScaleVal !== undefined ? newScaleVal - options.zeroNeedleAngle : 0;

    // Apply cross-limit angle clamping, tracking which limit was hit
    let newClampedAt: 'max' | 'min' | null = null;
    if (needleAngleNew + options.zeroNeedleAngle > options.maxTickAngle) {
      needleAngleNew = getNeedleAngleMaximum(
        options.allowNeedleCrossLimits,
        needleAngleNew,
        options.zeroTickAngle,
        options.zeroNeedleAngle,
        options.maxTickAngle,
        options.needleCrossLimitDegrees
      );
      newClampedAt = 'max';
    }
    if (needleAngleNew + options.zeroNeedleAngle < options.zeroTickAngle) {
      needleAngleNew = getNeedleAngleMinimum(
        options.allowNeedleCrossLimits,
        needleAngleNew,
        options.zeroTickAngle,
        options.zeroNeedleAngle,
        options.needleCrossLimitDegrees
      );
      newClampedAt = 'min';
    }

    // On first render (ref is null), snap immediately with no animation
    const isFirstRender = lastNeedleAngleRef.current === null;
    let needleAngleOld = lastNeedleAngleRef.current ?? needleAngleNew;

    // Clamp the old angle using the same cross-limit logic as the new angle
    let oldClampedAt: 'max' | 'min' | null = null;
    if (needleAngleOld + options.zeroNeedleAngle > options.maxTickAngle) {
      needleAngleOld = getNeedleAngleMaximum(
        options.allowNeedleCrossLimits,
        needleAngleOld,
        options.zeroTickAngle,
        options.zeroNeedleAngle,
        options.maxTickAngle,
        options.needleCrossLimitDegrees
      );
      oldClampedAt = 'max';
    }
    if (needleAngleOld + options.zeroNeedleAngle < options.zeroTickAngle) {
      needleAngleOld = getNeedleAngleMinimum(
        options.allowNeedleCrossLimits,
        needleAngleOld,
        options.zeroTickAngle,
        options.zeroNeedleAngle,
        options.needleCrossLimitDegrees
      );
      oldClampedAt = 'min';
    }

    // Skip animation if both old and new angles are clamped to the same limit
    if (!isFirstRender && newClampedAt !== null && newClampedAt === oldClampedAt) {
      lastNeedleAngleRef.current = needleAngleNew;
      return;
    }

    let transitionSpeed = 0;
    if (!isFirstRender && options.animateNeedleValueTransition) {
      transitionSpeed = options.animateNeedleValueTransitionSpeed;
    }

    // Update the ref before starting the transition so mid-transition
    // interruptions use the correct target angle
    lastNeedleAngleRef.current = needleAngleNew;

    const needlePath = select(needleRef.current);
    const needleCentre = originX + ',' + originY;

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
    options.displayValue,
    originX,
    originY,
    options.minValue,
    options.maxValue,
    options.zeroTickAngle,
    options.maxTickAngle,
    options.zeroNeedleAngle,
    options.maxNeedleAngle,
    options.animateNeedleValueTransition,
    options.animateNeedleValueTransitionSpeed,
    options.allowNeedleCrossLimits,
    options.needleCrossLimitDegrees,
  ]);

  // When the needle path shape changes (e.g., dimensions settle on mount),
  // immediately restore the transform to the last known angle
  useEffect(() => {
    if (needleRef.current && lastNeedleAngleRef.current !== null) {
      const needleCentre = originX + ',' + originY;
      needleRef.current.setAttribute('transform', 'rotate(' + lastNeedleAngleRef.current + ',' + needleCentre + ')');
    }
  }, [needlePathStart, needlePathLength, originX, originY]);

  const valueColor = useMemo(() => {
    if (options.showThresholdStateOnValue && options.displayValue && options.thresholds) {
      return getActiveThreshold(options.displayValue, options.thresholds.steps).color;
    }
    return options.unitsLabelColor;
  }, [options.showThresholdStateOnValue, options.displayValue, options.thresholds, options.unitsLabelColor]);

  const titleColor = useMemo(() => {
    if (options.showThresholdStateOnTitle && options.displayValue && options.thresholds) {
      return getActiveThreshold(options.displayValue, options.thresholds.steps).color;
    }
    return options.unitsLabelColor;
  }, [options.showThresholdStateOnTitle, options.displayValue, options.thresholds, options.unitsLabelColor]);

  const circleGroup = useMemo(
    () =>
      renderCircleGroup(
        originX,
        originY,
        outerEdgeRadius,
        innerEdgeRadius,
        options.innerColor,
        options.outerEdgeColor,
        options.pivotColor,
        options.pivotRadius,
        options.showThresholdStateOnBackground,
        options.displayValue ?? 0,
        options.thresholds,
        theme2
      ),
    [
      options.innerColor,
      options.outerEdgeColor,
      options.pivotColor,
      options.pivotRadius,
      options.showThresholdStateOnBackground,
      options.displayValue,
      options.thresholds,
      originX,
      originY,
      outerEdgeRadius,
      innerEdgeRadius,
      theme2,
    ]
  );

  const thresholdBands = useMemo(
    () =>
      renderThresholdBands(
        options.showThresholdBandOnGauge,
        options.showThresholdBandLowerRange,
        options.showThresholdBandMiddleRange,
        options.showThresholdBandUpperRange,
        options.thresholds,
        options.minValue,
        options.maxValue,
        options.zeroTickAngle,
        options.maxTickAngle,
        options.gaugeRadius,
        originX,
        originY,
        theme2
      ),
    [
      options.showThresholdBandOnGauge,
      options.showThresholdBandLowerRange,
      options.showThresholdBandMiddleRange,
      options.showThresholdBandUpperRange,
      options.thresholds,
      options.minValue,
      options.maxValue,
      options.zeroTickAngle,
      options.maxTickAngle,
      options.gaugeRadius,
      originX,
      originY,
      theme2,
    ]
  );

  const ticks = useMemo(
    () =>
      renderTicks(
        tickAnglesMaj,
        tickAnglesMin,
        tickStartMaj,
        tickStartMin,
        options.tickLengthMaj,
        options.tickLengthMin,
        tickWidthMajorCalc,
        tickWidthMinorCalc,
        options.tickMajorColor,
        options.tickMinorColor,
        originX,
        originY,
        theme2
      ),
    [
      tickAnglesMaj,
      tickAnglesMin,
      options.tickMinorColor,
      options.tickMajorColor,
      tickWidthMinorCalc,
      tickWidthMajorCalc,
      tickStartMin,
      tickStartMaj,
      options.tickLengthMin,
      options.tickLengthMaj,
      originX,
      originY,
      theme2,
    ]
  );

  const majorTickLabelElements = useMemo(
    () =>
      renderMajorTickLabels(
        tickAnglesMaj,
        tickMajorLabels,
        options.tickLabelFontSize,
        options.gaugeRadius,
        options.ticknessGaugeBasis,
        options.tickLabelColor,
        options.tickFont,
        labelStart,
        originX,
        originY,
        theme2
      ),
    [
      tickAnglesMaj,
      tickMajorLabels,
      options.tickLabelColor,
      options.tickLabelFontSize,
      options.tickFont,
      options.gaugeRadius,
      options.ticknessGaugeBasis,
      labelStart,
      originX,
      originY,
      theme2,
    ]
  );

  const titleLabel = useMemo(
    () =>
      renderTitleLabel(
        options.showTitle,
        options.displayTitle,
        options.titleFont,
        titleFontSize,
        titleLabelY,
        labelStart,
        originX,
        titleColor,
        theme2
      ),
    [
      titleColor,
      options.showTitle,
      options.displayTitle,
      options.titleFont,
      titleFontSize,
      titleLabelY,
      labelStart,
      originX,
      theme2,
    ]
  );

  const valueLabel = useMemo(
    () =>
      renderValueLabel(
        options.displayFormatted,
        options.valueFont,
        valueFontSize,
        valueLabelY,
        labelStart,
        originX,
        valueColor,
        theme2
      ),
    [valueColor, options.displayFormatted, options.valueFont, valueFontSize, valueLabelY, labelStart, originX, theme2]
  );

  return (
    <div className={divStyles}>
      <svg
        className={svgStyles}
        width={options.panelWidth}
        height={options.panelHeight}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0,0,${SVGSize},${SVGSize}`}
      >
        <g>
          {circleGroup}
          {thresholdBands}
          {ticks}
          {majorTickLabelElements}
          {createNeedleMarkers(options.needleColor, theme2)}
          {needleElement}
          {titleLabel}
          {valueLabel}
        </g>
      </svg>
    </div>
  );
};

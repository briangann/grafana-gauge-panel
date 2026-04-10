import React, { useId, useMemo } from 'react';

import { scaleLinear } from 'd3';

import { useStyles2, useTheme2 } from '@grafana/ui';
import { getActiveThreshold, GrafanaTheme2 } from '@grafana/data';

import { GaugeOptions } from '../types';
import { createNeedleMarkers, labelYCalc } from './utils';
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
import { useGaugeDimensions } from './useGaugeDimensions';
import { useTickComputations } from './useTickComputations';
import { useNeedleAnimation } from './useNeedleAnimation';

export const Gauge: React.FC<GaugeOptions> = (options) => {
  const divStyles = useStyles2(getWrapperStyles);
  const svgStyles = useStyles2(getSVGStyles);
  const needleId = useId();
  const theme2 = useTheme2();

  const {
    SVGSize,
    needleWidth,
    tickWidthMajorCalc,
    tickWidthMinorCalc,
    outerEdgeRadius,
    innerEdgeRadius,
    originX,
    originY,
    needlePathLength,
    needlePathStart,
    tickStartMaj,
    tickStartMin,
    labelStart,
  } = useGaugeDimensions({
    gaugeRadius: options.gaugeRadius,
    needleWidth: options.needleWidth,
    ticknessGaugeBasis: options.ticknessGaugeBasis,
    needleLengthNeg: options.needleLengthNeg,
    tickWidthMajor: options.tickWidthMajor,
    tickWidthMinor: options.tickWidthMinor,
    padding: options.padding,
    edgeWidth: options.edgeWidth,
    tickEdgeGap: options.tickEdgeGap,
    tickLengthMaj: options.tickLengthMaj,
    tickLengthMin: options.tickLengthMin,
    needleTickGap: options.needleTickGap,
    tickLabelFontSize: options.tickLabelFontSize,
  });

  const valueScale = useMemo(() => {
    return scaleLinear()
      .domain([options.minValue, options.maxValue])
      .range([options.zeroTickAngle, options.maxTickAngle]);
  }, [options.minValue, options.maxValue, options.zeroTickAngle, options.maxTickAngle]);

  const { tickAnglesMaj, tickAnglesMin, tickMajorLabels, tickPathsMaj, tickPathsMin } = useTickComputations({
    minValue: options.minValue,
    maxValue: options.maxValue,
    zeroTickAngle: options.zeroTickAngle,
    maxTickAngle: options.maxTickAngle,
    tickSpacingMajor: options.tickSpacingMajor,
    tickSpacingMinor: options.tickSpacingMinor,
    tickMaps: options.tickMapConfig.tickMaps,
    valueScale,
    originX,
    originY,
    tickStartMaj,
    tickStartMin,
    tickLengthMaj: options.tickLengthMaj,
    tickLengthMin: options.tickLengthMin,
  });

  useNeedleAnimation(needleId, {
    displayValue: options.displayValue ?? NaN,
    minValue: options.minValue,
    maxValue: options.maxValue,
    zeroTickAngle: options.zeroTickAngle,
    maxTickAngle: options.maxTickAngle,
    zeroNeedleAngle: options.zeroNeedleAngle,
    maxNeedleAngle: options.maxNeedleAngle,
    allowNeedleCrossLimits: options.allowNeedleCrossLimits,
    needleCrossLimitDegrees: options.needleCrossLimitDegrees,
    animateNeedleValueTransition: options.animateNeedleValueTransition,
    animateNeedleValueTransitionSpeed: options.animateNeedleValueTransitionSpeed,
    originX,
    originY,
    valueScale,
  });

  const needleElement = useMemo(
    () =>
      renderNeedle(
        needleId,
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
      needleId,
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
        tickPathsMaj,
        tickPathsMin,
        tickWidthMajorCalc,
        tickWidthMinorCalc,
        options.tickMajorColor,
        options.tickMinorColor,
        theme2
      ),
    [
      tickPathsMaj,
      tickPathsMin,
      options.tickMinorColor,
      options.tickMajorColor,
      tickWidthMinorCalc,
      tickWidthMajorCalc,
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

  const needleMarkers = useMemo(() => createNeedleMarkers(options.needleColor, theme2), [options.needleColor, theme2]);

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
          {needleMarkers}
          {needleElement}
          {titleLabel}
          {valueLabel}
        </g>
      </svg>
    </div>
  );
};

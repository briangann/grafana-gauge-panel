import React from 'react';

import { GrafanaTheme2, Threshold, getActiveThreshold, sortThresholds, ThresholdsConfig } from '@grafana/data';

import { ExpandedThresholdBand, GaugeOptions, Markers } from '../types';
import { drawBand, labelXCalc, labelYCalc, needleCalc } from './utils';

export const scaleLabelFontSize = (fontSize: number, radius: number, ticknessGaugeBasis: number) => {
  let scaledFontSize = fontSize * (radius / ticknessGaugeBasis);
  if (scaledFontSize < 4) {
    scaledFontSize = 0;
  }
  return scaledFontSize;
};

export const renderCircleGroup = (
  originX: number,
  originY: number,
  outerEdgeRadius: number,
  innerEdgeRadius: number,
  innerColor: string,
  outerEdgeColor: string,
  pivotColor: string,
  pivotRadius: number,
  showThresholdStateOnBackground: boolean,
  displayValue: number,
  thresholds: ThresholdsConfig | undefined,
  theme: GrafanaTheme2
) => {
  let gaugeFaceColor = innerColor;
  if (showThresholdStateOnBackground) {
    if (displayValue && thresholds) {
      const aThreshold = getActiveThreshold(displayValue, thresholds.steps);
      gaugeFaceColor = aThreshold.color;
    }
  }
  return (
    <g id="circles">
      <circle
        cx={originX}
        cy={originY}
        r={outerEdgeRadius}
        fill={theme.visualization.getColorByName(outerEdgeColor)}
        stroke="none"
      ></circle>
      <circle
        cx={originX}
        cy={originY}
        r={innerEdgeRadius}
        fill={theme.visualization.getColorByName(gaugeFaceColor)}
        stroke="none"
      ></circle>
      <circle
        cx={originX}
        cy={originY}
        r={pivotRadius}
        fill={theme.visualization.getColorByName(pivotColor)}
        stroke="none"
      ></circle>
    </g>
  );
};

export const renderNeedle = (
  needleRef: React.RefObject<SVGPathElement>,
  zeroNeedleAngle: number,
  originX: number,
  originY: number,
  needlePathStart: number,
  needlePathLength: number,
  markerEndShape: string,
  markerStartShape: string,
  markerEndEnabled: boolean,
  markerStartEnabled: boolean,
  needleColor: string,
  needleWidth: number,
  theme: GrafanaTheme2
) => {
  const pathNeedle = needleCalc(zeroNeedleAngle, originX, originY, needlePathStart, needlePathLength);
  const endShape = Markers.find((e) => e.name === markerEndShape) || Markers[0];
  const startShape = Markers.find((e) => e.name === markerStartShape) || Markers[1];
  return (
    <g id="needle">
      {pathNeedle.length > 0 && (
        <>
          <path
            ref={needleRef}
            d={pathNeedle}
            markerEnd={markerEndEnabled ? 'url(#marker_' + endShape.name + ')' : undefined}
            markerStart={markerStartEnabled ? 'url(#marker_' + startShape.name + ')' : undefined}
            markerHeight={6}
            markerWidth={6}
            strokeLinecap="round"
            stroke={theme.visualization.getColorByName(needleColor)}
            strokeWidth={needleWidth + 'px'}
          />
        </>
      )}
    </g>
  );
};

export const renderTicks = (
  tickPathsMaj: string[],
  tickPathsMin: string[],
  tickWidthMajorCalc: number,
  tickWidthMinorCalc: number,
  tickMajorColor: string,
  tickMinorColor: string,
  theme: GrafanaTheme2
) => {
  return (
    <g id="ticks">
      <g id="minorTickMarks">
        {tickPathsMin.length > 0 &&
          tickPathsMin.map((d: string, index: number) => (
            <path
              key={`tick-minor-${index}`}
              d={d}
              stroke={theme.visualization.getColorByName(tickMinorColor)}
              strokeWidth={tickWidthMinorCalc + 'px'}
            />
          ))}
      </g>
      <g id="majorTickMarks">
        {tickPathsMaj.length > 0 &&
          tickPathsMaj.map((d: string, index: number) => (
            <path
              key={`tick-major-${index}`}
              d={d}
              stroke={theme.visualization.getColorByName(tickMajorColor)}
              strokeWidth={tickWidthMajorCalc + 'px'}
            />
          ))}
      </g>
    </g>
  );
};

export const renderMajorTickLabels = (
  tickAnglesMaj: number[],
  tickMajorLabels: string[],
  tickLabelFontSize: number,
  gaugeRadius: number,
  ticknessGaugeBasis: number,
  tickLabelColor: string,
  tickFont: string,
  labelStart: number,
  originX: number,
  originY: number,
  theme: GrafanaTheme2
) => {
  let maxLabelLength = 0;
  for (const item in tickMajorLabels) {
    if (item.length > maxLabelLength) {
      maxLabelLength = item.length;
    }
  }
  const tmpTickLabelFontSize = scaleLabelFontSize(tickLabelFontSize, gaugeRadius, ticknessGaugeBasis);
  return (
    <g id="majorTickLabels">
      {tickAnglesMaj.length > 0 &&
        tickAnglesMaj.map((item: number, index: number) => {
          const labelText = tickMajorLabels[index];
          return (
            <text
              key={`mtl_${index}`}
              x={labelXCalc(item, maxLabelLength, labelText, tmpTickLabelFontSize, labelStart, originX) || 0}
              y={labelYCalc(item, tmpTickLabelFontSize, labelStart, originY) || 0}
              fontSize={tmpTickLabelFontSize || 12}
              textAnchor="middle"
              fill={theme.visualization.getColorByName(tickLabelColor) || '#000000'}
              fontWeight={'bold'}
              fontFamily={tickFont || 'Inter'}
            >
              {labelText}
            </text>
          );
        })}
    </g>
  );
};

export const renderTitleLabel = (
  showTitle: boolean,
  displayTitle: string,
  titleFont: string,
  titleFontSize: number,
  titleLabelY: number,
  labelStart: number,
  originX: number,
  titleColor: string,
  theme: GrafanaTheme2
) => {
  if (!showTitle || displayTitle.length === 0) {
    return false;
  }
  return (
    <g id="titleLabels">
      <text
        x={labelXCalc(0, 0, displayTitle, titleFontSize, labelStart, originX)}
        y={titleLabelY}
        fontSize={titleFontSize}
        textAnchor="middle"
        fill={theme.visualization.getColorByName(titleColor)}
        fontWeight={'bold'}
        fontFamily={titleFont}
      >
        {displayTitle}
      </text>
    </g>
  );
};

export const renderValueLabel = (
  displayFormatted: string,
  valueFont: string,
  valueFontSize: number,
  valueLabelY: number,
  labelStart: number,
  originX: number,
  valueColor: string,
  theme: GrafanaTheme2
) => {
  return (
    <g id="valueLabels">
      <text
        x={labelXCalc(0, 0, displayFormatted, valueFontSize, labelStart, originX)}
        y={valueLabelY}
        fontSize={valueFontSize}
        textAnchor="middle"
        fill={theme.visualization.getColorByName(valueColor)}
        fontWeight={'bold'}
        fontFamily={valueFont}
      >
        {displayFormatted}
      </text>
    </g>
  );
};

export const renderThresholdBands = (
  showThresholdBandOnGauge: boolean,
  showThresholdBandLowerRange: boolean,
  showThresholdBandMiddleRange: boolean,
  showThresholdBandUpperRange: boolean,
  thresholds: ThresholdsConfig | undefined,
  minValue: number,
  maxValue: number,
  zeroTickAngle: number,
  maxTickAngle: number,
  gaugeRadius: number,
  originX: number,
  originY: number,
  theme: GrafanaTheme2
) => {
  if (!showThresholdBandOnGauge) {
    return;
  }
  if (!thresholds || thresholds.steps.length === 0) {
    return;
  }
  const sorted = sortThresholds(thresholds.steps);

  let lowerBand: ExpandedThresholdBand | undefined;
  if (sorted.length > 0) {
    let nextThresholdValue = maxValue;
    if (sorted.length > 1) {
      nextThresholdValue = sorted[1].value;
    }
    if (nextThresholdValue === Infinity) {
      nextThresholdValue = maxValue;
    }
    let min = sorted[0].value;
    if (min === -Infinity) {
      min = minValue;
    }
    lowerBand = { index: 0, min, max: nextThresholdValue, color: sorted[0].color };
  }

  let upperBand: ExpandedThresholdBand | undefined;
  const upperIndex = sorted.length - 1;
  if (upperIndex > 0) {
    upperBand = { index: upperIndex, min: sorted[upperIndex].value, max: maxValue, color: sorted[upperIndex].color };
  }

  let innerBands: ExpandedThresholdBand[] | undefined;
  if (lowerBand && upperBand) {
    innerBands = [];
    for (let i = lowerBand.index + 1; i < upperBand.index; i++) {
      innerBands.push({ index: i, min: sorted[i].value, max: sorted[i + 1].value, color: sorted[i].color });
    }
  }

  const bandOptions = {
    minValue,
    maxValue,
    zeroTickAngle,
    maxTickAngle,
    gaugeRadius,
  } as GaugeOptions;

  return (
    <>
      {showThresholdBandLowerRange &&
        lowerBand &&
        drawBand(lowerBand.min, lowerBand.max, lowerBand.color, originX, originY, bandOptions, theme)}
      {showThresholdBandMiddleRange &&
        innerBands &&
        innerBands.map((aBand: ExpandedThresholdBand) => {
          return drawBand(aBand.min, aBand.max, aBand.color, originX, originY, bandOptions, theme);
        })}
      {showThresholdBandUpperRange &&
        upperBand &&
        drawBand(upperBand.min, upperBand.max, upperBand.color, originX, originY, bandOptions, theme)}
    </>
  );
};

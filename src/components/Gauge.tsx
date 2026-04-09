import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { getActiveThreshold, GrafanaTheme2, Threshold, sortThresholds } from '@grafana/data';

import { ExpandedThresholdBand, GaugeOptions, Markers } from './types';
import { TickMapItemType } from './TickMaps/types';
import { scaleLinear, line, interpolateString, select } from 'd3';
import { easeQuadIn } from 'd3-ease';

import { createNeedleMarkers, dToR, drawBand, labelXCalc, labelYCalc, needleCalc } from './utils';
import { getNeedleAngleMaximum, getNeedleAngleMinimum } from './needle_utils';

export const Gauge: React.FC<GaugeOptions> = (options) => {
  // pull in styles
  const divStyles = useStyles2(getWrapperStyles);
  const svgStyles = useStyles2(getSVGStyles);
  // need a Ref to the needle to update it
  const needleRef = useRef<SVGPathElement>(null);
  // keeps the previous value, initially it is the same, this is used for animation
  const [previousNeedleValue, setPreviousNeedleValue] = useState(options.displayValue);
  const [currentNeedleValue, setCurrentNeedleValue] = useState(options.displayValue);
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
  const [margin, setMargin] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  //
  const { SVGSize, needleWidth, needleLengthNegCalc, tickWidthMajorCalc,
          tickWidthMinorCalc, outerEdgeRadius, innerEdgeRadius, originX, originY
  } = useMemo(() => ({
    SVGSize: options.gaugeRadius * 2,
    needleWidth: options.needleWidth * (options.gaugeRadius / options.ticknessGaugeBasis),
    needleLengthNegCalc: options.gaugeRadius * options.needleLengthNeg,
    tickWidthMajorCalc: options.tickWidthMajor * (options.gaugeRadius / options.ticknessGaugeBasis),
    tickWidthMinorCalc: options.tickWidthMinor * (options.gaugeRadius / options.ticknessGaugeBasis),
    outerEdgeRadius: options.gaugeRadius - options.padding,
    innerEdgeRadius: options.gaugeRadius - options.padding - options.edgeWidth,
    originX: options.gaugeRadius,
    originY: options.gaugeRadius,
  }), [options.gaugeRadius, options.needleWidth, options.ticknessGaugeBasis,
       options.needleLengthNeg, options.tickWidthMajor, options.tickWidthMinor,
       options.padding, options.edgeWidth]);

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
  }, [options.minValue, options.maxValue, options.zeroTickAngle,
      options.maxTickAngle, options.tickSpacingMajor]);

  const tickSpacingMinDeg = useMemo(() => {
    const tickSpacingMinor = options.tickSpacingMinor ?? 1;
    const valueScale = scaleLinear()
      .domain([options.minValue, options.maxValue])
      .range([options.zeroTickAngle, options.maxTickAngle]);
    const scaleZero = valueScale(0) ?? 0;
    const minorA = valueScale(tickSpacingMinor) ?? 0;
    return Math.abs(minorA - scaleZero);
  }, [options.minValue, options.maxValue, options.zeroTickAngle,
      options.maxTickAngle, options.tickSpacingMinor]);

  const { tickMaj: tickAnglesMaj, tickMin: tickAnglesMin } = useMemo(() =>
    generateTickAngles(
      options.zeroTickAngle, options.maxTickAngle,
      tickSpacingMajDeg, tickSpacingMinDeg
    ),
    [options.zeroTickAngle, options.maxTickAngle,
     tickSpacingMajDeg, tickSpacingMinDeg]
  );

  const tickMajorLabels = useMemo(() =>
    generateTickMajorLabels(
      options.zeroTickAngle, options.maxTickAngle,
      options.minValue, options.maxValue,
      options.tickSpacingMajor ?? 10, tickSpacingMajDeg,
      options.tickMapConfig.tickMaps
    ),
    [options.zeroTickAngle, options.maxTickAngle,
     options.minValue, options.maxValue,
     options.tickSpacingMajor, tickSpacingMajDeg,
     options.tickMapConfig.tickMaps]
  );

  useEffect(() => {
    const needleLenPosCalc =
      options.gaugeRadius - options.padding -
      options.edgeWidth - options.tickEdgeGap -
      options.tickLengthMaj - (options.needleTickGap * options.gaugeRadius);
    setNeedlePathLength(needleLengthNegCalc + needleLenPosCalc);
    setNeedlePathStart(needleLengthNegCalc * -1);
    const tickStartMajor = options.gaugeRadius - options.padding -
      options.edgeWidth - options.tickEdgeGap - options.tickLengthMaj;
    setTickStartMaj(tickStartMajor);
    const tickStartMinor = options.gaugeRadius - options.padding -
      options.edgeWidth - options.tickEdgeGap - options.tickLengthMin;
    setTickStartMin(tickStartMinor);
    const tmpTickLabelFontSize = scaleLabelFontSize(
      options.tickLabelFontSize,
      options.gaugeRadius,
      options.ticknessGaugeBasis);
    setLabelStart(tickStartMajor - tmpTickLabelFontSize);
  }, [options.gaugeRadius, options.padding, options.edgeWidth,
      options.tickEdgeGap, options.tickLengthMaj, options.tickLengthMin,
      options.needleTickGap, options.tickLabelFontSize,
      options.ticknessGaugeBasis, needleLengthNegCalc]);

  const scaleLabelFontSize = (fontSize: number, radius: number, ticknessGaugeBasis: number) => {
    let scaledFontSize = fontSize * (radius / ticknessGaugeBasis);
    if (scaledFontSize < 4) {
      scaledFontSize = 0;
    }
    return scaledFontSize;
  };

  const createCircleGroup = () => {
    let gaugeFaceColor = options.innerColor;
    // the innerColor gets change to the state if the user has selected this option
    if (options.showThresholdStateOnBackground) {
      if (options.displayValue && options.thresholds) {
        const aThreshold = getActiveThreshold(options.displayValue, options.thresholds.steps);
        gaugeFaceColor = aThreshold.color;
      }
    }
    return (
      <g id='circles'>
        <circle cx={originX} cy={originY} r={outerEdgeRadius} fill={theme2.visualization.getColorByName(options.outerEdgeColor)} stroke='none'></circle>
        <circle cx={originX} cy={originY} r={innerEdgeRadius} fill={theme2.visualization.getColorByName(gaugeFaceColor)} stroke='none'></circle>
        <circle cx={originX} cy={originY} r={options.pivotRadius} fill={theme2.visualization.getColorByName(options.pivotColor)} stroke='none'></circle>
      </g>
    );
  };


  const createMajorTickLabels = () => {
    let maxLabelLength = 0;
    for (const item in tickMajorLabels) {
      if (item.length > maxLabelLength) {
        maxLabelLength = item.length;
      }
    }
    const tmpTickLabelFontSize = scaleLabelFontSize(
      options.tickLabelFontSize,
      options.gaugeRadius,
      options.ticknessGaugeBasis);

    return (
      <g id='majorTickLabels'>
        {tickAnglesMaj.length > 0 && tickAnglesMaj.map((item: number, index: number) => {
          const labelText = tickMajorLabels[index];
          return (
            <text
              key={`mtl_${index}`}
              x={labelXCalc(item, maxLabelLength, labelText, tmpTickLabelFontSize, labelStart, originX) || 0}
              y={labelYCalc(item, tmpTickLabelFontSize, labelStart, originY) || 0}
              fontSize={tmpTickLabelFontSize || 12}
              textAnchor='middle'
              fill={theme2.visualization.getColorByName(options.tickLabelColor) || '#000000'}
              fontWeight={'bold'}
              fontFamily={options.tickFont || 'Inter'}>
              {labelText}
            </text>
          );
        })}
      </g>
    );
  };

  const createNeedle = () => {
    const pathNeedle = needleCalc(options.zeroNeedleAngle, originX, originY, needlePathStart, needlePathLength);
    const markerEndShape = Markers.find(e => e.name === options.markerEndShape) || Markers[0];
    const markerStartShape = Markers.find(e => e.name === options.markerStartShape) || Markers[1];
    return (
      <g id='needle'>
        {pathNeedle.length > 0 && (
          <>
            <path
              ref={needleRef}
              d={pathNeedle}
              markerEnd={options.markerEndEnabled ? 'url(#marker_' + markerEndShape.name + ')' : undefined}
              markerStart={options.markerStartEnabled ? 'url(#marker_' + markerStartShape.name + ')' : undefined}
              markerHeight={6}
              markerWidth={6}
              strokeLinecap='round'
              stroke={theme2.visualization.getColorByName(options.needleColor)}
              strokeWidth={needleWidth + 'px'}
            />
          </>
        )}
      </g>
    );
  };

  const needleElement = useMemo(
    () => createNeedle(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.zeroNeedleAngle, originX, originY, needlePathStart, needlePathLength,
     options.markerEndShape, options.markerStartShape,
     options.markerEndEnabled, options.markerStartEnabled,
     options.needleColor, needleWidth]
  );


  const createTicks = () => {
    const pathTicksMajor = tickCalcMaj(tickAnglesMaj);
    const pathTicksMinor = tickCalcMin(tickAnglesMin);
    return (
      <g id='ticks'>
        <g id='minorTickMarks'>
          {pathTicksMinor.length > 0 && pathTicksMinor.map((d: string, index: number) => (
            <path key={`tick-minor-${index}`} d={d} stroke={theme2.visualization.getColorByName(options.tickMinorColor)} strokeWidth={tickWidthMinorCalc + 'px'} />
          ))}
        </g>
        <g id='majorTickMarks'>
          {pathTicksMajor.length > 0 && pathTicksMajor.map((d: string, index: number) => (
            <path key={`tick-major-${index}`} d={d} stroke={theme2.visualization.getColorByName(options.tickMajorColor)} strokeWidth={tickWidthMajorCalc + 'px'} />
          ))}
        </g>
      </g>
    );
  };

  const tickCalcMin = (degrees: number[]) => {
    const paths: string[] = [];
    for (const degree of degrees) {
      // Offset the tick mark angle so zero is vertically down, then convert to radians
      const tickAngle = degree + 90;
      const tickAngleRad = dToR(tickAngle);
      const y1 = originY + tickStartMin * Math.sin(tickAngleRad);
      const y2 = originY + (tickStartMin + options.tickLengthMin) * Math.sin(tickAngleRad);
      const x1 = originX + tickStartMin * Math.cos(tickAngleRad);
      const x2 = originX + (tickStartMin + options.tickLengthMin) * Math.cos(tickAngleRad);
      const lineSVG = line()([
        [x1, y1],
        [x2, y2],
      ]);
      if (lineSVG) {
        paths.push(lineSVG);
      }
    }
    return paths;
  };

  const tickCalcMaj = (degrees: number[]) => {
    const paths: string[] = [];
    for (const degree of degrees) {
      // Offset the tick mark angle so zero is vertically down, then convert to radians
      const tickAngle = degree + 90;
      const tickAngleRad = dToR(tickAngle);
      const y1 = originY + tickStartMaj * Math.sin(tickAngleRad);
      const y2 = originY + (tickStartMaj + options.tickLengthMaj) * Math.sin(tickAngleRad);
      const x1 = originX + tickStartMaj * Math.cos(tickAngleRad);
      const x2 = originX + (tickStartMaj + options.tickLengthMaj) * Math.cos(tickAngleRad);
      // Use a D3.JS path generator
      const lineSVG = line()([
        [x1, y1],
        [x2, y2],
      ]);
      if (lineSVG) {
        paths.push(lineSVG);
      }
    }
    return paths;
  };

  const { valueFontSize, titleFontSize, valueLabelY, titleLabelY } = useMemo(() => {
    const vfs = scaleLabelFontSize(options.valueFontSize, options.gaugeRadius, options.ticknessGaugeBasis);
    const tfs = scaleLabelFontSize(options.titleFontSize, options.gaugeRadius, options.ticknessGaugeBasis);
    const vly = labelYCalc(0, vfs, labelStart, originY) + options.valueYOffset;
    const tly = labelYCalc(0, tfs, labelStart, originY) + options.titleYOffset - (vfs / 2) - (tfs / 2);
    return { valueFontSize: vfs, titleFontSize: tfs, valueLabelY: vly, titleLabelY: tly };
  }, [options.valueFontSize, options.titleFontSize, options.gaugeRadius,
      options.ticknessGaugeBasis, options.valueYOffset, options.titleYOffset,
      labelStart, originY]);

  const createTitleLabel = (color: string) => {
    // Only show title if selected and non-empty title
    if (!options.showTitle || options.displayTitle.length === 0) {
        return false;
    }

    // Define title position relative to value label
    return (
      <g id='titleLabels'>
        <text
          x={labelXCalc(0, 0, options.displayTitle, titleFontSize, labelStart, originX)}
          y={titleLabelY}
          fontSize={titleFontSize}
          textAnchor='middle'
          fill={theme2.visualization.getColorByName(color)}
          fontWeight={'bold'}
          fontFamily={options.titleFont}
        >
          {options.displayTitle}
        </text>
      </g>
    );
  };

  const createValueLabel = (color: string) => {
    return (
      <g id='valueLabels'>
        <text
          x={labelXCalc(0, 0, options.displayFormatted, valueFontSize, labelStart, originX)}
          y={valueLabelY}
          fontSize={valueFontSize}
          textAnchor='middle'
          fill={theme2.visualization.getColorByName(color)}
          fontWeight={'bold'}
          fontFamily={options.valueFont}
        >
          {options.displayFormatted}
        </text>
      </g>
    );
  };

  const getLowerBand = (sorted: Threshold[]) => {
    const numBands = sorted.length;
    if (numBands === 0) {
      return undefined;
    }
    // if there is just one threshold
    let nextThresholdValue = options.maxValue;
    if (numBands > 1) {
      nextThresholdValue = sorted[1].value;
    }
    if (nextThresholdValue === Infinity) {
      nextThresholdValue = options.maxValue;
    }
    let min = sorted[0].value;
    if (min === -Infinity) {
      min = options.minValue;
    }
    // get the lower band
    return {
      index: 0,
      min,
      max: nextThresholdValue,
      color: sorted[0].color,
    };
  };

  const getUpperBand = (sorted: Threshold[]) => {
    const index = sorted.length - 1;
    // upper band always has an index greater than zero
    if (index === 0) {
      return undefined;
    }
    return {
      index,
      min: sorted[index].value,
      max: options.maxValue,
      color: sorted[index].color,
    };
  };

  const getInnerBands = (
    sorted: Threshold[],
    lower: ExpandedThresholdBand | undefined,
    upper: ExpandedThresholdBand | undefined) => {
    const innerBands: ExpandedThresholdBand[] = [];

    // inner bands only exist if there are valid lower and upper bands
    if ((lower === undefined) || upper === undefined) {
      return undefined;
    }
    for (let index = lower.index + 1; index < upper.index; index++) {
      innerBands.push({
        index,
        min: sorted[index].value,
        max: sorted[index + 1].value,
        color: sorted[index].color,
      });
    }
    return innerBands;
  };

  const expandThresholdBands = () => {
    // check if there are no thresholds
    if (options.thresholds && options.thresholds!.steps.length === 0) {
      return ({ lowerBand: undefined, innerBands: undefined, upperBand: undefined });
    }
    const sorted = sortThresholds(options.thresholds!.steps);
    // get the lower band
    const lowerBand = getLowerBand(sorted);
    // get the upper band
    const upperBand = getUpperBand(sorted);
    // get the inner bands
    const innerBands = getInnerBands(sorted, lowerBand, upperBand);
    return ({ lowerBand, innerBands, upperBand });
  };

  const createThresholdBands = () => {
    // do not show thresholds if this is false
    if (!options.showThresholdBandOnGauge) {
      return;
    }
    const { lowerBand, innerBands, upperBand } = expandThresholdBands();

    return (
      <>
        {options.showThresholdBandLowerRange && lowerBand &&
          drawBand(lowerBand.min, lowerBand.max, lowerBand.color, originX, originY, options, theme2)}
        {options.showThresholdBandMiddleRange && innerBands &&
          innerBands.map((aBand: ExpandedThresholdBand) => {
            return drawBand(aBand.min, aBand.max, aBand.color, originX, originY, options, theme2);
          })
        }
        {options.showThresholdBandUpperRange && upperBand &&
          drawBand(upperBand.min, upperBand.max, upperBand.color, originX, originY, options, theme2)}
      </>
    );
  };


  useEffect(() => {

    const updateGauge = (needleGroup: React.JSX.Element | null, newVal: number, newValFormatted: string) => {
      // Animate the transition of the needle to its new value
      const oldVal = previousNeedleValue;
      // Set default values if necessary
      if (newVal === undefined) {
        newVal = options.minValue;
      }
      // snap to new location by default
      let transitionSpeed = 0;

      if (options.animateNeedleValueTransition) {
        transitionSpeed = options.animateNeedleValueTransitionSpeed;
        // no transition when previous value is NaN
        if (Number.isNaN(oldVal)) {
          transitionSpeed = 0;
        }
      }

      if (!options.allowNeedleCrossLimits) {
        const lowerBound = Math.min(options.minValue, options.maxValue);
        const upperBound = Math.max(options.minValue, options.maxValue);
        if (newVal < lowerBound) {
          newVal = lowerBound;
          transitionSpeed = 0;
        }
        if (newVal > upperBound) {
          newVal = upperBound;
          transitionSpeed = 0;
        }
      }

      const needlePath = select(needleRef.current);
      const valueScale = scaleLinear()
        .domain([options.minValue, options.maxValue])
        .range([options.zeroTickAngle, options.maxTickAngle]);
      let needleAngleOld = options.zeroNeedleAngle;

      const newScaleVal = valueScale(newVal);

      let needleAngleNew = options.zeroNeedleAngle;
      if (newScaleVal !== undefined) {
        needleAngleNew = newScaleVal - options.zeroNeedleAngle;
      }

      if (valueScale !== undefined && !isNaN(Number(oldVal)) && !isNaN(newVal)) {
        const oldScaleVal = valueScale(Number(oldVal));
        if (oldScaleVal !== undefined) {
          needleAngleOld = oldScaleVal - options.zeroNeedleAngle;
        }
        if (newScaleVal !== undefined) {
          needleAngleNew = newScaleVal - options.zeroNeedleAngle;
        }
      }

      needlePath
        .transition()
        .duration(transitionSpeed)
        .ease(easeQuadIn)
        .attrTween('transform', () => {
          //
          // Allow burying the needle if there is space, otherwise lock to min/max
          //
          // Check for min/max ends of the needle
          if (needleAngleOld + options.zeroNeedleAngle > options.maxTickAngle) {
            needleAngleOld = options.maxNeedleAngle - options.zeroNeedleAngle;
          }
          if (needleAngleOld + options.zeroNeedleAngle < options.zeroTickAngle) {
            needleAngleOld = 0;
          }
          if (needleAngleNew + options.zeroNeedleAngle > options.maxTickAngle) {
            needleAngleNew = getNeedleAngleMaximum(options.allowNeedleCrossLimits, needleAngleNew, options.zeroTickAngle, options.zeroNeedleAngle, options.maxTickAngle, options.needleCrossLimitDegrees);
          }
          if (needleAngleNew + options.zeroNeedleAngle < options.zeroTickAngle) {
            needleAngleNew = getNeedleAngleMinimum(options.allowNeedleCrossLimits, needleAngleNew, options.zeroTickAngle, options.zeroNeedleAngle, options.needleCrossLimitDegrees);
          }
          const needleCentre = originX + ',' + originY;
          return interpolateString(
            'rotate(' + needleAngleOld + ',' + needleCentre + ')',
            'rotate(' + needleAngleNew + ',' + needleCentre + ')'
          );
        });
    };

    if (currentNeedleValue !== null && !isNaN(currentNeedleValue)) {
      updateGauge(needleElement, currentNeedleValue, options.displayFormatted);
    }
  }, [currentNeedleValue, previousNeedleValue, originX, originY,
      options.minValue, options.maxValue,
      options.zeroTickAngle, options.maxTickAngle,
      options.zeroNeedleAngle, options.maxNeedleAngle,
      options.animateNeedleValueTransition,
      options.animateNeedleValueTransitionSpeed,
      options.allowNeedleCrossLimits, options.needleCrossLimitDegrees,
      options.displayFormatted, needleElement]);

  useEffect(() => {
    // this will trigger updating the gauge
    if (currentNeedleValue !== options.displayValue) {
      setPreviousNeedleValue(currentNeedleValue);
      setCurrentNeedleValue(options.displayValue);
    }
  }, [currentNeedleValue, options.displayValue, previousNeedleValue]);

  const valueColor = useMemo(() => {
    if (options.showThresholdStateOnValue && options.displayValue && options.thresholds) {
      return getActiveThreshold(options.displayValue, options.thresholds.steps).color;
    }
    return options.unitsLabelColor;
  }, [options.showThresholdStateOnValue, options.displayValue,
      options.thresholds, options.unitsLabelColor]);

  const titleColor = useMemo(() => {
    if (options.showThresholdStateOnTitle && options.displayValue && options.thresholds) {
      return getActiveThreshold(options.displayValue, options.thresholds.steps).color;
    }
    return options.unitsLabelColor;
  }, [options.showThresholdStateOnTitle, options.displayValue,
      options.thresholds, options.unitsLabelColor]);

  const circleGroup = useMemo(
    () => createCircleGroup(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.innerColor, options.outerEdgeColor, options.pivotColor,
     options.pivotRadius, options.showThresholdStateOnBackground,
     options.displayValue, options.thresholds,
     originX, originY, outerEdgeRadius, innerEdgeRadius]
  );

  const thresholdBands = useMemo(
    () => createThresholdBands(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.showThresholdBandOnGauge, options.showThresholdBandLowerRange,
     options.showThresholdBandMiddleRange, options.showThresholdBandUpperRange,
     options.thresholds, options.minValue, options.maxValue,
     options.zeroTickAngle, options.maxTickAngle,
     options.gaugeRadius, originX, originY]
  );

  const ticks = useMemo(
    () => createTicks(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tickAnglesMaj, tickAnglesMin, options.tickMinorColor, options.tickMajorColor,
     tickWidthMinorCalc, tickWidthMajorCalc, tickStartMin, tickStartMaj,
     options.tickLengthMin, options.tickLengthMaj, originX, originY]
  );

  const majorTickLabels = useMemo(
    () => createMajorTickLabels(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tickAnglesMaj, tickMajorLabels, options.tickLabelColor,
     options.tickLabelFontSize, options.tickFont,
     options.gaugeRadius, options.ticknessGaugeBasis,
     labelStart, originX, originY]
  );

  const titleLabel = useMemo(
    () => createTitleLabel(titleColor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [titleColor, options.showTitle, options.displayTitle,
     options.titleFont, titleFontSize, titleLabelY, labelStart, originX]
  );

  const valueLabel = useMemo(
    () => createValueLabel(valueColor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valueColor, options.displayFormatted, options.valueFont,
     valueFontSize, valueLabelY, labelStart, originX]
  );

  return (
    <div className={divStyles}>
      <svg
        className={svgStyles}
        width={options.panelWidth}
        height={options.panelHeight}
        xmlns='http://www.w3.org/2000/svg'
        xmlnsXlink='http://www.w3.org/1999/xlink'
        viewBox={`0,0,${SVGSize},${SVGSize}`}
      >
        <g>
          {circleGroup}
          {thresholdBands}
          {ticks}
          {majorTickLabels}
          {createNeedleMarkers(options.needleColor, theme2)}
          {needleElement}
          {titleLabel}
          {valueLabel}
        </g>
      </svg>
    </div>
  );
};

const getWrapperStyles = (theme: GrafanaTheme2) => css`
  fill: transparent;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
`;

const getSVGStyles = (theme: GrafanaTheme2) => css`
  text-align: center;
  align-items: center;
  justify-content: center;
  fill: transparent;
`;

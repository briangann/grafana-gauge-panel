import React, { useEffect, useRef, useState } from 'react';

import { useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { getActiveThreshold, GrafanaTheme2, Threshold, sortThresholds } from '@grafana/data';

import { ExpandedThresholdBand, GaugeOptions, Markers } from './types';
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
  const [tickAnglesMaj, setTickAnglesMaj] = useState<number[]>([]);
  const [tickAnglesMin, setTickAnglesMin] = useState<number[]>([]);
  const [margin, setMargin] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [tickMajorLabels, setTickMajorLabels] = useState<string[]>([]);
  const [labelFontSize] = useState(options.valueFontSize);
  //
  const SVGSize = options.gaugeRadius * 2;
  // needle calc
  const needleWidth = options.needleWidth * (options.gaugeRadius / options.ticknessGaugeBasis);
  const needleLengthNegCalc = options.gaugeRadius * options.needleLengthNeg;
  // tick calc
  const tickWidthMajorCalc = options.tickWidthMajor * (options.gaugeRadius / options.ticknessGaugeBasis);
  const tickWidthMinorCalc = options.tickWidthMinor * (options.gaugeRadius / options.ticknessGaugeBasis);
  // edge calc
  const outerEdgeRadius = options.gaugeRadius - options.padding;
  const innerEdgeRadius = options.gaugeRadius - options.padding - options.edgeWidth;
  // center of gauge
  const originX = options.gaugeRadius;
  const originY = options.gaugeRadius;
  let needleElement: JSX.Element | null = null;

  /*
  useEffect(() => {
    console.log(`presetIndex set to ${options.presetIndex}`);
    options.innerColor = GaugePresetOptions[options.presetIndex].faceColor;
  }, [options]);
  */

  useEffect(() => {

    const generateTickMajorLabels = (majorDegree: number) => {
      //
      // Calculate major tick mark label text
      let counter = 0;
      const tickLabelText: string[] = [];
      for (let k = options.zeroTickAngle; k <= options.maxTickAngle; k = k + majorDegree) {
        const tickValue = options.minValue + options.tickSpacingMajor * counter;
        const parts = options.tickSpacingMajor.toString().split('.');
        let tickText = tickValue.toString();
        if (parts.length > 1) {
          tickText = Number(tickValue).toFixed(parts[1].length).toString();
        }
        // check if there are tickMaps that apply
        const tickTextFloat = parseFloat(tickText);
        for (const aTickMap of options.tickMapConfig.tickMaps) {
          if (parseFloat(aTickMap.value) === tickTextFloat) {
            tickText = aTickMap.text;
            break;
          }
        }
        tickLabelText.push(tickText);
        counter++;
      }
      return ({ genTickMajorLabels: tickLabelText });
    };

    const generateTickAngles = (majorDegree: number, minorDegree: number) => {
      const majorAngles = [];
      let counter = 0;
      for (let i = options.zeroTickAngle; i <= options.maxTickAngle; i = i + majorDegree) {
        const tickAngle = options.zeroTickAngle + majorDegree * counter;
        // check if this is the "end" of a full circle, and skip the last tick marker
        if (tickAngle - options.zeroTickAngle < 360) {
          majorAngles.push(options.zeroTickAngle + majorDegree * counter);
        }
        counter++;
      }
      const minorAngles = [];
      counter = 0;
      for (let j = options.zeroTickAngle; j <= options.maxTickAngle; j = j + minorDegree) {
        // Check for an existing major tick angle
        let exists = 0;
        majorAngles.forEach((d: any) => {
          if (options.zeroTickAngle + minorDegree * counter === d) {
            exists = 1;
          }
        });
        if (exists === 0) {
          minorAngles.push(options.zeroTickAngle + minorDegree * counter);
        }
        counter++;
      }
      return ({ tickMaj: majorAngles, tickMin: minorAngles });
    };

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
    setLabelStart(tickStartMajor - options.tickLabelFontSize);

    if (options.tickSpacingMajor === undefined) {
      options.tickSpacingMajor = 10;
    }
    if (options.tickSpacingMinor === undefined) {
      options.tickSpacingMinor = 1;
    }
    const valueScale = scaleLinear()
      .domain([options.minValue, options.maxValue])
      .range([options.zeroTickAngle, options.maxTickAngle]);

    const scaleZero = valueScale(0) || 0;
    const majorA = valueScale(options.tickSpacingMajor) || 10;
    const tickSpacingMajDeg = majorA - scaleZero;

    const minorA = valueScale(options.tickSpacingMinor) || 1;
    const tickSpacingMinDeg = minorA - scaleZero;

    // tick angles
    const { tickMaj, tickMin } = generateTickAngles(tickSpacingMajDeg, tickSpacingMinDeg);
    if (JSON.stringify(tickAnglesMaj) !== JSON.stringify(tickMaj)) {
      setTickAnglesMaj(tickMaj);
    }
    if (JSON.stringify(tickAnglesMin) !== JSON.stringify(tickMin)) {
      setTickAnglesMin(tickMin);
    }

    // labels for major ticks
    const { genTickMajorLabels } = generateTickMajorLabels(tickSpacingMajDeg);
    if (JSON.stringify(tickMajorLabels) !== JSON.stringify(genTickMajorLabels)) {
      setTickMajorLabels(genTickMajorLabels);
    }

  }, [tickAnglesMaj, tickAnglesMin, options, tickMajorLabels, needleLengthNegCalc]);


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
    return (
      <g id='majorTickLabels'>
        {tickAnglesMaj.length > 0 && tickAnglesMaj.map((item: number, index: number) => {
          const labelText = tickMajorLabels[index];
          return (
            <text
              key={`mtl_${index}`}
              x={labelXCalc(item, maxLabelLength, labelText, labelFontSize, labelStart, originX) || 0}
              y={labelYCalc(item, labelFontSize, labelStart, originY) || 0}
              fontSize={options.tickLabelFontSize || 12}
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


  const createTicks = () => {
    const pathTicksMajor = tickCalcMaj(tickAnglesMaj);
    const pathTicksMinor = tickCalcMin(tickAnglesMin);
    return (
      <g id='ticks'>
        <g id='minorTickMarks'>
          {pathTicksMinor.length > 0 && pathTicksMinor.map((d: string) => {
            return (
              <>
                <path d={d} stroke={theme2.visualization.getColorByName(options.tickMinorColor)} strokeWidth={tickWidthMinorCalc + 'px'} />
              </>
            );
          })}
        </g>
        <g id='majorTickMarks'>
          {pathTicksMajor.length > 0 && pathTicksMajor.map((d: string) => {
            return (
              <>
                <path d={d} stroke={theme2.visualization.getColorByName(options.tickMajorColor)} strokeWidth={tickWidthMajorCalc + 'px'} />
              </>
            );
          })}
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


  const createValueLabel = (color: string) => {
    const position = 0;
    return (
      <g id='valueLabels'>
        <text
          x={labelXCalc(position, 0, options.displayFormatted, labelFontSize, labelStart, originX)}
          y={labelYCalc(position, labelFontSize, labelStart, originY) + options.valueYOffset}
          fontSize={options.valueFontSize}
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

  if (needleElement === null) {
    needleElement = createNeedle();
  }

  useEffect(() => {

    const updateGauge = (needleGroup: JSX.Element | null, newVal: number, newValFormatted: string) => {
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
        if (newVal < options.minValue) {
          newVal = options.minValue;
          transitionSpeed = 0;
        }
        if (newVal > options.maxValue) {
          newVal = options.maxValue;
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
  }, [options, tickAnglesMaj, tickAnglesMin, tickMajorLabels, needleLengthNegCalc, previousNeedleValue, currentNeedleValue, originX, originY, needleElement]);

  useEffect(() => {
    // this will trigger updating the gauge
    if (currentNeedleValue !== options.displayValue) {
      setPreviousNeedleValue(currentNeedleValue);
      setCurrentNeedleValue(options.displayValue);
    }
  }, [currentNeedleValue, options.displayValue, previousNeedleValue]);

  let valueColor = options.unitsLabelColor;
  if (options.showThresholdStateOnValue) {
    if (options.displayValue && options.thresholds) {
      const aThreshold = getActiveThreshold(options.displayValue, options.thresholds.steps);
      valueColor = aThreshold.color;
    }
  }


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
          {createCircleGroup()}
          {createThresholdBands()}
          {createTicks()}
          {createMajorTickLabels()}
          {createNeedleMarkers(options.needleColor, theme2)}
          {needleElement}
          {createValueLabel(valueColor)}
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

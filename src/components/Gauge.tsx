import React, { useEffect, useRef, useState } from 'react';

import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2, Threshold, sortThresholds } from '@grafana/data';

import { ExpandedThresholdBand, GaugeOptions, MarkerEndShapes, MarkerStartShapes, MarkerType, Markers } from './types';
import { scaleLinear, line, arc, interpolateString, select } from 'd3';
import { easeQuadIn } from 'd3-ease';

export const Gauge: React.FC<GaugeOptions> = (options) => {
  const divStyles = useStyles2(getWrapperStyles);
  const svgStyles = useStyles2(getSVGStyles);
  const needleRef = useRef<SVGPathElement>(null);
  const [previousNeedleValue, setPreviousNeedleValue] = useState(NaN);
  const [currentNeedleValue, setCurrentNeedleValue] = useState(NaN);

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

    if (currentNeedleValue !== options.displayValue) {
      setPreviousNeedleValue(currentNeedleValue || NaN);
      setCurrentNeedleValue(options.displayValue || NaN);
    }

  }, [tickAnglesMaj, tickAnglesMin, options, tickMajorLabels, needleLengthNegCalc, previousNeedleValue, currentNeedleValue]);

  // TODO: convert colors (getColorForD3)
  const createCircleGroup = () => {
    return (
      <g id='circles'>
        <circle cx={originX} cy={originY} r={outerEdgeRadius} fill={options.outerEdgeColor} stroke='none'></circle>
        <circle cx={originX} cy={originY} r={innerEdgeRadius} fill={options.innerColor} stroke='none'></circle>
        <circle cx={originX} cy={originY} r={options.pivotRadius} fill={options.pivotColor} stroke='none'></circle>
      </g>
    );
  };

  const createNeedleMarkers = () => {
    return (
      <defs>
        {Markers.map((item: MarkerType) => {
          return (
            <marker
              key={item.name}
              id={`marker_${item.name}`}
              viewBox={item.viewBox}
              refX={0}
              refY={0}
              markerWidth={3}
              markerHeight={3}
              markerUnits={'strokeWidth'}
              orient={'auto'} >
              <path d={item.path} fill={options.needleColor} />
            </marker>
          );
        })}
      </defs>
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
              x={labelXCalc(item, maxLabelLength, labelText) || 0}
              y={labelYCalc(item) || 0}
              fontSize={options.tickLabelFontSize || 12}
              textAnchor='middle'
              fill={options.tickLabelColor || '#000000'}
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
    const pathNeedle = needleCalc(options.zeroNeedleAngle);
    return (
      <g id='needle'>
        {pathNeedle.length > 0 && (
          <>
            <path
              ref={needleRef}
              d={pathNeedle}
              markerEnd={options.markerEndEnabled ? 'url(#marker_' + MarkerEndShapes[0].name + ')' : undefined}
              markerStart={options.markerStartEnabled ? 'url(#marker_' + MarkerStartShapes[0].name + ')' : undefined}
              markerHeight={6}
              markerWidth={6}
              strokeLinecap='round'
              stroke={options.needleColor}
              strokeWidth={needleWidth + 'px'}
            />
          </>
        )}
      </g>
    );
  };

  const needleCalc = (degree: number) => {
    let path = '';
    const nAngleRad = dToR(degree + 90);
    const y1 = originY + needlePathStart * Math.sin(nAngleRad);
    const y2 = originY + (needlePathStart + needlePathLength) * Math.sin(nAngleRad);
    const x1 = originX + needlePathStart * Math.cos(nAngleRad);
    const x2 = originX + (needlePathStart + needlePathLength) * Math.cos(nAngleRad);
    const lineSVG = line()([
      [x1, y1],
      [x2, y2],
    ]);
    if (lineSVG) {
      path = lineSVG;
    }
    return path;
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
                <path d={d} stroke={options.tickMinorColor} strokeWidth={tickWidthMinorCalc + 'px'} />
              </>
            );
          })}
        </g>
        <g id='majorTickMarks'>
          {pathTicksMajor.length > 0 && pathTicksMajor.map((d: string) => {
            return (
              <>
                <path d={d} stroke={options.tickMajorColor} strokeWidth={tickWidthMajorCalc + 'px'} />
              </>
            );
          })}
        </g>
      </g>
    );
  };

  // Define functions to calcuate the positions of the labels for the tick marks
  const labelXCalc = (position: number, maxLabelLength: number, labelText: string) => {
    const tickAngle = position + 90;
    const tickAngleRad = dToR(tickAngle);
    // the max length of digits needs to be used for proper alignment
    const labelW = labelFontSize / (labelText.length + maxLabelLength / 2);
    const x1 = originX + (labelStart - labelW) * Math.cos(tickAngleRad);
    return x1;
  };

  const labelYCalc = (position: number) => {
    const tickAngle = position + 90;
    const tickAngleRad = dToR(tickAngle);
    const y1 = originY + labelStart * Math.sin(tickAngleRad) + labelFontSize / 2;
    return y1;
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

  const valueToDegrees = (value: any) => {
    // degree range is from 60 to 300 (240)  maxTickAngle - zeroTickAngle
    const degreeRange = options.maxTickAngle - options.zeroTickAngle;
    const range = options.maxValue - options.minValue;
    const min = options.minValue;
    return (value / range) * degreeRange - ((min / range) * degreeRange + options.zeroTickAngle);
  };

  const valueToRadians = (value: any) => {
    return (valueToDegrees(value) * Math.PI) / 180;
  };

  const dToR = (angleDeg: any) => {
    // Turns an angle in degrees to radians
    const angleRad = angleDeg * (Math.PI / 180);
    return angleRad;
  };

  const createValueLabel = () => {
    const position = 0;
    return (
      <g id='valueLabels'>
        <text
          x={labelXCalc(position, 0, options.displayFormatted)}
          y={labelYCalc(position) + options.valueYOffset}
          fontSize={options.valueFontSize}
          textAnchor='middle'
          fill={options.unitsLabelColor}
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
  }

  // TODO: handle returning undefined when there is no upper band
  const getUpperBand = (sorted: Threshold[]) => {
    const index = sorted.length - 1;
    return {
      index,
      min: sorted[index].value,
      max: options.maxValue,
      color: sorted[index].color,
    };
  }

  // TODO: handle returning undefined when there are no inner bands
  const getInnerBands = (sorted: Threshold[], lower: ExpandedThresholdBand, upper: ExpandedThresholdBand) => {
    const innerBands: ExpandedThresholdBand[] = [];
    for (let index = lower.index + 1; index < upper.index; index++) {
      innerBands.push({
        index,
        min: sorted[index].value,
        max: sorted[index + 1].value,
        color: sorted[index].color,
      });
    }
    return innerBands;
  }

  const expandThresholdBands = () => {
    // check if there are no thresholds
    if (options.thresholds && options.thresholds!.steps.length === 0) {
      return ({ lowerBand: undefined, innerBands: undefined, upperBand: undefined })
    }
    const sorted = sortThresholds(options.thresholds!.steps);
    // get the lower band
    const lowerBand = getLowerBand(sorted);
    // get the upper band
    const upperBand = getUpperBand(sorted);
    // get the inner bands
    const innerBands = getInnerBands(sorted, lowerBand, upperBand);
    return ({ lowerBand, innerBands, upperBand });
  }

  const createThresholdBands = () => {
    // do not show thresholds if this is false
    if (!options.showThresholdBandOnGauge) {
      return;
    }
    const { lowerBand, innerBands, upperBand } = expandThresholdBands();

    return (
      <>
        {options.showThresholdBandLowerRange && lowerBand &&
          drawBand(lowerBand.min, lowerBand.max, lowerBand.color)}
        {options.showThresholdBandMiddleRange && innerBands &&
          innerBands.map((aBand: ExpandedThresholdBand) => {
            return drawBand(aBand.min, aBand.max, aBand.color);
          })
        }
        {options.showThresholdBandUpperRange && upperBand &&
          drawBand(upperBand.min, upperBand.max, upperBand.color)}
      </>
    );
  };

  // TODO: convert colors (getColorForD3)
  const drawBand = (start: number, end: number, color: string) => {
    if (0 >= end - start) {
      return;
    }
    const anArc = arc();
    const xc = anArc({
      innerRadius: 0.7 * options.gaugeRadius,
      outerRadius: 0.85 * options.gaugeRadius,
      startAngle: valueToRadians(start),
      endAngle: valueToRadians(end),
    });

    return (
      <>
        {xc &&
          <path
            fill={color}
            d={xc || ''}
            transform={`translate(${originX},${originY}) rotate(${options.maxTickAngle})`}
          />
        }
      </>
    );
  };

  const updateGauge = (needleGroup: JSX.Element, newVal: number, newValFormatted: string) => {
    // Animate the transistion of the needle to its new value
    const oldVal = previousNeedleValue;
    // Set default values if necessary
    if (newVal === undefined) {
      newVal = options.minValue;
    }
    if (newVal > options.maxValue) {
      newVal = options.maxValue;
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
    const needlePath = select(needleRef.current);
    const valueScale = scaleLinear()
      .domain([options.minValue, options.maxValue])
      .range([options.zeroTickAngle, options.maxTickAngle]);
    let needleAngleOld = 0;
    let needleAngleNew = 0;
    if ((valueScale !== undefined) && (oldVal !== null) && (newVal !== null)) {
      const oldScaleVal = valueScale(oldVal);
      if (oldScaleVal !== undefined) {
        needleAngleOld = oldScaleVal - options.zeroNeedleAngle;
      }
      const newScaleVal = valueScale(newVal);
      if (newScaleVal !== undefined) {
        needleAngleNew = newScaleVal - options.zeroNeedleAngle;
      }
    }

    needlePath
      .transition()
      .duration(transitionSpeed)
      .ease(easeQuadIn)
      .attrTween('transform', (d: any, i: any, a: any) => {
        // Check for min/max ends of the needle
        if (needleAngleOld + options.zeroNeedleAngle > options.maxTickAngle) {
          needleAngleOld = options.maxNeedleAngle - options.zeroNeedleAngle;
        }
        if (needleAngleOld + options.zeroNeedleAngle < options.zeroTickAngle) {
          needleAngleOld = 0;
        }
        if (needleAngleNew + options.zeroNeedleAngle > options.maxTickAngle) {
          needleAngleNew = options.maxNeedleAngle - options.zeroNeedleAngle;
        }
        if (needleAngleNew + options.zeroNeedleAngle < options.zeroTickAngle) {
          needleAngleNew = 0;
        }
        const needleCentre = originX + ',' + originY;
        return interpolateString(
          'rotate(' + needleAngleOld + ',' + needleCentre + ')',
          'rotate(' + needleAngleNew + ',' + needleCentre + ')'
        );
      });

    // see this for threshold example
    // https://github.com/grafana/grafana/blob/main/packages/grafana-ui/src/components/Gauge/utils.ts
    // https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/field/thresholds.ts
    //
    const valueThresholdColor = options.unitsLabelColor;
    // TODO: used new threshold settings
    // getColorForD3
    if (options.showThresholdColorOnValue) {
      /*
      const boundaries = '60,80'.split(',');
      // const boundaries = options.thresholds.split(',');
      if (newVal < parseFloat(boundaries[0])) {
        valueThresholdColor = options.thresholdColors[0];
      }
      if (newVal > parseFloat(boundaries[0]) && newVal <= parseFloat(boundaries[1])) {
        valueThresholdColor = options.thresholdColors[1];
      }
      if (newVal >= parseFloat(boundaries[1])) {
        valueThresholdColor = options.thresholdColors[2];
      }
      */
    }
    // fill color
    // valueLabel.style('fill', valueThresholdColor);
    // valueLabelParent.selectAll('text').text(newValFormatted);
    // Update the current value
    // options.needleValue = newVal;
  };

  const ndl = createNeedle();
  updateGauge(ndl, currentNeedleValue || NaN, options.displayFormatted || '0');
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
          {createNeedleMarkers()}
          {ndl}
          {createValueLabel()}
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

const getColorForD3 = (theme: GrafanaTheme2, color: string) => {
  let useColor = color;
  if (typeof theme.visualization !== 'undefined') {
    useColor = theme.visualization.getColorByName(color);
  }
  return useColor;
};

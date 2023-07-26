import React, { useEffect, useState } from 'react';

import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

import { GaugeOptions, MarkerEndShapes, MarkerStartShapes, MarkerType, Markers } from './types';
import { scaleLinear, line, arc } from 'd3';

export const Gauge: React.FC<GaugeOptions> = (options) => {
  const divStyles = useStyles2(getWrapperStyles);
  const svgStyles = useStyles2(getSVGStyles);

  // if (options.processedData && options.processedData.length === 0) {
  //   return <div className={noTriggerTextStyles}>{options.globalDisplayTextTriggeredEmpty}</div>;
  // }
  const [gaugeRadiusCalc, setGaugeRadiusCalc] = useState(options.gaugeRadius);
  const [SVGSize, setSVGSize] = useState(options.gaugeRadius * 2);
  const [horizontalOffset, setHorizontalOffset] = useState(10);
  const [needleLengthPos, setNeedleLengthPos] = useState(0);
  const [needlePathLength, setNeedlePathLength] = useState(0);
  const [needlePath, setNeedlePath] = useState([] as any);
  const [needleWidth] = useState(options.needleWidth);
  const [needlePathStart, setNeedlePathStart] = useState(0);
  const [tickStartMaj, setTickStartMaj] = useState(0);
  const [tickStartMin, setTickStartMin] = useState(0);
  const [tickWidthMajorCalc, setTickWidthMajorCalc] = useState(5);
  const [tickWidthMinorCalc, setTickWidthMinorCalc] = useState(1);
  const [labelStart, setLabelStart] = useState(0);

  const [innerEdgeRadius, setInnerEdgeRadius] = useState(0);
  const [outerEdgeRadius, setOuterEdgeRadius] = useState(0);
  const [pivotRadius, setPivotRadius] = useState(0);
  const [originX, setOriginX] = useState(gaugeRadiusCalc);
  const [originY, setOriginY] = useState(gaugeRadiusCalc);
  const [tickAnglesMaj, setTickAnglesMaj] = useState<number[]>([]);
  const [tickAnglesMin, setTickAnglesMin] = useState<number[]>([]);
  const [margin, setMargin] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [tickMajorLabels, setTickMajorLabels] = useState<string[]>([]);
  const [labelFontSize] = useState(18);
  // Calculate required values
  // autosize if radius is set to zero
  if (options.gaugeRadius === 0) {
    let tmpGaugeRadius = options.panelHeight / 2;
    if (options.panelWidth < options.panelHeight) {
      tmpGaugeRadius = options.panelWidth / 2;
    }
    if (gaugeRadiusCalc !== tmpGaugeRadius) {
      console.log(`calculated radius ${tmpGaugeRadius}`);
      setGaugeRadiusCalc(tmpGaugeRadius);
    }
  }


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
        for (const aTickMap of options.tickMapConfig.tickMaps){
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


    const svgSize = gaugeRadiusCalc * 2;
    console.log(`calculated SVGSize ${svgSize}`);
    setSVGSize(svgSize);

    // Define a linear scale to convert values to needle displacement angle (degrees)
    const valueScale = scaleLinear()
      .domain([options.minValue, options.maxValue])
      .range([options.zeroTickAngle, options.maxTickAngle]);
    //
    const needleLenPos =
      gaugeRadiusCalc - options.padding -
      options.edgeWidth - options.tickEdgeGap -
      options.tickLengthMaj - options.needleTickGap;
    setNeedleLengthPos(needleLenPos);
    const nLength = options.needleLengthNeg + needleLenPos;
    setNeedlePathLength(nLength);
    const needlePathStartX = options.needleLengthNeg * -1;
    setNeedlePathStart(needlePathStartX);
    const tickStartMajX = gaugeRadiusCalc - options.padding -
      options.edgeWidth - options.tickEdgeGap - options.tickLengthMaj;
    setTickStartMaj(tickStartMajX);
    const tickStartMinX = gaugeRadiusCalc - options.padding -
      options.edgeWidth - options.tickEdgeGap - options.tickLengthMin;
    setTickStartMin(tickStartMinX);
    setLabelStart(tickStartMajX - options.tickLabelFontSize);
    setInnerEdgeRadius(gaugeRadiusCalc - options.padding - options.edgeWidth);
    setOuterEdgeRadius(gaugeRadiusCalc - options.padding);
    setPivotRadius(options.pivotRadius * gaugeRadiusCalc);
    // setOriginX(options.gaugeRadius);
    // setOriginY(options.gaugeRadius);

    if (options.tickSpacingMajor === undefined) {
      options.tickSpacingMajor = 10;
    }
    if (options.tickSpacingMinor === undefined) {
      options.tickSpacingMinor = 1;
    }
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

    // size of major tick
    const tickWidthMajorX = options.tickWidthMajor * (gaugeRadiusCalc / options.ticknessGaugeBasis);
    setTickWidthMajorCalc(tickWidthMajorX);
    // size of minor tick
    const tickWidthMinorX = options.tickWidthMinor * (gaugeRadiusCalc / options.ticknessGaugeBasis);
    setTickWidthMinorCalc(tickWidthMinorX);

  }, [gaugeRadiusCalc, tickAnglesMaj, tickAnglesMin, options, tickMajorLabels]);

  const createCircleGroup = () => {
    return (
      <g id='circles'>
        <circle cx={originX} cy={originY} r={outerEdgeRadius} fill={options.outerEdgeColor} stroke='none'></circle>
        <circle cx={originX} cy={originY} r={innerEdgeRadius} fill={options.innerColor} stroke='none'></circle>
        <circle cx={originX} cy={originY} r={pivotRadius} fill={options.pivotColor} stroke='none'></circle>
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
              fontSize={labelFontSize || 8}
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
    console.log(`major tick count ${pathTicksMajor.length}`);
    const pathTicksMinor = tickCalcMin(tickAnglesMin);
    console.log(`minor tick count ${pathTicksMinor.length}`);
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
      console.log(`tick angle major = ${tickAngle} for degree ${degree}`);
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

  const createValueLabel = (position: number, value: string) => {
    return (
      <g id='valueLabels'>
        <text
          x={labelXCalc(position, 0, value)}
          y={labelYCalc(position) + options.valueYOffset}
          fontSize={options.valueFontSize}
          textAnchor='middle'
          fill={options.unitsLabelColor}
          fontWeight={'bold'}
          fontFamily={options.valueFont}
        >
          {value}
        </text>
      </g>
    );
  };

  const createThresholdBands = () => {
    const boundaries = '60,80'.split(',');
    return (
      <>
        { options.showThresholdsOnGauge && (
          <>
            {options.showThresholdLowerRange &&
              drawBand(options.minValue, parseFloat(boundaries[0]), 'green')}
            {options.showThresholdMiddleRange &&
              drawBand(parseFloat(boundaries[0]), parseFloat(boundaries[1]), 'yellow')}
            {options.showThresholdUpperRange &&
              drawBand(parseFloat(boundaries[1]), options.maxValue, 'red')}
          </>
        )}
      </>
    );
    /*
    if (options.showThresholdOnGauge && options.thresholds.length > 0) {
      // split the threshold values
      const boundaries = options.thresholds.split(',');
      if (options.showLowerThresholdRange) {
        drawBand(options.minVal, parseFloat(boundaries[0]), options.thresholdColors[0]);
      }
      if (options.showMiddleThresholdRange) {
        drawBand(parseFloat(boundaries[0]), parseFloat(boundaries[1]), options.thresholdColors[1]);
      }
      if (options.showUpperThresholdRange) {
        drawBand(parseFloat(boundaries[1]), options.maxVal, options.thresholdColors[2]);
      }
    }
    */
  };

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
          {createNeedle()}
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

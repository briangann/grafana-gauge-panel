import React, { useEffect, useState } from 'react';

import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

import { GaugeOptions, MarkerEndShapes, MarkerStartShapes, MarkerType, Markers } from './types';
import { scaleLinear, line } from 'd3';

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
  const [needleWidth] = useState(2);
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

  // Calculate required values
  // autosize if radius is set to zero
  if (options.gaugeRadius === 0) {
    let tmpGaugeRadius = options.panelHeight / 2;
    let xspace = options.panelHeight;
    if (options.panelWidth < options.panelHeight) {
      tmpGaugeRadius = options.panelWidth / 2;
      xspace = options.panelWidth;
      // TODO: check span/title
      //if (typeof this.panel.span !== 'undefined' && this.panel.title !== '') {
      //  // using the width requires more margin in pre-v5
      //  tmpGaugeRadius -= 5;
      //}
    }
    if (gaugeRadiusCalc !== tmpGaugeRadius) {
      console.log(`calculated radius ${tmpGaugeRadius}`);
      setGaugeRadiusCalc(tmpGaugeRadius);
    }
  }


  useEffect(() => {

    const generateTickAngles = (tickSpacingMajDeg: number, tickSpacingMinDeg: number) => {
      const tickAnglesMajX = [];
      let counter = 0;
      for (let i = options.zeroTickAngle; i <= options.maxTickAngle; i = i + tickSpacingMajDeg) {
        const tickAngle = options.zeroTickAngle + tickSpacingMajDeg * counter;
        // check if this is the "end" of a full circle, and skip the last tick marker
        if (tickAngle - options.zeroTickAngle < 360) {
          tickAnglesMajX.push(options.zeroTickAngle + tickSpacingMajDeg * counter);
        }
        counter++;
      }
      const tickAnglesMinX = [];
      counter = 0;
      for (let j = options.zeroTickAngle; j <= options.maxTickAngle; j = j + tickSpacingMinDeg) {
        // Check for an existing major tick angle
        let exists = 0;
        tickAnglesMajX.forEach((d: any) => {
          if (options.zeroTickAngle + tickSpacingMinDeg * counter === d) {
            exists = 1;
          }
        });
        if (exists === 0) {
          tickAnglesMinX.push(options.zeroTickAngle + tickSpacingMinDeg * counter);
        }
        counter++;
      }
      return ({ tickMaj: tickAnglesMajX, tickMin: tickAnglesMinX });
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
    setLabelStart(tickStartMajX - options.labelFontSize);
    setInnerEdgeRadius(gaugeRadiusCalc - options.padding - options.edgeWidth);
    setOuterEdgeRadius(gaugeRadiusCalc - options.padding);
    setPivotRadius(options.pivotRadius * gaugeRadiusCalc);
    //setOriginX(options.gaugeRadius);
    //setOriginY(options.gaugeRadius);

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

    const { tickMaj, tickMin } = generateTickAngles(tickSpacingMajDeg, tickSpacingMinDeg);
    if (JSON.stringify(tickAnglesMaj) !== JSON.stringify(tickMaj)) {
      setTickAnglesMaj(tickMaj);
    }
    if (JSON.stringify(tickAnglesMin) !== JSON.stringify(tickMin)) {
      setTickAnglesMin(tickMin);
    }

    //
    // Calculate major tick mark label text
    let counter = 0;
    const tickLabelText = [] as any;
    for (let k = options.zeroTickAngle; k <= options.maxTickAngle; k = k + tickSpacingMajDeg) {
      const tickValue = options.minValue + options.tickSpacingMajor * counter;
      const parts = options.tickSpacingMajor.toString().split('.');
      let tickText = tickValue.toString();
      if (parts.length > 1) {
        tickText = Number(tickValue).toFixed(parts[1].length).toString();
      }
      // check if there are tickMaps that apply
      const tickTextFloat = parseFloat(tickText);
      // TODO: mappings to be implemented
      //for (let i = 0; i < this.opt.tickMaps.length; i++) {
      //  const aTickMap = this.opt.tickMaps[i];
      //  if (parseFloat(aTickMap.value) === tickTextFloat) {
      //    tickText = aTickMap.text;
      //    break;
      //  }
      //}
      tickLabelText.push(tickText);
      counter++;
    }

    const tickWidthMajorX = options.tickWidthMajor * (gaugeRadiusCalc / options.ticknessGaugeBasis);
    setTickWidthMajorCalc(tickWidthMajorX);
    const tickWidthMinorX = options.tickWidthMinor * (gaugeRadiusCalc / options.ticknessGaugeBasis);
    setTickWidthMinorCalc(tickWidthMinorX);

  }, [gaugeRadiusCalc, tickAnglesMaj, tickAnglesMin, options]);

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
        { Markers.map((item: MarkerType) => {
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
  }
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
        )};
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
  }


  const createTicks = () => {
    const pathTicksMajor = tickCalcMaj(tickAnglesMaj);
    console.log(`major tick count ${pathTicksMajor.length}`);
    const pathTicksMinor = tickCalcMin(tickAnglesMin);
    console.log(`minor tick count ${pathTicksMinor.length}`);
    // eslint-disable-next-line no-debugger
    //debugger;
    return (
      <g id="ticks">
        <g id='minorTickMarks'>
          {pathTicksMinor.length > 0 && pathTicksMinor.map((d: string) => {
            return (
              <>
                <path d={d} stroke={options.tickMinorColor} strokeWidth={tickWidthMinorCalc + 'px'} />
              </>
            );
          })};
        </g>
        <g id='majorTickMarks'>
          {pathTicksMajor.length > 0 && pathTicksMajor.map((d: string) => {
            return (
              <>
                <path d={d} stroke={options.tickMajorColor} strokeWidth={tickWidthMajorCalc + 'px'} />
              </>
            );
          })};
        </g>
      </g>
    )
  }

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
  }

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
  }

  const dToR = (angleDeg: any) => {
    // Turns an angle in degrees to radians
    const angleRad = angleDeg * (Math.PI / 180);
    return angleRad;
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
          {createTicks()}
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

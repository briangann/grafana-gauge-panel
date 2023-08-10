
import React from 'react';
import { arc, line } from 'd3';
import { GaugeOptions, MarkerType, Markers } from './types';
import { GrafanaTheme2 } from '@grafana/data';


export const dToR = (angleDeg: any) => {
  // Turns an angle in degrees to radians
  const angleRad = angleDeg * (Math.PI / 180);
  return angleRad;
};

export const valueToDegrees = (value: any, minValue: number, maxValue: number, zeroTickAngle: number, maxTickAngle: number) => {
  // example: degree range is from 60 to 300 (240)  maxTickAngle - zeroTickAngle
  const degreeRange = maxTickAngle - zeroTickAngle;
  const range = maxValue - minValue;
  const min = minValue;
  return (value / range) * degreeRange - ((min / range) * degreeRange + zeroTickAngle);
};

export const valueToRadians = (value: any, minValue: number, maxValue: number, zeroTickAngle: number, maxTickAngle: number) => {
  return (valueToDegrees(value, minValue, maxValue, zeroTickAngle, maxTickAngle) * Math.PI) / 180;
};

// Define functions to calcuate the positions of the labels for the tick marks
export const labelXCalc = (position: number, maxLabelLength: number, labelText: string, labelFontSize: number, labelStart: number, originX: number) => {
  const tickAngle = position + 90;
  const tickAngleRad = dToR(tickAngle);
  // the max length of digits needs to be used for proper alignment
  const labelW = labelFontSize / (labelText.length + maxLabelLength / 2);
  const x1 = originX + (labelStart - labelW) * Math.cos(tickAngleRad);
  return x1;
};

export const labelYCalc = (position: number, labelFontSize: number, labelStart: number, originY: number) => {
  const tickAngle = position + 90;
  const tickAngleRad = dToR(tickAngle);
  const y1 = originY + labelStart * Math.sin(tickAngleRad) + labelFontSize / 2;
  return y1;
};

export const drawBand = (start: number, end: number, color: string, originX: number, originY: number, options: GaugeOptions, theme2: GrafanaTheme2) => {
  if (0 >= end - start) {
    return;
  }
  const anArc = arc();
  const xc = anArc({
    innerRadius: 0.7 * options.gaugeRadius,
    outerRadius: 0.85 * options.gaugeRadius,
    startAngle: valueToRadians(start, options.minValue, options.maxValue, options.zeroTickAngle, options.maxTickAngle),
    endAngle: valueToRadians(end, options.minValue, options.maxValue, options.zeroTickAngle, options.maxTickAngle),
  });

  return (
    <>
      {xc &&
        <path
          fill={theme2.visualization.getColorByName(color)}
          d={xc || ''}
          transform={`translate(${originX},${originY}) rotate(${options.maxTickAngle})`}
        />
      }
    </>
  );
};

export const needleCalc = (degree: number, originX: number, originY: number, needlePathStart: number, needlePathLength: number) => {
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

export const createNeedleMarkers = (needleColor: string, theme2: GrafanaTheme2) => {
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
            <path d={item.path} fill={theme2.visualization.getColorByName(needleColor)} />
          </marker>
        );
      })}
    </defs>
  );
};

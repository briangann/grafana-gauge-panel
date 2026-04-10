import { useMemo } from 'react';

import { line, type ScaleLinear } from 'd3';

import { TickMapItemType } from '../TickMaps/types';
import { dToR } from './utils';

const MAX_TICKS = 100;

const generateTickAngles = (zeroTickAngle: number, maxTickAngle: number, majorDegree: number, minorDegree: number) => {
  if (majorDegree <= 0 || !isFinite(majorDegree)) {
    return { tickMaj: [], tickMin: [], clamped: false };
  }

  let clamped = false;
  const majorAngles: number[] = [];
  let counter = 0;
  let iterations = 0;
  for (let i = zeroTickAngle; i <= maxTickAngle; i = i + majorDegree) {
    if (majorAngles.length >= MAX_TICKS || iterations++ > MAX_TICKS) {
      clamped = true;
      break;
    }
    const tickAngle = zeroTickAngle + majorDegree * counter;
    if (tickAngle - zeroTickAngle < 360) {
      majorAngles.push(zeroTickAngle + majorDegree * counter);
    }
    counter++;
  }

  if (minorDegree <= 0 || !isFinite(minorDegree)) {
    return { tickMaj: majorAngles, tickMin: [], clamped };
  }

  const minorAngles: number[] = [];
  counter = 0;
  iterations = 0;
  for (let j = zeroTickAngle; j <= maxTickAngle; j = j + minorDegree) {
    if (minorAngles.length >= MAX_TICKS || iterations++ > MAX_TICKS) {
      clamped = true;
      break;
    }
    let exists = 0;
    majorAngles.forEach((d: number) => {
      if (Math.abs(zeroTickAngle + minorDegree * counter - d) < 0.0001) {
        exists = 1;
      }
    });
    if (exists === 0) {
      minorAngles.push(zeroTickAngle + minorDegree * counter);
    }
    counter++;
  }
  return { tickMaj: majorAngles, tickMin: minorAngles, clamped };
};

const generateTickMajorLabels = (
  zeroTickAngle: number,
  maxTickAngle: number,
  minValue: number,
  maxValue: number,
  tickSpacingMajor: number,
  majorDegree: number,
  tickMaps: TickMapItemType[]
) => {
  if (majorDegree <= 0 || !isFinite(majorDegree)) {
    return { labels: [], clamped: false };
  }

  let clamped = false;
  let counter = 0;
  let iterations = 0;
  const tickLabelText: string[] = [];
  for (let k = zeroTickAngle; k <= maxTickAngle; k = k + majorDegree) {
    if (tickLabelText.length >= MAX_TICKS || iterations++ > MAX_TICKS) {
      clamped = true;
      break;
    }
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
  return { labels: tickLabelText, clamped };
};

interface TickComputationOptions {
  minValue: number;
  maxValue: number;
  zeroTickAngle: number;
  maxTickAngle: number;
  tickSpacingMajor: number;
  tickSpacingMinor: number;
  tickMaps: TickMapItemType[];
  valueScale: ScaleLinear<number, number>;
  originX: number;
  originY: number;
  tickStartMaj: number;
  tickStartMin: number;
  tickLengthMaj: number;
  tickLengthMin: number;
}

export const useTickComputations = (opts: TickComputationOptions) => {
  const { valueScale } = opts;

  const tickSpacingMajDeg = useMemo(() => {
    const tickSpacingMajor = opts.tickSpacingMajor ?? 10;
    const scaleZero = valueScale(0) ?? 0;
    const majorA = valueScale(tickSpacingMajor) ?? 0;
    return Math.abs(majorA - scaleZero);
  }, [valueScale, opts.tickSpacingMajor]);

  const tickSpacingMinDeg = useMemo(() => {
    const tickSpacingMinor = opts.tickSpacingMinor ?? 1;
    const scaleZero = valueScale(0) ?? 0;
    const minorA = valueScale(tickSpacingMinor) ?? 0;
    return Math.abs(minorA - scaleZero);
  }, [valueScale, opts.tickSpacingMinor]);

  const { tickMaj: tickAnglesMaj, tickMin: tickAnglesMin, clamped: anglesClamped } = useMemo(
    () => generateTickAngles(opts.zeroTickAngle, opts.maxTickAngle, tickSpacingMajDeg, tickSpacingMinDeg),
    [opts.zeroTickAngle, opts.maxTickAngle, tickSpacingMajDeg, tickSpacingMinDeg]
  );

  const { labels: tickMajorLabels, clamped: labelsClamped } = useMemo(
    () =>
      generateTickMajorLabels(
        opts.zeroTickAngle,
        opts.maxTickAngle,
        opts.minValue,
        opts.maxValue,
        opts.tickSpacingMajor ?? 10,
        tickSpacingMajDeg,
        opts.tickMaps
      ),
    [
      opts.zeroTickAngle,
      opts.maxTickAngle,
      opts.minValue,
      opts.maxValue,
      opts.tickSpacingMajor,
      tickSpacingMajDeg,
      opts.tickMaps,
    ]
  );

  const { tickPathsMaj, tickPathsMin } = useMemo(() => {
    const computePaths = (degrees: number[], tickStart: number, tickLength: number) => {
      const paths: string[] = [];
      const lineFn = line();
      for (const degree of degrees) {
        const tickAngle = degree + 90;
        const tickAngleRad = dToR(tickAngle);
        const y1 = opts.originY + tickStart * Math.sin(tickAngleRad);
        const y2 = opts.originY + (tickStart + tickLength) * Math.sin(tickAngleRad);
        const x1 = opts.originX + tickStart * Math.cos(tickAngleRad);
        const x2 = opts.originX + (tickStart + tickLength) * Math.cos(tickAngleRad);
        const lineSVG = lineFn([
          [x1, y1],
          [x2, y2],
        ]);
        if (lineSVG) {
          paths.push(lineSVG);
        }
      }
      return paths;
    };
    return {
      tickPathsMaj: computePaths(tickAnglesMaj, opts.tickStartMaj, opts.tickLengthMaj),
      tickPathsMin: computePaths(tickAnglesMin, opts.tickStartMin, opts.tickLengthMin),
    };
  }, [
    tickAnglesMaj,
    tickAnglesMin,
    opts.originX,
    opts.originY,
    opts.tickStartMaj,
    opts.tickStartMin,
    opts.tickLengthMaj,
    opts.tickLengthMin,
  ]);

  const ticksClamped = anglesClamped || labelsClamped;
  return { tickAnglesMaj, tickAnglesMin, tickMajorLabels, tickPathsMaj, tickPathsMin, ticksClamped };
};

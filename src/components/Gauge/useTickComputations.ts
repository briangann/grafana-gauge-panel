import { useMemo } from 'react';

import { scaleLinear } from 'd3';

import { TickMapItemType } from '../TickMaps/types';

const generateTickAngles = (zeroTickAngle: number, maxTickAngle: number, majorDegree: number, minorDegree: number) => {
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

interface TickComputationOptions {
  minValue: number;
  maxValue: number;
  zeroTickAngle: number;
  maxTickAngle: number;
  tickSpacingMajor: number;
  tickSpacingMinor: number;
  tickMaps: TickMapItemType[];
}

export const useTickComputations = (opts: TickComputationOptions) => {
  const tickSpacingMajDeg = useMemo(() => {
    const tickSpacingMajor = opts.tickSpacingMajor ?? 10;
    const valueScale = scaleLinear()
      .domain([opts.minValue, opts.maxValue])
      .range([opts.zeroTickAngle, opts.maxTickAngle]);
    const scaleZero = valueScale(0) ?? 0;
    const majorA = valueScale(tickSpacingMajor) ?? 0;
    return Math.abs(majorA - scaleZero);
  }, [opts.minValue, opts.maxValue, opts.zeroTickAngle, opts.maxTickAngle, opts.tickSpacingMajor]);

  const tickSpacingMinDeg = useMemo(() => {
    const tickSpacingMinor = opts.tickSpacingMinor ?? 1;
    const valueScale = scaleLinear()
      .domain([opts.minValue, opts.maxValue])
      .range([opts.zeroTickAngle, opts.maxTickAngle]);
    const scaleZero = valueScale(0) ?? 0;
    const minorA = valueScale(tickSpacingMinor) ?? 0;
    return Math.abs(minorA - scaleZero);
  }, [opts.minValue, opts.maxValue, opts.zeroTickAngle, opts.maxTickAngle, opts.tickSpacingMinor]);

  const { tickMaj: tickAnglesMaj, tickMin: tickAnglesMin } = useMemo(
    () => generateTickAngles(opts.zeroTickAngle, opts.maxTickAngle, tickSpacingMajDeg, tickSpacingMinDeg),
    [opts.zeroTickAngle, opts.maxTickAngle, tickSpacingMajDeg, tickSpacingMinDeg]
  );

  const tickMajorLabels = useMemo(
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

  return { tickAnglesMaj, tickAnglesMin, tickMajorLabels };
};

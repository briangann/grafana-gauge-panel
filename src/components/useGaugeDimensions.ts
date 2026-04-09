import { useEffect, useMemo, useState } from 'react';

import { scaleLabelFontSize } from './gauge_render';

interface GaugeDimensionOptions {
  gaugeRadius: number;
  needleWidth: number;
  ticknessGaugeBasis: number;
  needleLengthNeg: number;
  tickWidthMajor: number;
  tickWidthMinor: number;
  padding: number;
  edgeWidth: number;
  tickEdgeGap: number;
  tickLengthMaj: number;
  tickLengthMin: number;
  needleTickGap: number;
  tickLabelFontSize: number;
}

export const useGaugeDimensions = (opts: GaugeDimensionOptions) => {
  const [needlePathLength, setNeedlePathLength] = useState(0);
  const [needlePathStart, setNeedlePathStart] = useState(0);
  const [tickStartMaj, setTickStartMaj] = useState(0);
  const [tickStartMin, setTickStartMin] = useState(0);
  const [labelStart, setLabelStart] = useState(0);

  const {
    SVGSize,
    needleWidth,
    needleLengthNegCalc,
    tickWidthMajorCalc,
    tickWidthMinorCalc,
    outerEdgeRadius,
    innerEdgeRadius,
    originX,
    originY,
  } = useMemo(
    () => ({
      SVGSize: opts.gaugeRadius * 2,
      needleWidth: opts.needleWidth * (opts.gaugeRadius / opts.ticknessGaugeBasis),
      needleLengthNegCalc: opts.gaugeRadius * opts.needleLengthNeg,
      tickWidthMajorCalc: opts.tickWidthMajor * (opts.gaugeRadius / opts.ticknessGaugeBasis),
      tickWidthMinorCalc: opts.tickWidthMinor * (opts.gaugeRadius / opts.ticknessGaugeBasis),
      outerEdgeRadius: opts.gaugeRadius - opts.padding,
      innerEdgeRadius: opts.gaugeRadius - opts.padding - opts.edgeWidth,
      originX: opts.gaugeRadius,
      originY: opts.gaugeRadius,
    }),
    [
      opts.gaugeRadius,
      opts.needleWidth,
      opts.ticknessGaugeBasis,
      opts.needleLengthNeg,
      opts.tickWidthMajor,
      opts.tickWidthMinor,
      opts.padding,
      opts.edgeWidth,
    ]
  );

  useEffect(() => {
    const needleLenPosCalc =
      opts.gaugeRadius -
      opts.padding -
      opts.edgeWidth -
      opts.tickEdgeGap -
      opts.tickLengthMaj -
      opts.needleTickGap * opts.gaugeRadius;
    setNeedlePathLength(needleLengthNegCalc + needleLenPosCalc);
    setNeedlePathStart(needleLengthNegCalc * -1);
    const tickStartMajor = opts.gaugeRadius - opts.padding - opts.edgeWidth - opts.tickEdgeGap - opts.tickLengthMaj;
    setTickStartMaj(tickStartMajor);
    const tickStartMinor = opts.gaugeRadius - opts.padding - opts.edgeWidth - opts.tickEdgeGap - opts.tickLengthMin;
    setTickStartMin(tickStartMinor);
    const tmpTickLabelFontSize = scaleLabelFontSize(opts.tickLabelFontSize, opts.gaugeRadius, opts.ticknessGaugeBasis);
    setLabelStart(tickStartMajor - tmpTickLabelFontSize);
  }, [
    opts.gaugeRadius,
    opts.padding,
    opts.edgeWidth,
    opts.tickEdgeGap,
    opts.tickLengthMaj,
    opts.tickLengthMin,
    opts.needleTickGap,
    opts.tickLabelFontSize,
    opts.ticknessGaugeBasis,
    needleLengthNegCalc,
  ]);

  return {
    SVGSize,
    needleWidth,
    needleLengthNegCalc,
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
  };
};

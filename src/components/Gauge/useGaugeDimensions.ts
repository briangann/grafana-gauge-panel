import { useMemo } from 'react';

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
  return useMemo(() => {
    const needleLengthNegCalc = opts.gaugeRadius * opts.needleLengthNeg;
    const needleLenPosCalc =
      opts.gaugeRadius -
      opts.padding -
      opts.edgeWidth -
      opts.tickEdgeGap -
      opts.tickLengthMaj -
      opts.needleTickGap * opts.gaugeRadius;
    const tickStartMajor = opts.gaugeRadius - opts.padding - opts.edgeWidth - opts.tickEdgeGap - opts.tickLengthMaj;
    const tickStartMinor = opts.gaugeRadius - opts.padding - opts.edgeWidth - opts.tickEdgeGap - opts.tickLengthMin;
    const tmpTickLabelFontSize = scaleLabelFontSize(opts.tickLabelFontSize, opts.gaugeRadius, opts.ticknessGaugeBasis);

    return {
      SVGSize: opts.gaugeRadius * 2,
      needleWidth: opts.needleWidth * (opts.gaugeRadius / opts.ticknessGaugeBasis),
      tickWidthMajorCalc: opts.tickWidthMajor * (opts.gaugeRadius / opts.ticknessGaugeBasis),
      tickWidthMinorCalc: opts.tickWidthMinor * (opts.gaugeRadius / opts.ticknessGaugeBasis),
      outerEdgeRadius: opts.gaugeRadius - opts.padding,
      innerEdgeRadius: opts.gaugeRadius - opts.padding - opts.edgeWidth,
      originX: opts.gaugeRadius,
      originY: opts.gaugeRadius,
      needlePathLength: needleLengthNegCalc + needleLenPosCalc,
      needlePathStart: needleLengthNegCalc * -1,
      tickStartMaj: tickStartMajor,
      tickStartMin: tickStartMinor,
      labelStart: tickStartMajor - tmpTickLabelFontSize * 1.3,
    };
  }, [
    opts.gaugeRadius,
    opts.needleWidth,
    opts.ticknessGaugeBasis,
    opts.needleLengthNeg,
    opts.tickWidthMajor,
    opts.tickWidthMinor,
    opts.padding,
    opts.edgeWidth,
    opts.tickEdgeGap,
    opts.tickLengthMaj,
    opts.tickLengthMin,
    opts.needleTickGap,
    opts.tickLabelFontSize,
  ]);
};

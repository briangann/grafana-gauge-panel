import { PanelModel } from '@grafana/data';
import { config } from '@grafana/runtime';
import { satisfies, coerce } from 'semver';

import { FontFamilies, GaugeOptions } from './components/types';

interface AngularOptions {
  // limits
  minValue: number;
  maxValue: number;
  // tick spacing
  tickSpaceMinVal: number;
  tickSpaceMajVal: number;
  // units
  gaugeUnits: string;
  // radius
  gaugeRadius: number;
  pivotRadius: number;
  // padding
  padding: number;
  // edgeWidth
  edgeWidth: number;
  // tickEdgeGap
  tickEdgeGap: number;
  // tickLengths
  tickLengthMaj: number;
  tickLengthMin: number;
  // needleTickGap
  needleTickGap: number;
  // needleLengthNeg
  needleLengthNeg: number;
  // ticknessGaugeBasis (scaling)
  ticknessGaugeBasis: number;
  // needleWidth
  needleWidth: number;
  // colors
  outerEdgeCol: string;
  pivotCol: string;
  tickColMaj: string;
  tickColMin: string;
  tickLabelCol: string;
  unitsLabelCol: string;
  // thresholds
  show: boolean;
  showLowerThresholdRange: boolean;
  showMiddleThresholdRange: boolean;
  showUpperThresholdRange: boolean;
  showThresholdColorOnBackground: boolean;
  showThresholdColorOnValue: boolean;
  showThresholdOnGauge: boolean;
  // fonts
  tickFont: string;
  unitsFont: string;
  // font sizes
  unitsLabelFontSize: number;
  // ticks
  tickWidthMaj: number;
  tickWidthMin: number;
  // needle
  zeroNeedleAngle: number;
  zeroTickAngle: number;
  //
  decimals: number;
  format: string;
  operatorName: string;
}

/**
 * This is called when the panel is imported or reloaded
 */
export const PanelMigrationHandler = (panel: PanelModel<GaugeOptions>): Partial<GaugeOptions> => {
  // @ts-ignore
  if (!panel.gauge) {
    // not angular, just return the options if currently set
    if (!panel.options) {
      // This happens on the first load or when migrating from angular
      return {} as any;
    }
    // have settings, return them unchanged
    return panel.options;
  }
  // @ts-ignore
  const newDefaults = migrateDefaults(panel.gauge);
  const options = newDefaults;
  // @ts-ignore
  if (panel.format) {
    // @ts-ignore
    options.unitFormat = panel.format;
    // @ts-ignore
    delete panel.format;
  }
  // @ts-ignore
  if (panel.decimals) {
    // @ts-ignore
    options.decimals = panel.decimals;
    // @ts-ignore
    delete panel.decimals;
  }
  // TODO: migrate thresholds and colors
  // @ts-ignore
  delete panel.colors;
  // @ts-ignore
  delete panel.thresholds;
  // TODO: migrate tickmaps
  // @ts-ignore
  delete panel.tickMaps;
  // TODO: migrate mappingTypes
  // mappingType: number
  // @ts-ignore
  delete panel.mappingType;
  // mappingTypes: [] { name: string, value: number }
  // @ts-ignore
  delete panel.mappingTypes;
  // @ts-ignore
  if (panel.valueMaps) {
    // TODO: migrate valueMaps
  }
  // @ts-ignore
  delete panel.valueMaps;
  // operator
  // @ts-ignore
  if (panel.operatorName) {
    // TODO: map the old operators to the new list
  }
  // @ts-ignore
  delete panel.operatorName
  // @ts-ignore
  if (panel.rangeMaps) {
    // TODO: migrate rangemaps
  }
  // @ts-ignore
  delete panel.rangeMaps;
  // clean up
  // @ts-ignore
  delete panel.fontSizes;
  // @ts-ignore
  delete panel.fontTypes;
  // @ts-ignore
  delete panel.gaugeDivId;
  // @ts-ignore
  delete panel.markerEndShapes;
  // @ts-ignore
  delete panel.markerStartShapes;
  // @ts-ignore
  delete panel.operatorNameOptions;
  // @ts-ignore
  delete panel.svgContainer;
  // @ts-ignore
  delete panel.unitFormats;
  // @ts-ignore
  delete panel.gauge;
  return options;
};

export const migrateDefaults = (angular: AngularOptions) => {
  // set default values first
  const options: GaugeOptions = {
    decimals: 2,
    unitFormat: 'short',
    operatorName: 'mean',
    valueYOffset: 0,
    valueFontSize: 0,
    valueFont: FontFamilies.INTER,
    tickLabelFontSize: 0,
    tickFont: FontFamilies.INTER,
    animateNeedleValueTransition: true,
    animateNeedleValueTransitionSpeed: 500,
    markerEndEnabled: false,
    markerEndShape: 'arrow',
    markerStartEnabled: false,
    markerStartShape: 'stub',
    // limits
    minValue: 0,
    maxValue: 100,
    //
    thresholdColors: [
      'rgba(245, 54, 54, 0.9)',
      'rgba(237, 129, 40, 0.89)',
      'rgba(50, 172, 45, 0.97)'
    ],
    outerEdgeColor: '',
    innerColor: '',
    pivotColor: '',
    needleColor: '',
    unitsLabelColor: '',
    tickLabelColor: '',
    tickMajorColor: '',
    tickMinorColor: '',
    gaugeRadius: 0,
    pivotRadius: 0,
    padding: 0,
    edgeWidth: 0,
    tickEdgeGap: 0,
    tickLengthMaj: 0,
    tickLengthMin: 0,
    ticknessGaugeBasis: 0,
    tickWidthMajor: 0,
    tickWidthMinor: 0,
    needleWidth: 2,
    needleTickGap: 0,
    needleLengthNeg: 0,
    zeroTickAngle: 0,
    maxTickAngle: 0,
    zeroNeedleAngle: 0,
    maxNeedleAngle: 0,
    // tick spacing
    tickSpacingMajor: 0,
    tickSpacingMinor: 0,
    tickMapConfig: {
      tickMaps: []
    },
    showThresholdsOnGauge: true,
    showThresholdColorOnValue: false,
    showThresholdColorOnBackground: false,
    showThresholdLowerRange: true,
    showThresholdMiddleRange: true,
    showThresholdUpperRange: true
  };
  // next migrate the angular settings

  // migrate limits
  if (angular.maxValue) {
    options.maxValue = angular.maxValue;
  }
  if (angular.minValue) {
    options.minValue = angular.minValue;
  }
  // migrate tick spacing
  if (angular.tickSpaceMajVal) {
    options.tickSpacingMajor = angular.tickSpaceMajVal;
  }
  if (angular.tickSpaceMinVal) {
    options.tickSpacingMinor = angular.tickSpaceMinVal;
  }
  // units
  // TODO: this is also called .format, and may need a type conversion
  if (angular.gaugeUnits) {
    options.unitFormat = angular.gaugeUnits;
  }
  // radius settings
  if (angular.gaugeRadius) {
    options.gaugeRadius = angular.gaugeRadius;
  }
  if (angular.pivotRadius) {
    options.pivotRadius = angular.pivotRadius;
  }
  // padding
  if (angular.padding) {
    options.padding = angular.padding;
  }
  // edgeWidth
  if (angular.edgeWidth) {
    options.edgeWidth = angular.edgeWidth;
  }
  // tickEdgeGap
  if (angular.tickEdgeGap) {
    options.tickEdgeGap = angular.tickEdgeGap;
  }
  // tickLengthMaj/Min
  if (angular.tickLengthMaj) {
    options.tickLengthMaj = angular.tickLengthMaj;
  }
  if (angular.tickLengthMin) {
    options.tickLengthMin = angular.tickLengthMin;
  }
  // needleTickGap
  if (angular.needleTickGap) {
    options.needleTickGap = angular.needleTickGap;
  }
  // needleLengthNeg
  if (angular.needleLengthNeg) {
    options.needleLengthNeg = angular.needleLengthNeg;
  }
  // ticknessGaugeBasis
  if (angular.ticknessGaugeBasis) {
    options.ticknessGaugeBasis = angular.ticknessGaugeBasis;
  }
  // needleWidth
  if (angular.needleWidth) {
    options.needleWidth = angular.needleWidth;
  }
  // color
  if (angular.outerEdgeCol) {
    options.outerEdgeColor = angular.outerEdgeCol;
  }
  if (angular.pivotCol) {
    options.pivotColor = angular.pivotCol;
  }
  if (angular.tickColMaj) {
    options.tickMajorColor = angular.tickColMaj;
  }
  if (angular.tickColMin) {
    options.tickMinorColor = angular.tickColMin;
  }
  if (angular.tickLabelCol) {
    options.tickLabelColor = angular.tickLabelCol;
  }
  //
  if (angular.showLowerThresholdRange) {
    options.showThresholdLowerRange = angular.showLowerThresholdRange;
  }
  if (angular.showMiddleThresholdRange) {
    options.showThresholdMiddleRange = angular.showMiddleThresholdRange;
  }
  if (angular.showUpperThresholdRange) {
    options.showThresholdUpperRange = angular.showUpperThresholdRange;
  }
  if (angular.showThresholdColorOnBackground) {
    options.showThresholdColorOnBackground = angular.showThresholdColorOnBackground;
  }
  if (angular.showThresholdColorOnValue) {
    options.showThresholdColorOnValue = angular.showThresholdColorOnValue;
  }
  if (angular.showThresholdOnGauge) {
    options.showThresholdsOnGauge = angular.showThresholdOnGauge;
  }
  // font
  if (angular.tickFont) {
    options.tickFont = angular.tickFont;
  }
  if (angular.unitsFont) {
    options.valueFont = angular.unitsFont;
  }
  //
  if (angular.tickWidthMaj) {
    options.tickWidthMajor = angular.tickWidthMaj;
  }
  if (angular.tickWidthMin) {
    options.tickWidthMinor = angular.tickWidthMin;
  }
  if (angular.unitsLabelCol) {
    options.unitsLabelColor = angular.unitsLabelCol;
  }
  if (angular.unitsLabelFontSize) {
    options.valueFontSize = angular.unitsLabelFontSize;
  }
  if (angular.zeroNeedleAngle) {
    options.zeroNeedleAngle = angular.zeroNeedleAngle;
  }
  if (angular.zeroTickAngle) {
    options.zeroTickAngle = angular.zeroTickAngle;
  }
  return options;
};

/**
 * This is called when the panel changes from another panel
 *
 * not currently used
 */
export const PanelChangedHandler = (
  panel: PanelModel<Partial<GaugeOptions>> | any,
  prevPluginId: string,
  prevOptions: any
) => {
  // Changing from angular polystat panel
  if (prevPluginId === 'd3gauge' && prevOptions.angular) {
    console.log('detected old panel');
    const oldOpts = prevOptions.angular;
    console.log(JSON.stringify(oldOpts));
  }
  return {};
};

// Roboto font was removed Dec 1, 2022, and releases after that date should not attempt to use it
export const hasRobotoFont = () => {
  const version = coerce(config.buildInfo.version);
  if (version !== null) {
    if (satisfies(version, '<9.4.0')) {
      return true;
    }
  }
  return false;
};

import { PanelModel } from '@grafana/data';
import { config } from '@grafana/runtime';
import { satisfies, coerce } from 'semver';

import { GaugeOptions } from './components/types';

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
  delete panel.gauge;
  return options;
};

export const migrateDefaults = (angular: AngularOptions) => {
  const options: GaugeOptions = {
    panelHeight: undefined,
    panelWidth: undefined,
    panelId: 0,
    decimals: 2,
    unitFormat: '',
    operatorName: 'avg',
    valueYOffset: 0,
    valueFontSize: 0,
    valueFont: '',
    tickLabelFontSize: 0,
    tickFont: '',
    animateNeedleValueTransition: true,
    animateNeedleValueTransitionSpeed: 500,
    markerEndEnabled: false,
    markerEndShape: '',
    markerStartEnabled: true,
    markerStartShape: '',
    // limits
    minValue: 0,
    maxValue: 100,
    //
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
  // migrate limits
  if (angular.maxValue) {
    options.maxValue = angular.maxValue;
  }
  if (angular.minValue) {
    options.minValue = angular.minValue;
  }
  // migrate tick spacing
  if (angular.tickSpaceMinVal) {
    options.tickSpacingMinor = angular.tickSpaceMinVal;
  }
  if (angular.tickSpaceMajVal) {
    options.tickSpacingMajor = angular.tickSpaceMajVal;
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
  //
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

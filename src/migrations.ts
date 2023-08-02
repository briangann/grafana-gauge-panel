import { FieldConfig, PanelModel, ValueMapping, convertOldAngularValueMappings } from '@grafana/data';
import { config } from '@grafana/runtime';
import { satisfies, coerce } from 'semver';

import { FontFamilies, GaugeOptions } from './components/types';
import { TickMapItemType } from 'components/TickMaps/types';

interface AngularTickMap {
  value: string;
  text: string;
}

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
  // using fieldConfig
  // @ts-ignore
  const fieldConfigDefaults = migrateFieldConfig(panel, panel.fieldConfig);
  panel.fieldConfig.defaults = fieldConfigDefaults;
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
  // @ts-ignore
  options.tickMapConfig = migrateTickMaps(panel.tickMaps) || [];
  // @ts-ignore
  delete panel.tickMaps;
  // migrate mappingTypes/Value/RangeMaps
  const newMaps = migrateValueAndRangeMaps(panel);
  panel.fieldConfig.defaults.mappings = newMaps;
  // @ts-ignore
  delete panel.mappingType;
  // @ts-ignore
  delete panel.rangeMaps;
  // @ts-ignore
  delete panel.valueMaps;
  // operator conversion
  // @ts-ignore
  options.operatorName = convertOperators(panel.operatorName);
  // @ts-ignore
  delete panel.operatorName;
  // @ts-ignore
  delete panel.operatorNameOptions;
  // general clean up
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
  // clean up undefined
  // @ts-ignore
  Object.keys(panel).forEach((key) => (panel[key] === undefined ? delete panel[key] : {}));
  // @ts-ignore
  Object.keys(options).forEach((key) => (options[key] === undefined ? delete options[key] : {}));

  return options;
};

export const convertOperators = (operator: string) => {
  switch (operator) {
    case 'avg':
      return 'mean';
    case 'current':
      return 'last'; // lastNotNull?
    case 'time_step':
      return 'step';
    case 'total':
      return 'sum';
    default:
      return operator;
  }
};

export const migrateTickMaps = (tickMaps: AngularTickMap[]) => {
  const newTickMaps: TickMapItemType[] = [];
  if (!tickMaps || tickMaps.length === 0) {
    return newTickMaps;
  }
  let count = 0;
  for (const item of tickMaps) {
    const aTickMap: TickMapItemType = {
      label: `Label-${count}`,
      value: item.value,
      text: item.text,
      enabled: true,
      order: count
    };
    newTickMaps.push(aTickMap);
    count++;
  }
  return newTickMaps;
};

export const migrateFieldConfig = (panel: PanelModel<GaugeOptions, any>, fieldConfig: FieldConfig<any>) => {
  // @ts-ignore
  if (panel.decimals) {
    // @ts-ignore
    fieldConfig.decimals = panel.decimals;
    // @ts-ignore
    delete panel.decimals;
  }
  // units
  // @ts-ignore
  if (panel.gauge) {
    // @ts-ignore
    if (panel.gauge.gaugeUnits) {
      // @ts-ignore
      fieldConfig.unit = panel.gauge.gaugeUnits;
    }
  }
  return fieldConfig;
};

export const migrateValueAndRangeMaps = (panel: any) => {
  // value maps first
  panel.mappingType = 1;
  let newValueMappings: ValueMapping[] = [];
  if (panel.valueMaps !== undefined) {
    newValueMappings = convertOldAngularValueMappings(panel);
  }
  // range maps second
  panel.mappingType = 2;
  let newRangeMappings: ValueMapping[] = [];
  if (panel.rangeMaps !== undefined) {
    newRangeMappings = convertOldAngularValueMappings(panel);
  }
  // append together
  const newMappings = newValueMappings.concat(newRangeMappings);
  // get uniques only
  const uniques = [...new Map(newMappings.map((v) => [JSON.stringify(v), v])).values()];
  return uniques;
};


export const migrateDefaults = (angular: AngularOptions) => {
  // set default values first
  const options: GaugeOptions = {
    operatorName: 'mean',
    valueYOffset: 0,
    valueFontSize: 22,
    valueFont: FontFamilies.INTER,
    tickLabelFontSize: 18,
    tickFont: FontFamilies.INTER,
    animateNeedleValueTransition: true,
    animateNeedleValueTransitionSpeed: 100,
    markerEndEnabled: false,
    markerEndShape: 'arrow',
    markerStartEnabled: false,
    markerStartShape: 'circle',
    // limits
    minValue: 0,
    maxValue: 100,
    //
    thresholdColors: [
      'rgba(245, 54, 54, 0.9)',
      'rgba(237, 129, 40, 0.89)',
      'rgba(50, 172, 45, 0.97)'
    ],
    outerEdgeColor: '#0099cc',
    innerColor: '#ffffff',
    pivotColor: '#999999',
    needleColor: '#0099cc',
    unitsLabelColor: '#000000',
    tickLabelColor: '#000000',
    tickMajorColor: '#0099cc',
    tickMinorColor: '#000000',
    gaugeRadius: 0,
    pivotRadius: 0.1,
    padding: 0.05,
    edgeWidth: 0.05,
    tickEdgeGap: 0.05,
    tickLengthMaj: 0.15,
    tickLengthMin: 0.05,
    ticknessGaugeBasis: 200,
    tickWidthMajor: 5,
    tickWidthMinor: 1,
    needleWidth: 5,
    needleTickGap: 0.05,
    needleLengthNeg: 0.2,
    zeroTickAngle: 60,
    maxTickAngle: 300,
    zeroNeedleAngle: 40,
    maxNeedleAngle: 320,
    // tick spacing
    tickSpacingMajor: 10,
    tickSpacingMinor: 1,
    tickMapConfig: [],
    showThresholdBandOnGauge: false,
    showThresholdColorOnValue: false,
    showThresholdColorOnBackground: false,
    showThresholdBandLowerRange: false,
    showThresholdBandMiddleRange: false,
    showThresholdBandUpperRange: false,
    displayFormatted: '',
    displayValue: null
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
    options.showThresholdBandLowerRange = angular.showLowerThresholdRange;
  }
  if (angular.showMiddleThresholdRange) {
    options.showThresholdBandMiddleRange = angular.showMiddleThresholdRange;
  }
  if (angular.showUpperThresholdRange) {
    options.showThresholdBandUpperRange = angular.showUpperThresholdRange;
  }
  if (angular.showThresholdColorOnBackground) {
    options.showThresholdColorOnBackground = angular.showThresholdColorOnBackground;
  }
  if (angular.showThresholdColorOnValue) {
    options.showThresholdColorOnValue = angular.showThresholdColorOnValue;
  }
  if (angular.showThresholdOnGauge) {
    options.showThresholdBandOnGauge = angular.showThresholdOnGauge;
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

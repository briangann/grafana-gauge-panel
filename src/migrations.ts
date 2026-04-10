import {
  FieldConfigSource,
  PanelModel,
  ThresholdsConfig,
  ThresholdsMode,
  ValueMapping,
  convertOldAngularValueMappings,
} from '@grafana/data';
import { config } from '@grafana/runtime';
import { satisfies, coerce } from 'semver';

import { FontFamilies, GaugeOptions, Markers } from './components/types';
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
  innerCol: string;
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
  thresholdColors: string[];
  // fonts
  tickFont: string;
  unitsFont: string;
  // font sizes
  unitsLabelFontSize: number;
  labelFontSize: number;
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

/** Panel-level properties present during Angular-to-React migration. */
interface AngularPanelProperties {
  gauge?: AngularOptions;
  format?: string;
  decimals?: number;
  thresholds?: string;
  colors?: string[];
  tickMaps?: AngularTickMap[];
  operatorName?: string;
  operatorNameOptions?: unknown;
  fontSizes?: unknown;
  fontTypes?: unknown;
  gaugeDivId?: unknown;
  markerEndEnabled?: boolean;
  markerEndShape?: string;
  markerStartEnabled?: boolean;
  markerStartShape?: string;
  markerEndShapes?: unknown;
  markerStartShapes?: unknown;
  svgContainer?: unknown;
  unitFormats?: unknown;
  mappingType?: number;
  valueMaps?: unknown[];
  rangeMaps?: unknown[];
  mappingTypes?: unknown;
  [key: string]: unknown;
}

type AngularPanel = PanelModel<GaugeOptions> & AngularPanelProperties;

/** FieldConfig with extra top-level properties from angular migration. */
interface AngularFieldConfig extends FieldConfigSource {
  decimals?: number;
  unit?: string;
}

/**
 * This is called when the panel is imported or reloaded
 */
export const PanelMigrationHandler = (panel: PanelModel<GaugeOptions>): Partial<GaugeOptions> => {
  const ap = panel as AngularPanel;
  if (!ap.gauge) {
    // not angular, just return the options if currently set
    if (!panel.options) {
      // This happens on the first load or when migrating from angular
      return {};
    }
    // have settings, return them unchanged
    return panel.options;
  }
  const newDefaults = migrateDefaults(ap.gauge);
  const options = newDefaults;
  // using fieldConfig
  ap.fieldConfig = migrateFieldConfig(ap, ap.fieldConfig as AngularFieldConfig);
  if (ap.format) {
    (options as unknown as Record<string, unknown>).unitFormat = ap.format;
    delete ap.format;
  }
  if (ap.decimals) {
    (options as unknown as Record<string, unknown>).decimals = ap.decimals;
    delete ap.decimals;
  }
  if (ap.thresholds) {
    const migratedThresholds = migrateThresholds(ap.thresholds, ap.colors || []);
    ap.fieldConfig.defaults.thresholds = migratedThresholds;
  }
  delete ap.colors;
  delete ap.thresholds;
  options.tickMapConfig = migrateTickMaps(ap.tickMaps || []);
  delete ap.tickMaps;
  // migrate mappingTypes/Value/RangeMaps
  const newMaps = migrateValueAndRangeMaps(ap);
  ap.fieldConfig.defaults.mappings = newMaps;
  delete ap.mappingType;
  delete ap.mappingTypes;
  delete ap.rangeMaps;
  delete ap.valueMaps;
  // operator conversion
  options.operatorName = convertOperators(ap.operatorName || '');
  delete ap.operatorName;
  delete ap.operatorNameOptions;
  // general clean up
  delete ap.fontSizes;
  delete ap.fontTypes;
  delete ap.gaugeDivId;
  options.markerEndEnabled = ap.markerEndEnabled ?? false;
  options.markerEndShape = (Markers.find((e) => e.name === ap.markerEndShape) || Markers[0]).name;
  delete ap.markerEndShapes;
  options.markerStartEnabled = ap.markerStartEnabled ?? false;
  options.markerStartShape = (Markers.find((e) => e.name === ap.markerStartShape) || Markers[1]).name;
  delete ap.markerStartShapes;
  delete ap.operatorNameOptions;
  delete ap.svgContainer;
  delete ap.unitFormats;
  delete ap.gauge;
  // clean up undefined
  Object.keys(ap).forEach((key) => (ap[key] === undefined ? delete ap[key] : {}));
  Object.keys(options).forEach((key) => {
    if ((options as unknown as Record<string, unknown>)[key] === undefined) {
      delete (options as unknown as Record<string, unknown>)[key];
    }
  });

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
    return {
      tickMaps: newTickMaps,
      enabled: true,
    };
  }
  let count = 0;
  for (const item of tickMaps) {
    const aTickMap: TickMapItemType = {
      label: `Label-${count}`,
      value: item.value,
      text: item.text,
      enabled: true,
      order: count,
    };
    newTickMaps.push(aTickMap);
    count++;
  }
  return {
    tickMaps: newTickMaps,
    enabled: true,
  };
};

export const migrateFieldConfig = (panel: AngularPanel, fieldConfig: AngularFieldConfig) => {
  if (panel.decimals) {
    fieldConfig.decimals = panel.decimals;
    delete panel.decimals;
  }
  // units
  if (panel.gauge) {
    if (panel.gauge.gaugeUnits) {
      fieldConfig.unit = panel.gauge.gaugeUnits;
    }
  }
  return fieldConfig;
};

export const migrateValueAndRangeMaps = (panel: AngularPanel) => {
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
    titleYOffset: 0,
    titleFontSize: 22,
    titleFont: FontFamilies.INTER,
    tickLabelFontSize: 18,
    tickFont: FontFamilies.INTER,
    animateNeedleValueTransition: true,
    animateNeedleValueTransitionSpeed: 100,
    allowNeedleCrossLimits: true,
    needleCrossLimitDegrees: 10,
    markerEndEnabled: false,
    markerEndShape: 'arrow',
    markerStartEnabled: false,
    markerStartShape: 'circle',
    // limits
    minValue: 0,
    maxValue: 100,
    //
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
    tickMapConfig: {
      tickMaps: [],
      enabled: true,
    },
    showThresholdBandOnGauge: false,
    showThresholdBandLowerRange: false,
    showThresholdBandMiddleRange: false,
    showThresholdBandUpperRange: false,
    displayFormatted: '',
    displayValue: null,
    displayTitle: '',
    showTitle: false,
    showValue: true,
    showTickLabels: true,
    thresholds: undefined,
    showThresholdStateOnValue: false,
    showThresholdStateOnTitle: false,
    showThresholdStateOnBackground: false,
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
  if (angular.innerCol) {
    options.innerColor = angular.innerCol;
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
    options.showThresholdStateOnBackground = angular.showThresholdColorOnBackground;
  }
  if (angular.showThresholdColorOnValue) {
    options.showThresholdStateOnValue = angular.showThresholdColorOnValue;
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
  if (angular.labelFontSize) {
    options.tickLabelFontSize = angular.labelFontSize;
  }
  if (angular.zeroNeedleAngle) {
    options.zeroNeedleAngle = angular.zeroNeedleAngle;
  }
  if (angular.zeroTickAngle) {
    options.zeroTickAngle = angular.zeroTickAngle;
  }
  return options;
};

const migrateThresholds = (thresholds: string, thresholdColors: string[]) => {
  // default colors are used in case the array passed in is empty
  const defaultColors = ['rgba(50, 172, 45, 0.97)', 'rgba(237, 129, 40, 0.89)', 'rgba(245, 54, 54, 0.9)'];

  const defaultThresholds: ThresholdsConfig = {
    mode: ThresholdsMode.Absolute,
    steps: [
      {
        color: 'green',
        value: -Infinity,
      },
    ],
  };
  if (thresholds.length === 0) {
    return defaultThresholds;
  }
  // convert existing thresholds to new format, the only option is "absolute" in the old panel
  // there should be colors defined, but if there are none, use the defaults
  const migratedThresholds: ThresholdsConfig = {
    mode: ThresholdsMode.Absolute,
    steps: [],
  };
  const allThresholds = thresholds.split(',');
  let useColors = thresholdColors;
  if (thresholdColors.length === 0) {
    useColors = defaultColors;
  }
  // there should only be two values for thresholds
  // the values up to the first is implied -Infinity to first value
  migratedThresholds.steps.push(
    {
      color: useColors[0],
      value: -Infinity,
    },
    {
      color: useColors[1],
      value: Number(allThresholds[0]),
    },
    {
      color: useColors[2],
      value: Number(allThresholds[1]),
    }
  );
  return migratedThresholds;
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

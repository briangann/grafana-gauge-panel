import { SelectableValue, ThresholdsConfig } from '@grafana/data';
import { TickMapItemType } from './TickMaps/types';

export interface GaugeOptions {
  // data: PanelData | undefined;
  displayFormatted: string;
  displayValue: number | null;
  // General
  operatorName: string;
  valueYOffset: number;

  // Font Settings
  valueFont: string;
  valueFontSize: number;
  tickLabelFontSize: number;
  tickFont: string;

  // preset index
  // presetIndex: number;
  // Needle Options
  animateNeedleValueTransition: boolean;
  animateNeedleValueTransitionSpeed: number;
  allowNeedleCrossLimits: boolean;
  needleCrossLimitDegrees: number;
  markerEndEnabled: boolean;
  markerEndShape: string;
  markerStartEnabled: boolean;
  markerStartShape: string;
  // limits
  minValue: number;
  maxValue: number;
  // coloring
  outerEdgeColor: string;
  innerColor: string;
  pivotColor: string;
  needleColor: string;
  unitsLabelColor: string;
  tickLabelColor: string;
  tickMajorColor: string;
  tickMinorColor: string;
  // Gauge Radial
  gaugeRadius: number;
  pivotRadius: number;
  padding: number;
  edgeWidth: number;
  tickEdgeGap: number;
  tickLengthMaj: number;
  tickLengthMin: number;
  ticknessGaugeBasis: number;
  tickWidthMajor: number;
  tickWidthMinor: number;
  needleWidth: number;
  needleTickGap: number;
  needleLengthNeg: number;
  // Gauge Degrees
  zeroTickAngle: number;
  maxTickAngle: number;
  zeroNeedleAngle: number;
  maxNeedleAngle: number;
  // radial
  tickSpacingMajor: number;
  tickSpacingMinor: number;
  // passed in by grafana
  panelHeight?: any;
  panelWidth?: any;
  panelId?: number;

  // tickmaps
  tickMapConfig: {
    tickMaps: TickMapItemType[];
    enabled: boolean;
  };

  // thresholds
  showThresholdBandOnGauge: boolean;
  showThresholdBandLowerRange: boolean;
  showThresholdBandMiddleRange: boolean;
  showThresholdBandUpperRange: boolean;
  //
  showThresholdStateOnValue: boolean;
  showThresholdStateOnBackground: boolean;
  //
  thresholds: ThresholdsConfig | undefined;
}

// tslint:disable-next-line
export interface GaugeModel {}



export enum FontFamilies {
  ARIAL = 'Arial',
  HELVETICA = 'Helvetica',
  HELVETICA_NEUE = 'Helvetica Neue',
  INTER = 'Inter',
  ROBOTO = 'Roboto',
  ROBOTO_MONO = 'Roboto Mono',
}

export const FontFamilyOptions: SelectableValue[] = [
  { value: FontFamilies.ARIAL, label: 'Arial' },
  { value: FontFamilies.HELVETICA, label: 'Helvetica' },
  { value: FontFamilies.HELVETICA_NEUE, label: 'Helvetica Neue' },
  { value: FontFamilies.INTER, label: 'Inter' },
  { value: FontFamilies.ROBOTO_MONO, label: 'Roboto Mono' },
];

export const FontSizes: SelectableValue[] = [
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10' },
  { value: 11, label: '11' },
  { value: 12, label: '12' },
  { value: 13, label: '13' },
  { value: 14, label: '14' },
  { value: 15, label: '15' },
  { value: 16, label: '16' },
  { value: 17, label: '17' },
  { value: 18, label: '18' },
  { value: 19, label: '19' },
  { value: 20, label: '20' },
  { value: 22, label: '22' },
  { value: 24, label: '24' },
  { value: 26, label: '26' },
  { value: 28, label: '28' },
  { value: 30, label: '30' },
  { value: 32, label: '32' },
  { value: 34, label: '34' },
  { value: 36, label: '36' },
  { value: 38, label: '38' },
  { value: 40, label: '40' },
  { value: 42, label: '42' },
  { value: 44, label: '44' },
  { value: 46, label: '46' },
  { value: 48, label: '48' },
  { value: 50, label: '50' },
  { value: 52, label: '52' },
  { value: 54, label: '54' },
  { value: 56, label: '56' },
  { value: 58, label: '58' },
  { value: 60, label: '60' },
  { value: 62, label: '62' },
  { value: 64, label: '64' },
  { value: 66, label: '66' },
  { value: 68, label: '68' },
  { value: 70, label: '70' },
];

export const OperatorOptions: SelectableValue[] = [
  { value: 'mean', label: 'Mean (avg)' },
  { value: 'sum', label: 'Sum' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'last', label: 'Last' },
  { value: 'lastNotNull', label: 'Last Not Null' },
  { value: 'first', label: 'First' },
  { value: 'firstNotNull', label: 'First Not Null' },
  { value: 'count', label: 'Count' },
  { value: 'allIsNull', label: 'All Is Null (boolean)' },
  { value: 'allIsZero', label: 'All Is Zero (boolean)' },
  { value: 'delta', label: 'Delta' },
  { value: 'diff', label: 'Difference' },
  { value: 'diffperc', label: 'Difference (Percent)' },
  { value: 'last_time', label: 'Time of Last Point' },
  { value: 'logmin', label: 'Log Min' },
  { value: 'name', label: 'Name' },
  { value: 'nonNullCount', label: 'Non Null Count' },
  { value: 'previousDeltaUp', label: 'Previous Delta Up' },
  { value: 'range', label: 'Range' },
  { value: 'step', label: 'Step' },
];


export interface MarkerType {
  id: number;
  name: string;
  path: string;
  viewBox: string;
}
export const Markers: MarkerType[] = [
  { id: 0, name: 'arrow', path: 'M 0,0 m -5,-5 L 5,0 L -5,5 Z', viewBox: '-5 -5 10 10' },
  { id: 1, name: 'circle', path: 'M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0', viewBox: '-6 -6 12 12' },
  { id: 2, name: 'square', path: 'M 0,0 m -5,-5 L 5,-5 L 5,5 L -5,5 Z', viewBox: '-5 -5 10 10' },
  { id: 3, name: 'stub', path: 'M 0,0 m -1,-5 L 1,-5 L 1,5 L -1,5 Z', viewBox: '-1 -5 2 10' },
  { id: 4, name: 'arrow-inverse', path: 'M 0,0 m 5,5 L -5,0 L 5,-5 Z', viewBox: '-5 -5 10 10' },
];

/*
export const MarkerStartShapes = [
  { id: 0, name: 'circle' },
  { id: 1, name: 'square' },
  { id: 2, name: 'stub' },
];

export const MarkerEndShapes = [
  { id: 0, name: 'arrow' }
];
*/

export const MarkerOptions: SelectableValue[] = [
  { value: 'arrow', label: 'arrow' },
  { value: 'circle', label: 'circle' },
  { value: 'square', label: 'square' },
  { value: 'stub', label: 'stub' },
  { value: 'arrow-inverse', label: 'arrow-inverse' },
];

export interface ExpandedThresholdBand {
  index: number;
  min: number;
  max: number;
  color: string;
}

export interface GaugePresetType {
  id: number;
  name: string;
  faceColor: string;
}

export const GaugePresetOptions: GaugePresetType[] = [
  { id: 0, name: 'Default', faceColor: '#FFFFFF' },
  { id: 1, name: 'Red', faceColor: '#FF0000' },
  { id: 2, name: 'Compass', faceColor: '#00F0FF' },
];

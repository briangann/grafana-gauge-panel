import { SelectableValue } from '@grafana/data';

export interface GaugeOptions {
  decimals: number;
  panelHeight: any;
  panelWidth: any;
  panelId: number;
  unitFormat: string;
  operatorName: string;
}

export interface GaugeModel {}

export const MarkerStartShapes = [
  { id: 0, name: 'circle' },
  { id: 1, name: 'square' },
  { id: 2, name: 'stub' },
];

export const MarkerEndShapes = [{ id: 0, name: 'arrow' }];

export enum FontFamilies {
  ARIAL = 'Arial',
  HELVETICA = 'Helvetica',
  HELVETICA_NEUE = 'Helvetica Neue',
  INTER = 'Inter',
  ROBOTO = 'Roboto',
  ROBOTO_MONO = 'Roboto Mono',
}

export const FontFamilyOptions = [
  { value: FontFamilies.ARIAL, label: 'Arial' },
  { value: FontFamilies.HELVETICA, label: 'Helvetica' },
  { value: FontFamilies.HELVETICA_NEUE, label: 'Helvetica Neue' },
  { value: FontFamilies.INTER, label: 'Inter' },
  { value: FontFamilies.ROBOTO_MONO, label: 'Roboto Mono' },
];
export const FontFamilyOptionsLegacy = [
  { value: FontFamilies.ARIAL, label: 'Arial' },
  { value: FontFamilies.HELVETICA, label: 'Helvetica' },
  { value: FontFamilies.HELVETICA_NEUE, label: 'Helvetica Neue' },
  { value: FontFamilies.ROBOTO, label: 'Roboto' },
  { value: FontFamilies.ROBOTO_MONO, label: 'Roboto Mono' },
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

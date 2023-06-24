import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { GaugePanel } from './components/GaugePanel';
import { GaugeOptions, OperatorOptions } from 'components/types';
import { DataSuggestionsSupplier } from './components/suggestions';
import { PanelMigrationHandler } from './migrations';

export const plugin = new PanelPlugin<GaugeOptions>(GaugePanel)
  .setMigrationHandler(PanelMigrationHandler)
  .useFieldConfig({
    disableStandardOptions: [
      FieldConfigProperty.Thresholds,
      FieldConfigProperty.Color,
      FieldConfigProperty.Decimals,
      FieldConfigProperty.DisplayName,
      FieldConfigProperty.Max,
      FieldConfigProperty.Min,
      FieldConfigProperty.Links,
      FieldConfigProperty.NoValue,
      FieldConfigProperty.Unit,
    ],
    standardOptions: {
      [FieldConfigProperty.Mappings]: {},
    },
  })
  .setPanelOptions((builder) => {
    builder
      // General Settings

      // unit to use
      .addUnitPicker({
        name: 'Unit',
        path: 'unitFormat',
        defaultValue: 'short',
        category: ['General'],
        description: 'The Unit Format displayed with the metric value',
      })
      // stat (operator)
      .addSelect({
        name: 'Stat',
        path: 'operatorName',
        description: 'Statistic to display',
        category: ['General'],
        defaultValue: OperatorOptions[0].value,
        settings: {
          options: OperatorOptions,
        },
      })
      // decimals
      .addNumberInput({
        name: 'Decimals',
        path: 'decimals',
        description: 'Display specified number of decimals',
        defaultValue: 2,
        settings: {
          min: 0,
          integer: true,
        },
        category: ['General'],
      })
      // valueYOffset
      .addNumberInput({
        name: 'ValueYOffset',
        path: 'valueYOffset',
        description: 'Adjust the displayed value up or down the Y-Axis, use negative value to move up, positive for down',
        defaultValue: 0,
        settings: {
          min: 0,
          integer: true,
        },
        category: ['General'],
      });

      // Font Settings

      // unitsLabelFontSize
      // unitsFont
      // labelFontSize
      // tickFont
  })
  .setSuggestionsSupplier(new DataSuggestionsSupplier());

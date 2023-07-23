import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { GaugePanel } from './components/GaugePanel';
import { FontFamilyOptions, FontSizes, GaugeOptions, MarkerEndShapes, MarkerOptions, MarkerStartShapes, OperatorOptions } from 'components/types';
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
      })

      // Font Settings
      // unitsLabelFontSize
      .addSelect({
        name: 'Value Font Size',
        path: 'valueFontSize',
        description: 'Font Size of Value',
        category: ['Font Settings'],
        defaultValue: FontSizes[8].value,
        settings: {
          options: FontSizes,
        },
      })
      // Value Font
      .addSelect({
        name: 'Value Font',
        path: 'valueFont',
        description: 'The font of the value text, at the bottom of the gauge',
        category: ['Font Settings'],
        defaultValue: FontFamilyOptions[3].value,
        settings: {
          options: FontFamilyOptions,
        },
      })
      // tickLabelFontSize
      .addSelect({
        name: 'Tick Label Font Size',
        path: 'tickLabelFontSize',
        description: 'Font Size of Value Displayed',
        category: ['Font Settings'],
        defaultValue: FontSizes[4].value,
        settings: {
          options: FontSizes,
        },
      })
      // tickFont
      .addSelect({
        name: 'Tick Label Font',
        path: 'tickFont',
        description: 'The font of the tick labels',
        category: ['Font Settings'],
        defaultValue: FontFamilyOptions[3].value,
        settings: {
          options: FontFamilyOptions,
        },
      })
      // animateNeedleValueTransition
      .addBooleanSwitch({
        name: 'Animate Needle Transition',
        path: 'animateNeedleValueTransition',
        defaultValue: true,
        category: ['Needle Options'],
        description: 'Animate needle when value changes',
      })
      // animateNeedleValueTransitionSpeed
      .addNumberInput({
        name: 'Transition Speed (MS)',
        path: 'animateNeedleValueTransitionSpeed',
        description: 'How fast to move the needle when value changes in milliseconds, default is 500',
        defaultValue: 500,
        settings: {
          placeHolder: '500',
          min: 50,
          integer: true,
        },
        category: ['Needle Options'],
        showIf: (c) => c.animateNeedleValueTransition === true,
      })
      // markerEndEnabled
      .addBooleanSwitch({
        name: 'Show End Marker',
        path: 'markerEndEnabled',
        defaultValue: true,
        category: ['Needle Options'],
        description: 'Display a marker at end of needle',
      })
      // markerEndShape
      .addSelect({
        name: 'End Marker Shape',
        path: 'markerEndShape',
        description: 'Shape used at the end of the needle',
        category: ['Needle Options'],
        defaultValue: MarkerOptions[0].value,
        settings: {
          options: MarkerOptions,
        },
        showIf: (c) => c.markerEndEnabled === true,
      })
      // markerStartEnabled
      .addBooleanSwitch({
        name: 'Show Start Marker',
        path: 'markerStartEnabled',
        defaultValue: true,
        category: ['Needle Options'],
        description: 'Display a marker at beginning of needle',
      })
      // markerStartShape
      .addSelect({
        name: 'Start Marker Shape',
        path: 'markerStartShape',
        description: 'Shape used at the end of the needle',
        category: ['Needle Options'],
        defaultValue: MarkerOptions[2].value,
        settings: {
          options: MarkerOptions,
        },
        showIf: (c) => c.markerStartEnabled === true,
      })
      // Limits
      .addNumberInput({
        name: 'Minimum Value',
        path: 'minValue',
        description: 'Minimum value displayed by the gauge (left side)',
        defaultValue: 0,
        settings: {
          placeHolder: '0',
          min: 0,
          integer: false,
        },
        category: ['Limits'],
      })
      .addNumberInput({
        name: 'Maximum Value',
        path: 'maxValue',
        description: 'Maximum value displayed by the gauge (right side)',
        defaultValue: 100,
        settings: {
          placeHolder: '100',
          min: 0,
          integer: false,
        },
        category: ['Limits'],
      })

      // Coloring
      .addColorPicker({
        name: 'Outer Edge',
        path: 'outerEdgeColor',
        category: ['Coloring'],
        defaultValue: '#0099CC',
        description: 'Color of the outer circle',
      })
      .addColorPicker({
        name: 'Inner (Face)',
        path: 'innerColor',
        category: ['Coloring'],
        defaultValue: '#FFF',
        description: 'Color of the gauge face',
      })
      .addColorPicker({
        name: 'Pivot',
        path: 'pivotColor',
        category: ['Coloring'],
        defaultValue: '#999',
        description: 'Color of the central pivot circle',
      })
      .addColorPicker({
        name: 'Needle',
        path: 'needleColor',
        category: ['Coloring'],
        defaultValue: '#0099CC',
        description: 'Color of the needle',
      })
      .addColorPicker({
        name: 'Units Label',
        path: 'unitsLabelColor',
        category: ['Coloring'],
        defaultValue: '#000',
        description: 'The color of the units text, at the bottom of the gauge',
      })
      .addColorPicker({
        name: 'Tick Label',
        path: 'tickLabelColor',
        category: ['Coloring'],
        defaultValue: '#000',
        description: 'The color of the tick labels',
      })
      .addColorPicker({
        name: 'Tick Major',
        path: 'tickMajorColor',
        category: ['Coloring'],
        defaultValue: '#0099CC',
        description: 'Color of the major ticks',
      })
      .addColorPicker({
        name: 'Tick Minor',
        path: 'tickMinorColor',
        category: ['Coloring'],
        defaultValue: '#000',
        description: 'Color of the minor ticks',
      })

      // Radial Customization
      .addNumberInput({
        name: 'Radius',
        path: 'gaugeRadius',
        description: 'The radius of the gauge in pixels (0 for autoscaling)',
        defaultValue: 120,
        settings: {
          placeHolder: '20',
          min: 20,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Pivot Radius',
        path: 'pivotRadius',
        description: 'Size of the central \'pivot\' circle, on which the needle sits, as a % of the gauge radius',
        defaultValue: 0.1,
        settings: {
          placeHolder: '0.1',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Padding',
        path: 'padding',
        description: 'Padding between gauge radius and the outer circle of the gauge, as a % of the gauge radius',
        defaultValue: 0.05,
        settings: {
          placeHolder: '0.05',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Edge Width',
        path: 'edgeWidth',
        description: 'The thickness of the circle around the edge of the gauge, as a % of the gauge radius',
        defaultValue: 0.05,
        settings: {
          placeHolder: '0.05',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Tick Edge Gap',
        path: 'tickEdgeGap',
        description: 'Spacing between ticks and the outer circle, as a % of the gauge radius',
        defaultValue: 0.05,
        settings: {
          placeHolder: '0.05',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Tick Length Major',
        path: 'tickLengthMaj',
        description: 'Length of the major ticks, as a % of the gauge radius',
        defaultValue: 0.15,
        settings: {
          placeHolder: '0.15',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Tick Length Minor',
        path: 'tickLengthMin',
        description: 'Length of the minor ticks, as a % of the gauge radius',
        defaultValue: 0.05,
        settings: {
          placeHolder: '0.05',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Needle Tick Gap',
        path: 'needleTickGap',
        description: 'Spacing between ticks and the outer circle, as a % of the gauge radius',
        defaultValue: 0.05,
        settings: {
          placeHolder: '0.05',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Needle Length Stem',
        path: 'needleLengthNeg',
        description: 'Length of the needle section extending beyond the centre of the gauge, as a % of the gauge radius',
        defaultValue: 0,
        settings: {
          placeHolder: '0',
          min: 0,
          integer: true,
        },
        category: ['Radial Customization'],
      })
      // Gauge Degrees
      .addNumberInput({
        name: 'Zero Tick Angle',
        path: 'zeroTickAngle',
        description: 'Angle where the tick value (0) starts (default 60)',
        defaultValue: 60,
        settings: {
          placeHolder: '60',
          min: 0,
          integer: false,
        },
        category: ['Gauge Degrees'],
      })
      .addNumberInput({
        name: 'Max Tick Angle',
        path: 'maxTickAngle',
        description: 'Angle where the tick value ends (default 320)',
        defaultValue: 300,
        settings: {
          placeHolder: '300',
          min: 0,
          integer: false,
        },
        category: ['Gauge Degrees'],
      })
      .addNumberInput({
        name: 'Zero Needle Angle',
        path: 'zeroNeedleAngle',
        description: 'Angle where needle is at minimum value (default 60)',
        defaultValue: 60,
        settings: {
          placeHolder: '60',
          min: 0,
          integer: false,
        },
        category: ['Gauge Degrees'],
      })
      .addNumberInput({
        name: 'Max Needle Angle',
        path: 'maxNeedleAngle',
        description: 'Angle where needle is at maximum value (default 320)',
        defaultValue: 320,
        settings: {
          placeHolder: '320',
          min: 0,
          integer: false,
        },
        category: ['Gauge Degrees'],
      })
      // Gauge Readings
      .addNumberInput({
        name: 'Tick Spacing Minor',
        path: 'tickSpacingMinor',
        description: 'The numeric spacing of the minor increment ticks',
        defaultValue: 1,
        settings: {
          placeHolder: '1',
          min: 1,
          integer: true,
        },
        category: ['Gauge Readings'],
      })
      .addNumberInput({
        name: 'Tick Spacing Major',
        path: 'tickSpacingMajor',
        description: 'The numeric spacing of the major increment ticks',
        defaultValue: 10,
        settings: {
          placeHolder: '10',
          min: 1,
          integer: true,
        },
        category: ['Gauge Readings'],
      })
  })
  .setSuggestionsSupplier(new DataSuggestionsSupplier());

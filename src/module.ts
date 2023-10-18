import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { GaugePanel } from './components/GaugePanel';
import { FontFamilyOptions, FontSizes, GaugeOptions, GaugePresetOptions, MarkerOptions, OperatorOptions } from 'components/types';
import { DataSuggestionsSupplier } from './components/suggestions';
import { PanelMigrationHandler } from './migrations';
import { TickMapEditor } from 'components/TickMaps/TickMapEditor';
import { TickMapItemType } from 'components/TickMaps/types';


export const plugin = new PanelPlugin<GaugeOptions>(GaugePanel)
  .setMigrationHandler(PanelMigrationHandler)
  .useFieldConfig({
    disableStandardOptions: [
      FieldConfigProperty.Color,
      FieldConfigProperty.DisplayName,
      FieldConfigProperty.Links,
      FieldConfigProperty.Max,
      FieldConfigProperty.Min,
      FieldConfigProperty.NoValue,
    ],
    standardOptions: {
      [FieldConfigProperty.Unit]: {
        defaultValue: 'short'
      },
      [FieldConfigProperty.Decimals]: {
        defaultValue: 2
      },
      [FieldConfigProperty.Mappings]: {},
    },
  })
  .setPanelOptions((builder) => {
    builder
      // General Settings
      // stat (operator)
      .addSelect({
        name: 'Stat',
        path: 'operatorName',
        description: 'Statistic to display',
        category: ['Standard options'],
        defaultValue: OperatorOptions[0].value,
        settings: {
          options: OperatorOptions,
        },
      })

      // Font Settings
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
      // unitsLabelFontSize
      .addSelect({
        name: 'Value Font Size',
        path: 'valueFontSize',
        description: 'Font Size of Value',
        category: ['Font Settings'],
        defaultValue: FontSizes[17].value,
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
      // tickLabelFontSize
      .addSelect({
        name: 'Tick Label Font Size',
        path: 'tickLabelFontSize',
        description: 'Font Size of Value Displayed',
        category: ['Font Settings'],
        defaultValue: FontSizes[14].value,
        settings: {
          options: FontSizes,
        },
      })

      // Presets
      /*
      .addSelect({
        name: 'Preset',
        path: 'presetIndex',
        description: 'Modify current gauge with preset values',
        settings: {
          options: [
            { value: GaugePresetOptions[0].id, label: GaugePresetOptions[0].name },
            { value: GaugePresetOptions[1].id, label: GaugePresetOptions[1].name },
            { value: GaugePresetOptions[2].id, label: GaugePresetOptions[2].name },
          ],
        },
        defaultValue: GaugePresetOptions[0].id,
        category: ['Presets'],
      })
      */
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
        defaultValue: 100,
        settings: {
          placeHolder: '100',
          min: 50,
          integer: true,
        },
        category: ['Needle Options'],
        showIf: (c) => c.animateNeedleValueTransition === true,
      })
      // toggle ability to bury the needle (below min, beyond max)
      .addBooleanSwitch({
        name: 'Allow Crossing Limits',
        path: 'allowNeedleCrossLimits',
        defaultValue: true,
        category: ['Needle Options'],
        description: 'Allow needle to render below and above limits',
      })
      .addNumberInput({
        name: 'Needle Cross Limit Degrees',
        path: 'needleCrossLimitDegrees',
        description: 'How many degrees to cross below and above minimum and maximum limit, default is 5 degrees',
        defaultValue: 10,
        settings: {
          placeHolder: '10',
          min: 0,
          integer: true,
        },
        category: ['Needle Options'],
        showIf: (c) => c.allowNeedleCrossLimits === true,
      })

      .addNumberInput({
        name: 'Needle Width',
        path: 'needleWidth',
        description: 'Width of Needle, default is 5',
        defaultValue: 5,
        settings: {
          placeHolder: '5',
          min: 1,
          integer: true,
        },
        category: ['Needle Options'],
      })
      // markerEndEnabled
      .addBooleanSwitch({
        name: 'Show End Marker',
        path: 'markerEndEnabled',
        defaultValue: false,
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
        defaultValue: false,
        category: ['Needle Options'],
        description: 'Display a marker at beginning of needle',
      })
      // markerStartShape
      .addSelect({
        name: 'Start Marker Shape',
        path: 'markerStartShape',
        description: 'Shape used at the end of the needle',
        category: ['Needle Options'],
        defaultValue: MarkerOptions[1].value,
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
          integer: false,
        },
        category: ['Limits'],
      })

      // Coloring
      .addColorPicker({
        name: 'Outer Edge',
        path: 'outerEdgeColor',
        category: ['Coloring'],
        defaultValue: '#0099cc',
        description: 'Color of the outer circle',
      })
      .addColorPicker({
        name: 'Inner (Face)',
        path: 'innerColor',
        category: ['Coloring'],
        defaultValue: '#ffffff',
        description: 'Color of the gauge face',
      })
      .addColorPicker({
        name: 'Pivot',
        path: 'pivotColor',
        category: ['Coloring'],
        defaultValue: '#999999',
        description: 'Color of the central pivot circle',
      })
      .addColorPicker({
        name: 'Needle',
        path: 'needleColor',
        category: ['Coloring'],
        defaultValue: '#0099cc',
        description: 'Color of the needle',
      })
      .addColorPicker({
        name: 'Units Label',
        path: 'unitsLabelColor',
        category: ['Coloring'],
        defaultValue: '#000000',
        description: 'The color of the units text, at the bottom of the gauge',
      })
      .addColorPicker({
        name: 'Tick Label',
        path: 'tickLabelColor',
        category: ['Coloring'],
        defaultValue: '#000000',
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
        defaultValue: '#000000',
        description: 'Color of the minor ticks',
      })

      // Radial Customization
      .addNumberInput({
        name: 'Radius',
        path: 'gaugeRadius',
        description: 'The radius of the gauge in pixels (0 for autoscaling)',
        defaultValue: 0,
        settings: {
          placeHolder: '0',
          min: 0,
          integer: true,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Tickness Gauge Basis',
        path: 'ticknessGaugeBasis',
        description: 'Scaling factor for ticks',
        defaultValue: 200,
        settings: {
          placeHolder: '200',
          min: 1,
          integer: true,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Pivot Radius',
        path: 'pivotRadius',
        description: 'Size of the central \'pivot\' circle, on which the needle sits, as a percentage of the gauge radius',
        defaultValue: 0.1,
        settings: {
          placeHolder: '0.1',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      // valueYOffset
      .addNumberInput({
        name: 'Value Y-Offset',
        path: 'valueYOffset',
        description: 'Adjust the displayed value up or down the Y-Axis, use negative value to move up, positive for down',
        defaultValue: 0,
        settings: {
          integer: true,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Padding',
        path: 'padding',
        description: 'Padding between gauge radius and the outer circle of the gauge, as a percentage of the gauge radius',
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
        description: 'The thickness of the circle around the edge of the gauge, as a percentage of the gauge radius',
        defaultValue: 0.05,
        settings: {
          placeHolder: '0.05',
          min: 0,
          step: 0.05,
          integer: false
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Tick Edge Gap',
        path: 'tickEdgeGap',
        description: 'Spacing between ticks and the outer circle, as a percentage of the gauge radius',
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
        description: 'Length of the major ticks, as a percentage of the gauge radius',
        defaultValue: 0.15,
        settings: {
          placeHolder: '0.15',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Tick Width Major',
        path: 'tickWidthMajor',
        description: 'Width of the major ticks in pixels',
        defaultValue: 5,
        settings: {
          placeHolder: '5',
          min: 0,
          integer: true,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Tick Length Minor',
        path: 'tickLengthMin',
        description: 'Length of the minor ticks, as a percentage of the gauge radius',
        defaultValue: 0.05,
        settings: {
          placeHolder: '0.05',
          min: 0,
          integer: false,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Tick Width Minor',
        path: 'tickWidthMinor',
        description: 'Width of the minor ticks in pixels',
        defaultValue: 1,
        settings: {
          placeHolder: '1',
          min: 0,
          integer: true,
        },
        category: ['Radial Customization'],
      })
      .addNumberInput({
        name: 'Needle Tick Gap',
        path: 'needleTickGap',
        description: 'Spacing between ticks the needle end, as a percentage of the gauge radius',
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
        description: 'Length of the needle section extending beyond the centre of the gauge, as a percentage of the gauge radius',
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
        description: 'Angle where the tick value ends (default 300)',
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
        description: 'Angle where needle is at minimum value (default 40)',
        defaultValue: 40,
        settings: {
          placeHolder: '40',
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
      // tick maps (value to text mapping)
      .addCustomEditor({
        name: 'Tick Maps',
        id: 'tickMapConfig',
        path: 'tickMapConfig',
        description: 'Tick Maps',
        editor: TickMapEditor,
        defaultValue: {
          tickMaps: [] as TickMapItemType[],
        },
        category: ['Tick Maps'],
      })
      // threshold options
      .addBooleanSwitch({
        name: 'Show Threshold Band On Gauge',
        path: 'showThresholdBandOnGauge',
        defaultValue: false,
        category: ['Thresholds'],
        description: 'Thresholds are displayed as a band on face of gauge along the needle arc',
      })
      .addBooleanSwitch({
        name: 'Show Lower Range',
        path: 'showThresholdBandLowerRange',
        defaultValue: true,
        category: ['Thresholds'],
        description: 'Lower threshold is displayed on band',
        showIf: (c) => c.showThresholdBandOnGauge === true,
      })
      .addBooleanSwitch({
        name: 'Show Middle Range',
        path: 'showThresholdBandMiddleRange',
        defaultValue: true,
        category: ['Thresholds'],
        description: 'Middle thresholds are displayed on band',
        showIf: (c) => c.showThresholdBandOnGauge === true,
      })
      .addBooleanSwitch({
        name: 'Show Upper Range',
        path: 'showThresholdBandUpperRange',
        defaultValue: true,
        category: ['Thresholds'],
        description: 'Upper threshold is displayed on band',
        showIf: (c) => c.showThresholdBandOnGauge === true,
      })
      .addBooleanSwitch({
        name: 'Show Threshold State on Background',
        path: 'showThresholdStateOnBackground',
        defaultValue: false,
        category: ['Thresholds'],
        description: 'Gauge face color changes to state of threshold',
      })
      .addBooleanSwitch({
        name: 'Show Threshold State on Value',
        path: 'showThresholdStateOnValue',
        defaultValue: false,
        category: ['Thresholds'],
        description: 'Displayed value color changes to state of threshold',
      });

  })
  .setSuggestionsSupplier(new DataSuggestionsSupplier());

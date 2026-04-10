import { PanelModel, ThresholdsMode } from '@grafana/data';
import { config } from '@grafana/runtime';

import { FontFamilies, GaugeOptions } from './components/types';
import {
  PanelMigrationHandler,
  convertOperators,
  migrateDefaults,
  migrateFieldConfig,
  migrateTickMaps,
  migrateValueAndRangeMaps,
  hasRobotoFont,
} from './migrations';

describe('D3Gauge -> D3GaugeV2 migrations', () => {
  it('migrates empty d3gauge', () => {
    const panel: PanelModel = {
      id: 0,
      type: 'panel',
      options: {},
      fieldConfig: {
        defaults: {},
        overrides: [],
      },
    };
    const options = PanelMigrationHandler(panel);
    expect(options).toEqual({});
  });

  it('migrates start and end markers from angular d3gauge', () => {
    const panel: PanelModel = {
      id: 0,
      type: 'panel',
      options: {
        markerStartEnabled: true,
        markerStartShape: 'circle',
        markerEndEnabled: true,
        markerEndShape: 'arrow',
      },
      fieldConfig: {
        defaults: {},
        overrides: [],
      },
    };
    const options = PanelMigrationHandler(panel);
    expect(options).toEqual({
      markerStartEnabled: true,
      markerStartShape: 'circle',
      markerEndEnabled: true,
      markerEndShape: 'arrow',
    });
  });
  it('migrates start and end disabled markers from angular d3gauge', () => {
    const panel: PanelModel = {
      id: 0,
      type: 'panel',
      options: {
        markerStartEnabled: false,
        markerStartShape: 'circle',
        markerEndEnabled: true,
        markerEndShape: 'arrow',
      },
      fieldConfig: {
        defaults: {},
        overrides: [],
      },
    };
    const options = PanelMigrationHandler(panel);
    expect(options).toEqual({
      markerStartEnabled: false,
      markerStartShape: 'circle',
      markerEndEnabled: true,
      markerEndShape: 'arrow',
    });
  });

  it('checks if roboto is available to runtime', () => {
    const versions = new Map<string, boolean>([
      ['8.4.11', true],
      ['8.5.21', true],
      ['9.1.0', true],
      ['9.2.0', true],
      ['9.3.0', true],
      ['9.4.0', false],
      ['9.4.3', false],
    ]);
    for (const [key, value] of versions) {
      config.buildInfo.version = key;
      expect(hasRobotoFont()).toEqual(value);
    }
  });
});

describe('convertOperators', () => {
  it('converts avg to mean', () => {
    expect(convertOperators('avg')).toBe('mean');
  });

  it('converts current to last', () => {
    expect(convertOperators('current')).toBe('last');
  });

  it('converts time_step to step', () => {
    expect(convertOperators('time_step')).toBe('step');
  });

  it('converts total to sum', () => {
    expect(convertOperators('total')).toBe('sum');
  });

  it('passes through unknown operators unchanged', () => {
    expect(convertOperators('max')).toBe('max');
    expect(convertOperators('min')).toBe('min');
    expect(convertOperators('mean')).toBe('mean');
  });

  it('passes through empty string', () => {
    expect(convertOperators('')).toBe('');
  });
});

describe('migrateTickMaps', () => {
  it('returns empty tick maps for empty input', () => {
    const result = migrateTickMaps([]);
    expect(result).toEqual({
      tickMaps: [],
      enabled: true,
    });
  });

  it('converts angular tick maps to new format', () => {
    const angularTickMaps = [
      { value: '10', text: 'Low' },
      { value: '50', text: 'Mid' },
      { value: '90', text: 'High' },
    ];
    const result = migrateTickMaps(angularTickMaps);
    expect(result.tickMaps).toHaveLength(3);
    expect(result.enabled).toBe(true);
    expect(result.tickMaps[0]).toEqual({
      label: 'Label-0',
      value: '10',
      text: 'Low',
      enabled: true,
      order: 0,
    });
    expect(result.tickMaps[1]).toEqual({
      label: 'Label-1',
      value: '50',
      text: 'Mid',
      enabled: true,
      order: 1,
    });
    expect(result.tickMaps[2]).toEqual({
      label: 'Label-2',
      value: '90',
      text: 'High',
      enabled: true,
      order: 2,
    });
  });

  it('converts a single tick map', () => {
    const result = migrateTickMaps([{ value: '0', text: 'Zero' }]);
    expect(result.tickMaps).toHaveLength(1);
    expect(result.tickMaps[0].value).toBe('0');
    expect(result.tickMaps[0].text).toBe('Zero');
    expect(result.tickMaps[0].order).toBe(0);
  });
});

describe('migrateFieldConfig', () => {
  const makePanel = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 0,
      type: 'panel',
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      ...overrides,
    }) as any;

  it('migrates decimals to fieldConfig', () => {
    const panel = makePanel({ decimals: 3 });
    const fieldConfig = { defaults: {}, overrides: [] } as any;
    const result = migrateFieldConfig(panel, fieldConfig);
    expect(result.decimals).toBe(3);
    expect(panel.decimals).toBeUndefined();
  });

  it('migrates gauge units to fieldConfig', () => {
    const panel = makePanel({
      gauge: {
        gaugeUnits: 'percent',
      },
    });
    const fieldConfig = { defaults: {}, overrides: [] } as any;
    const result = migrateFieldConfig(panel, fieldConfig);
    expect(result.unit).toBe('percent');
  });

  it('does not set unit when gauge has no gaugeUnits', () => {
    const panel = makePanel({
      gauge: {
        gaugeUnits: '',
      },
    });
    const fieldConfig = { defaults: {}, overrides: [] } as any;
    const result = migrateFieldConfig(panel, fieldConfig);
    expect(result.unit).toBeUndefined();
  });

  it('returns fieldConfig unchanged when no angular properties present', () => {
    const panel = makePanel();
    const fieldConfig = { defaults: {}, overrides: [] } as any;
    const result = migrateFieldConfig(panel, fieldConfig);
    expect(result).toEqual({ defaults: {}, overrides: [] });
  });
});

describe('migrateValueAndRangeMaps', () => {
  const makePanel = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 0,
      type: 'panel',
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      ...overrides,
    }) as any;

  it('returns empty array when no maps exist', () => {
    const panel = makePanel();
    const result = migrateValueAndRangeMaps(panel);
    expect(result).toEqual([]);
  });

  it('sets mappingType to 1 for value maps then 2 for range maps', () => {
    const panel = makePanel();
    migrateValueAndRangeMaps(panel);
    // After execution, mappingType should be 2 (last assignment)
    expect(panel.mappingType).toBe(2);
  });
});

describe('migrateDefaults', () => {
  // Minimal AngularOptions with all required fields at zero/empty values
  const makeAngularOptions = (overrides: Record<string, unknown> = {}) =>
    ({
      minValue: 0,
      maxValue: 0,
      tickSpaceMinVal: 0,
      tickSpaceMajVal: 0,
      gaugeUnits: '',
      gaugeRadius: 0,
      pivotRadius: 0,
      padding: 0,
      edgeWidth: 0,
      tickEdgeGap: 0,
      tickLengthMaj: 0,
      tickLengthMin: 0,
      needleTickGap: 0,
      needleLengthNeg: 0,
      ticknessGaugeBasis: 0,
      needleWidth: 0,
      outerEdgeCol: '',
      innerCol: '',
      pivotCol: '',
      tickColMaj: '',
      tickColMin: '',
      tickLabelCol: '',
      unitsLabelCol: '',
      show: false,
      showLowerThresholdRange: false,
      showMiddleThresholdRange: false,
      showUpperThresholdRange: false,
      showThresholdColorOnBackground: false,
      showThresholdColorOnValue: false,
      showThresholdOnGauge: false,
      thresholdColors: [],
      tickFont: '',
      unitsFont: '',
      unitsLabelFontSize: 0,
      labelFontSize: 0,
      tickWidthMaj: 0,
      tickWidthMin: 0,
      zeroNeedleAngle: 0,
      zeroTickAngle: 0,
      decimals: 0,
      format: '',
      operatorName: '',
      ...overrides,
    }) as any;

  it('returns default values when angular options are all zero/empty', () => {
    const result = migrateDefaults(makeAngularOptions());
    expect(result.minValue).toBe(0);
    expect(result.maxValue).toBe(100);
    expect(result.gaugeRadius).toBe(0);
    expect(result.outerEdgeColor).toBe('#0099cc');
    expect(result.innerColor).toBe('#ffffff');
    expect(result.pivotColor).toBe('#999999');
    expect(result.needleColor).toBe('#0099cc');
    expect(result.tickFont).toBe(FontFamilies.INTER);
    expect(result.valueFont).toBe(FontFamilies.INTER);
    expect(result.animateNeedleValueTransition).toBe(true);
    expect(result.showThresholdBandOnGauge).toBe(false);
    expect(result.showThresholdBandLowerRange).toBe(false);
    expect(result.showThresholdBandMiddleRange).toBe(false);
    expect(result.showThresholdBandUpperRange).toBe(false);
  });

  it('migrates limit values', () => {
    const result = migrateDefaults(makeAngularOptions({ minValue: -50, maxValue: 200 }));
    expect(result.minValue).toBe(-50);
    expect(result.maxValue).toBe(200);
  });

  it('migrates tick spacing', () => {
    const result = migrateDefaults(makeAngularOptions({ tickSpaceMajVal: 25, tickSpaceMinVal: 5 }));
    expect(result.tickSpacingMajor).toBe(25);
    expect(result.tickSpacingMinor).toBe(5);
  });

  it('migrates radius settings', () => {
    const result = migrateDefaults(makeAngularOptions({ gaugeRadius: 150, pivotRadius: 0.15 }));
    expect(result.gaugeRadius).toBe(150);
    expect(result.pivotRadius).toBe(0.15);
  });

  it('migrates padding, edgeWidth, and tickEdgeGap', () => {
    const result = migrateDefaults(makeAngularOptions({ padding: 0.1, edgeWidth: 0.08, tickEdgeGap: 0.03 }));
    expect(result.padding).toBe(0.1);
    expect(result.edgeWidth).toBe(0.08);
    expect(result.tickEdgeGap).toBe(0.03);
  });

  it('migrates tick lengths', () => {
    const result = migrateDefaults(makeAngularOptions({ tickLengthMaj: 0.2, tickLengthMin: 0.08 }));
    expect(result.tickLengthMaj).toBe(0.2);
    expect(result.tickLengthMin).toBe(0.08);
  });

  it('migrates needle settings', () => {
    const result = migrateDefaults(
      makeAngularOptions({ needleTickGap: 0.1, needleLengthNeg: 0.3, needleWidth: 8, ticknessGaugeBasis: 250 })
    );
    expect(result.needleTickGap).toBe(0.1);
    expect(result.needleLengthNeg).toBe(0.3);
    expect(result.needleWidth).toBe(8);
    expect(result.ticknessGaugeBasis).toBe(250);
  });

  it('migrates color settings with renamed properties', () => {
    const result = migrateDefaults(
      makeAngularOptions({
        outerEdgeCol: '#ff0000',
        innerCol: '#00ff00',
        pivotCol: '#0000ff',
        tickColMaj: '#111111',
        tickColMin: '#222222',
        tickLabelCol: '#333333',
        unitsLabelCol: '#444444',
      })
    );
    expect(result.outerEdgeColor).toBe('#ff0000');
    expect(result.innerColor).toBe('#00ff00');
    expect(result.pivotColor).toBe('#0000ff');
    expect(result.tickMajorColor).toBe('#111111');
    expect(result.tickMinorColor).toBe('#222222');
    expect(result.tickLabelColor).toBe('#333333');
    expect(result.unitsLabelColor).toBe('#444444');
  });

  it('migrates threshold band visibility settings', () => {
    const result = migrateDefaults(
      makeAngularOptions({
        showLowerThresholdRange: true,
        showMiddleThresholdRange: true,
        showUpperThresholdRange: true,
        showThresholdColorOnBackground: true,
        showThresholdColorOnValue: true,
        showThresholdOnGauge: true,
      })
    );
    expect(result.showThresholdBandLowerRange).toBe(true);
    expect(result.showThresholdBandMiddleRange).toBe(true);
    expect(result.showThresholdBandUpperRange).toBe(true);
    expect(result.showThresholdStateOnBackground).toBe(true);
    expect(result.showThresholdStateOnValue).toBe(true);
    expect(result.showThresholdBandOnGauge).toBe(true);
  });

  it('migrates font settings', () => {
    const result = migrateDefaults(makeAngularOptions({ tickFont: 'Arial', unitsFont: 'Helvetica' }));
    expect(result.tickFont).toBe('Arial');
    expect(result.valueFont).toBe('Helvetica');
  });

  it('migrates tick width settings with renamed properties', () => {
    const result = migrateDefaults(makeAngularOptions({ tickWidthMaj: 7, tickWidthMin: 2 }));
    expect(result.tickWidthMajor).toBe(7);
    expect(result.tickWidthMinor).toBe(2);
  });

  it('migrates font size settings', () => {
    const result = migrateDefaults(makeAngularOptions({ unitsLabelFontSize: 30, labelFontSize: 14 }));
    expect(result.valueFontSize).toBe(30);
    expect(result.tickLabelFontSize).toBe(14);
  });

  it('migrates needle angle settings', () => {
    const result = migrateDefaults(makeAngularOptions({ zeroNeedleAngle: 50, zeroTickAngle: 70 }));
    expect(result.zeroNeedleAngle).toBe(50);
    expect(result.zeroTickAngle).toBe(70);
  });
});

describe('PanelMigrationHandler (full angular panel)', () => {
  it('returns empty object when panel has no options and no gauge', () => {
    const panel = {
      id: 0,
      type: 'panel',
      fieldConfig: { defaults: {}, overrides: [] },
    } as unknown as PanelModel<GaugeOptions>;
    const result = PanelMigrationHandler(panel);
    expect(result).toEqual({});
  });

  it('returns existing options when panel is not angular', () => {
    const existingOptions = { minValue: 10, maxValue: 200 } as GaugeOptions;
    const panel = {
      id: 0,
      type: 'panel',
      options: existingOptions,
      fieldConfig: { defaults: {}, overrides: [] },
    } as PanelModel<GaugeOptions>;
    const result = PanelMigrationHandler(panel);
    expect(result).toBe(existingOptions);
  });

  it('migrates a full angular panel with gauge, thresholds, and tickMaps', () => {
    const panel = {
      id: 0,
      type: 'panel',
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      gauge: {
        minValue: 0,
        maxValue: 500,
        tickSpaceMinVal: 5,
        tickSpaceMajVal: 50,
        gaugeUnits: 'bytes',
        gaugeRadius: 200,
        pivotRadius: 0.1,
        padding: 0.05,
        edgeWidth: 0.05,
        tickEdgeGap: 0.05,
        tickLengthMaj: 0.15,
        tickLengthMin: 0.05,
        needleTickGap: 0.05,
        needleLengthNeg: 0.2,
        ticknessGaugeBasis: 200,
        needleWidth: 5,
        outerEdgeCol: '#0099cc',
        innerCol: '#ffffff',
        pivotCol: '#999999',
        tickColMaj: '#0099cc',
        tickColMin: '#000000',
        tickLabelCol: '#000000',
        unitsLabelCol: '#000000',
        show: true,
        showLowerThresholdRange: true,
        showMiddleThresholdRange: false,
        showUpperThresholdRange: true,
        showThresholdColorOnBackground: false,
        showThresholdColorOnValue: true,
        showThresholdOnGauge: true,
        thresholdColors: [],
        tickFont: 'Arial',
        unitsFont: 'Helvetica',
        unitsLabelFontSize: 20,
        labelFontSize: 16,
        tickWidthMaj: 5,
        tickWidthMin: 1,
        zeroNeedleAngle: 40,
        zeroTickAngle: 60,
        decimals: 2,
        format: 'short',
        operatorName: 'avg',
      },
      thresholds: '50,80',
      colors: ['green', 'yellow', 'red'],
      tickMaps: [
        { value: '100', text: 'Low' },
        { value: '300', text: 'Mid' },
      ],
      operatorName: 'avg',
      markerEndEnabled: true,
      markerEndShape: 'arrow',
      markerStartEnabled: false,
      markerStartShape: 'circle',
    } as any;

    const result = PanelMigrationHandler(panel);

    // Verify limits migrated
    expect(result.maxValue).toBe(500);
    // Verify operator converted
    expect(result.operatorName).toBe('mean');
    // Verify tick maps migrated
    expect(result.tickMapConfig?.tickMaps).toHaveLength(2);
    expect(result.tickMapConfig?.tickMaps[0].text).toBe('Low');
    // Verify thresholds migrated to fieldConfig
    expect(panel.fieldConfig.defaults.thresholds).toBeDefined();
    expect(panel.fieldConfig.defaults.thresholds.mode).toBe(ThresholdsMode.Absolute);
    expect(panel.fieldConfig.defaults.thresholds.steps).toHaveLength(3);
    expect(panel.fieldConfig.defaults.thresholds.steps[1].value).toBe(50);
    expect(panel.fieldConfig.defaults.thresholds.steps[2].value).toBe(80);
    // Verify colors used for thresholds
    expect(panel.fieldConfig.defaults.thresholds.steps[0].color).toBe('green');
    expect(panel.fieldConfig.defaults.thresholds.steps[1].color).toBe('yellow');
    expect(panel.fieldConfig.defaults.thresholds.steps[2].color).toBe('red');
    // Verify markers
    expect(result.markerEndEnabled).toBe(true);
    expect(result.markerEndShape).toBe('arrow');
    expect(result.markerStartEnabled).toBe(false);
    expect(result.markerStartShape).toBe('circle');
    // Verify angular properties cleaned up
    expect(panel.gauge).toBeUndefined();
    expect(panel.thresholds).toBeUndefined();
    expect(panel.colors).toBeUndefined();
    expect(panel.tickMaps).toBeUndefined();
    expect(panel.operatorName).toBeUndefined();
  });

  it('uses default threshold colors when none provided', () => {
    const panel = {
      id: 0,
      type: 'panel',
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      gauge: {
        minValue: 0,
        maxValue: 100,
        tickSpaceMinVal: 0,
        tickSpaceMajVal: 0,
        gaugeUnits: '',
        gaugeRadius: 0,
        pivotRadius: 0,
        padding: 0,
        edgeWidth: 0,
        tickEdgeGap: 0,
        tickLengthMaj: 0,
        tickLengthMin: 0,
        needleTickGap: 0,
        needleLengthNeg: 0,
        ticknessGaugeBasis: 0,
        needleWidth: 0,
        outerEdgeCol: '',
        innerCol: '',
        pivotCol: '',
        tickColMaj: '',
        tickColMin: '',
        tickLabelCol: '',
        unitsLabelCol: '',
        show: false,
        showLowerThresholdRange: false,
        showMiddleThresholdRange: false,
        showUpperThresholdRange: false,
        showThresholdColorOnBackground: false,
        showThresholdColorOnValue: false,
        showThresholdOnGauge: false,
        thresholdColors: [],
        tickFont: '',
        unitsFont: '',
        unitsLabelFontSize: 0,
        labelFontSize: 0,
        tickWidthMaj: 0,
        tickWidthMin: 0,
        zeroNeedleAngle: 0,
        zeroTickAngle: 0,
        decimals: 0,
        format: '',
        operatorName: '',
      },
      thresholds: '20,60',
      colors: [],
    } as any;

    PanelMigrationHandler(panel);
    const steps = panel.fieldConfig.defaults.thresholds.steps;
    // Default colors should be used
    expect(steps[0].color).toBe('rgba(50, 172, 45, 0.97)');
    expect(steps[1].color).toBe('rgba(237, 129, 40, 0.89)');
    expect(steps[2].color).toBe('rgba(245, 54, 54, 0.9)');
  });

  it('skips threshold migration when threshold string is empty', () => {
    const panel = {
      id: 0,
      type: 'panel',
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      gauge: {
        minValue: 0,
        maxValue: 100,
        tickSpaceMinVal: 0,
        tickSpaceMajVal: 0,
        gaugeUnits: '',
        gaugeRadius: 0,
        pivotRadius: 0,
        padding: 0,
        edgeWidth: 0,
        tickEdgeGap: 0,
        tickLengthMaj: 0,
        tickLengthMin: 0,
        needleTickGap: 0,
        needleLengthNeg: 0,
        ticknessGaugeBasis: 0,
        needleWidth: 0,
        outerEdgeCol: '',
        innerCol: '',
        pivotCol: '',
        tickColMaj: '',
        tickColMin: '',
        tickLabelCol: '',
        unitsLabelCol: '',
        show: false,
        showLowerThresholdRange: false,
        showMiddleThresholdRange: false,
        showUpperThresholdRange: false,
        showThresholdColorOnBackground: false,
        showThresholdColorOnValue: false,
        showThresholdOnGauge: false,
        thresholdColors: [],
        tickFont: '',
        unitsFont: '',
        unitsLabelFontSize: 0,
        labelFontSize: 0,
        tickWidthMaj: 0,
        tickWidthMin: 0,
        zeroNeedleAngle: 0,
        zeroTickAngle: 0,
        decimals: 0,
        format: '',
        operatorName: '',
      },
      thresholds: '',
    } as any;

    PanelMigrationHandler(panel);
    // Empty string is falsy, so thresholds are not migrated
    expect(panel.fieldConfig.defaults.thresholds).toBeUndefined();
  });

  it('migrates format to unitFormat on options', () => {
    const panel = {
      id: 0,
      type: 'panel',
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      gauge: {
        minValue: 0,
        maxValue: 100,
        tickSpaceMinVal: 0,
        tickSpaceMajVal: 0,
        gaugeUnits: '',
        gaugeRadius: 0,
        pivotRadius: 0,
        padding: 0,
        edgeWidth: 0,
        tickEdgeGap: 0,
        tickLengthMaj: 0,
        tickLengthMin: 0,
        needleTickGap: 0,
        needleLengthNeg: 0,
        ticknessGaugeBasis: 0,
        needleWidth: 0,
        outerEdgeCol: '',
        innerCol: '',
        pivotCol: '',
        tickColMaj: '',
        tickColMin: '',
        tickLabelCol: '',
        unitsLabelCol: '',
        show: false,
        showLowerThresholdRange: false,
        showMiddleThresholdRange: false,
        showUpperThresholdRange: false,
        showThresholdColorOnBackground: false,
        showThresholdColorOnValue: false,
        showThresholdOnGauge: false,
        thresholdColors: [],
        tickFont: '',
        unitsFont: '',
        unitsLabelFontSize: 0,
        labelFontSize: 0,
        tickWidthMaj: 0,
        tickWidthMin: 0,
        zeroNeedleAngle: 0,
        zeroTickAngle: 0,
        decimals: 0,
        format: '',
        operatorName: '',
      },
      format: 'bytes',
    } as any;

    const result = PanelMigrationHandler(panel);
    expect((result as Record<string, unknown>).unitFormat).toBe('bytes');
    expect(panel.format).toBeUndefined();
  });
});

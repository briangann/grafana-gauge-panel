import React from 'react';
import { render } from '@testing-library/react';
import { FieldType, LoadingState, ThresholdsMode } from '@grafana/data';

// Mock d3 (ESM)
jest.mock('d3', () => ({}));
jest.mock('d3-ease', () => ({}));

// Capture props passed to Gauge
const mockGaugeProps: Array<Record<string, unknown>> = [];
jest.mock('./Gauge/Gauge', () => ({
  Gauge: (props: Record<string, unknown>) => {
    mockGaugeProps.push(props);
    return <div data-testid="gauge" />;
  },
}));

jest.mock('./gauge_panel_styles', () => ({
  getComponentStyles: () => ({
    wrapper: 'wrapper-class',
    container: 'container-class',
  }),
}));

import { GaugePanel } from './GaugePanel';
import { GaugeOptions } from './types';

const defaultOptions: GaugeOptions = {
  displayFormatted: '',
  displayValue: null,
  showTitle: false,
  showValue: true,
  showTickLabels: true,
  displayTitle: '',
  operatorName: 'lastNotNull',
  valueYOffset: 0,
  titleYOffset: 0,
  valueFont: 'Inter',
  valueFontSize: 20,
  titleFont: 'Inter',
  titleFontSize: 14,
  tickLabelFontSize: 12,
  tickFont: 'Inter',
  animateNeedleValueTransition: true,
  animateNeedleValueTransitionSpeed: 500,
  allowNeedleCrossLimits: false,
  needleCrossLimitDegrees: 5,
  markerEndEnabled: false,
  markerEndShape: 'arrow',
  markerStartEnabled: false,
  markerStartShape: 'circle',
  minValue: 0,
  maxValue: 100,
  wrapValues: false,
  outerEdgeColor: '#000',
  innerColor: '#fff',
  pivotColor: '#333',
  needleColor: 'red',
  unitsLabelColor: '#000',
  tickLabelColor: '#000',
  tickMajorColor: '#000',
  tickMinorColor: '#666',
  gaugeRadius: 200,
  pivotRadius: 0.02,
  padding: 0.05,
  edgeWidth: 0.025,
  tickEdgeGap: 0.01,
  tickLengthMaj: 0.075,
  tickLengthMin: 0.04,
  ticknessGaugeBasis: 200,
  tickWidthMajor: 3,
  tickWidthMinor: 1,
  needleWidth: 2,
  needleTickGap: 0.05,
  needleLengthNeg: 0.1,
  zeroTickAngle: 60,
  maxTickAngle: 300,
  zeroNeedleAngle: 60,
  maxNeedleAngle: 300,
  tickSpacingMajor: 10,
  tickSpacingMinor: 1,
  tickMapConfig: { tickMaps: [], enabled: false },
  showThresholdBandOnGauge: false,
  showThresholdBandLowerRange: false,
  showThresholdBandMiddleRange: false,
  showThresholdBandUpperRange: false,
  showThresholdStateOnValue: false,
  showThresholdStateOnTitle: false,
  showThresholdStateOnBackground: false,
  thresholds: undefined,
};

const makeProps = (overrides: Partial<GaugeOptions> = {}, panelOverrides: Record<string, unknown> = {}) => {
  const options = { ...defaultOptions, ...overrides };
  return {
    options,
    data: {
      state: LoadingState.Done,
      series: [
        {
          name: 'test',
          fields: [
            {
              name: 'value',
              type: FieldType.number,
              values: [42],
              config: {},
              state: {},
            },
          ],
          length: 1,
        },
      ],
      timeRange: {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-02'),
        raw: { from: 'now-1h', to: 'now' },
      },
    },
    id: 1,
    width: 600,
    height: 400,
    replaceVariables: (v: string) => v,
    fieldConfig: {
      defaults: {
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            { value: -Infinity, color: 'green' },
            { value: 80, color: 'red' },
          ],
        },
      },
      overrides: [],
    },
    timeZone: 'utc',
    ...panelOverrides,
  } as any;
};

const makeFieldData = (
  values: Array<number | string>,
  config: Record<string, unknown>,
  fieldType: FieldType = FieldType.number,
  includeState = true
) => ({
  data: {
    state: LoadingState.Done,
    series: [
      {
        name: 'test',
        fields: [
          {
            name: 'value',
            type: fieldType,
            values,
            config,
            ...(includeState ? { state: {} } : {}),
          },
        ],
        length: values.length,
      },
    ],
    timeRange: {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-02'),
      raw: { from: 'now-1h', to: 'now' },
    },
  },
});

describe('GaugePanel', () => {
  beforeEach(() => {
    mockGaugeProps.length = 0;
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<GaugePanel {...makeProps()} />);
    expect(getByTestId('gauge')).toBeTruthy();
  });

  it('passes panel dimensions to Gauge', () => {
    render(<GaugePanel {...makeProps()} />);
    const props = mockGaugeProps[0];
    expect(props.panelWidth).toBe(600);
    expect(props.panelHeight).toBe(400);
    expect(props.panelId).toBe(1);
  });

  it('passes thresholds from fieldConfig', () => {
    render(<GaugePanel {...makeProps()} />);
    const props = mockGaugeProps[0];
    expect(props.thresholds).toEqual({
      mode: ThresholdsMode.Absolute,
      steps: [
        { value: -Infinity, color: 'green' },
        { value: 80, color: 'red' },
      ],
    });
  });

  it('prefers per-field thresholds over static fieldConfig defaults (Config from query results)', () => {
    const perFieldThresholds = {
      mode: ThresholdsMode.Absolute,
      steps: [
        { value: -Infinity, color: 'blue' },
        { value: 50, color: 'orange' },
        { value: 90, color: 'red' },
      ],
    };
    const props = makeProps({}, {
      data: {
        state: LoadingState.Done,
        series: [
          {
            name: 'test',
            fields: [
              {
                name: 'value',
                type: FieldType.number,
                values: [42],
                config: {
                  thresholds: perFieldThresholds,
                },
                state: {},
              },
            ],
            length: 1,
          },
        ],
        timeRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-02'),
          raw: { from: 'now-1h', to: 'now' },
        },
      },
    });
    render(<GaugePanel {...props} />);
    const gaugeProps = mockGaugeProps[0];
    expect(gaugeProps.thresholds).toEqual(perFieldThresholds);
  });

  describe('auto-sizing', () => {
    it('uses configured gaugeRadius when non-zero', () => {
      render(<GaugePanel {...makeProps({ gaugeRadius: 150 })} />);
      expect(mockGaugeProps[0].gaugeRadius).toBe(150);
    });

    it('auto-sizes to height/2 when gaugeRadius is 0 and height < width', () => {
      render(<GaugePanel {...makeProps({ gaugeRadius: 0 }, { width: 600, height: 400 })} />);
      expect(mockGaugeProps[0].gaugeRadius).toBe(200);
    });

    it('auto-sizes to width/2 when gaugeRadius is 0 and width < height', () => {
      render(<GaugePanel {...makeProps({ gaugeRadius: 0 }, { width: 300, height: 600 })} />);
      expect(mockGaugeProps[0].gaugeRadius).toBe(150);
    });
  });

  describe('computed props', () => {
    it('scales pivotRadius by gaugeRadius', () => {
      render(<GaugePanel {...makeProps({ pivotRadius: 0.02, gaugeRadius: 200 })} />);
      expect(mockGaugeProps[0].pivotRadius).toBe(4);
    });

    it('scales padding by gaugeRadius', () => {
      render(<GaugePanel {...makeProps({ padding: 0.05, gaugeRadius: 200 })} />);
      expect(mockGaugeProps[0].padding).toBe(10);
    });

    it('scales edgeWidth by gaugeRadius', () => {
      render(<GaugePanel {...makeProps({ edgeWidth: 0.025, gaugeRadius: 200 })} />);
      expect(mockGaugeProps[0].edgeWidth).toBe(5);
    });

    it('scales tickEdgeGap by gaugeRadius', () => {
      render(<GaugePanel {...makeProps({ tickEdgeGap: 0.01, gaugeRadius: 200 })} />);
      expect(mockGaugeProps[0].tickEdgeGap).toBe(2);
    });

    it('scales tickLengthMaj by gaugeRadius', () => {
      render(<GaugePanel {...makeProps({ tickLengthMaj: 0.075, gaugeRadius: 200 })} />);
      expect(mockGaugeProps[0].tickLengthMaj).toBe(15);
    });

    it('scales tickLengthMin by gaugeRadius', () => {
      render(<GaugePanel {...makeProps({ tickLengthMin: 0.04, gaugeRadius: 200 })} />);
      expect(mockGaugeProps[0].tickLengthMin).toBe(8);
    });
  });

  describe('option passthrough', () => {
    it('spreads non-computed options directly to Gauge', () => {
      render(<GaugePanel {...makeProps({ needleColor: 'blue', minValue: 10, maxValue: 90 })} />);
      const props = mockGaugeProps[0];
      expect(props.needleColor).toBe('blue');
      expect(props.minValue).toBe(10);
      expect(props.maxValue).toBe(90);
    });

    it('passes animation options through', () => {
      render(
        <GaugePanel {...makeProps({ animateNeedleValueTransition: true, animateNeedleValueTransitionSpeed: 1000 })} />
      );
      const props = mockGaugeProps[0];
      expect(props.animateNeedleValueTransition).toBe(true);
      expect(props.animateNeedleValueTransitionSpeed).toBe(1000);
    });
  });

  it('renders wrapper and container divs', () => {
    const { container } = render(<GaugePanel {...makeProps()} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    const inner = wrapper.firstChild as HTMLElement;
    expect(inner.tagName).toBe('DIV');
  });

  describe('getValues - percent unit handling', () => {
    it('handles percent unit with default range', () => {
      render(<GaugePanel {...makeProps({}, makeFieldData([50], { unit: 'percent' }))} />);
      expect(mockGaugeProps[0].displayValue).toBe(50);
    });

    it('handles percentunit unit with default range', () => {
      render(<GaugePanel {...makeProps({}, makeFieldData([0.5], { unit: 'percentunit' }))} />);
      expect(mockGaugeProps[0].displayValue).toBe(0.5);
    });

    it('respects custom min/max on percent fields', () => {
      render(<GaugePanel {...makeProps({}, makeFieldData([30], { unit: 'percent', min: 10, max: 50 }))} />);
      expect(mockGaugeProps[0].displayValue).toBe(30);
    });

    it('does not modify non-percent fields', () => {
      render(<GaugePanel {...makeProps({}, makeFieldData([1024], { unit: 'bytes' }))} />);
      expect(mockGaugeProps[0].displayValue).toBe(1024);
    });

    it('handles percent field with no prior state', () => {
      render(<GaugePanel {...makeProps({}, makeFieldData([75], { unit: 'percent' }, FieldType.number, false))} />);
      expect(mockGaugeProps[0].displayValue).toBe(75);
    });
  });

  describe('getValues - display value extraction', () => {
    it('passes numeric value to Gauge', () => {
      render(<GaugePanel {...makeProps()} />);
      expect(mockGaugeProps[0].displayValue).toBe(42);
    });

    it('passes 0 when value is a non-numeric string', () => {
      const props = makeProps({}, makeFieldData(['not a number'], {}, FieldType.string));
      render(<GaugePanel {...props} />);
      expect(mockGaugeProps[0].displayValue).toBe(0);
    });

    it('formats display string for percent unit', () => {
      const props = makeProps({}, makeFieldData([42], { unit: 'percent' }));
      render(<GaugePanel {...props} />);
      const formatted = mockGaugeProps[0].displayFormatted as string;
      expect(formatted).toContain('42');
      expect(formatted).toContain('%');
    });

    it('passes title when displayName is set', () => {
      const props = makeProps({}, makeFieldData([42], { displayName: 'Temperature' }));
      render(<GaugePanel {...props} />);
      expect(mockGaugeProps[0].displayTitle).toBe('Temperature');
    });

    it('falls back to field name when displayName is absent', () => {
      render(<GaugePanel {...makeProps()} />);
      expect(mockGaugeProps[0].displayTitle).toBe('value');
    });
  });

  describe('wrapValues', () => {
    it('wraps negative value into range when enabled', () => {
      const props = makeProps(
        { minValue: 0, maxValue: 360, wrapValues: true },
        makeFieldData([-90], {})
      );
      render(<GaugePanel {...props} />);
      expect(mockGaugeProps[0].displayValue).toBe(270);
    });

    it('wraps value exceeding max into range', () => {
      const props = makeProps(
        { minValue: 0, maxValue: 360, wrapValues: true },
        makeFieldData([400], {})
      );
      render(<GaugePanel {...props} />);
      expect(mockGaugeProps[0].displayValue).toBe(40);
    });

    it('does not wrap when disabled', () => {
      const props = makeProps(
        { minValue: 0, maxValue: 360, wrapValues: false },
        makeFieldData([-90], {})
      );
      render(<GaugePanel {...props} />);
      expect(mockGaugeProps[0].displayValue).toBe(-90);
    });

    it('passes through in-range values unchanged', () => {
      const props = makeProps(
        { minValue: 0, maxValue: 360, wrapValues: true },
        makeFieldData([180], {})
      );
      render(<GaugePanel {...props} />);
      expect(mockGaugeProps[0].displayValue).toBe(180);
    });

    it('wraps with non-zero minValue', () => {
      const props = makeProps(
        { minValue: 10, maxValue: 110, wrapValues: true },
        makeFieldData([5], {})
      );
      render(<GaugePanel {...props} />);
      // range=100, (5-10)%100 = -5, (-5+100)%100 = 95, 95+10 = 105
      expect(mockGaugeProps[0].displayValue).toBe(105);
    });

    it('wraps value at exactly max to min', () => {
      const props = makeProps(
        { minValue: 0, maxValue: 360, wrapValues: true },
        makeFieldData([360], {})
      );
      render(<GaugePanel {...props} />);
      expect(mockGaugeProps[0].displayValue).toBe(0);
    });
  });

  describe('getValues - operator passthrough', () => {
    it('uses mean operator', () => {
      const props = makeProps({ operatorName: 'mean' }, makeFieldData([10, 20, 30], {}));
      render(<GaugePanel {...props} />);
      expect(mockGaugeProps[0].displayValue).toBe(20);
    });

    it('uses max operator', () => {
      const props = makeProps({ operatorName: 'max' }, makeFieldData([10, 20, 30], {}));
      render(<GaugePanel {...props} />);
      expect(mockGaugeProps[0].displayValue).toBe(30);
    });
  });
});

import React from 'react';
import { render } from '@testing-library/react';
import { ThresholdsMode } from '@grafana/data';

// Mock d3 (ESM)
jest.mock('d3', () => ({
  scaleLinear: () => {
    let domain = [0, 1];
    let range = [0, 1];
    const scale = (val: number) => {
      const ratio = (val - domain[0]) / (domain[1] - domain[0]);
      return range[0] + ratio * (range[1] - range[0]);
    };
    scale.domain = (d: number[]) => {
      domain = d;
      return scale;
    };
    scale.range = (r: number[]) => {
      range = r;
      return scale;
    };
    return scale;
  },
  interpolateString: (a: string, b: string) => (t: number) => t === 0 ? a : b,
  select: () => ({
    transition: () => ({
      duration: () => ({
        ease: () => ({
          attrTween: jest.fn(),
        }),
      }),
    }),
  }),
  line: () => (points: Array<[number, number]>) => {
    if (!points || points.length < 2) {
      return null;
    }
    return `M${points[0][0]},${points[0][1]}L${points[1][0]},${points[1][1]}`;
  },
  arc: () => {
    return (params: { innerRadius: number; outerRadius: number; startAngle: number; endAngle: number }) => {
      return `M0,${-params.outerRadius}A${params.outerRadius},${params.outerRadius},0,0,1,0,${params.outerRadius}`;
    };
  },
}));
jest.mock('d3-ease', () => ({ easeQuadIn: (t: number) => t * t }));

import { Gauge } from './Gauge';
import { GaugeOptions } from '../types';

const defaultOptions: GaugeOptions = {
  displayFormatted: '50.0',
  displayValue: 50,
  showTitle: true,
  showValue: true,
  showTickLabels: true,
  formatTickLabelsWithUnit: false,
  displayTitle: 'Test Gauge',
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
  pivotRadius: 4,
  padding: 10,
  edgeWidth: 5,
  tickEdgeGap: 2,
  tickLengthMaj: 15,
  tickLengthMin: 8,
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
  panelWidth: 600,
  panelHeight: 400,
  panelId: 1,
};

describe('Gauge', () => {
  describe('SVG structure', () => {
    it('renders an SVG element', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('sets SVG width and height from panel dimensions', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('600');
      expect(svg?.getAttribute('height')).toBe('400');
    });

    it('sets viewBox based on gauge radius', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toBe('0,0,400,400');
    });

    it('renders circles group', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const circles = container.querySelector('#circles');
      expect(circles).not.toBeNull();
      expect(circles?.querySelectorAll('circle')).toHaveLength(3);
    });

    it('renders ticks group', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const ticks = container.querySelector('#ticks');
      expect(ticks).not.toBeNull();
    });

    it('renders major tick marks', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const majorTicks = container.querySelector('#majorTickMarks');
      expect(majorTicks).not.toBeNull();
      const paths = majorTicks?.querySelectorAll('path');
      expect(paths!.length).toBeGreaterThan(0);
    });

    it('renders minor tick marks', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const minorTicks = container.querySelector('#minorTickMarks');
      expect(minorTicks).not.toBeNull();
      const paths = minorTicks?.querySelectorAll('path');
      expect(paths!.length).toBeGreaterThan(0);
    });

    it('renders major tick labels', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const labels = container.querySelector('#majorTickLabels');
      expect(labels).not.toBeNull();
      const texts = labels?.querySelectorAll('text');
      expect(texts!.length).toBeGreaterThan(0);
    });

    it('renders needle group', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const needle = container.querySelector('#needle');
      expect(needle).not.toBeNull();
    });

    it('renders needle markers (defs)', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const defs = container.querySelector('defs');
      expect(defs).not.toBeNull();
    });
  });

  describe('value label', () => {
    it('renders the formatted value', () => {
      const { container } = render(<Gauge {...defaultOptions} />);
      const valueLabels = container.querySelector('#valueLabels');
      expect(valueLabels).not.toBeNull();
      expect(valueLabels?.textContent).toBe('50.0');
    });

    it('updates when displayFormatted changes', () => {
      const { container, rerender } = render(<Gauge {...defaultOptions} />);
      rerender(<Gauge {...defaultOptions} displayFormatted="75.5" />);
      const valueLabels = container.querySelector('#valueLabels');
      expect(valueLabels?.textContent).toBe('75.5');
    });
  });

  describe('title label', () => {
    it('renders the title when showTitle is true', () => {
      const { container } = render(<Gauge {...defaultOptions} showTitle={true} displayTitle="My Gauge" />);
      const titleLabels = container.querySelector('#titleLabels');
      expect(titleLabels).not.toBeNull();
      expect(titleLabels?.textContent).toBe('My Gauge');
    });

    it('does not render title when showTitle is false', () => {
      const { container } = render(<Gauge {...defaultOptions} showTitle={false} />);
      const titleLabels = container.querySelector('#titleLabels');
      expect(titleLabels).toBeNull();
    });

    it('does not render title when displayTitle is empty', () => {
      const { container } = render(<Gauge {...defaultOptions} showTitle={true} displayTitle="" />);
      const titleLabels = container.querySelector('#titleLabels');
      expect(titleLabels).toBeNull();
    });
  });

  describe('threshold state colors', () => {
    const thresholds = {
      mode: ThresholdsMode.Absolute,
      steps: [
        { value: -Infinity, color: 'green' },
        { value: 80, color: 'red' },
      ],
    };

    it('uses same fill for value when threshold state is toggled off vs on', () => {
      const { container: c1 } = render(
        <Gauge {...defaultOptions} displayValue={50} thresholds={thresholds} showThresholdStateOnValue={false} />
      );
      const { container: c2 } = render(
        <Gauge {...defaultOptions} displayValue={50} thresholds={thresholds} showThresholdStateOnValue={true} />
      );
      const fillOff = c1.querySelector('#valueLabels text')?.getAttribute('fill');
      const fillOn = c2.querySelector('#valueLabels text')?.getAttribute('fill');
      // When enabled, the fill should differ from the default unitsLabelColor
      expect(fillOff).not.toBe(fillOn);
    });

    it('changes title fill color when threshold state is enabled', () => {
      const { container: c1 } = render(
        <Gauge
          {...defaultOptions}
          displayValue={90}
          thresholds={thresholds}
          showThresholdStateOnTitle={false}
          showTitle={true}
          displayTitle="Test"
        />
      );
      const { container: c2 } = render(
        <Gauge
          {...defaultOptions}
          displayValue={90}
          thresholds={thresholds}
          showThresholdStateOnTitle={true}
          showTitle={true}
          displayTitle="Test"
        />
      );
      const fillOff = c1.querySelector('#titleLabels text')?.getAttribute('fill');
      const fillOn = c2.querySelector('#titleLabels text')?.getAttribute('fill');
      expect(fillOff).not.toBe(fillOn);
    });
  });

  describe('threshold bands', () => {
    it('does not render threshold bands when disabled', () => {
      const { container } = render(<Gauge {...defaultOptions} showThresholdBandOnGauge={false} />);
      // No threshold path elements outside of ticks/needle
      const svg = container.querySelector('svg g');
      const allPaths = svg?.querySelectorAll('path');
      // Paths should only be from ticks and needle, not threshold bands
      const tickPaths = container.querySelectorAll('#ticks path');
      const needlePaths = container.querySelectorAll('#needle path');
      const markerPaths = container.querySelectorAll('defs path');
      expect(allPaths!.length).toBe(tickPaths.length + needlePaths.length + markerPaths.length);
    });
  });

  describe('viewBox scaling', () => {
    it('adjusts viewBox when gaugeRadius changes', () => {
      const { container } = render(<Gauge {...defaultOptions} gaugeRadius={100} />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toBe('0,0,200,200');
    });
  });

  describe('tick clamp warning', () => {
    it('does not render warning icon for normal tick configs', () => {
      const onTicksClamped = jest.fn();
      render(<Gauge {...defaultOptions} onTicksClamped={onTicksClamped} />);
      expect(onTicksClamped).toHaveBeenCalledWith(false);
    });

    it('reports ticksClamped true when ticks exceed limit', () => {
      const onTicksClamped = jest.fn();
      render(
        <Gauge
          {...defaultOptions}
          tickSpacingMajor={0.001}
          onTicksClamped={onTicksClamped}
        />
      );
      expect(onTicksClamped).toHaveBeenCalledWith(true);
    });
  });
});

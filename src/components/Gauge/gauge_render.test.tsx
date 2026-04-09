import React from 'react';
import { render } from '@testing-library/react';
import { GrafanaTheme2, ThresholdsMode } from '@grafana/data';

jest.mock('d3', () => {
  return {
    arc: () => {
      const arcFn = (params: { innerRadius: number; outerRadius: number; startAngle: number; endAngle: number }) => {
        return `M0,${-params.outerRadius}A${params.outerRadius},${params.outerRadius},0,0,1,0,${params.outerRadius}`;
      };
      return arcFn;
    },
    line: () => {
      return (points: Array<[number, number]>) => {
        if (!points || points.length < 2) {
          return null;
        }
        return `M${points[0][0]},${points[0][1]}L${points[1][0]},${points[1][1]}`;
      };
    },
  };
});

import {
  scaleLabelFontSize,
  renderCircleGroup,
  renderNeedle,
  renderTicks,
  renderMajorTickLabels,
  renderTitleLabel,
  renderValueLabel,
  renderThresholdBands,
} from './gauge_render';

const mockTheme = {
  visualization: {
    getColorByName: (name: string) => name,
  },
} as unknown as GrafanaTheme2;

describe('gauge_render', () => {
  describe('scaleLabelFontSize', () => {
    it('scales font size by radius / basis ratio', () => {
      expect(scaleLabelFontSize(12, 200, 200)).toBe(12);
    });

    it('scales proportionally when radius differs from basis', () => {
      expect(scaleLabelFontSize(12, 100, 200)).toBe(6);
    });

    it('returns 0 when scaled size is less than 4', () => {
      expect(scaleLabelFontSize(3, 100, 200)).toBe(0);
    });

    it('returns exact 4 boundary', () => {
      // 8 * (100/200) = 4, which is not less than 4
      expect(scaleLabelFontSize(8, 100, 200)).toBe(4);
    });
  });

  describe('renderCircleGroup', () => {
    it('renders three circles', () => {
      const result = renderCircleGroup(200, 200, 190, 180, '#fff', '#000', '#333', 5, false, 50, undefined, mockTheme);
      const { container } = render(<svg>{result}</svg>);
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(3);
    });

    it('uses outerEdgeColor for outer circle', () => {
      const result = renderCircleGroup(
        200, 200, 190, 180, '#fff', 'blue', '#333', 5, false, 50, undefined, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const circles = container.querySelectorAll('circle');
      expect(circles[0].getAttribute('fill')).toBe('blue');
    });

    it('uses innerColor for face circle when threshold state disabled', () => {
      const result = renderCircleGroup(
        200, 200, 190, 180, 'white', '#000', '#333', 5, false, 50, undefined, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const circles = container.querySelectorAll('circle');
      expect(circles[1].getAttribute('fill')).toBe('white');
    });

    it('uses threshold color for face when showThresholdStateOnBackground is true', () => {
      const thresholds = {
        mode: ThresholdsMode.Absolute,
        steps: [
          { value: -Infinity, color: 'green' },
          { value: 80, color: 'red' },
        ],
      };
      const result = renderCircleGroup(
        200, 200, 190, 180, 'white', '#000', '#333', 5, true, 50, thresholds, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const circles = container.querySelectorAll('circle');
      expect(circles[1].getAttribute('fill')).toBe('green');
    });

    it('uses pivotColor for center circle', () => {
      const result = renderCircleGroup(
        200, 200, 190, 180, '#fff', '#000', 'red', 5, false, 50, undefined, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const circles = container.querySelectorAll('circle');
      expect(circles[2].getAttribute('fill')).toBe('red');
    });
  });

  describe('renderNeedle', () => {
    const needleRef = { current: null } as React.RefObject<SVGPathElement>;

    it('renders a needle path when path length is positive', () => {
      const result = renderNeedle(
        needleRef, 60, 200, 200, -20, 150,
        'arrow', 'circle', false, false, 'red', 2, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const path = container.querySelector('path');
      expect(path).not.toBeNull();
      expect(path?.getAttribute('stroke')).toBe('red');
      expect(path?.getAttribute('stroke-width')).toBe('2px');
    });

    it('renders needle group even with zero-length path', () => {
      const result = renderNeedle(
        needleRef, 60, 200, 200, 0, 0,
        'arrow', 'circle', false, false, 'red', 2, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const g = container.querySelector('#needle');
      expect(g).not.toBeNull();
    });

    it('sets markerEnd when enabled', () => {
      const result = renderNeedle(
        needleRef, 60, 200, 200, -20, 150,
        'arrow', 'circle', true, false, 'red', 2, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const path = container.querySelector('path');
      expect(path?.getAttribute('marker-end')).toBe('url(#marker_arrow)');
      expect(path?.getAttribute('marker-start')).toBeNull();
    });

    it('sets markerStart when enabled', () => {
      const result = renderNeedle(
        needleRef, 60, 200, 200, -20, 150,
        'arrow', 'circle', false, true, 'red', 2, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const path = container.querySelector('path');
      expect(path?.getAttribute('marker-start')).toBe('url(#marker_circle)');
    });
  });

  describe('renderTicks', () => {
    it('renders major and minor tick marks', () => {
      const result = renderTicks(
        ['M0,0L1,1', 'M2,2L3,3', 'M4,4L5,5'],
        ['M10,10L11,11', 'M12,12L13,13'],
        2, 1, 'black', 'gray', mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const majorPaths = container.querySelector('#majorTickMarks')?.querySelectorAll('path');
      const minorPaths = container.querySelector('#minorTickMarks')?.querySelectorAll('path');
      expect(majorPaths).toHaveLength(3);
      expect(minorPaths).toHaveLength(2);
    });

    it('renders empty groups when no paths provided', () => {
      const result = renderTicks([], [], 2, 1, 'black', 'gray', mockTheme);
      const { container } = render(<svg>{result}</svg>);
      const majorPaths = container.querySelector('#majorTickMarks')?.querySelectorAll('path');
      const minorPaths = container.querySelector('#minorTickMarks')?.querySelectorAll('path');
      expect(majorPaths).toHaveLength(0);
      expect(minorPaths).toHaveLength(0);
    });

    it('applies correct stroke colors', () => {
      const result = renderTicks(
        ['M0,0L1,1'], ['M2,2L3,3'],
        2, 1, 'blue', 'silver', mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const majorPath = container.querySelector('#majorTickMarks path');
      const minorPath = container.querySelector('#minorTickMarks path');
      expect(majorPath?.getAttribute('stroke')).toBe('blue');
      expect(minorPath?.getAttribute('stroke')).toBe('silver');
    });

    it('applies correct stroke widths', () => {
      const result = renderTicks(
        ['M0,0L1,1'], ['M2,2L3,3'],
        3, 1.5, 'black', 'gray', mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const majorPath = container.querySelector('#majorTickMarks path');
      const minorPath = container.querySelector('#minorTickMarks path');
      expect(majorPath?.getAttribute('stroke-width')).toBe('3px');
      expect(minorPath?.getAttribute('stroke-width')).toBe('1.5px');
    });
  });

  describe('renderMajorTickLabels', () => {
    it('renders text elements for each tick angle', () => {
      const result = renderMajorTickLabels(
        [60, 120, 180], ['0', '50', '100'],
        12, 200, 200, 'black', 'Inter', 140, 200, 200, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const texts = container.querySelectorAll('text');
      expect(texts).toHaveLength(3);
      expect(texts[0].textContent).toBe('0');
      expect(texts[1].textContent).toBe('50');
      expect(texts[2].textContent).toBe('100');
    });

    it('renders empty group when no angles', () => {
      const result = renderMajorTickLabels(
        [], [], 12, 200, 200, 'black', 'Inter', 140, 200, 200, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const texts = container.querySelectorAll('text');
      expect(texts).toHaveLength(0);
    });

    it('applies font properties', () => {
      const result = renderMajorTickLabels(
        [60], ['0'],
        12, 200, 200, 'white', 'Courier', 140, 200, 200, mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const text = container.querySelector('text');
      expect(text?.getAttribute('fill')).toBe('white');
      expect(text?.getAttribute('font-family')).toBe('Courier');
    });
  });

  describe('renderTitleLabel', () => {
    it('renders title text when showTitle is true', () => {
      const result = renderTitleLabel(
        true, 'My Gauge', 'Inter', 16, 250, 140, 200, 'black', mockTheme
      );
      expect(result).not.toBe(false);
      const { container } = render(<svg>{result as React.ReactElement}</svg>);
      const text = container.querySelector('text');
      expect(text?.textContent).toBe('My Gauge');
    });

    it('returns false when showTitle is false', () => {
      const result = renderTitleLabel(
        false, 'My Gauge', 'Inter', 16, 250, 140, 200, 'black', mockTheme
      );
      expect(result).toBe(false);
    });

    it('returns false when displayTitle is empty', () => {
      const result = renderTitleLabel(
        true, '', 'Inter', 16, 250, 140, 200, 'black', mockTheme
      );
      expect(result).toBe(false);
    });

    it('applies title color and font', () => {
      const result = renderTitleLabel(
        true, 'Test', 'Courier', 14, 250, 140, 200, 'green', mockTheme
      );
      const { container } = render(<svg>{result as React.ReactElement}</svg>);
      const text = container.querySelector('text');
      expect(text?.getAttribute('fill')).toBe('green');
      expect(text?.getAttribute('font-family')).toBe('Courier');
      expect(text?.getAttribute('font-size')).toBe('14');
    });
  });

  describe('renderValueLabel', () => {
    it('renders the formatted value', () => {
      const result = renderValueLabel(
        '42.5', 'Inter', 20, 260, 140, 200, 'black', mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const text = container.querySelector('text');
      expect(text?.textContent).toBe('42.5');
    });

    it('applies value color and font', () => {
      const result = renderValueLabel(
        '100', 'Courier', 18, 260, 140, 200, 'red', mockTheme
      );
      const { container } = render(<svg>{result}</svg>);
      const text = container.querySelector('text');
      expect(text?.getAttribute('fill')).toBe('red');
      expect(text?.getAttribute('font-family')).toBe('Courier');
      expect(text?.getAttribute('font-size')).toBe('18');
    });
  });

  describe('renderThresholdBands', () => {
    it('returns undefined when showThresholdBandOnGauge is false', () => {
      const result = renderThresholdBands(
        false, true, true, true, undefined,
        0, 100, 60, 300, 200, 200, 200, mockTheme
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined when thresholds have no steps', () => {
      const thresholds = { mode: ThresholdsMode.Absolute, steps: [] };
      const result = renderThresholdBands(
        true, true, true, true, thresholds,
        0, 100, 60, 300, 200, 200, 200, mockTheme
      );
      expect(result).toBeUndefined();
    });

    it('renders lower band when enabled', () => {
      const thresholds = {
        mode: ThresholdsMode.Absolute,
        steps: [
          { value: -Infinity, color: 'green' },
          { value: 80, color: 'red' },
        ],
      };
      const result = renderThresholdBands(
        true, true, false, false, thresholds,
        0, 100, 60, 300, 200, 200, 200, mockTheme
      );
      expect(result).not.toBeUndefined();
    });

    it('renders upper band when enabled', () => {
      const thresholds = {
        mode: ThresholdsMode.Absolute,
        steps: [
          { value: -Infinity, color: 'green' },
          { value: 80, color: 'red' },
        ],
      };
      const result = renderThresholdBands(
        true, false, false, true, thresholds,
        0, 100, 60, 300, 200, 200, 200, mockTheme
      );
      expect(result).not.toBeUndefined();
    });
  });
});

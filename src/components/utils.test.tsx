import React from 'react';
import { render } from '@testing-library/react';
import { GrafanaTheme2 } from '@grafana/data';

// Mock d3 since some sub-packages (d3-array, d3-path, etc.) are ESM-only
// and not covered by the scaffolded transformIgnorePatterns
jest.mock('d3', () => {
  return {
    arc: () => {
      // Return a function that produces an SVG path string
      const arcFn = (params: { innerRadius: number; outerRadius: number; startAngle: number; endAngle: number }) => {
        return `M0,${-params.outerRadius}A${params.outerRadius},${params.outerRadius},0,0,1,0,${params.outerRadius}`;
      };
      return arcFn;
    },
    line: () => {
      // Return a function that takes an array of [x,y] pairs and returns an SVG path
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
  dToR,
  valueToDegrees,
  valueToRadians,
  ValueToDegreesOptions,
  ValueToRadiansOptions,
  labelXCalc,
  labelYCalc,
  needleCalc,
  drawBand,
  createNeedleMarkers,
} from './utils';
import { GaugeOptions } from './types';

// Minimal GrafanaTheme2 mock for functions that need it
const mockTheme = {
  visualization: {
    getColorByName: (name: string) => name,
  },
} as unknown as GrafanaTheme2;

// Standard gauge options for drawBand tests
const mockGaugeOptions = {
  minValue: 0,
  maxValue: 100,
  zeroTickAngle: 60,
  maxTickAngle: 300,
  gaugeRadius: 200,
} as GaugeOptions;

describe('Utils', () => {
  describe('dToR', () => {
    it('converts 0 degrees to 0 radians', () => {
      expect(dToR(0)).toEqual(0);
    });

    it('converts 90 degrees to PI/2 radians', () => {
      expect(dToR(90)).toBeCloseTo(Math.PI / 2);
    });

    it('converts 180 degrees to PI radians', () => {
      expect(dToR(180)).toBeCloseTo(Math.PI);
    });

    it('converts 360 degrees to 2*PI radians', () => {
      expect(dToR(360)).toBeCloseTo(2 * Math.PI);
    });

    it('converts negative degrees', () => {
      expect(dToR(-90)).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('valueToDegrees', () => {
    const normalOptions: ValueToDegreesOptions = {
      minValue: 0,
      maxValue: 100,
      zeroTickAngle: 60,
      maxTickAngle: 300,
    };

    it('maps minimum value to start of degree range', () => {
      const result = valueToDegrees(0, normalOptions);
      // At min value (0), should map to the start angle position
      // Formula: (0/100)*240 - ((0/100)*240 + 60) = 0 - 60 = -60
      expect(result).toBeCloseTo(-60);
    });

    it('maps maximum value to end of degree range', () => {
      const result = valueToDegrees(100, normalOptions);
      // At max value (100): (100/100)*240 - ((0/100)*240 + 60) = 240 - 60 = 180
      expect(result).toBeCloseTo(180);
    });

    it('maps midpoint value to middle of degree range', () => {
      const result = valueToDegrees(50, normalOptions);
      // At mid value (50): (50/100)*240 - ((0/100)*240 + 60) = 120 - 60 = 60
      expect(result).toBeCloseTo(60);
    });

    it('handles inverted range (min=0, max=-20)', () => {
      const invertedOptions: ValueToDegreesOptions = {
        minValue: 0,
        maxValue: -20,
        zeroTickAngle: 60,
        maxTickAngle: 300,
      };
      const atMin = valueToDegrees(0, invertedOptions);
      const atMax = valueToDegrees(-20, invertedOptions);
      const atMid = valueToDegrees(-10, invertedOptions);
      // The degree difference between min and max should span the full range
      expect(atMax - atMin).toBeCloseTo(240);
      // Midpoint should be halfway
      expect(atMid - atMin).toBeCloseTo(120);
    });
  });

  describe('valueToRadians', () => {
    const options: ValueToRadiansOptions = {
      minValue: 0,
      maxValue: 100,
      zeroTickAngle: 60,
      maxTickAngle: 300,
    };

    it('returns valueToDegrees result converted to radians', () => {
      const degrees = valueToDegrees(50, options);
      const radians = valueToRadians(50, options);
      expect(radians).toBeCloseTo((degrees * Math.PI) / 180);
    });

    it('maps min value correctly', () => {
      const degrees = valueToDegrees(0, options);
      const radians = valueToRadians(0, options);
      expect(radians).toBeCloseTo((degrees * Math.PI) / 180);
    });

    it('maps max value correctly', () => {
      const degrees = valueToDegrees(100, options);
      const radians = valueToRadians(100, options);
      expect(radians).toBeCloseTo((degrees * Math.PI) / 180);
    });
  });

  describe('labelXCalc', () => {
    it('calculates X position for a label at position 0', () => {
      const x = labelXCalc(0, 3, '50', 12, 150, 200);
      expect(typeof x).toBe('number');
      expect(isNaN(x)).toBe(false);
    });

    it('returns different X positions for different angles', () => {
      const x1 = labelXCalc(0, 3, '50', 12, 150, 200);
      const x2 = labelXCalc(90, 3, '50', 12, 150, 200);
      expect(x1).not.toEqual(x2);
    });

    it('centers on originX when angle puts label at vertical axis', () => {
      // At position -90, tickAngle = 0, cos(0) = 1, so x is offset from origin
      const x = labelXCalc(-90, 3, '50', 12, 150, 200);
      expect(x).toBeGreaterThan(200);
    });
  });

  describe('labelYCalc', () => {
    it('calculates Y position for a label at position 0', () => {
      const y = labelYCalc(0, 12, 150, 200);
      expect(typeof y).toBe('number');
      expect(isNaN(y)).toBe(false);
    });

    it('returns different Y positions for different angles', () => {
      const y1 = labelYCalc(0, 12, 150, 200);
      const y2 = labelYCalc(90, 12, 150, 200);
      expect(y1).not.toEqual(y2);
    });

    it('includes font size offset in calculation', () => {
      const ySmall = labelYCalc(0, 8, 150, 200);
      const yLarge = labelYCalc(0, 24, 150, 200);
      // Larger font size should shift y position
      expect(ySmall).not.toEqual(yLarge);
    });
  });

  describe('needleCalc', () => {
    it('returns a non-empty SVG path string for valid inputs', () => {
      const path = needleCalc(90, 200, 200, -20, 150);
      expect(path.length).toBeGreaterThan(0);
      expect(path).toContain('M');
    });

    it('returns a path string starting with M (moveto)', () => {
      const path = needleCalc(0, 200, 200, -10, 100);
      expect(path.charAt(0)).toBe('M');
    });

    it('returns different paths for different angles', () => {
      const path1 = needleCalc(0, 200, 200, -20, 150);
      const path2 = needleCalc(180, 200, 200, -20, 150);
      expect(path1).not.toEqual(path2);
    });
  });

  describe('drawBand', () => {
    it('returns JSX for a valid band (start < end in normal range)', () => {
      const result = drawBand(20, 80, 'green', 200, 200, mockGaugeOptions, mockTheme);
      expect(result).toBeDefined();
    });

    it('returns undefined when endAngle <= startAngle', () => {
      // With normal range 0-100 and angles 60-300, start=80 end=20 means
      // endAngle < startAngle, so band should be skipped
      const result = drawBand(80, 20, 'red', 200, 200, mockGaugeOptions, mockTheme);
      expect(result).toBeUndefined();
    });

    it('returns undefined for zero-width band', () => {
      const result = drawBand(50, 50, 'blue', 200, 200, mockGaugeOptions, mockTheme);
      expect(result).toBeUndefined();
    });

    it('renders with the correct fill color from theme', () => {
      const result = drawBand(20, 80, 'green', 200, 200, mockGaugeOptions, mockTheme);
      // Our mock returns the color name as-is
      const { container } = render(result as React.ReactElement);
      const path = container.querySelector('path');
      expect(path).not.toBeNull();
      expect(path?.getAttribute('fill')).toBe('green');
    });

    it('works with inverted range options', () => {
      const invertedOptions = {
        ...mockGaugeOptions,
        minValue: 0,
        maxValue: -20,
      } as GaugeOptions;
      // With inverted range, start=0 end=-10 should produce valid band
      // because the angles still progress correctly via valueToRadians
      const result = drawBand(0, -10, 'yellow', 200, 200, invertedOptions, mockTheme);
      expect(result).toBeDefined();
    });
  });

  describe('createNeedleMarkers', () => {
    it('returns SVG defs element with markers', () => {
      const result = createNeedleMarkers('red', mockTheme);
      const { container } = render(result);
      const defs = container.querySelector('defs');
      expect(defs).not.toBeNull();
    });

    it('renders all 5 marker types', () => {
      const result = createNeedleMarkers('red', mockTheme);
      const { container } = render(result);
      const markers = container.querySelectorAll('marker');
      expect(markers.length).toBe(5);
    });

    it('renders markers with correct IDs', () => {
      const result = createNeedleMarkers('blue', mockTheme);
      const { container } = render(result);
      expect(container.querySelector('#marker_arrow')).not.toBeNull();
      expect(container.querySelector('#marker_circle')).not.toBeNull();
      expect(container.querySelector('#marker_square')).not.toBeNull();
      expect(container.querySelector('#marker_stub')).not.toBeNull();
      expect(container.querySelector('#marker_arrow-inverse')).not.toBeNull();
    });

    it('applies needle color to marker paths', () => {
      const result = createNeedleMarkers('purple', mockTheme);
      const { container } = render(result);
      const paths = container.querySelectorAll('marker path');
      paths.forEach((path) => {
        // mockTheme.visualization.getColorByName returns the name as-is
        expect(path.getAttribute('fill')).toBe('purple');
      });
    });
  });
});

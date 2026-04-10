import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { RangeEditor } from './RangeEditor';

describe('RangeEditor', () => {
  const defaultProps = {
    value: 100,
    onChange: jest.fn(),
    item: { path: 'maxValue' } as any,
    context: {
      options: {
        minValue: 0,
        maxValue: 100,
        tickSpacingMajor: 10,
        tickSpacingMinor: 1,
      },
      onOptionsChange: jest.fn(),
    } as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a number input with the current value', () => {
    const { container } = render(<RangeEditor {...defaultProps} />);
    const input = container.querySelector('input');
    expect(input).not.toBeNull();
    expect(input?.value).toBe('100');
  });

  it('updates option via onOptionsChange on blur', () => {
    const { container } = render(<RangeEditor {...defaultProps} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '200' } });
    fireEvent.blur(input);
    expect(defaultProps.context.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({ maxValue: 200 })
    );
  });

  it('auto-fills tick spacing when ticks would exceed limit', () => {
    const { container } = render(<RangeEditor {...defaultProps} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.blur(input);
    // range=1000, current minor=1, 1000/1=1000 > 100 -> auto-fill
    // computeTickSpacing(0, 1000) -> major=100, minor=20
    expect(defaultProps.context.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tickSpacingMajor: 100,
        tickSpacingMinor: 20,
      })
    );
  });

  it('preserves tick spacing when ticks stay within limit', () => {
    const props = {
      ...defaultProps,
      value: 100,
      context: {
        options: {
          minValue: 0,
          maxValue: 100,
          tickSpacingMajor: 10,
          tickSpacingMinor: 5,
        },
        onOptionsChange: jest.fn(),
      } as any,
    };
    const { container } = render(<RangeEditor {...props} />);
    const input = container.querySelector('input')!;
    // Change max from 100 to 200. major=10 -> 200/10=20, minor=5 -> 200/5=40
    // Both within 100, so spacing preserved
    fireEvent.change(input, { target: { value: '200' } });
    fireEvent.blur(input);
    expect(props.context.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        maxValue: 200,
        tickSpacingMajor: 10,
        tickSpacingMinor: 5,
      })
    );
  });

  it('auto-fills tick spacing when minValue changes and ticks exceed limit', () => {
    const props = {
      ...defaultProps,
      value: 0,
      item: { path: 'minValue' } as any,
    };
    const { container } = render(<RangeEditor {...props} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '-100' } });
    fireEvent.blur(input);
    // range=200, current minor=1, 200/1=200 > 100 -> auto-fill
    // computeTickSpacing(-100, 100) -> range=200, major=20, minor=4
    expect(props.context.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tickSpacingMajor: 20,
        tickSpacingMinor: 4,
      })
    );
  });

  it('syncs local value when external value prop changes', () => {
    const { container, rerender } = render(<RangeEditor {...defaultProps} />);
    const input = container.querySelector('input')!;
    expect(input.value).toBe('100');

    rerender(<RangeEditor {...defaultProps} value={500} />);
    expect(input.value).toBe('500');
  });
});

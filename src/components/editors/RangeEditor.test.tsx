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

  it('calls onChange with the new value', () => {
    const { container } = render(<RangeEditor {...defaultProps} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '500' } });
    fireEvent.blur(input);
    expect(defaultProps.onChange).toHaveBeenCalledWith(500);
  });

  it('updates tick spacing when maxValue changes', () => {
    const { container } = render(<RangeEditor {...defaultProps} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.blur(input);
    // computeTickSpacing(0, 1000) -> major=100, minor=20
    expect(defaultProps.context.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tickSpacingMajor: 100,
        tickSpacingMinor: 20,
      })
    );
  });

  it('updates tick spacing when minValue changes', () => {
    const props = {
      ...defaultProps,
      value: 0,
      item: { path: 'minValue' } as any,
    };
    const { container } = render(<RangeEditor {...props} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '-100' } });
    fireEvent.blur(input);
    // computeTickSpacing(-100, 100) -> range=200, major=20, minor=4
    expect(props.context.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tickSpacingMajor: 20,
        tickSpacingMinor: 4,
      })
    );
  });
});

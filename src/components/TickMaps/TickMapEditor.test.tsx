import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

import { v4 as uuidv4 } from 'uuid';
import { TickMapEditor } from './TickMapEditor';

const mockedUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  mockedUuidv4.mockImplementation(() => {
    uuidCounter++;
    return `test-uuid-${uuidCounter}`;
  });
});

const makeProps = (
  tickMaps: Array<{ label: string; value: string; text: string; enabled: boolean; order: number }> = []
) => ({
  item: {} as any,
  context: {
    options: {
      tickMapConfig: {
        tickMaps,
        enabled: true,
      },
    },
  } as any,
  onChange: jest.fn(),
  value: null as any,
  id: 'test-editor',
});

describe('TickMapEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Add Tick Map button with no items', () => {
    const props = makeProps();
    render(<TickMapEditor {...props} />);
    expect(screen.getByText('Add Tick Map')).toBeInTheDocument();
  });

  it('renders existing tick maps from context', () => {
    const props = makeProps([
      { label: 'First', value: '10', text: 'Ten', enabled: true, order: 0 },
      { label: 'Second', value: '20', text: 'Twenty', enabled: true, order: 1 },
    ]);
    render(<TickMapEditor {...props} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('adds a new tick map when Add Tick Map is clicked', () => {
    const props = makeProps();
    render(<TickMapEditor {...props} />);
    fireEvent.click(screen.getByText('Add Tick Map'));
    expect(screen.getByText('TickMap-0')).toBeInTheDocument();
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tickMaps: [expect.objectContaining({ label: 'TickMap-0', enabled: true, order: 0, value: '', text: '' })],
      })
    );
  });

  it('removes a tick map and reorders remaining items', () => {
    const props = makeProps([
      { label: 'First', value: '10', text: 'Ten', enabled: true, order: 0 },
      { label: 'Second', value: '20', text: 'Twenty', enabled: true, order: 1 },
    ]);
    render(<TickMapEditor {...props} />);
    // Expand first item to access its controls
    fireEvent.click(screen.getByText('First'));
    const deleteButton = screen.getByLabelText('Delete Tick Map');
    fireEvent.click(deleteButton);
    // onChange should be called with only the second item, reordered to index 0
    const lastCall = props.onChange.mock.calls[props.onChange.mock.calls.length - 1][0];
    expect(lastCall.tickMaps).toHaveLength(1);
    expect(lastCall.tickMaps[0].label).toBe('Second');
    expect(lastCall.tickMaps[0].order).toBe(0);
  });

  it('duplicates a tick map with Copy suffix', () => {
    const props = makeProps([{ label: 'Original', value: '10', text: 'Ten', enabled: true, order: 0 }]);
    render(<TickMapEditor {...props} />);
    // Expand the item to access its controls
    fireEvent.click(screen.getByText('Original'));
    const copyButton = screen.getByLabelText('Duplicate');
    fireEvent.click(copyButton);
    const lastCall = props.onChange.mock.calls[props.onChange.mock.calls.length - 1][0];
    expect(lastCall.tickMaps).toHaveLength(2);
    expect(lastCall.tickMaps[1].label).toBe('Original Copy');
    expect(lastCall.tickMaps[1].value).toBe('10');
    expect(lastCall.tickMaps[1].text).toBe('Ten');
  });

  it('moves a tick map down', () => {
    const props = makeProps([
      { label: 'First', value: '10', text: 'Ten', enabled: true, order: 0 },
      { label: 'Second', value: '20', text: 'Twenty', enabled: true, order: 1 },
    ]);
    render(<TickMapEditor {...props} />);
    // Expand first item to access its controls
    fireEvent.click(screen.getByText('First'));
    const moveDownButton = screen.getByLabelText('Move Down');
    fireEvent.click(moveDownButton);
    const lastCall = props.onChange.mock.calls[props.onChange.mock.calls.length - 1][0];
    expect(lastCall.tickMaps[0].label).toBe('Second');
    expect(lastCall.tickMaps[1].label).toBe('First');
    expect(lastCall.tickMaps[0].order).toBe(0);
    expect(lastCall.tickMaps[1].order).toBe(1);
  });

  it('moves a tick map up', () => {
    const props = makeProps([
      { label: 'First', value: '10', text: 'Ten', enabled: true, order: 0 },
      { label: 'Second', value: '20', text: 'Twenty', enabled: true, order: 1 },
    ]);
    render(<TickMapEditor {...props} />);
    // Expand second item to access its controls
    fireEvent.click(screen.getByText('Second'));
    const moveUpButton = screen.getByLabelText('Move Up');
    fireEvent.click(moveUpButton);
    const lastCall = props.onChange.mock.calls[props.onChange.mock.calls.length - 1][0];
    expect(lastCall.tickMaps[0].label).toBe('Second');
    expect(lastCall.tickMaps[1].label).toBe('First');
  });

  it('does not move the first item up', () => {
    const props = makeProps([
      { label: 'First', value: '10', text: 'Ten', enabled: true, order: 0 },
      { label: 'Second', value: '20', text: 'Twenty', enabled: true, order: 1 },
    ]);
    render(<TickMapEditor {...props} />);
    // Expand first item
    fireEvent.click(screen.getByText('First'));
    const moveUpButton = screen.getByLabelText('Move Up');
    fireEvent.click(moveUpButton);
    // toggleOpener calls setTracker which calls onChange, so onChange IS called once (for expand)
    // moveUp(0) should be a no-op since index === 0
    // The key assertion: the order should not have changed
    const calls = props.onChange.mock.calls;
    // The last call should still have First at index 0
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.tickMaps[0].label).toBe('First');
    expect(lastCall.tickMaps[1].label).toBe('Second');
  });

  it('does not move the last item down', () => {
    const props = makeProps([
      { label: 'First', value: '10', text: 'Ten', enabled: true, order: 0 },
      { label: 'Second', value: '20', text: 'Twenty', enabled: true, order: 1 },
    ]);
    render(<TickMapEditor {...props} />);
    // Expand second item
    fireEvent.click(screen.getByText('Second'));
    const moveDownButton = screen.getByLabelText('Move Down');
    fireEvent.click(moveDownButton);
    // Similar to above — order should remain unchanged
    const calls = props.onChange.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.tickMaps[0].label).toBe('First');
    expect(lastCall.tickMaps[1].label).toBe('Second');
  });

  it('updates tick map fields through onChange', () => {
    const props = makeProps([{ label: 'Test', value: '10', text: 'Ten', enabled: true, order: 0 }]);
    render(<TickMapEditor {...props} />);
    // Expand item
    fireEvent.click(screen.getByText('Test'));
    const labelInput = screen.getByDisplayValue('Test');
    fireEvent.change(labelInput, { target: { value: 'Updated' } });
    const lastCall = props.onChange.mock.calls[props.onChange.mock.calls.length - 1][0];
    expect(lastCall.tickMaps[0].label).toBe('Updated');
  });
});

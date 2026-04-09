import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { TickMapItem } from './TickMapItem';
import { TickMapItemType } from './types';

const defaultTickMap: TickMapItemType = {
  label: 'Test Label',
  value: '50',
  text: 'Fifty',
  enabled: true,
  order: 0,
};

const defaultProps = {
  tickMap: defaultTickMap,
  ID: 'test-uuid-1',
  setter: jest.fn(),
  remover: jest.fn(),
  moveUp: jest.fn(),
  moveDown: jest.fn(),
  createDuplicate: jest.fn(),
};

const renderItem = (overrides: Partial<typeof defaultProps> = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(<TickMapItem {...props} />);
};

describe('TickMapItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with provided tick map values', () => {
    renderItem();
    expect(screen.getByDisplayValue('Test Label')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fifty')).toBeInTheDocument();
  });

  it('disables fields when tick map is not enabled', () => {
    const disabledTickMap = { ...defaultTickMap, enabled: false };
    renderItem({ tickMap: disabledTickMap });
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('enables fields when tick map is enabled', () => {
    renderItem();
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).not.toBeDisabled();
    });
  });

  it('calls setter with updated label on label input change', () => {
    renderItem();
    const labelInput = screen.getByDisplayValue('Test Label');
    fireEvent.change(labelInput, { target: { value: 'New Label' } });
    expect(defaultProps.setter).toHaveBeenCalledWith(0, {
      ...defaultTickMap,
      label: 'New Label',
    });
  });

  it('calls setter with updated value on value input change', () => {
    renderItem();
    const valueInput = screen.getByDisplayValue('50');
    fireEvent.change(valueInput, { target: { value: '75' } });
    expect(defaultProps.setter).toHaveBeenCalledWith(0, {
      ...defaultTickMap,
      value: '75',
    });
  });

  it('calls setter with updated text on text input change', () => {
    renderItem();
    const textInput = screen.getByDisplayValue('Fifty');
    fireEvent.change(textInput, { target: { value: 'Seventy-Five' } });
    expect(defaultProps.setter).toHaveBeenCalledWith(0, {
      ...defaultTickMap,
      text: 'Seventy-Five',
    });
  });

  it('calls setter with toggled enabled on visibility icon click', () => {
    renderItem();
    const toggleButton = screen.getByLabelText('Hide/Show Override');
    fireEvent.click(toggleButton);
    expect(defaultProps.setter).toHaveBeenCalledWith(0, {
      ...defaultTickMap,
      enabled: false,
    });
  });

  it('calls remover with correct order on delete click', () => {
    renderItem();
    const deleteButton = screen.getByLabelText('Delete Tick Map');
    fireEvent.click(deleteButton);
    expect(defaultProps.remover).toHaveBeenCalledWith(0);
  });

  it('calls moveUp with correct order on move up click', () => {
    renderItem();
    const moveUpButton = screen.getByLabelText('Move Up');
    fireEvent.click(moveUpButton);
    expect(defaultProps.moveUp).toHaveBeenCalledWith(0);
  });

  it('calls moveDown with correct order on move down click', () => {
    renderItem();
    const moveDownButton = screen.getByLabelText('Move Down');
    fireEvent.click(moveDownButton);
    expect(defaultProps.moveDown).toHaveBeenCalledWith(0);
  });

  it('calls createDuplicate with correct order on copy click', () => {
    renderItem();
    const copyButton = screen.getByLabelText('Duplicate');
    fireEvent.click(copyButton);
    expect(defaultProps.createDuplicate).toHaveBeenCalledWith(0);
  });

  it('uses correct order from tick map prop', () => {
    const tickMap = { ...defaultTickMap, order: 3 };
    renderItem({ tickMap });
    const deleteButton = screen.getByLabelText('Delete Tick Map');
    fireEvent.click(deleteButton);
    expect(defaultProps.remover).toHaveBeenCalledWith(3);
  });
});

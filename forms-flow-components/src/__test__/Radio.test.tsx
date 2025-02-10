import { render, fireEvent, getByTestId } from '@testing-library/react';
import {CustomRadioButton as Radio} from '../components/CustomComponents/Radio';
import '@testing-library/jest-dom';
import React from 'react';

describe('Radio Component', () => {
  const mockOnChange = jest.fn();

  const defaultProps = {
    name: 'test-radio',
    dataTestId: 'test-radio',
    value: 'option1',
    items: [
      { value: 'option1', label: 'Option 1', onClick: jest.fn() },
      { value: 'option2', label: 'Option 2', onClick: jest.fn() }
    ],

    onChange: mockOnChange,
    label: 'Test Radio'
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders radio button with label', () => {
    const { getByLabelText } = render(<Radio {...defaultProps} />);
    const radioElement = getByLabelText('Option 1');
    expect(radioElement).toBeInTheDocument();
  });

  it('handles onChange event', () => {
    const { getByLabelText } = render(<Radio {...defaultProps} />);
    const radioElement = getByLabelText('Option 1');
    
    fireEvent.click(radioElement);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('renders all radio options', () => {
    const { getByLabelText } = render(<Radio {...defaultProps} />);
    expect(getByLabelText('Option 1')).toBeInTheDocument();
    expect(getByLabelText('Option 2')).toBeInTheDocument();
  });

}); 
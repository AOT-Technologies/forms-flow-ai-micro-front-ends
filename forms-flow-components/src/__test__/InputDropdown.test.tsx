import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InputDropdown } from '../components/CustomComponents/InputDropdown';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => str,
  }),
}));

const renderComponent = (props) => {
  return render(<InputDropdown {...props} />);
};

describe('InputDropdown Component', () => {
  const mockOptions = [
    { label: 'Option 1', onClick: jest.fn() },
    { label: 'Option 2', onClick: jest.fn() },
    { label: 'Option 3', onClick: jest.fn() }
  ];

  const defaultProps = {
    Options: mockOptions,
    firstItemLabel: 'Add New',
    dropdownLabel: 'Select Option',
    isAllowInput: true,
    placeholder: 'Select an option'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input dropdown with placeholder', () => {
    renderComponent(defaultProps);
    expect(screen.getByPlaceholderText('Select an option')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    renderComponent(defaultProps);
    const input = screen.getByPlaceholderText('Select an option');
    fireEvent.click(input);
    
    expect(screen.getByText('Add New')).toBeInTheDocument();
    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('filters options based on input', () => {
    renderComponent(defaultProps);
    const input = screen.getByPlaceholderText('Select an option');
    
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'Option 1' } });

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });

  it('selects an option when clicked', () => {
    renderComponent(defaultProps);
    const input = screen.getByPlaceholderText('Select an option');
    
    fireEvent.click(input);
    fireEvent.click(screen.getByText('Option 1'));

    expect(input).toHaveValue('Option 1');
    expect(mockOptions[0].onClick).toHaveBeenCalled();
  });

  it('allows custom input when "Add New" is clicked', () => {
    renderComponent(defaultProps);
    const input = screen.getByPlaceholderText('Select an option');
    
    fireEvent.click(input);
    fireEvent.click(screen.getByText('Add New'));
    
    const newInput = screen.getByRole('textbox');
    fireEvent.change(newInput, { target: { value: 'Custom Input' } });
    
    expect(newInput).toHaveValue('Custom Input');
  });

  it('closes dropdown when clicking outside', () => {
    renderComponent(defaultProps);
    const input = screen.getByPlaceholderText('Select an option');
    
    fireEvent.click(input);
    expect(screen.getByText('Add New')).toBeInTheDocument();
    
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Add New')).not.toBeInTheDocument();
  });

  it('handles invalid state correctly', () => {
    renderComponent({...defaultProps, isInvalid: true, feedback: 'Error message'});
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
}); 
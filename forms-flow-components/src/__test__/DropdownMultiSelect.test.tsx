import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DropdownMultiSelect } from '../components/CustomComponents/DropdownMultiselect';


describe('DropdownMultiSelect Component', () => {
  const mockDropdownChange = jest.fn();
  const mockMultiSelectionChange = jest.fn();
  const mockOptions = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
    { id: '3', name: 'Option 3' }
  ];
  const mockdropdownOptions = [
    { label: 'Option 1', onClick: jest.fn() },
    { label: 'Option 2', onClick: jest.fn() },
    { label: 'Option 3', onClick: jest.fn() }
  ];
  const defaultProps = {
    dropdownLabel: 'Test Dropdown',
    inputDropDownOptions: mockdropdownOptions,
    multiSelectOptions:mockOptions,
    onDropdownChange: mockDropdownChange,
    onMultiSelectionChange: mockMultiSelectionChange,
    dataTestId: 'test',
    ariaLabel: 'test',
    placeholder: 'Select an options'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });
  const renderComponent = (props = {}) => render(<DropdownMultiSelect {...defaultProps} {...props} />);

  it('renders dropdown component with label', () => {
    const { container } = renderComponent();
    const inputdropdown = screen.getByTestId("test-dropdown-component");
    expect(inputdropdown).toBeInTheDocument();
    expect(container.querySelector('label')).toHaveTextContent('Test Dropdown');
  });

  it('renders multiselect when enableMultiSelect is true', () => {
    const { container } =  renderComponent({ enableMultiSelect: true });
    expect(container.querySelector('.multiSelectContainer')).toBeInTheDocument();
  });

  it('does not render multiselect when enableMultiSelect is false', () => {
    const { container } = renderComponent({ enableMultiSelect: false });
    expect(container.querySelector('.multiSelectContainer')).not.toBeInTheDocument();
  });

  it('disables multiselect when disabled prop is true', () => {
    const { container } = renderComponent({ enableMultiSelect: true, disabled: true });
    expect(container.querySelector('.multiSelectContainer')).toHaveClass('disable_ms');
  });

  it('renders input dropdown with placeholder', () => {
    renderComponent();
    expect(screen.getByTestId('test-dropdown-component')).toBeInTheDocument();
  });

  it('opens dropdown on click and displays options', () => {
    renderComponent();
    const input = screen.getByTestId('test-dropdown-component');
    
    fireEvent.click(input);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('renders multiselect dropdown options correctly', () => { 
    const { container } = renderComponent({ enableMultiSelect: true,displayValue: "name" });

    // Wait for the multiselect container to be rendered
    const multiselect = container.querySelector('.multiSelectContainer');
    expect(multiselect).toBeInTheDocument();

    // Check if options are rendered
    mockOptions.forEach(option => {
      expect(screen.getByText(option.name)).toBeInTheDocument();
    });
  });

  it('selects an option when dropdown is clicked', () => {
    renderComponent();
    const input = screen.getByTestId('test-dropdown-component');
    
    fireEvent.click(input);
    fireEvent.click(screen.getByText('Option 1'));

    expect(input).toHaveValue('Option 1');
    expect(mockdropdownOptions[0].onClick).toHaveBeenCalled();
  });

  it('handles multiselect value changes', () => {
    const { container } = renderComponent({ enableMultiSelect: true });
    const option = container.querySelector('.option');
    fireEvent.click(option!);
    expect(mockMultiSelectionChange).toHaveBeenCalled();
  });
  
});
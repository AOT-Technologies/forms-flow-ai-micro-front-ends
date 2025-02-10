import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultipleSelect } from '../components/CustomComponents/MultiSelect';


const renderMultipleSelect = (props) => render(<MultipleSelect {...props} displayValue="name" />);
describe('MultipleSelect Component', () => {
  const mockOptions = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
    { id: '3', name: 'Option 3' }
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders MultipleSelect component with options', () => {
    const {container} =  renderMultipleSelect({options:mockOptions,value:[],onChange:mockOnChange,placeholder:"Select options"})

    const MultipleSelect =  container.querySelector("#multiselectContainerReact")
    expect(MultipleSelect).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select options")).toBeInTheDocument();
  });

  it('displays selected options', () => {
    const selectedValues = [mockOptions[0], mockOptions[1]];
 
    const {container} = renderMultipleSelect({options:mockOptions,value:selectedValues,onChange:mockOnChange,placeholder:"Select options"})

    const MultipleSelect =  container.querySelector("#multiselectContainerReact")
    expect(MultipleSelect).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();

  });
 
}); 
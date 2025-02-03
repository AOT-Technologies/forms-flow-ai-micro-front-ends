import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormTextArea } from '../components/CustomComponents/FormTextArea';
 
 
const handleChange = jest.fn();

describe('FormTextArea Component', () => {
  it('renders with default props', () => {
    render(<FormTextArea  onChange={handleChange} value="" dataTestid="textarea" />);
    expect(screen.getByTestId('textarea')).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<FormTextArea  onChange={handleChange} value="" label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<FormTextArea  onChange={handleChange} value="" placeholder="Enter text" dataTestid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveAttribute('placeholder', 'Enter text');
  });

  it('triggers onChange when text is typed', () => {
    render(<FormTextArea onChange={handleChange} dataTestid="textarea"  value=''/>);
    fireEvent.change(screen.getByTestId('textarea'), { target: { value: 'Hello' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('triggers onBlur when focus is lost', () => {
    const handleBlur = jest.fn();
    render(<FormTextArea  onChange={handleChange} onBlur={handleBlur} dataTestid="textarea" value=""/>);
    fireEvent.blur(screen.getByTestId('textarea'));
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('displays validation feedback when isInvalid is true', () => {
    render(<FormTextArea  onChange={handleChange} value='' isInvalid feedback="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    render(<FormTextArea  onChange={handleChange} value='' icon={<span data-testid="icon">⭐</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onIconClick when icon is clicked', () => {
    const handleIconClick = jest.fn();
    render(<FormTextArea  onChange={handleChange} value='' icon={<span data-testid="icon">⭐</span>}  onIconClick={handleIconClick} />);
    fireEvent.click(screen.getByTestId('icon'));
    expect(handleIconClick).toHaveBeenCalledTimes(1);
  });

   
   
});

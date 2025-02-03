import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FormInput } from '../components/CustomComponents/FormInput';
const handleChange = jest.fn();
describe('FormInput Component', () => {
  it('renders without crashing', () => {
    render(<FormInput  onChange={handleChange} value=''  dataTestid="input" />);
    expect(screen.getByTestId('input')).toBeInTheDocument();
  });

  it('triggers onChange when text is typed', () => {

    render(<FormInput onChange={handleChange} dataTestid="input" value="" />);
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'Test' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('triggers onBlur when input loses focus', () => {
    const handleBlur = jest.fn();
    render(<FormInput onChange={handleChange}  onBlur={handleBlur} dataTestid="input" value="" />);
    fireEvent.blur(screen.getByTestId('input'));
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('triggers onClick when input is clicked', () => {
    const handleClick = jest.fn();
    render(<FormInput onChange={handleChange}  onClick={handleClick} dataTestid="input" value="" />);
    fireEvent.click(screen.getByTestId('input'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onIconClick when icon is clicked', () => {
    const handleIconClick = jest.fn();
    render(<FormInput onChange={handleChange}  onIconClick={handleIconClick} dataTestid="input" icon={<span data-testid="icon">*</span>} value="" />);
    fireEvent.click(screen.getByTestId('icon'));
    expect(handleIconClick).toHaveBeenCalledTimes(1);
  });

  it('autoFocus works when enabled', () => {
    render(<FormInput onChange={handleChange} value=''  dataTestid="input" autoFocusInput />);
    expect(screen.getByTestId('input')).toHaveFocus();
  });
});

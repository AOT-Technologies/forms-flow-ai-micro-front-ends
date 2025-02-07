import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FormInput } from '../components/CustomComponents/FormInput';

const handleChange = jest.fn();

const renderFormInputComponent = (props)=> render(<FormInput  onChange={handleChange} value=''  dataTestid="input" {...props} />);

describe('FormInput Component', () => {
  it('renders without crashing', () => {
    renderFormInputComponent();
    expect(screen.getByTestId('input')).toBeInTheDocument();
  });

  it('triggers onChange when text is typed', () => {
    renderFormInputComponent();
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'Test' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('triggers onBlur when input loses focus', () => {
    const handleBlur = jest.fn();
    renderFormInputComponent({onBlur:handleBlur})
     fireEvent.blur(screen.getByTestId('input'));
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('triggers onClick when input is clicked', () => {
    const handleClick = jest.fn();
    renderFormInputComponent({onClick:handleClick})
     fireEvent.click(screen.getByTestId('input'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onIconClick when icon is clicked', () => {
    const handleIconClick = jest.fn();
    renderFormInputComponent({onIconClick:handleIconClick, icon:<span data-testid="icon">*</span>})
    fireEvent.click(screen.getByTestId('icon'));
    expect(handleIconClick).toHaveBeenCalledTimes(1);
  });

  it('autoFocus works when enabled', () => {
    renderFormInputComponent({autoFocusInput:true})
    expect(screen.getByTestId('input')).toHaveFocus();
  });
});

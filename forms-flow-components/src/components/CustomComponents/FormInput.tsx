import React, { ChangeEvent, FocusEvent, KeyboardEvent, useEffect, useRef } from 'react';
import { Form } from 'react-bootstrap';
import { useTranslation } from "react-i18next";
import { ClearIcon } from "../SvgIcons/index";

interface FormInputProps {
  type?: string;
  label?: string;
  name? : string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isInvalid?: boolean;
  feedback?: string;
  disabled?: boolean;
  size?: 'sm' | 'lg';
  dataTestId?: string;
  ariaLabel?: string;
  className?: string;
  required?: boolean;
  clear?: boolean;
  icon?: React.ReactNode;
  id?: string;
  onIconClick?: () => void;
  onClearClick?: () => void;
  onClick?: () => void;
  turnOnLoader?: boolean;
  autoFocusInput?: boolean;
  minLength?: number;
  maxLength?: number; 
  variant?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  type = "text",
  name,
  label,
  value ,
  onChange,
  onBlur,
  placeholder = "",
  isInvalid = false,
  feedback = "",
  disabled = false,
  size,
  dataTestId,
  ariaLabel,
  className='',
  required = false,
  icon,
  clear,
  id,
  onIconClick,
  onClearClick,
  onClick,
  turnOnLoader = false,
  autoFocusInput = false,
  minLength,
  maxLength, 
  variant,
}) => {
  const { t } = useTranslation();
  // let variantInputHeightClass = '';
  // if (variant === 'assign-user-sm') {
  //   variantInputHeightClass = 'assign-user-sm-height';
  // } else if (variant === 'assign-user-md') {
  //   variantInputHeightClass = 'assign-user-md-height';
  // }
  const inputClassNames = `${icon ? 'with-icon' : ''}  ${className}`;
  const inputRef = useRef(null);
  useEffect(()=>{ 
    if(autoFocusInput && inputRef.current){
      inputRef.current.focus();
    }
  },[autoFocusInput])
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Check if Enter key is pressed and onIconClick is provided
    if (e.key === 'Enter' && onIconClick) {
      onIconClick();
    }
  };

  return (
    <div className={`input-text ${icon ? "with-icon" : ""} ${isInvalid ? "error" : ""} ${className ? className : ""}`}>
      {label && (
        <Form.Label htmlFor={id} className='custom-form-control-label'>
          {t(label)}{required && <span className='required-icon'>*</span>}
        </Form.Label>
      )}
      
      <div className="field">
        <Form.Control
          id={id} // make the input id UNIQUE
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          isInvalid={isInvalid}
          disabled={disabled}
          size={size}
          data-testid={dataTestId}
          aria-label={ariaLabel}
          required={required}
          className={`${inputClassNames} ${type === 'number' ? 'no-spinner' : ''}`}
          onKeyDown={handleKeyDown}
          onClick={onClick}
          ref={inputRef}
          minLength={minLength}
          maxLength={maxLength}
        />

        {icon && !turnOnLoader && (
          <div
            className="icon"
            id="input-icon" 
            onClick={onIconClick}
            >
            {icon}
          </div>
        )}

        {clear && (
          <div
            className="clear"
            onClick={onClearClick}
            >
            <ClearIcon
              data-testid="clear-field"
              aria-label="clear-field"
            />
          </div>
        )}
        </div>

        {isInvalid && (
          <label htmlFor='name-input' className='error-text'>
            {t(feedback)}
          </label>
        )}

      </div>
  );
};


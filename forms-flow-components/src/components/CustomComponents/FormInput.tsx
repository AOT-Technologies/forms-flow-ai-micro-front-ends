import React, { ChangeEvent, FocusEvent, KeyboardEvent, useEffect, useRef } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from "react-i18next";
import { LoadingIcon } from "../SvgIcons/index";

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
  icon?: React.ReactNode;
  id?: string;
  onIconClick?: () => void;
  onClick?: () => void;
  turnOnLoader?: boolean;
  autoFocusInput?: boolean;
  minLength?: number;
  maxLength?: number;
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
  className = '',
  required = false,
  icon,
  id,
  onIconClick,
  onClick,
  turnOnLoader = false,
  autoFocusInput = false,
  minLength,
  maxLength, 
}) => {
  const { t } = useTranslation();
  const inputClassNames = `form-control-input ${icon ? 'with-icon' : ''} ${className}`;
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
    <div className={`input-text ${icon? "with-icon":""} ${isInvalid ? "error" : ""}`}>
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
          className={inputClassNames}
          onKeyDown={handleKeyDown}
          onClick={onClick}
          ref={inputRef}
          minLength={minLength}
          maxLength={maxLength}
        />

        {turnOnLoader && <LoadingIcon />}

        {icon && !turnOnLoader && (
          <div
            className="icon"
            id="input-icon" 
            onClick={onIconClick}
            >
            {icon}
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


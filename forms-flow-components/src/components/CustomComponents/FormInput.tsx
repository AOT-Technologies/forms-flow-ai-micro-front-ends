import React, { ChangeEvent, FocusEvent, KeyboardEvent, useEffect, useRef } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from "react-i18next";

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
  variant,
}) => {
  const { t } = useTranslation();
  let variantInputHeightClass = '';
  if (variant === 'assign-user-sm') {
    variantInputHeightClass = 'assign-user-sm-height';
  } else if (variant === 'assign-user-md') {
    variantInputHeightClass = 'assign-user-md-height';
  }
  const inputClassNames = `form-control-input ${icon ? 'with-icon' : ''} ${variantInputHeightClass} ${className}`;
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
    <Form.Group controlId={id}>
      {label && (
        <Form.Label className='custom-form-control-label'>
          {t(label)}{required && <span className='required-icon'>*</span>}
        </Form.Label>
      )}
      <InputGroup className="custom-form-input-group">
        <Form.Control
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
        {turnOnLoader && (
          <div className="input-spinner"></div>
        )}
          {icon && !turnOnLoader &&(
            <InputGroup.Text
             id="input-icon" 
             onClick={onIconClick}
             className={disabled ? 'disabled-icon' : ''}>
              {icon}
            </InputGroup.Text>
          )}
        </InputGroup>
        {isInvalid && (
            <Form.Control.Feedback className='custom-feedback' type="invalid">
              {t(feedback)}
            </Form.Control.Feedback>
          )}
      </Form.Group>
  );
};


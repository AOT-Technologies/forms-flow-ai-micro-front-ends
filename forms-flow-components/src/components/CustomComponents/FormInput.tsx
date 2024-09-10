import React, { ChangeEvent, FocusEvent ,KeyboardEvent } from 'react';
import { Form, InputGroup } from 'react-bootstrap';

interface FormInputProps {
  type?: string;
  label?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isInvalid?: boolean;
  feedback?: string;
  disabled?: boolean;
  size?: 'sm' | 'lg';
  dataTestid?: string;
  ariaLabel?: string;
  className?: string;
  required?: boolean;
  icon?: React.ReactNode;
  id?: string;
  onIconClick?: () => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  type = "text",
  label,
  value ,
  onChange,
  onBlur,
  placeholder = "",
  isInvalid = false,
  feedback = "",
  disabled = false,
  size,
  dataTestid,
  ariaLabel,
  className = '',
  required = false,
  icon,
  id,
  onIconClick
}) => {

  const inputClassNames = `form-control-input ${icon ? 'with-icon' : ''} ${className}`;

  return (
    <div className="form-input-box">
      <Form.Group controlId={id}>
        {label && (
          <Form.Label className='custom-form-control-label'>
            {label} {required && <span className='required-icon'>*</span>}
          </Form.Label>
        )}
        <InputGroup className="custom-form-input-group">
          <Form.Control
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            isInvalid={isInvalid}
            disabled={disabled}
            size={size}
            data-testid={dataTestid}
            aria-label={ariaLabel}
            required={required}
            className={inputClassNames}
            onKeyDown={(e) => (e.keyCode === 13 && onIconClick())}
          />
          {icon && (
            <InputGroup.Text
             id="basic-addon1" 
             onClick={onIconClick}
             className={disabled ? 'disabled-icon' : ''}>
              {icon}
            </InputGroup.Text>
          )}
          {isInvalid && (
            <Form.Control.Feedback className='custom-feedback' type="invalid">
              {feedback}
            </Form.Control.Feedback>
          )}
        </InputGroup>
      </Form.Group>
    </div>
  );
};


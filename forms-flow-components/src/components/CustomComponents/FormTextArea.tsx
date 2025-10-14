import React, { ChangeEvent, FocusEvent, KeyboardEvent, useRef, forwardRef, useEffect } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from "react-i18next";

interface FormTextAreaProps {
    type?: string;
    label?: string;
    name?:string;
    value?: string;
    onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur?: (e: FocusEvent<HTMLTextAreaElement>) => void;
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
    minRows?: number;
    onIconClick?: () => void;
    maxRows?: number;
    iconPosition?: string;
    minLength?: number;
    maxLength?: number; 
}

export const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(({
    label,
    value = '',
    name,
    onChange,
    onBlur,
    placeholder = '',
    isInvalid = false,
    feedback = '',
    disabled = false,
    size,
   dataTestId,
    ariaLabel,
    className = '',
    required = false,
    icon,
    id,
    minRows = 1,
    onIconClick,
    maxRows = 5,
    iconPosition = "top",
    minLength, 
    maxLength, 
}, ref) => {
    const { t } = useTranslation();
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const combinedRef = (ref || internalRef) as React.RefObject<HTMLTextAreaElement>;

    useEffect(() => {
        if (combinedRef.current) {
            combinedRef.current.style.height = `${minRows * 1.5}em`;
            combinedRef.current.style.height = `${combinedRef.current.scrollHeight}px`;
        }
    }, [value, minRows, combinedRef]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && onIconClick) {
            e.preventDefault();
            onIconClick();
        }
    };

    const getIconPositionClass = (position) => {
        if (position === "top") return 'icon-top';
        if (position === "center") return 'icon-center';
        if (position === "bottom") return 'icon-bottom';
        return 'icon-top'; 
    };
    
    const iconPositionClass = getIconPositionClass(iconPosition);
    return (
            <Form.Group controlId={id} className={`input-textarea ${icon ? 'with-icon' : ''} `}>
                {label && (
                    <Form.Label className="custom-form-control-label">
                        {t(label)} {required && <span className="required-icon">*</span>}
                    </Form.Label>
                )}
                <InputGroup className="field">
                    <Form.Control
                        as="textarea"
                        ref={combinedRef}
                        name={name}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={t(placeholder)}
                        isInvalid={isInvalid}
                        disabled={disabled}
                        size={size}
                        data-testid={dataTestId}
                        aria-label={ariaLabel}
                        required={required}
                        // className={` ${icon ? 'with-icon' : ''} `} //custom-textarea form-control-input ${className}
                        onKeyDown={handleKeyDown}
                        minLength={minLength}
                        maxLength={maxLength}
                    />
                    {icon && (
                        <InputGroup.Text
                            id="basic-addon1"
                            onClick={onIconClick}
                            className={` ${disabled ? 'disabled' : ''}`}
                        >
                            {icon}
                        </InputGroup.Text>
                    )}
                    {isInvalid && (
                        <Form.Label className="error-text">
                            {t(feedback)}
                        </Form.Label>
                    )}
                </InputGroup>
            </Form.Group>
    );
});

FormTextArea.displayName = 'FormTextArea';

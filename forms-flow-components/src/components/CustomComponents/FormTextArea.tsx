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
    dataTestid?: string;
    ariaLabel?: string;
    className?: string;
    required?: boolean;
    icon?: React.ReactNode;
    id?: string;
    minRows?: number;
    onIconClick?: () => void;
    maxRows?: number;
    iconPosition?: string;
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
    dataTestid,
    ariaLabel,
    className = '',
    required = false,
    icon,
    id,
    minRows = 1,
    onIconClick,
    maxRows = 5,
    iconPosition = "top"
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
            <Form.Group controlId={id}>
                {label && (
                    <Form.Label className="custom-form-control-label">
                        {t(label)} {required && <span className="required-icon">*</span>}
                    </Form.Label>
                )}
                <InputGroup className="custom-form-input-group">
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
                        data-testid={dataTestid}
                        aria-label={ariaLabel}
                        required={required}
                        className={`custom-textarea form-control-input ${icon ? 'with-icon' : ''} ${className}`}
                        style={{ maxHeight: `${maxRows * 1.5}em` }}
                        onKeyDown={handleKeyDown}
                    />
                    {icon && (
                        <InputGroup.Text
                            id="basic-addon1"
                            onClick={onIconClick}
                            className={`icon-wrapper  ${iconPositionClass} ${disabled ? 'disabled-icon' : ''}`}
                        >
                            {icon}
                        </InputGroup.Text>
                    )}
                    {isInvalid && (
                        <Form.Control.Feedback className="custom-feedback" type="invalid">
                            {t(feedback)}
                        </Form.Control.Feedback>
                    )}
                </InputGroup>
            </Form.Group>
    );
});

FormTextArea.displayName = 'FormTextArea';

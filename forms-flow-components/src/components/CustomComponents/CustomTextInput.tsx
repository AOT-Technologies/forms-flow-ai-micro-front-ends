import React, { FC, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface CustomTextInputProps {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  dataTestId: string;
  disabled?: boolean;
  ariaLabel?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  maxLength?: number;
  minLength?: number;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  autoFocus?: boolean;
}

export const CustomTextInput: FC<CustomTextInputProps> = ({
  value,
  setValue,
  placeholder,
  dataTestId,
  disabled = false,
  ariaLabel,
  onBlur,
  maxLength,
  minLength,
  icon,
  onIconClick,
  autoFocus = false,
}) => {
  const { t } = useTranslation();
  const inputId = `${dataTestId}-input`; // unique id
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  return (
    <div className={`text-input-container ${icon ? "text-input-with-icon" : ""}`}>
      {/* Hidden label for accessibility */}
      {/* <label htmlFor={inputId} className="sr-only">
        {ariaLabel || t(placeholder)}
      </label> */}

      <input
        ref={inputRef}
        id={inputId}
        className="text-input"
        type="text"
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        placeholder={t(placeholder)}
        data-testid={dataTestId}
        aria-label={ariaLabel || t(placeholder)}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        minLength={minLength}
      />
      {icon && (
        <div
          className={`text-input-icon ${onIconClick ? "text-input-icon-clickable" : ""}`}
          onClick={onIconClick}
          role={onIconClick ? "button" : undefined}
          tabIndex={onIconClick ? 0 : undefined}
          onKeyDown={onIconClick ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onIconClick();
            }
          } : undefined}
          aria-label={onIconClick ? "Icon button" : undefined}
        >
          {icon}
        </div>
      )}
    </div>
  );
};

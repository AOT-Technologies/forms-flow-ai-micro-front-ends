import React, { FC } from "react";
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
}) => {
  const { t } = useTranslation();
  const inputId = `${dataTestId}-input`; // unique id

  return (
    <div className="text-input-container">
      {/* Hidden label for accessibility */}
      {/* <label htmlFor={inputId} className="sr-only">
        {ariaLabel || t(placeholder)}
      </label> */}

      <input
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
    </div>
  );
};

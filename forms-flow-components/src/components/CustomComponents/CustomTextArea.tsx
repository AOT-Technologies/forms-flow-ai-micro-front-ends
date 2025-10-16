import React, { FC } from "react";
import { useTranslation } from "react-i18next";

interface CustomTextAreaProps {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  dataTestId: string;
  disabled?: boolean;
  ariaLabel?: string;
  rows?: number;
  maxLength?: number;
}

export const CustomTextArea: FC<CustomTextAreaProps> = ({
  value,
  setValue,
  placeholder = "Enter text",
  dataTestId,
  disabled = false,
  ariaLabel,
  rows = 4,
  maxLength,
}) => {
  const { t } = useTranslation();
  const inputId = `${dataTestId}-textarea`; // unique id per instance
  const containerClass = `text-area-container${disabled ? " text-area-disabled" : ""}`;

  return (
    <div className={containerClass}>
      {/* Hidden label for accessibility */}
      {/* <label htmlFor={inputId} className="sr-only">
        {ariaLabel || t(placeholder)}
      </label> */}

      <textarea
        id={inputId}
        name={dataTestId} // ensures no warnings + supports form submit
        className="text-area"
        onChange={(e) => setValue(e.target.value)}
        placeholder={t(placeholder)}
        data-testid={dataTestId}
        aria-label={ariaLabel || placeholder}
        value={value}
        role="textbox"
        draggable={false}
        disabled={disabled}
        rows={rows}
        {...(maxLength ? { maxLength } : {})}
      />
    </div>
  );
};

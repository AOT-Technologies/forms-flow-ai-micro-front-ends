import React, { useState } from "react";
import { useTranslation } from "react-i18next";

type Variant = "primary" | "secondary";

interface CustomButtonProps {
  variant?: Variant;
  loading?: boolean;
  ariaLabel?: string;
  label?: string;
  disabled?: boolean;
  selected?: boolean;  // for controlled selected state
  onClick?: () => void;
  name?: string;
  dataTestId?: string;
  icon?: React.ReactNode;
  className?: string;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

export const V8CustomButton: React.FC<CustomButtonProps> = ({
  label = "",
  variant = "secondary",
  loading = false,
  disabled = false,
  ariaLabel = "",
  selected = false,
  name,
  dataTestId,
  onClick,
  icon,
  className = "",
  iconOnly = false,
  fullWidth = false,
  ...props
}) => {
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      className={[
        "custom-button",
        `custom-button--${variant}`,
        loading ? "is-loading" : "",
        disabled ? "is-disabled" : "",
        selected ? "is-selected" : "",
        isPressed ? "is-selected" : "",  // apply selected style on mousedown
        fullWidth ? "w-100" : "",
        iconOnly ? "icon-only" : "",
        className
      ]
        .filter(Boolean) //filter to prevent empty strings
        .join(" ")}
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}     // press start
      onMouseUp={() => setIsPressed(false)}      // press end
      onMouseLeave={() => setIsPressed(false)}   // cancel if moved away
      name={name}
      data-testid={dataTestId}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      tabIndex={0}
      role="button"
      {...props}
    >
      {loading && <span className="button-spinner" aria-hidden="true"></span>}
      {!loading && icon && icon}
      {!iconOnly && t(label)}
    </button>
  );
};

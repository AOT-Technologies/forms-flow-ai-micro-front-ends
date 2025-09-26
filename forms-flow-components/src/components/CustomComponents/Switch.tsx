import React, { useState, useRef } from "react";
import { SwitchTickIcon, SwitchCrossIcon } from "../SvgIcons";
import { StyleServices } from "@formsflow/service";

interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
  withIcon?: boolean;
  onChange?: (checked: boolean) => void;
  id?: string;
  className?: string;
  label?: string;
  type?: string; // default|primary|binary
}

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  disabled = false,
  withIcon = false,
  onChange,
  id,
  className = "",
  label,
  type = "default"
}) => {
  const [isChecked, setIsChecked] = useState(checked);
  const [isFocused, setIsFocused] = useState(false);
  const switchRef = useRef<HTMLButtonElement>(null);

  // Use CSS variables for colors
  const colorSuccess = StyleServices.getCSSVariable('--ff-success'); // for #00C49A
  const colorPrimaryLight = StyleServices.getCSSVariable('--ff-primary-light'); // for #B8ABFF
  const colorDanger = StyleServices.getCSSVariable('--ff-danger'); // for #E57373
  const colorGrayLight = StyleServices.getCSSVariable('--ff-gray-light'); // for #E5E5E5

  const renderIcon = () => {
    let fillColor = colorSuccess;

    if (isChecked) {
      if (type.toLowerCase() === 'primary') fillColor = colorPrimaryLight;
      return (
        <span className="custom-switch-icon">
          <SwitchTickIcon fillColor={fillColor} />
        </span>
      );
    } else {
      if (type.toLowerCase() === 'binary') fillColor = colorDanger;
      else fillColor = colorGrayLight;
      return (
        <span className="custom-switch-icon">
          <SwitchCrossIcon fillColor={fillColor} />
        </span>
      );
    }
  };

  const renderClass = () => {
    let switchClass = 'custom-switch';

    if (isChecked) {
      if (type.toLowerCase() === 'primary') switchClass += ' custom-switch-on-primary';
      else switchClass += ' custom-switch-on';
    } else {
      if (type.toLowerCase() === 'binary') {
        switchClass += ' custom-switch-off-binary';
      } else {
        switchClass += ' custom-switch-off';
      }
    }

    if (isFocused) switchClass += ' custom-switch-focused';
    if (disabled) switchClass += ' custom-switch-disabled';

    return switchClass;
  }

  const handleToggle = () => {
    if (disabled) return;
    setIsChecked((prev) => {
      const newChecked = !prev;
      onChange?.(newChecked);
      return newChecked;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      handleToggle();
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className={`custom-switch-wrapper ${className}`}>
      {label && (
        <label htmlFor={id} className="custom-switch-label">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id ? `${id}-label` : undefined}
        ref={switchRef}
        role="switch"
        aria-checked={isChecked}
        aria-disabled={disabled}
        aria-labelledby={label && id ? `${id}-label` : undefined}
        aria-label={!label ? label ?? 'Toggle' : undefined}
        tabIndex={disabled ? -1 : 0}
        className={renderClass()}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
      >
        <span className="custom-switch-slider">
          {withIcon && renderIcon()}
        </span>
      </button>
    </div>
  );
};
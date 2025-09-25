import React, { useState, useRef } from "react";
import { SwitchTickIcon, SwitchCrossIcon } from "../SvgIcons";

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

  const renderIcon = () => {
    let fillColor = "#00C49A";
    
    if (isChecked) {
        if(type= 'primary') fillColor ='#B8ABFF';

        return (
            <span className="custom-switch-icon">
                <SwitchTickIcon fillColor = {fillColor}/>
            </span>
        );
    }else{
        if(type == 'binary')fillColor = '#E57373';
        else fillColor = '#E5E5E5';

        return(
            <span className="custom-switch-icon">
                <SwitchCrossIcon fillColor={fillColor}/>
            </span>
        )
    }
  };

  const renderClass = () => {
    let switchClass = 'custom-switch';

    if (isChecked) {
      if (type.toLowerCase() === 'primary') switchClass += ' custom-switch-on-primary';
      else switchClass += ' custom-switch-on';
    } else {
      if (type.toLowerCase() === 'binary') switchClass += ' custom-switch-off-binary';
      else switchClass += ' custom-switch-off';
    }

    if (isFocused) switchClass += ' custom-switch-focused';
    if (disabled) switchClass += ' custom-switch-disabled';

    return switchClass;
  }

  const handleToggle = () => {
    if (disabled) return;
    setIsChecked((prev) => {
      const newChecked = !prev;
      onChange && onChange(newChecked);
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
        id={id}
        ref={switchRef}
        role="switch"
        aria-checked={isChecked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={renderClass()}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
      >
        <span className="custom-switch-slider">
          { withIcon && renderIcon() }
        </span>
      </button>
    </div>
  );
};
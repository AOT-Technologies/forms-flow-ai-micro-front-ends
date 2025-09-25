import React, { useState, useRef } from "react";

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
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M3.8 8.01667L0 4.21667L0.95 3.26667L3.8 6.11667L9.91667 0L10.8667 0.95L3.8 8.01667Z" fill={fillColor}/>
                </svg>
            </span>
        );
    }else{
        if(type == 'binary')fillColor = '#E57373';
        else fillColor = '#E5E5E5';

        return(
            <span className="custom-switch-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M0.933333 9.33333L0 8.4L3.73333 4.66667L0 0.933333L0.933333 0L4.66667 3.73333L8.4 0L9.33333 0.933333L5.6 4.66667L9.33333 8.4L8.4 9.33333L4.66667 5.6L0.933333 9.33333Z" fill={fillColor}/>
                </svg>
            </span>
        )
    }
  };

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
        className={`custom-switch
          ${isChecked ? "custom-switch-on" : "custom-switch-off"}
          ${isFocused ? "custom-switch-focused" : ""}
          ${disabled ? "custom-switch-disabled" : ""}
        `}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        style={
          isChecked && type === 'primary'
            ? { background: '#B8ABFF', boxShadow: '0 0 0 2px #B8ABFF' }
            : undefined
        }
      >
        <span className="custom-switch-slider">
          { withIcon && renderIcon() }
        </span>
      </button>
    </div>
  );
};
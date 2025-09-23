import React, { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { ChevronIcon } from "../SvgIcons/index";

interface V8CustomDropdownButtonProps {
  label?: string;
  items: { label: string; value: string; onClick?: () => void }[];
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
  dataTestId?: string;
  ariaLabel?: string;
}

export const V8CustomDropdownButton: React.FC<V8CustomDropdownButtonProps> = ({
  label = "Edit",
  items,
  variant = "primary",
  disabled = false,
  className = "",
  dataTestId = "v8-dropdown",
  ariaLabel = "Custom dropdown",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      as={ButtonGroup}
      show={open}
      onToggle={(isOpen) => setOpen(isOpen)}
      className={`v8-custom-dropdown ${className}`}
      data-testid={dataTestId}
    >
      <Dropdown.Toggle
        variant={variant}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`v8-dropdown-toggle ${open ? "open" : ""}`}
      >
          <span>{label}</span>
          <span className="v8-dropdown-divider" aria-hidden="true" />
          <span className="chevron-icon">
            <ChevronIcon/>
          </span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="v8-dropdown-menu">
        {items.map((item) => (
          <Dropdown.Item
            key={item.value}
            onClick={item.onClick}
            aria-label={item.label}
            className="v8-dropdown-item"
          >
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

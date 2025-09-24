import React, { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { ChevronIcon } from "../SvgIcons/index";

interface DropdownItemConfig {
  label: string;
  value?: string;
  onClick?: () => void;
  dataTestId?: string;
  ariaLabel?: string;
}

interface V8CustomDropdownButtonProps {
  label?: string;
  dropdownItems: DropdownItemConfig[];
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
  dataTestId?: string;
  ariaLabel?: string;
  menuPosition?: "left" | "right"; // controls dropdown menu alignment
}

export const V8CustomDropdownButton: React.FC<V8CustomDropdownButtonProps> = ({
  label = "Edit",
  dropdownItems,
  variant = "primary",
  disabled = false,
  className = "",
  dataTestId = "v8-dropdown",
  ariaLabel = "Custom dropdown",
  menuPosition = "left",
}) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const handleItemClick = (item: DropdownItemConfig) => {
    setSelectedValue(item.value || item.label);
    item.onClick?.();
    setOpen(false); // close after selecting
  };

  return (
    <Dropdown
      as={ButtonGroup}
      show={open}
      onToggle={(isOpen) => setOpen(isOpen)}
      className={`v8-custom-dropdown menu-${menuPosition} ${className}`}
      data-testid={dataTestId}
    >
      <Dropdown.Toggle
        variant={variant}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`v8-dropdown-toggle ${open ? "open" : ""}`}
      >
          <div className="label-div"><span className="dropdown-label">{label}</span></div>
          <span className="v8-dropdown-divider" aria-hidden="true" />
          <div className="dropdown-icon"><span className="chevron-icon"><ChevronIcon/></span></div>


      </Dropdown.Toggle>

      <Dropdown.Menu className="v8-dropdown-menu">
        {dropdownItems.map((item) => (
          <Dropdown.Item
            key={item.value || item.label}
            onClick={() => handleItemClick(item)}
            aria-label={item.ariaLabel || item.label}
            className={`v8-dropdown-item ${
              selectedValue === (item.value || item.label) ? "selected" : ""
            }`}
            data-testid={item.dataTestId}
          >
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

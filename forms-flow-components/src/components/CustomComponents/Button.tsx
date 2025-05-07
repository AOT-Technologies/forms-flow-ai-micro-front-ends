import { useRef, useEffect, useState, ReactElement } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import { ChevronIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";

interface DropdownItem {
  label: string;
  onClick: () => void;
  dataTestId?: string;
  ariaLabel?: string;
}

interface CustomButtonProps {
  variant: string;
  size?: "sm" | "md" | "lg" | "table" | "table-sm";
  label: string;
  name?: string,
  onClick?: () => void;
  isDropdown?: boolean;
  dropdownItems?: DropdownItem[];
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  dataTestId?: string;
  ariaLabel?: string;
  buttonLoading?: boolean;
  iconOnly?: boolean;  
}

const getButtonClassName = (size: string | undefined, className: string, iconOnly: boolean = false) => {
  const sizeClassMap: Record<string, string> = {
    md: "btn-md",
    table: "btn-table",
    "table-sm": "btn-table-sm"
  };

  return `${size ? sizeClassMap[size] || '' : ''} ${className}`.trim();
};

export const CustomButton: React.FC<CustomButtonProps> = ({
  variant,
  size,
  label,
  onClick,
  isDropdown = false,
  dropdownItems = [],
  disabled = false,
  icon = false,
  className = "",
  dataTestId = "",
  ariaLabel = "",
  name =  "",
  buttonLoading = false,
  iconOnly = false,  
}) => {
  const classNameForButton = getButtonClassName(size, className, iconOnly);
  const sizeOfButton = size !== "md" && size !== "table" && size !== "table-sm" ? size : undefined;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const { t } = useTranslation();

  const updateMenuStyle = () => {
    if (buttonRef.current && toggleRef.current) {
      const buttonWidth = buttonRef.current.getBoundingClientRect().width;
      const toggleWidth = toggleRef.current.getBoundingClientRect().width;
      const totalWidth = buttonWidth + toggleWidth - 1;
      setMenuStyle({
        minWidth: `${totalWidth}px`,
        borderTop: "none",
        borderTopLeftRadius: "0",
        borderTopRightRadius: "0",
        padding: "0",
      });
    }
  };

  useEffect(() => {
    updateMenuStyle();
    window.addEventListener("resize", updateMenuStyle);
    return () => window.removeEventListener("resize", updateMenuStyle);
  }, []);

  // Dropdown Button
  if (isDropdown) {
    return (
      <Dropdown
        as={ButtonGroup}
        className={className}
        onToggle={(isOpen) => setDropdownOpen(isOpen)}
      >
        <Button
          variant={variant}
          size={sizeOfButton}
          disabled={disabled}
          ref={buttonRef}
          data-testid={dataTestId}
          aria-label={ariaLabel}
          name={name}
          className={`${classNameForButton} justify-content-start`}
        >
          {t(label)}
        </Button>

        <Dropdown.Toggle
          ref={toggleRef}
          split
          variant={variant}
          id="dropdown-split-basic"
          className={`default-arrow ${dropdownOpen ? "collapsed" : ""}`}
        >
          <ChevronIcon className="svgIcon-onDark" />
        </Dropdown.Toggle>

        <Dropdown.Menu style={menuStyle}>
          {dropdownItems.map((item, index) => (
            <Dropdown.Item
              key={index}
              onClick={item.onClick}
              data-testid={item.dataTestId}
              aria-label={item.ariaLabel}
            >
              {t(item.label)}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  // Icon-only Button
  if (iconOnly) {
    return (
      <Button
        variant={variant}
        size={sizeOfButton}
        onClick={onClick}
        disabled={disabled || buttonLoading}
        name={name}
        className={`p-0 ${classNameForButton}`}
        data-testid={dataTestId}
        aria-label={ariaLabel}
      >
        <div className="d-inline-flex align-items-center">
          {icon}
        </div>
      </Button>
    );
  }

  // Default Button with icon and label
  return (
    <Button
      variant={variant}
      size={sizeOfButton}
      onClick={onClick}
      disabled={disabled || buttonLoading}
      name={name}
      className={classNameForButton}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      <div
        className={`d-inline-flex align-items-center ${
          buttonLoading ? "button-content" : ""
        }`}
      >
        {icon && <span className="me-2">{icon}</span>}
        {t(label)}
      </div>
      {buttonLoading && <span className="dotted-spinner"></span>}
    </Button>
    
  );
};


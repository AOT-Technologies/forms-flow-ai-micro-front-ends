import { useRef, useEffect, useState, ReactElement } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import { ChevronIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";
import { StyleServices } from "@formsflow/service";

interface DropdownItem {
  content?: React.ReactNode;
  onClick: () => void;
  dataTestId?: string;
  ariaLabel?: string;
}

interface ButtonDropdownProps {
  dropdownType: "DROPDOWN_ONLY" | "DROPDOWN_WITH_EXTRA_ACTION";
  variant: string;
  size?: "sm" | "md" | "lg" ;
  label: string;
  name?: string,
  dropdownItems?: DropdownItem[];
  disabled?: boolean;
  extraActionIcon?: React.ReactNode;
  extraActionOnClick?:() => void;
  className?: string;
  dataTestId?: string;
  ariaLabel?: string;
//   buttonLoading?: boolean;  
}

// const getButtonClassName = (size: string | undefined, className: string) => 
//   `${size === "md" ? 'btn-md' : ''} ${className}`;

export const ButtonDropdown: React.FC<ButtonDropdownProps> = ({
  dropdownType,
  variant,
  size,
  label,
  dropdownItems = [],
  disabled = false,
  extraActionIcon = false,
  extraActionOnClick,
  className = "",
  dataTestId = "",
  ariaLabel = "",
  name =  "",
}) => {
//   const classNameForButton = getButtonClassName(size, className);
  const buttonRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const { t } = useTranslation();
  const primaryBtnBgColor = StyleServices.getCSSVariable('--primary-btn-bg-color');
  const secondaryBtnBgColor = StyleServices.getCSSVariable('--secondary-btn-bg-color');  

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

  const getExtraActionStyles = (variant: string) => {
    const backgroundColors: Record<string, string | undefined> = {
      primary: primaryBtnBgColor,
      secondary: secondaryBtnBgColor,
    };
  
    return {
      extraActionClass: "extra-action-icon",
      backgroundColor: backgroundColors[variant] || undefined,
    };
  };
  
const { extraActionClass, backgroundColor } = getExtraActionStyles(variant);

   return (
      <Dropdown
        as={ButtonGroup}
        className={className}
        onToggle={(isOpen) => setDropdownOpen(isOpen)}
      >
        <div ref={buttonRef} className="d-flex">
        <Button
          variant={variant}
          size={size !== "md" ? size : undefined}
          disabled={disabled}
          data-testid={dataTestId}
          aria-label={ariaLabel}
          name={name}
          className="button-dropdown"
        >
          {t(label)}
        </Button>
        {dropdownType === "DROPDOWN_WITH_EXTRA_ACTION" && extraActionIcon && (
          <div
            onClick={extraActionOnClick}
            className={extraActionClass}
            style={{ backgroundColor }}
          >
            {extraActionIcon}
          </div>
        )}
        </div>
        <Dropdown.Toggle
          ref={toggleRef}
          split
          variant={variant}
          id="dropdown-split-basic"
          className={`default-arrow ${dropdownOpen ? "collapsed" : ""} button-dropdown-toggle`}
        >
          <ChevronIcon color="white" />
        </Dropdown.Toggle>

        <Dropdown.Menu style={menuStyle}>
          {dropdownItems.map((item, index) => (
            <Dropdown.Item
              key={index}
              onClick={item.onClick}
              data-testid={item.dataTestId}
              aria-label={item.ariaLabel}
            >
              {item.content}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }


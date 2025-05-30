import { useRef, useEffect, useState, ReactElement } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import { ChevronIcon, LoadingIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";
import i18n from "../../resourceBundles/i18n";
interface DropdownItem {
  label: string;
  onClick: () => void;
  dataTestId?: string;
  ariaLabel?: string;
}

interface CustomButtonProps {
  variant?: string;
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
  actionTable?: boolean;
  action?: boolean;
  iconWithText?: boolean;
  secondary?: boolean;
  dark?: boolean;
  darkPrimary?: boolean;
}

const getButtonClassName = (size: string | undefined, className: string, iconOnly: boolean = false, actionTable: boolean = false, action: boolean = false, iconWithText: boolean = false, secondary: boolean = false, dark: boolean = false, darkPrimary: boolean = false) => {
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
  dataTestId,
  ariaLabel = "",
  name =  "",
  buttonLoading = false,
  iconOnly = false, 
  actionTable = false, 
  action = false, 
  iconWithText = false,
  secondary = false,
  dark = false,
  darkPrimary = false,
}) => {
  const classNameForButton = getButtonClassName(size, className, iconOnly, actionTable, action, iconWithText, secondary, dark, darkPrimary);
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
    const locale = localStorage.getItem("i18nextLng");
    if (locale) {
      i18n.changeLanguage(locale);
    }
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

  // Btn-Icon-Special
  if (iconOnly) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        name={name}
        className={`button-icon-special ${buttonLoading ? "loading" : ""}`}
        data-testid={dataTestId}
        aria-label={ariaLabel}
      >
        {icon}
        {buttonLoading && <LoadingIcon />}
      </button>
    );
  }

  // Btn-Action-Table
  if (actionTable) {
    return (
      <button
      onClick={onClick}
      disabled={disabled}
      name={name}
      className={`button-action-table ${buttonLoading ? "loading" : ""}`}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      {t(label)}
      {buttonLoading && <LoadingIcon />}
    </button>
    );
  }
  
  // Btn-Action
  if (action) {
    return (
      <button
      onClick={onClick}
      disabled={disabled}
      name={name}
      className={`button-action ${buttonLoading ? "loading" : ""}`}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      {t(label)}
      {buttonLoading && <LoadingIcon />}
    </button>
    );
  }

  // Btn-Icon
  if (iconWithText) {
    return (
      <button
      onClick={onClick}
      disabled={disabled}
      name={name}
      className={`button-icon ${buttonLoading ? "loading" : ""}`}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      {icon}
      {t(label)}
      {buttonLoading && <LoadingIcon />}
    </button>
    );
  }

  // Btn-Secondary
  if (secondary) {
    return (
      <button
      onClick={onClick}
      disabled={disabled}
      name={name}
      className={`button-secondary ${buttonLoading ? "loading" : ""}`}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      {t(label)}
      {buttonLoading && <LoadingIcon />}
    </button>
    );
  }

  // Btn-Dark
  if (dark) {
    return (
      <button
      onClick={onClick}
      disabled={disabled}
      name={name}
      className={`button-dark ${buttonLoading ? "loading" : ""}`}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      {t(label)}
      {buttonLoading && <LoadingIcon />}
    </button>
    );
  }

  // Btn-Dark-Primary
  if (darkPrimary) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        name={name}
        className={`button-dark-primary ${buttonLoading ? "loading" : ""}`}
        data-testid={dataTestId}
        aria-label={ariaLabel}
      >
      {t(label)}
      {buttonLoading && <LoadingIcon />}
    </button>
    );
  }

  // Btn-Primary
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      name={name}
      className={`button-primary ${buttonLoading ? "loading" : ""}`}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      {t(label)}
      {buttonLoading && <LoadingIcon />}
    </button>
    // <Button
    //   variant={variant}
    //   size={sizeOfButton}
    //   onClick={onClick}
    //   disabled={disabled || buttonLoading}
    //   name={name}
    //   className={classNameForButton}
    //   data-testid={dataTestId}
    //   aria-label={ariaLabel}
    // >
    //   <div
    //     className={`d-inline-flex align-items-center ${
    //       buttonLoading ? "button-content" : ""
    //     }`}
    //   >
    //     {icon && <span className="me-2">{icon}</span>}
    //   </div>
    //   {t(label)}
    //   {buttonLoading && <span className="dotted-spinner"></span>}
    // </Button>
    
  );
};


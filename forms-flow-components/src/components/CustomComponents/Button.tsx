import { useRef, useEffect, useState, ReactElement } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import { ChevronIcon } from "../SvgIcons/index";

interface DropdownItem {
  label: string;
  onClick: () => void;
  dataTestid?: string;
  ariaLabel?: string;
}

interface CustomButtonProps {
  variant: string;
  size?: "sm" | "md" | "lg" ;
  label: string;
  name?: string,
  onClick?: () => void;
  isDropdown?: boolean;
  dropdownItems?: DropdownItem[];
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  dataTestid?: string;
  ariaLabel?: string;
  buttonLoading?: boolean;
}

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
  dataTestid = "",
  ariaLabel = "",
  name =  "",
  buttonLoading = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

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

  if (isDropdown) {
    return (
      <Dropdown
        as={ButtonGroup}
        className={className}
        onToggle={(isOpen) => setDropdownOpen(isOpen)}
      >
        <Button
          variant={variant}
          size={size!='md' ? size : undefined}
          disabled={disabled}
          ref={buttonRef}
          data-testid={dataTestid}
          aria-label={ariaLabel}
          name={name}
          className={`${size !== 'md' ? className : `btn-md ${className}`}`}
        >
          {label}
        </Button>

        <Dropdown.Toggle
          ref={toggleRef}
          split
          variant={variant}
          id="dropdown-split-basic"
          className={`default-arrow ${dropdownOpen ? "collapsed" : ""}`}
        >
          <ChevronIcon color="white" />
        </Dropdown.Toggle>

        <Dropdown.Menu style={menuStyle}>
          {dropdownItems.map((item, index) => (
            <Dropdown.Item
              key={index}
              onClick={item.onClick}
              data-testid={item.dataTestid}
              aria-label={item.ariaLabel}
            >
              {item.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  return (
    <Button
      variant={variant}
      size={size!='md' ? size : undefined}
      onClick={onClick}
      disabled={disabled || buttonLoading}
      name={name}
      className={`${size !== 'md' ? className : `btn-md ${className}`}`}
      data-testid={dataTestid}
      aria-label={ariaLabel}
    >
      <div
        className={`d-inline-flex align-items-center ${
          buttonLoading ? "button-content" : ""
        }`}
      >
        {icon && <span className="me-2">{icon}</span>}
        {label}
      </div>
      {buttonLoading && <span className="dotted-spinner"></span>}
    </Button>
  );
};


import { useRef, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import { ChevronIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";
import { StyleServices } from "@formsflow/service";
import { CustomSearch } from "./Search";

interface DropdownItem {
  content?: React.ReactNode;
  onClick: (type?: string) => void;
  type?: string;
  dataTestId?: string;
  ariaLabel?: string;
  className?: string;
}

interface ButtonDropdownProps {
  variant: string;
  size?: "sm" | "md" | "lg" ;
  defaultLabel: string;
  label: string;
  name?: string,
  className?: string;
  dropdownType: "DROPDOWN_ONLY" | "DROPDOWN_WITH_EXTRA_ACTION";
  dropdownItems?: DropdownItem[];
  onSearch?: (searchTerm: string) => void;
  extraActionIcon?: React.ReactNode;
  extraActionOnClick?:() => void; 
  dataTestId?: string;
  ariaLabel?: string; 
 }

export const ButtonDropdown: React.FC<ButtonDropdownProps> = ({
  dropdownType,
  variant,
  size,
  defaultLabel, 
  label,
  dropdownItems = [],
  onSearch,
  extraActionIcon = false,
  extraActionOnClick,
  className = "",
  dataTestId = "",
  ariaLabel = "",
  name =  "",
}) => {

  const buttonRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const { t } = useTranslation();
  const primaryBtnBgColor = StyleServices.getCSSVariable('--primary-btn-bg-color');
  const secondaryBtnBgColor = StyleServices.getCSSVariable('--secondary-btn-bg-color'); 
  const [search, setSearch] = useState("");

  const handleClearSearch = () => {
    setSearch("");
    onSearch?.("");
  }

  const handleSearch = () => {
    onSearch?.(search);
  };

  useEffect(()=>{
      if (onSearch) {
    onSearch(search);
  }
  },[search]);
    // Check if we should use the default label
  const isUsingDefaultLabel = !label || label === "";
  // Display label if provided, otherwise use defaultLabel
  const displayLabel = isUsingDefaultLabel ? defaultLabel : label;
  // Define the label style as a separate variable
  const labelStyle: React.CSSProperties = isUsingDefaultLabel 
    ? { fontStyle: 'italic' } 
    : {};
  const updateMenuStyle = () => {
    if (buttonRef.current && toggleRef.current) {
      const buttonWidth = buttonRef.current.getBoundingClientRect().width;
      const toggleWidth = toggleRef.current.getBoundingClientRect().width;
      const totalWidth = buttonWidth + toggleWidth - 1;
      setMenuStyle({
        width: `${totalWidth}px`,
        maxHeight: "480px",
        overflowY: "auto",
        border: "2px solid var(--primary-btn-bg-color)",
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
        className={`${className} custom-btn-width`}
        onToggle={(isOpen) => setDropdownOpen(isOpen)} 
        data-testid={`${dataTestId}-container`}
      >
        <div ref={buttonRef} className="label-extra-action">
        <Button
          variant={variant}
          size={size !== "md" ? size : undefined}
          data-testid={dataTestId}
          aria-label={ariaLabel}
          name={name}
          className="button-dropdown"
        >
         <span style={labelStyle}>
          {t(displayLabel)}
        </span>
        </Button>
        {dropdownType === "DROPDOWN_WITH_EXTRA_ACTION" && extraActionIcon && (
          <Button
            onClick={extraActionOnClick}
            className={`${extraActionClass} border-0`}
            style={{ backgroundColor }}
            data-testid={`${dataTestId}-extra-action`}
            aria-label={`${t(displayLabel)} extra action`}
          >
            {extraActionIcon}
          </Button>
        )}
        </div>
        <Dropdown.Toggle
          ref={toggleRef}
          split
          variant={variant}
          id="dropdown-split-basic"
          className={`default-arrow ${dropdownOpen ? "collapsed" : ""} button-dropdown-toggle`}
          data-testid={`${dataTestId}-toggle`}
          aria-label={`${t(displayLabel)} dropdown toggle`}
        >
          <ChevronIcon color="white" />
        </Dropdown.Toggle>

        <Dropdown.Menu style={menuStyle}>
        {onSearch && (<CustomSearch
          handleClearSearch={handleClearSearch}
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
          placeholder={t("Search")}
          title={t("Search")}
          dataTestId="search-filter"
        />)}
          {dropdownItems.map((item) => (
            <Dropdown.Item
              key={item.type}
              onClick={() => item.onClick(item.type)}
              data-testid={item.dataTestId}
              aria-label={item.ariaLabel}
              className={item.className}
            >
              {item.content}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }


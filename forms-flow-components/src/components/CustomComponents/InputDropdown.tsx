import React, { useState, useRef, useEffect } from 'react';
import { InputGroup } from 'react-bootstrap';
import ListGroup from 'react-bootstrap/ListGroup';
import { FormInput } from './FormInput';
import { CloseIcon , ChevronIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";
import { StyleServices } from "@formsflow/service";

interface DropdownItem {
  label: string;
  value?:string;
  onClick: () => void;
}
interface InputDropdownProps {
  Options: DropdownItem[];
  firstItemLabel?: string;
  dropdownLabel?: string;
  placeholder?: string;
  isAllowInput?: boolean;
  required?: boolean;
  selectedOption?: string; 
  feedback?: string;
  ariaLabelforDropdown?:string
  ariaLabelforInput?:string
  dataTestIdforInput?:string
  dataTestIdforDropdown?:string
  setNewInput? : (value: string) => void;
  isInvalid?: boolean;
  inputClassName?: string;
  onBlurDropDown?: () => void; 
  disabled?: boolean;
  variant?: 'assign-user-sm' | 'assign-user-md'; 
  handleCloseClick?: () => void;
  openByDefault?: boolean;
  id?: string;
}

export const InputDropdown: React.FC<InputDropdownProps> = ({
  Options = [],
  firstItemLabel,
  dropdownLabel,
  placeholder = '',
  isAllowInput =  false,
  required = false,
  selectedOption ,
  feedback,
  setNewInput = ()=>{},
  ariaLabelforDropdown,
  ariaLabelforInput,
  dataTestIdforDropdown,
  dataTestIdforInput,
  isInvalid,
  inputClassName='',
  onBlurDropDown,
  disabled = false,
  variant,
  handleCloseClick,
  openByDefault = false,
  id
}) => {
  const { t } = useTranslation();
  const primaryColor = StyleServices.getCSSVariable('--ff-primary');
  const disabledColor = StyleServices.getCSSVariable('--ff-gray-medium-dark');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(selectedOption || ''); 
  const [filteredItems, setFilteredItems] = useState<DropdownItem[]>([]);
  const [textBoxInput, setTextBoxInput] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if(!disabled) {
     setIsDropdownOpen((prev) => !prev);
    }
  };
  
  useEffect(() => {
    if (openByDefault) {
      setIsDropdownOpen(true);
    }
  }, [openByDefault]);

  // Handle clear input when using CloseIcon
  const handleClearInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCloseClick?.();
    setInputValue('');
    setNewInput('');
  };

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsDropdownOpen(false);
          }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [dropdownRef]);

  useEffect(() => {
    if (selectedOption) {
        const foundItem = Options.find((item) => item.value === selectedOption);
        setInputValue(foundItem ? foundItem.label : selectedOption);
      }
  }, [selectedOption,Options]);

  const handleInputDropdownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(disabled) return ;
      const value = e.target.value;
      setInputValue(value);
      if (value === '') {
        setNewInput('');
      }
      //filtering out items
      const filtered = Options.filter((item) =>
          item.label.toLowerCase().includes(value.toLowerCase()) || 
          item.value?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
  };

  const handleSelect = (item: DropdownItem) => {
      setInputValue(item.label);
      setNewInput(item.value);
      setIsDropdownOpen(false);
      if (item.onClick) {
          item.onClick(); 
      }
  };

  const onFirstItemClick = () => {
      setTextBoxInput(true);
      setInputValue('');
      setIsDropdownOpen(false);
  };

  const handleClose = () => {
      setTextBoxInput(false);
      setInputValue('');
      setIsDropdownOpen(true);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setNewInput(e.target.value);
    setInputValue(e.target.value);
  }
  let variantClass = '';

  if (variant === 'assign-user-sm') {
    variantClass = 'assign-user-sm-width';
  } else if (variant === 'assign-user-md') {
    variantClass = 'assign-user-md-width';
  }

  // Determine which icon to show based on variant and inputValue
  const renderIcon = () => {
    // Only show CloseIcon when variant is present AND inputValue exists
    if (variant && inputValue) {
    return <CloseIcon 
            onClick={handleClearInput} 
            color={disabled ? disabledColor : primaryColor} 
            data-testid="clear-input" 
            aria-label="Clear input"
            width={9}
            height={9}
            />;
    } else {
    // Default to ChevronIcon in all other cases
    return <ChevronIcon 
            className={disabled ? "svgIcon-disabled" : "svgIcon-primary"} 
            data-testid="dropdown-input" 
            aria-label="dropdown input"
            />;
    }};

      // Check if an item is the currently selected one
  const isItemSelected = (item: DropdownItem) => {
    return item.label === inputValue || item.value === selectedOption;
  };

  return (
      <div className="input-select" ref={dropdownRef}>
          {textBoxInput ? (
              <InputGroup ref={dropdownRef}>
                  <FormInput
                      autoFocusInput
                      value={inputValue}
                      onChange={handleInputChange}
                      ariaLabel={ariaLabelforInput}
                     dataTestId={dataTestIdforInput}
                      isInvalid={isInvalid}
                      icon={<CloseIcon onClick={handleClose} color={primaryColor} data-testid="close-input" aria-label="Close input "/>} 
                      className="input-with-close"
                      label={t(dropdownLabel)}
                      feedback={t(feedback)}
                      variant={variant}
                      id={id}
                  />
              </InputGroup>
          ) : (
            <FormInput
                placeholder={t(placeholder)}
                value={inputValue}
                onChange={handleInputDropdownChange}
                onClick={toggleDropdown}
                ariaLabel={ariaLabelforDropdown}
                dataTestId={dataTestIdforDropdown}
                icon={renderIcon()}
                className={`${inputClassName} ${isDropdownOpen && 'border-input collapsed'} ${disabled && 'disabled-inpudropdown'}`}
                onIconClick={toggleDropdown}
                label={t(dropdownLabel)}
                required={required}
                onBlur={onBlurDropDown}
                isInvalid={!(isDropdownOpen || selectedOption) && isInvalid}
                feedback={t(feedback)}
                id={id}
                variant={variant}
            />
          )}

          {!textBoxInput && isDropdownOpen && !disabled && (
              <div className="select-options">
                  {isAllowInput && (
                      <ListGroup.Item
                          onClick={onFirstItemClick}
                          className="list-first-item-btn"
                          data-testid="list-first-item"
                      >
                          {t(firstItemLabel)}
                      </ListGroup.Item>
                  )}
                  {(filteredItems.length > 0 ? filteredItems : Options).map((item, index) => (
                      <ListGroup.Item
                          key={index}
                          onClick={() => handleSelect(item)}
                          data-testid={`list-${index}-item`}
                          aria-label={`list-${item.label}-item`}
                          className={`${isItemSelected(item) ? 'chosen' : ''}`}
                      >
                          {t(item.label)}
                      </ListGroup.Item>
                  ))}
              </div>
          )}
      </div>
  );
};



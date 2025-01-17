import React, { useState, useRef, useEffect } from 'react';
import { InputGroup } from 'react-bootstrap';
import ListGroup from 'react-bootstrap/ListGroup';
import { FormInput } from './FormInput';
import { CloseIcon , ChevronIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";
import { StyleServices } from "@formsflow/service";

interface DropdownItem {
  label: string;
  onClick: () => void;
}
interface InputDropdownProps {
  Options: DropdownItem[];
  firstItemLabel: string;
  dropdownLabel: string;
  placeholder?: string;
  isAllowInput: boolean;
  required?: boolean;
  value?: string;
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
}

export const InputDropdown: React.FC<InputDropdownProps> = ({
  Options = [],
  firstItemLabel,
  dropdownLabel,
  placeholder = '',
  isAllowInput,
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
  onBlurDropDown
}) => {
  const { t } = useTranslation();
  const primaryColor = StyleServices.getCSSVariable('primary');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(selectedOption || ''); 
  const [filteredItems, setFilteredItems] = useState<DropdownItem[]>([]);
  const [textBoxInput, setTextBoxInput] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
      setIsDropdownOpen((prev) => !prev);
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
        setInputValue(selectedOption);
      }
  }, [selectedOption]);

  const handleInputDropdownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      if (value === '') {
        setNewInput('');
      }
      //filtering out items
      const filtered = Options.filter((item) =>
          item.label.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
  };

  const handleSelect = (item: DropdownItem) => {
      setInputValue(item.label);
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
  return (
      <div ref={dropdownRef} className="input-dropdown w-100">
          {textBoxInput ? (
              <InputGroup>
                  <FormInput
                      autoFocusInput
                      value={inputValue}
                      onChange={handleInputChange}
                      ariaLabel={ariaLabelforInput}
                      dataTestid={dataTestIdforInput}
                      isInvalid={isInvalid}
                      icon={<CloseIcon onClick={handleClose} color={primaryColor} data-testid="close-input" aria-label="Close input "/>} 
                      className="input-with-close"
                      label={t(dropdownLabel)}
                      feedback={t(feedback)}
                  />
              </InputGroup>
          ) : (
              <InputGroup>
                  <FormInput
                      placeholder={t(placeholder)}
                      value={inputValue}
                      onChange={handleInputDropdownChange}
                      onClick={toggleDropdown}
                      ariaLabel={ariaLabelforDropdown}
                      dataTestid={dataTestIdforDropdown}
                      icon={<ChevronIcon data-testid="dropdown-input" aria-label="dropdown input"/>}
                      className={`${inputClassName} ${isDropdownOpen ? 'border-input collapsed' : ''}`}
                      onIconClick={toggleDropdown}
                      label={t(dropdownLabel)}
                      required={required}
                      onBlur={onBlurDropDown}
                      isInvalid={!(isDropdownOpen || selectedOption) && isInvalid}
                      feedback={t(feedback)}
                  />
              </InputGroup>
          )}

          {!textBoxInput && isDropdownOpen && (
              <ListGroup>
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
                      >
                          {t(item.label)}
                      </ListGroup.Item>
                  ))}
              </ListGroup>
          )}
      </div>
  );
};



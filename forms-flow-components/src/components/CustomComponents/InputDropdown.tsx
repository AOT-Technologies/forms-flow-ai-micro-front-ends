import React, { useState, useRef, useEffect } from 'react';
import { InputGroup } from 'react-bootstrap';
import ListGroup from 'react-bootstrap/ListGroup';
import { FormInput } from './FormInput';
import { CloseIcon , ChevronIcon } from "../SvgIcons/index";


  
interface InputDropdownProps {
  dropDownItems: string[];
  firstItemLabel: string;
  dropdownLabel: string;
  placeholder?: string;
  isAllowInput: boolean;
}

export  const InputDropdown: React.FC<InputDropdownProps> = ({
  dropDownItems=[],
  firstItemLabel,
  dropdownLabel,
  placeholder = '',
  isAllowInput,
}) => {
  const [selectedItem, setSelectedItem] = useState<string | undefined>(undefined);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(selectedItem || '');
  const [filteredItems, setFilteredItems] = useState<string[]>([]);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const filtered = dropDownItems.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const handleSelect = (item: string) => {
    setSelectedItem(item);
    setInputValue(item);
    setIsDropdownOpen(false);
  };

  const onFirstItemClick = () => {
    setTextBoxInput(true);
    setInputValue('');
    setSelectedItem(undefined);
    setIsDropdownOpen(false);
  };

  const handleClose = () => {
    setTextBoxInput(false);
    setInputValue('');
    setIsDropdownOpen(true);
  };

  return (
    <div ref={dropdownRef} className="input-dropdown">
      {textBoxInput ? (
        <InputGroup>
          <FormInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label="category input"
            icon={<CloseIcon  onClick={handleClose}/>} 
            className="input-with-close"
            label={dropdownLabel}
          />
        </InputGroup>
      ) : (
        <InputGroup>
          <FormInput
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onClick={toggleDropdown}
            aria-label="Dropdown input"
            icon={<ChevronIcon />}
            className={`${isDropdownOpen ? 'border-input collapsed' : ''}`}
            onIconClick={toggleDropdown}
            label={dropdownLabel}
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
              {firstItemLabel}
            </ListGroup.Item>
          )}
          {(filteredItems.length > 0 ? filteredItems : dropDownItems).map((item, index) => (
            <ListGroup.Item
              key={index}
              onClick={() => handleSelect(item)}
              data-testid={`list-${item}-item`}
              aria-label={`list-${item}-item`}
            >
              {item}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};


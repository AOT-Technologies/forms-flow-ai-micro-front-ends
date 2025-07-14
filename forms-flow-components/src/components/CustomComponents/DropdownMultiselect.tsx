import React from 'react';
import { InputDropdown } from './InputDropdown';
import { MultipleSelect } from './MultiSelect';

interface DropdownMultiselectProps {
  dropdownLabel: string; 
  onDropdownChange?: (value: any) => void; // Callback when dropdown changes
  onMultiSelectionChange?: (values: any[]) => void; // Callback when multi-selection changes
  multiSelectPillClassName?: string;
  disabled?: boolean;
  enableMultiSelect?:boolean;
  inputDropDownSelectedValue?:string;
  multiSelectOptions?: Array<any>;
  multiSelectedValues?: Array<any>;
  inputDropDownOptions?: Array<any>;
  displayValue?:string;
  ariaLabel?:string;
  dataTestId?:string;
  placeholder?:string;
  className?:string;
  id?:string;
}

export const DropdownMultiSelect: React.FC<DropdownMultiselectProps> = ({
  dropdownLabel,
  inputDropDownOptions = [],
  multiSelectOptions = [],
  inputDropDownSelectedValue,
  multiSelectedValues = [],
  onDropdownChange = ()=>{},
  onMultiSelectionChange,
  multiSelectPillClassName,
  disabled = false,
  enableMultiSelect,
  displayValue,
  ariaLabel,
  dataTestId,
  placeholder,
  id,
  className
}) => { 
  return (
    <div className="dropdown-multiselect-component">
      <div className='dropdown-input'>
      <InputDropdown
        Options={inputDropDownOptions}
        dropdownLabel={dropdownLabel}
        selectedOption={inputDropDownSelectedValue}
        setNewInput={(value) => {
          onDropdownChange(value);
        }}
        ariaLabelforDropdown={`${ariaLabel}-dropdown-label`}
        ariaLabelforInput={`${ariaLabel}-input-dropdown`}
        dataTestIdforDropdown={`${dataTestId}-dropdown-component`}
        dataTestIdforInput={`${dataTestId}-dropdown-input`}
        disabled={disabled}
        placeholder={placeholder}
        id={id}
        className={` ${className ? className : ''} `} 
      />
      </div>
            
      {enableMultiSelect && (
        <div className='d-flex'>
        <div className='L-style'></div>
        <MultipleSelect
          options={multiSelectOptions}
          selectedValues={multiSelectedValues}
          onSelect={onMultiSelectionChange}
          onRemove={onMultiSelectionChange}
          avoidHighlightFirstOption={true}
          disabled={disabled}
          className={`dropdown-multi ${multiSelectPillClassName}`}
          displayValue = {displayValue}
          placeholder={placeholder}
        />
        </div>
      )}
    </div>
  );
};

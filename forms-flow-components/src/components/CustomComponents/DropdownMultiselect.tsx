import React from 'react';
import { SelectDropdown } from './SelectDropdown';
import { MultipleSelect } from './MultiSelect';
import { VerticalLineIcon } from '../SvgIcons';

/**
 * Interface defining the props for the DropdownMultiSelect component
 * This component combines a single-select dropdown with an optional multi-select component
 */
interface DropdownMultiselectProps {
  /** Label text for the dropdown component */
  dropdownLabel: string; 
  /** Callback function triggered when the dropdown selection changes */
  onDropdownChange?: (value: string | number) => void; 
  /** Callback function triggered when multi-select values change */
  onMultiSelectionChange?: (values: any[]) => void; 
  /** Additional CSS class name for multi-select pills */
  multiSelectPillClassName?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to enable the multi-select functionality */
  enableMultiSelect?:boolean;
  /** Currently selected value for the dropdown */
  value?: string | number; 
  /** Default value for the dropdown */
  defaultValue?: string | number; 
  /** Array of options for the multi-select component */
  multiSelectOptions?: Array<any>;
  /** Array of currently selected values in the multi-select */
  multiSelectedValues?: Array<any>;
  /** Array of options for the dropdown */
  options?: Array<any>; 
  /** Property name to display from the option objects */
  displayValue?:string;
  /** Accessibility label for screen readers */
  ariaLabel?:string;
  /** Data test ID for testing purposes */
  dataTestId?:string;
  /** Placeholder text for the multi-select */
  placeholder?:string;
  /** Additional CSS class names */
  className?:string;
  /** Unique identifier for the component */
  id?:string;
  /** Visual variant of the component ('primary' or 'secondary') */
  variant?: 'primary' | 'secondary'; 
}

export const DropdownMultiSelect: React.FC<DropdownMultiselectProps> = ({
  dropdownLabel,
  options = [],
  multiSelectOptions = [],
  value,
  defaultValue,
  multiSelectedValues = [],
  onDropdownChange = ()=>{},
  onMultiSelectionChange,
  multiSelectPillClassName="",
  disabled = false,
  enableMultiSelect,
  displayValue,
  ariaLabel,
  dataTestId,
  placeholder,
  id,
  className,
  variant = 'primary'
}) => { 
  return (
    <div className={`dropdown-multiselect-component ${className}`}>
      {/* Conditionally rendered label */}
      {dropdownLabel && <label className="dropdown-label">{dropdownLabel}</label>}
      {/* Single-select dropdown section */}
      <div className='dropdown-input' >
        <SelectDropdown
          options={options}
          value={value}
          defaultValue={defaultValue}
          onChange={(selectedValue) => {
            onDropdownChange(selectedValue);
          }}
          disabled={disabled}
          ariaLabel={`${ariaLabel}-dropdown`}
          dataTestId={`${dataTestId}-dropdown`}
          id={id}
        />
      </div>
            
      {/* Conditionally rendered multi-select section */}
      {enableMultiSelect && (
        <div className='d-flex'>
          {/* Visual separator between dropdown and multi-select */}
          <VerticalLineIcon className='vertical-line-icon' />
          
          {/* Multi-select component */}
          <MultipleSelect
            options={multiSelectOptions}
            selectedValues={multiSelectedValues}
            onSelect={onMultiSelectionChange}
            onRemove={onMultiSelectionChange}
            avoidHighlightFirstOption={true}
            disabled={disabled}
            className={`dropdown-multi ms-3 ${multiSelectPillClassName}`}
            displayValue = {displayValue}
            placeholder={placeholder}
            variant={variant}
          />
        </div>
      )}
    </div>
  );
};

import React, { useState,useRef,useEffect } from "react";
import Multiselect from 'multiselect-react-dropdown';
import { CloseIcon } from "../SvgIcons/index";
import { StyleServices } from "@formsflow/service";


interface MultiSelectInterface {
  options: Array<any>; 
  selectedValues?: Array<any>; 
  onSelect?: (selected: any) => void; 
  onRemove?: (removed: any) => void; 
  displayValue?: string;  
  avoidHighlightFirstOption?: boolean;  
  hidePlaceholder?:boolean;
  className?:string;
  disabled?:boolean;
  placeholder?:string;
  label?:string;
}

export const MultipleSelect: React.FC<MultiSelectInterface> = ({
    options = [],
    selectedValues = [],
    onSelect = ()=> {},
    onRemove = ()=> {},
    displayValue= "",
    avoidHighlightFirstOption = true,
    hidePlaceholder=true,
    className,
    disabled=false,
    placeholder="",
    label

})=>{
   const primaryColor = StyleServices.getCSSVariable('--ff-primary');
   const dropdownRef = useRef<HTMLDivElement | null>(null);
   const [isOpen,setIsOpen] = useState(false);
     // Toggle dropdown open/close when clicked
  const handleClick = (e: MouseEvent) => {
    if (
      dropdownRef.current &&
      dropdownRef.current.contains(e.target as Node) &&
      !disabled
    ) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);
   
  return (
      <div className={`multiselect-container ${className}`} ref={dropdownRef}>
       {label && <label className="multiple-select-label">{label}</label>}
        <Multiselect
          options={options}
          selectedValues={selectedValues}
          className={`${isOpen && "open-dropdown"}`}
          onSelect={onSelect}
          onRemove={onRemove}
          displayValue={displayValue}
          avoidHighlightFirstOption={avoidHighlightFirstOption}
          hidePlaceholder={hidePlaceholder}
          disable={disabled}
          placeholder={placeholder}
          customCloseIcon={
            <CloseIcon
              onClick={onRemove}
              color={disabled ? `#AFB4B6`: primaryColor}
              data-testid="pill-remove-icon"
              aria-label="remove "
            />
          }
        />
      </div>
    );
}
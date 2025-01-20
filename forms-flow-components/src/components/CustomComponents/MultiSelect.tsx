import React from "react";
import Multiselect from 'multiselect-react-dropdown';


interface MultiSelectInterface {
  options: Array<any>; 
  selectedValues?: Array<any>; 
  onSelect?: (selected: any) => void; 
  onRemove?: (removed: any) => void; 
  displayValue?: string;  
  avoidHighlightFirstOption?: boolean;  
}

export const MultipleSelect: React.FC<MultiSelectInterface> = ({
    options = [],
    selectedValues = [],
    onSelect = ()=> {},
    onRemove = ()=> {},
    displayValue= "",
    avoidHighlightFirstOption = true

})=>{
    return <Multiselect
    options={options}  
    selectedValues={selectedValues} 
    onSelect={onSelect}  
    onRemove={onRemove}  
    displayValue={displayValue}
    avoidHighlightFirstOption={avoidHighlightFirstOption}
    />
}
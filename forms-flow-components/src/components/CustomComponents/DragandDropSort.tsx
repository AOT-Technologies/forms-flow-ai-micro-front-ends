import React, { useState, useEffect } from "react";
    import { FormVariableIcon,DraggableIcon } from "../SvgIcons/index";

interface FilterItem {
  label: string;
  name: string;
  isChecked: boolean;
  sortOrder: number;
  isTaskVariable: boolean;
}

interface DragAndDropFilterProps {
  items: FilterItem[];
  onUpdate: (updatedItems: FilterItem[]) => void;
}

export const DragandDropSort: React.FC<DragAndDropFilterProps> = ({ items, onUpdate }) => {

  const computedStyle = getComputedStyle(document.documentElement);
  const darkColor = computedStyle.getPropertyValue("--ff-gray-darkest");
  const [filterItems, setFilterItems] = useState<FilterItem[]>(items);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    onUpdate(filterItems);
  }, [filterItems, onUpdate]);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    e.dataTransfer.setData("drag-index", index.toString());
    setDraggingIndex(index);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };


  const onDragEnter = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === targetIndex) return;
    
    setFilterItems((prevItems) => {
      const updatedItems = [...prevItems];
      const [draggedItem] = updatedItems.splice(draggingIndex, 1);
      updatedItems.splice(targetIndex, 0, draggedItem);
      return updatedItems.map((item, index) => ({ ...item, sortOrder: index + 1,  isMoving: true, }));
    });
    setDraggingIndex(targetIndex);  
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingIndex(null);
  };

  const onDragEnd = () => {
    setDraggingIndex(null);
  }; 
  
  const onCheckboxChange = (index: number) => {
    setFilterItems((prevItems) =>
      prevItems.map((item, i) =>
        i === index ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };
  return (
    <div className="drag-drop-container">
      {filterItems.map((item, index) => (
        <div
          key={item.name}
          className={`draggable-item ${draggingIndex === index ? "dragging" : ""} `}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnter={(e) => onDragEnter(e, index)}
          onDragEnd={onDragEnd}
        >
          <div 
          draggable 
          className="draggable-icon"
          onDragStart={(e) => onDragStart(e, index)}
          >
            <DraggableIcon />
          </div>
          <div className="checkbox-container">
          <input 
          type="checkbox" 
          className="form-check-input" 
          checked={item.isChecked} 
          onChange={() => onCheckboxChange(index)}
           />
          </div>
          {item.label}
          <div className="dotted-line"></div>
            {item.isTaskVariable && (
              <FormVariableIcon color={darkColor} />
            ) }
        </div>
      ))}
    </div>
  );
};


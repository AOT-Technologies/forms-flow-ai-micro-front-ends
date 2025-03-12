import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FormVariableIcon,DraggableIcon } from "../SvgIcons/index";
import { CustomButton } from "./Button";

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
  const { t } = useTranslation();
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

  const onRemove = (indexToRemove: number) => {
    setFilterItems((prevItems) => prevItems.filter((_, index) => index !== indexToRemove)
      .map((item, index) => ({ ...item, sortOrder: index + 1 })));
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
          draggable
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnter={(e) => onDragEnter(e, index)}
          onDragStart={(e) => onDragStart(e, index)}
          onDragEnd={onDragEnd}
        >
          <span className="draggable-icon">
            <DraggableIcon />
          </span>
          <input 
          type="checkbox" 
          className="form-check-input" 
          checked={item.isChecked} 
          onChange={() => onCheckboxChange(index)}
           />
          <span>{item.label}</span>
          <div className="dotted-line"></div>
          <div className="icon-btn-container">
            {item.isTaskVariable ? (
              <FormVariableIcon />
            ) : (
              <div className="hover-buttons">
                <CustomButton
                  variant="secondary"
                  size="sm"
                  label={t("Edit")}
                  dataTestId="Edit-button"
                  ariaLabel="Edit Button"
                  onClick={() => console.log("Edit", item)}
                />
                <CustomButton
                  variant="secondary"
                  size="sm"
                  label={t("Remove")}
                  dataTestId="Remove-button"
                  ariaLabel="Remove Button"
                  onClick={() => onRemove(index)}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};


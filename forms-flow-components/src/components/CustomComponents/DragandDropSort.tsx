import React, { useState, useEffect ,useRef} from "react";
import { FormVariableIcon, DraggableIcon } from "../SvgIcons/index";
import { StyleServices } from "@formsflow/service";

interface FilterItem {
  label?: string;
  name: string;
  isChecked?: boolean;
  sortOrder?: number;
  isFormVariable?: boolean;
  itemId?:number;
  icon?:React.ReactNode;
}

interface DragAndDropFilterProps {
  items: FilterItem[];
  onUpdate?: (updatedItems: FilterItem[]) => void;
  icon?:React.ReactNode;
  preventLastCheck?:boolean
}

export const DragandDropSort: React.FC<DragAndDropFilterProps> = ({ items, onUpdate, icon, preventLastCheck = false }) => {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [filterItems, setFilterItems] = useState<FilterItem[]>(items);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
 
  useEffect(() => {
    if (onUpdate) {
      onUpdate(filterItems);
    }
  }, [filterItems, onUpdate]);

  useEffect(() => {
  // Only update items that are missing sortOrder
  const needsUpdate = filterItems.some(item => item.sortOrder == null);
  if (!needsUpdate) return;

  const updatedItems = filterItems.map((item, index) => ({
    ...item,
    sortOrder: item.sortOrder ?? index,
  }));

  setFilterItems(updatedItems);
}, []);

  const onDragStart = (e: React.DragEvent<HTMLSpanElement>, index: number) => {
    e.stopPropagation();
    e.dataTransfer.setData("drag-index", index.toString());
    setDraggingIndex(index);
  };

  const onDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
  
    const bounding = container.getBoundingClientRect();
    const offset = 40; 
    const scrollSpeed = 5; //scroll speed  can be adjusted here
  
    if (e.clientY < bounding.top + offset) {
      // scroll up
      container.scrollTop -= scrollSpeed;
    } else if (e.clientY > bounding.bottom - offset) {
      // scroll down
      container.scrollTop += scrollSpeed;
    }
  };


  const onDragEnter = (e: React.DragEvent<HTMLLIElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === targetIndex) return;
    
    setFilterItems((prevItems) => {
      const updatedItems = [...prevItems];
      const [draggedItem] = updatedItems.splice(draggingIndex, 1);
      updatedItems.splice(targetIndex, 0, draggedItem);
      return updatedItems.map((item, index) => ({ ...item, sortOrder: index + 1}));
    });
    setDraggingIndex(targetIndex);  
  };

  const onDrop = (e: React.DragEvent<HTMLLIElement>) => {
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

  const onLabelClick = (index: number) => {
    onCheckboxChange(index);
  };

  return (
    <div className="drag-drop-container" ref={containerRef}>
      <ul>
        {filterItems.map((item, index) => (
          <li
            key={item.itemId ?? `${item.name}-${index}`}
            className={`draggable-item ${draggingIndex === index ? "dragging" : ""}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnter={(e) => onDragEnter(e, index)}
            onDragEnd={onDragEnd}
          >
            <button
              className="draggable-icon drag-as-div"
              draggable
              onDragStart={(e) => onDragStart(e, index)}
            >
              <DraggableIcon />
            </button>
            

            <div className="checkbox-container">
              <input
                data-testid={`${item.name}-checkbox`}
                type="checkbox"
                className="form-check-input"
                checked={item.isChecked}
                onChange={() => onCheckboxChange(index)}
                disabled={preventLastCheck && item.isChecked && filterItems.filter(i => i.isChecked).length === 1}
              />
            </div>

            <button className="label cursor-pointer drag-as-div" onClick={() => onLabelClick(index)}>
              {item.label ?? item.name}
            </button>

            <div className="dotted-line"></div>

            {item.isFormVariable && icon }{item.icon}
          </li>
        ))}
      </ul>
    </div>
  );
};

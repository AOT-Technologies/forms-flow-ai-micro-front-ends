import React, { useState, useEffect ,useRef} from "react";
import { DraggableIcon, CheckboxCheckedIcon, CheckboxUncheckedIcon } from "../SvgIcons/index";
import Sortable from "sortablejs";

interface FilterItem {
  id:  number;
  label?: string;
  name: string;
  isChecked?: boolean;
  sortOrder?: number;
  isFormVariable?: boolean;
  icon?: React.ReactNode;
}

interface DragAndDropFilterProps {
  items: FilterItem[];
  onUpdate?: (updatedItems: FilterItem[]) => void;
  icon?: React.ReactNode;
  preventLastCheck?: boolean;
}

export const DragandDropSort: React.FC<DragAndDropFilterProps> = ({
  items,
  onUpdate,
  icon,
  preventLastCheck = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [filterItems, setFilterItems] = useState<FilterItem[]>(items);

  useEffect(() => {
    const needsUpdate = filterItems.some((item) => item.sortOrder == null);
    if (needsUpdate) {
      const updatedItems = filterItems.map((item, index) => ({
        ...item,
        sortOrder: item.sortOrder ?? index,
      }));
      setFilterItems(updatedItems);
    }
  }, []);

  useEffect(() => {
    if (onUpdate) {
      onUpdate(filterItems);
    }
  }, [filterItems, onUpdate]);

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  const container = containerRef.current;
  if (!container) return;

  const bounding = container.getBoundingClientRect();
  const offset = 40; 
  const jumpDistance = 0; // Sudden scroll amount

  if (e.clientY < bounding.top + offset) { 
    container.scrollTop -= jumpDistance;
  } else if (e.clientY > bounding.bottom - offset) { 
    container.scrollTop += jumpDistance;
  }
};

useEffect(() => {
  if (!listRef.current) return;

  const sortable = Sortable.create(listRef.current, {
    animation: 200,               // Smooth animation duration
    handle: ".draggable-icon",   // Only drag from icon
    ghostClass: "dragging", // Optional ghost class for visual feedback
 
    onEnd: (evt) => {
      if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
      if (evt.oldIndex === evt.newIndex) return;

      const updatedItems = [...filterItems];
      const [movedItem] = updatedItems.splice(evt.oldIndex, 1);
      updatedItems.splice(evt.newIndex, 0, movedItem);

      const reordered = updatedItems.map((item, index) => ({
        ...item,
        sortOrder: index + 1,
      }));

      setFilterItems(reordered);
    },
  });
   
    const currentList = listRef.current;
    currentList?.addEventListener("dragover", handleDragOver);

  return () => {
    sortable.destroy();
    currentList?.removeEventListener("dragover", handleDragOver);
  };
}, [filterItems]);

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
    <div className="drag-drop-container list-action rearrangable checkbox" ref={containerRef}>
      <ul  ref={listRef}>
        {filterItems.map((item, index) => (
          <li key={item.id ?? `${item.name}-${index}`}
            className="draggable-item"
          >

            <button
              className="draggable-icon"
              draggable
            >
              <DraggableIcon />
            </button>

            <label htmlFor={`${item.id ?? item.name}-checkbox-id`} className="input-checkbox">
              <input
                id={`${item.id ?? item.name}-checkbox-id`}
                type="checkbox"
                checked={item.isChecked}
                onChange={() => onCheckboxChange(index)}
                disabled={preventLastCheck && item.isChecked && filterItems.filter(i => i.isChecked).length === 1}
                data-testid={`${item.name}-checkbox`}
                />
              <span>{item.label ?? item.name}</span>
              {item.isChecked ? <CheckboxCheckedIcon /> : <CheckboxUncheckedIcon /> }
            </label>
            
            <div className="dotted-line"></div>

            {item.isFormVariable && icon}
            {item.icon}
          </li>
        ))}
      </ul>
    </div>
  );
};

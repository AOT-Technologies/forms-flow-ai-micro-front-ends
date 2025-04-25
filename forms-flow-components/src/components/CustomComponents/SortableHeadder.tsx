import React from "react";
import { useTranslation } from "react-i18next";
import { SortIcon } from "../SvgIcons";
import { StyleServices } from "@formsflow/service";

interface SortState {
    activeKey: string;
    sortColumns: { [key: string]: { sortOrder: "asc" | "desc" } };
  }
  
interface SortableHeaderProps {
  columnKey: string;
  title: string;
  currentSort: SortState;
  handleSort: (key: string) => void;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  columnKey,
  title,
  currentSort,
  handleSort,
  className = "",
}) => {
  const { t } = useTranslation();
  const sortedOrder = currentSort[columnKey]?.sortOrder;
  const isSorted = currentSort.activeKey === columnKey;
  const iconColor = isSorted
    ? StyleServices.getCSSVariable("--ff-primary")
    : StyleServices.getCSSVariable("--ff-gray-medium-dark");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter") {
      handleSort(columnKey);
    }
  };

  return (
    <button
      className={`button-as-div ${className}`}
      onClick={() => handleSort(columnKey)}
      onKeyDown={handleKeyDown}
      aria-pressed={isSorted}
      data-testid={`${title}-header-btn`}
      aria-label={`${title}-header-btn`}
    >
      <span className="mt-1">{t(title)}</span>
      <span className={sortedOrder === "asc" ? "arrow-up" : "arrow-down"}>
        <SortIcon color={iconColor} />
      </span>
    </button>
  );
};

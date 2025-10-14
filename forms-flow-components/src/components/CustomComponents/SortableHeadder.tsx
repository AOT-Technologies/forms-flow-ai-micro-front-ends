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
      onClick={() => handleSort(columnKey)}
      onKeyDown={handleKeyDown}
      aria-pressed={isSorted}
      data-testid={`${title}-header-btn`}
      aria-label={`${title}-header-btn`}
    >
      <span className="text">{t(title)}</span>
      <span className={sortedOrder === "desc" ? "arrow-down" : "arrow-up"}>
        <SortIcon color={iconColor} dataTestId="sort" />
      </span>
    </button>
  );
};

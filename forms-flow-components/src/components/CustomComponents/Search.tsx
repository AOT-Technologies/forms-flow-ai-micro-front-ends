import React, { FC } from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for `CustomSearch` component.
 * Simple, accessible search input with integrated search button.
 */
export interface CustomSearchProps {
  /** Current search input value */
  search: string;
  /** Callback to update the search value */
  setSearch: (value: string) => void;
  /** Callback triggered on search submission (e.g., Enter key or button click) */
  handleSearch: () => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Test ID for automated testing */
  dataTestId: string;
  /** Disables the search input and button */
  disabled?: boolean;
  /** Optional width for the search input (CSS value) */
  width?: string;
}

/**
 * CustomSearch: Simple, accessible search input with integrated search functionality.
 *
 * Usage:
 * <CustomSearch
 *   search={searchValue}
 *   setSearch={setSearchValue}
 *   handleSearch={performSearch}
 *   placeholder="Search items..."
 *   dataTestId="main-search"
 *   disabled={false}
 *   width="300px"
 * />
 */
export const CustomSearch: FC<CustomSearchProps> = ({
  search,
  setSearch,
  handleSearch,
  placeholder = "Search",
  dataTestId,
  disabled = false,
  width,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="search-input-container"
      {...(width ? { style: { width } } : {})}
    >
      <input
        className="search-input"
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder={t(placeholder)}
        data-testid={dataTestId}
        aria-label={placeholder}
        value={search}
        role="searchbox"
        disabled={disabled}
      />
    </div>
  );
};

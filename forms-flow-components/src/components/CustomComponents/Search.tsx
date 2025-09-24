import React, { FC } from "react";
import { useTranslation } from "react-i18next";

interface CustomSearchProps {
  search: string;
  setSearch: (value: string) => void;
  handleSearch: () => void;
  placeholder?: string;
  dataTestId: string;
  disabled?: boolean;
}

export const CustomSearch: FC<CustomSearchProps> = ({
  search,
  setSearch,
  handleSearch,
  placeholder = "Search",
  dataTestId,
  disabled = false,
}) => {
  const { t } = useTranslation();
  return (
    <div className="search-input-container">
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

import React from "react";
import { useTranslation } from "react-i18next";
import { CustomButton } from "./Button";
import { FilterIcon, RefreshIcon } from "../SvgIcons";
import { SortModal } from "./SortModal";

interface SortOption {
  value: string;
  label: string;
}

interface FilterSortActionsProps {
  showSortModal: boolean;
  handleFilterIconClick: () => void;
  handleRefresh: () => void;
  handleSortModalClose: () => void;
  handleSortApply: () => void;
  defaultSortOption: string;
  defaultSortOrder: string;
  optionSortBy: SortOption[];
  filterDataTestId: string;
  filterAriaLabel: string;
  refreshDataTestId: string;
  refreshAriaLabel: string;
}

export const FilterSortActions: React.FC<FilterSortActionsProps> = React.memo(
  ({
    showSortModal,
    handleFilterIconClick,
    handleRefresh,
    handleSortModalClose,
    handleSortApply,
    defaultSortOption,
    defaultSortOrder,
    optionSortBy,
    filterDataTestId,
    filterAriaLabel,
    refreshDataTestId,
    refreshAriaLabel,
  }) => {
    const { t } = useTranslation();

    return (
      <>
        <CustomButton
          label=""
          variant="outline-secondary"
          icon={<FilterIcon />}
          iconOnly={true}
          onClick={handleFilterIconClick}
          dataTestId={filterDataTestId}
          ariaLabel={filterAriaLabel}
        />

        <CustomButton
          label=""
          variant="outline-secondary"
          icon={<RefreshIcon />}
          iconOnly={true}
          onClick={handleRefresh}
          dataTestId={refreshDataTestId}
          ariaLabel={refreshAriaLabel}
        />

        {showSortModal && (
          <SortModal
            firstItemLabel={t("Sort By")}
            secondItemLabel={t("In a")}
            showSortModal={showSortModal}
            onClose={handleSortModalClose}
            primaryBtnAction={handleSortApply}
            modalHeader={t("Sort")}
            primaryBtnLabel={t("Sort Results")}
            secondaryBtnLabel={t("Cancel")}
            optionSortBy={optionSortBy}
            optionSortOrder={[
              { value: "asc", label: t("Ascending") },
              { value: "desc", label: t("Descending") },
            ]}
            defaultSortOption={defaultSortOption}
            defaultSortOrder={defaultSortOrder}
            primaryBtndataTestid="apply-sort-button"
            secondaryBtndataTestid="cancel-sort-button"
            primaryBtnariaLabel={t("Apply sorting")}
            secondaryBtnariaLabel={t("Cancel sorting")}
            closedataTestid="close-sort-modal"
          />
        )}
      </>
    );
  }
);

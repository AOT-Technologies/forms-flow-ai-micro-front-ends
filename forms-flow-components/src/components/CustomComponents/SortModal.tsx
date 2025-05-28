import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";
import { CloseIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";
import { InputDropdown } from "./InputDropdown";

interface SortModalProps {
  showSortModal: boolean;
  onClose?: () => void;
  primaryBtnAction?: (selectedOption: string, order: string) => void;
  secondaryBtnAction?: () => void;
  modalHeader?: string;
  primaryBtnLabel?: string;
  secondaryBtnLabel?: string;
  optionSortBy: { value: string; label: string }[];
  optionSortOrder: { value: string; label: string }[];
  defaultSortOption?: string;
  defaultSortOrder?: string;
  firstItemLabel?: string;
  secondItemLabel?: string;
  primaryBtndataTestid?: string;
  secondaryBtndataTestid?: string;
  primaryBtnariaLabel?: string;
  secondaryBtnariaLabel?: string;
  closedataTestid?: string;
}

export const SortModal: React.FC<SortModalProps> = React.memo(
  ({
    showSortModal,
    onClose,
    primaryBtnAction,
    secondaryBtnAction = onClose,
    modalHeader = "Sort",
    primaryBtnLabel = "Sort Results",
    secondaryBtnLabel = "Cancel",
    optionSortBy = [],
    optionSortOrder = [],
    defaultSortOption = "",
    defaultSortOrder = "",
    firstItemLabel = "Sort By",
    secondItemLabel = "In a",
    primaryBtndataTestid = "apply-sort-button",
    secondaryBtndataTestid = "cancel-sort-button",
    primaryBtnariaLabel = "Apply sorting",
    secondaryBtnariaLabel = "Cancel",
    closedataTestid = "close-sort-modal",
  }) => {
    const { t } = useTranslation();
    const [selectedOption, setSelectedOption] = useState(defaultSortOption);
    const [selectedOrder, setSelectedOrder] = useState(defaultSortOrder);

    const handlePrimaryAction = () => {
      if (primaryBtnAction) {
        primaryBtnAction(selectedOption, selectedOrder);
      }
    };

    useEffect(() => {
      if (!showSortModal) {
        setSelectedOption(defaultSortOption);
        setSelectedOrder(defaultSortOrder);
      }
    }, [showSortModal, defaultSortOption, defaultSortOrder]);

    const isPrimaryButtonDisabled =
      !selectedOption ||
      !selectedOrder ||
      (selectedOption === defaultSortOption &&
        selectedOrder === defaultSortOrder);
    return (
      <Modal show={showSortModal} onHide={onClose} size="sm">
        <Modal.Header>
          <Modal.Title>
            <p>{t(modalHeader)}</p>
          </Modal.Title>
          <div className="icon-close" onClick={onClose}>
            <CloseIcon data-testid={closedataTestid} />
          </div>
        </Modal.Header>
        <Modal.Body className="sort-settings p-0">
          <div className="sortbody-settings">
            <InputDropdown
              firstItemLabel={t(firstItemLabel)}
              isAllowInput={false}
              Options={optionSortBy.map((option) => ({
                label: t(option.label),
                onClick: () => setSelectedOption(option.value),
              }))}
              dropdownLabel={t(firstItemLabel)}
              selectedOption={t(
                optionSortBy.find((option) => option.value === selectedOption)
                  ?.label || ""
              )}
              isInvalid={false}
              ariaLabelforDropdown={t("Sort By Dropdown")}
              ariaLabelforInput={t("Sort By Input")}
              dataTestIdforDropdown="dropdown-sort-by"
              dataTestIdforInput="input-sort-by"
            />
            <InputDropdown
              firstItemLabel={t(secondItemLabel)}
              isAllowInput={false}
              Options={optionSortOrder.map((option) => ({
                label: t(option.label),
                onClick: () => setSelectedOrder(option.value),
              }))}
              dropdownLabel={t(secondItemLabel)}
              selectedOption={t(
                optionSortOrder.find((option) => option.value === selectedOrder)
                  ?.label || ""
              )}
              isInvalid={false}
              ariaLabelforDropdown={t("Order Dropdown")}
              ariaLabelforInput={t("Order Input")}
              dataTestIdforDropdown="dropdown-sort-order"
              dataTestIdforInput="input-sort-order"
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="buttons-row">
            <CustomButton
              variant="primary"
              size="md"
              disabled={isPrimaryButtonDisabled}
              label={t(primaryBtnLabel)}
              onClick={handlePrimaryAction}
              name="applyButton"
              dataTestId={primaryBtndataTestid}
              ariaLabel={t(primaryBtnariaLabel)}
            />
            <CustomButton
              variant="secondary"
              size="md"
              name="cancelButton"
              label={t(secondaryBtnLabel)}
              onClick={secondaryBtnAction}
              dataTestId={secondaryBtndataTestid}
              ariaLabel={t(secondaryBtnariaLabel)}
            />
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
);

export default SortModal;

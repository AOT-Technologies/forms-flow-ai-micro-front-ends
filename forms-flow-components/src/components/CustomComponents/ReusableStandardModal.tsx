import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { V8CustomButton } from "./CustomButton";
import { CloseIcon } from "../SvgIcons/index";
import { StyleServices } from "@formsflow/service";

export interface ContentItem {
  id: number;
  heading: string;
  body: string;
  onClick?: () => void;
}

export interface ReusableStandardModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  content?: React.ReactNode;
  contents?: ContentItem[]; // New prop for BuildModal compatibility
  questionText?: string; // Optional question text above the options

  // Footer button props
  primaryBtnText?: string;
  primaryBtnAction?: () => void;
  primaryBtnDisable?: boolean;
  primaryBtndataTestid?: string;
  primaryBtnariaLabel?: string;
  buttonLoading?: boolean;

  secondaryBtnText?: string;
  secondaryBtnAction?: () => void;
  secondaryBtnDisable?: boolean;
  secondaryBtnLoading?: boolean;
  secondoryBtndataTestid?: string;
  secondoryBtnariaLabel?: string;
}

const buildModalContent = (
  contents: ContentItem[],
  selectedId: number | null,
  onSelect: (id: number, onClick?: () => void) => void,
  questionText: string | undefined,
  t: (key: string) => string
) => {
  const handleKeyDown = (event: React.KeyboardEvent, onClick?: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      onClick?.();
    }
  };

  return (
    <div className="reusable-standard-modal-content-wrapper">
      {questionText && (
        <div className="reusable-standard-modal-question">
          {t(questionText)}
        </div>
      )}
      <div className="reusable-standard-modal-options">
        {contents.map(({ id, heading, body, onClick }) => {
          const isSelected = selectedId === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id, onClick)}
              tabIndex={0}
              onKeyDown={(event) => handleKeyDown(event, onClick)}
              aria-label={`Button for ${heading}`}
              data-testid={`button-${id}`}
              className={`reusable-standard-modal-option ${isSelected ? "selected" : ""}`}
            >
              <div className="reusable-standard-modal-option-content">
                <h3 className="reusable-standard-modal-option-heading">
                  {t(heading)}
                </h3>
                <p className="reusable-standard-modal-option-body">{t(body)}</p>
              </div>
              <input
                type="radio"
                checked={isSelected}
                onChange={() => onSelect(id, onClick)}
                className="reusable-standard-modal-radio"
                aria-label={`Select ${heading}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const ReusableStandardModal: React.FC<ReusableStandardModalProps> = ({
  show,
  onClose,
  title,
  subtitle,
  content,
  contents,
  questionText,

  primaryBtnText,
  primaryBtnAction,
  primaryBtnDisable,
  primaryBtndataTestid,
  primaryBtnariaLabel,
  buttonLoading,

  secondaryBtnText,
  secondaryBtnAction,
  secondaryBtnDisable,
  secondaryBtnLoading,
  secondoryBtndataTestid,
  secondoryBtnariaLabel,
}) => {
  const { t } = useTranslation();
  const darkColor = StyleServices.getCSSVariable("--secondary-dark");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Reset selection when modal closes
  useEffect(() => {
    if (!show) {
      setSelectedId(null);
    }
  }, [show]);

  const handleSelect = (id: number, onClick?: () => void) => {
    setSelectedId(id);
    // If onClick is provided and it doesn't close the modal, we can call it
    // Otherwise, the parent component will handle the selection via primaryBtnAction
    if (onClick && !contents) {
      onClick();
    }
  };

  const handlePrimaryAction = () => {
    if (contents && selectedId !== null) {
      const selectedItem = contents.find((item) => item.id === selectedId);
      if (selectedItem?.onClick) {
        selectedItem.onClick();
      }
    }
    if (primaryBtnAction) {
      primaryBtnAction();
    }
  };

  // Determine if primary button should be disabled
  const isPrimaryDisabled = contents
    ? selectedId === null || primaryBtnDisable
    : primaryBtnDisable;

  // Render content based on props
  const renderContent = () => {
    if (contents && contents.length > 0) {
      return buildModalContent(contents, selectedId, handleSelect, questionText, t);
    }
    return content;
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      dialogClassName="reusable-standard-modal"
      aria-labelledby="reusable-standard-modal-title"
    >
      <Modal.Header>
        <div className="modal-header-content">
          <Modal.Title id="reusable-standard-modal-title">
            {t(title)}
            <div onClick={onClose}>
              <CloseIcon color={darkColor} />
            </div>
          </Modal.Title>

          {subtitle && (
            <div className="modal-subtitle">
              {subtitle}
            </div>
          )}
        </div>
      </Modal.Header>

      {(renderContent() || contents) && (
        <Modal.Body className="custom-scroll">
          {renderContent()}
        </Modal.Body>
      )}

      {(primaryBtnText || secondaryBtnText) && (
        <Modal.Footer>
          {secondaryBtnText && (
            <V8CustomButton
              label={t(secondaryBtnText)}
              onClick={secondaryBtnAction || onClose}
              dataTestId={secondoryBtndataTestid}
              ariaLabel={secondoryBtnariaLabel}
              disabled={secondaryBtnDisable}
              loading={secondaryBtnLoading}
              variant="secondary"
            />
          )}
          {primaryBtnText && (
            <V8CustomButton
              label={t(primaryBtnText)}
              disabled={isPrimaryDisabled}
              onClick={handlePrimaryAction}
              dataTestId={primaryBtndataTestid}
              ariaLabel={primaryBtnariaLabel}
              loading={buttonLoading}
              variant="primary"
            />
          )}
        </Modal.Footer>
      )}
    </Modal>
  );
};
import React from "react";
import { AppModal } from "./AppModal";
import { useTranslation } from "react-i18next";
import { V8CustomButton } from "./CustomButton";
import { CloseIcon } from "../SvgIcons/index";
import { StyleServices } from "@formsflow/service";

interface ReusableLargeModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  headerControl?: React.ReactNode;
  content?: React.ReactNode;

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

export const ReusableLargeModal: React.FC<ReusableLargeModalProps> = ({
  show,
  onClose,
  title,
  subtitle,
  headerControl,
  content,

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

  return (
    <AppModal
      show={show}
      onHide={onClose}
      size="lg"
      dialogClassName="reusable-large-modal"
      aria-labelledby="reusable-modal-title"
    >
      <AppModal.Header>
        <div className="modal-header-content">
          <div className="modal-header-top">
            <AppModal.Title id="reusable-modal-title" className="modal-title-text">
              {t(title)}
            </AppModal.Title>
            {headerControl && (
              <div className="modal-header-control">
                {headerControl}
              </div>
            )}
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label={t("Close")}>
              <CloseIcon color={darkColor} />
            </button>
          </div>

          {subtitle && (
            <div className="modal-subtitle">
              {subtitle}
            </div>
          )}
        </div>
      </AppModal.Header>

      {content && <AppModal.Body className="custom-scroll">{content}</AppModal.Body>}

      <AppModal.Footer>
        {secondaryBtnText && (
          <V8CustomButton
            label={t(secondaryBtnText)}
            onClick={secondaryBtnAction}
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
            disabled={primaryBtnDisable}
            onClick={primaryBtnAction}
            dataTestId={primaryBtndataTestid}
            ariaLabel={primaryBtnariaLabel}
            loading={buttonLoading}
            variant="primary"
          />
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

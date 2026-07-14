import React from "react";
import { AppModal } from "./AppModal";
import {CustomButton} from "./Button";
import { CloseIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";

interface ErrorModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  messageSecondary?: string;
  primaryBtnAction: () => void;
  primaryBtnText: string;
  primaryBtndataTestid?: string;
  primaryBtnariaLabel?: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = React.memo(({
  show,
  onClose,
  title,
  message,
  primaryBtnAction,
  primaryBtnText,
  primaryBtndataTestid = 'Dismiss-button',
  primaryBtnariaLabel = 'Dismiss',
}) => {
  const { t } = useTranslation();
  return (
      <AppModal
        show={show}
        onHide={onClose}
        size="sm"
        data-testid="error-modal"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-message"
      >
        <AppModal.Header>
          <AppModal.Title id="error-modal-title" className="text-danger">
            <p>
              {t(title)}
            </p>
          </AppModal.Title>
          <div className="icon-close" onClick={onClose}>
              <CloseIcon />
          </div>
        </AppModal.Header>
        <AppModal.Body className="build-modal-body">
          <div
            className="d-flex flex-column"
            id="error-modal-message"
          >
            <div
              className="message-primary"
              data-testid="error-modal-primary-message"
              aria-label="Primary message"
            >
              {t(message)}
            </div>
          </div>
        </AppModal.Body>
        <AppModal.Footer>
          <div className="buttons-row">
            <CustomButton
              label={primaryBtnText}
              onClick={primaryBtnAction}
              dataTestId={primaryBtndataTestid}
              ariaLabel={primaryBtnariaLabel}
              secondary
            />
          </div>
        </AppModal.Footer>
      </AppModal>
  );
});

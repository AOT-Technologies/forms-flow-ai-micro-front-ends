import React from "react";
import Modal from "react-bootstrap/Modal";
import {V8CustomButton} from "./CustomButton";
import { CloseIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";

interface ConfirmModalProps {
  show: boolean;
  onClose: () => void;
  secondaryBtnAction: () => void;
  title: string;
  message: any;
  messageSecondary?: string;
  primaryBtnAction: () => void;
  primaryBtnText: string;
  primaryBtnDisable?: boolean;
  primaryBtndataTestid?: string;
  primaryBtnariaLabel?: string;
  buttonLoading?:boolean;
  secondaryBtnText: string;
  secondaryBtnDisable?: boolean;
  secondoryBtndataTestid?: string;
  secondoryBtnariaLabel?: string;
  secondaryBtnLoading?:boolean;
  datatestId?: string;
  titleDataTestId?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = React.memo(({
  show,
  onClose,
  secondaryBtnAction,
  title,
  message,
  messageSecondary = '',
  primaryBtnAction,
  primaryBtnText,
  primaryBtnDisable = false,
  primaryBtndataTestid = 'confirm-button',
  primaryBtnariaLabel = 'Confirm Button',
  buttonLoading= false,
  secondaryBtnText,
  secondaryBtnDisable = false,
  secondoryBtndataTestid = 'cancel-button',
  secondoryBtnariaLabel = 'Cancel Button',
  secondaryBtnLoading= false,
  datatestId,
  titleDataTestId,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
        show={show}
        onHide={onClose}
        size="sm"
        data-testid="confirm-modal"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <Modal.Header>
          <Modal.Title id="confirm-modal-title" data-testid={titleDataTestId}>
            <p>
              {t(title)}
            </p>
          </Modal.Title>
          <div className="icon-close" onClick={onClose}>
              <CloseIcon data-testid="confirm-modal-close"/>
          </div>
        </Modal.Header>
        <Modal.Body className="build-modal-body">
          <div
            className="d-flex flex-column"
            id="confirm-modal-message"
          >
            <div
              className="message-primary"
              data-testid={ datatestId }
              aria-label="Primary message"
            >
              {message}
            </div>
            {messageSecondary && (
              <div
                className="message-secondary"
                data-testid="confirm-modal-secondary-message"
                aria-label="Secondary message"
              >
                {messageSecondary}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="buttons-row">
          {primaryBtnText &&
            <V8CustomButton
              label={primaryBtnText}
              disabled={primaryBtnDisable}
              onClick={primaryBtnAction}
              dataTestId={primaryBtndataTestid}
              ariaLabel={primaryBtnariaLabel}
              loading={buttonLoading}
              variant="primary" 
            />}
          {secondaryBtnText &&
            <V8CustomButton
              label={secondaryBtnText}
              onClick={secondaryBtnAction}
              dataTestId={secondoryBtndataTestid}
              ariaLabel={secondoryBtnariaLabel}
              disabled={secondaryBtnDisable}
              loading={secondaryBtnLoading}
              variant="secondary"
            />}
          </div>
        </Modal.Footer>
      </Modal>
  );
});

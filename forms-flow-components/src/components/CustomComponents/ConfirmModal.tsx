import React from "react";
import Modal from "react-bootstrap/Modal";
import {CustomButton} from "./Button";
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
  secondaryBtnLoading= false
}) => {
  const { t } = useTranslation();
  return (
    <Modal
        show={show}
        onHide={onClose}
        size="sm"
        centered={true}
        data-testid="confirm-modal"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <Modal.Header>
          <Modal.Title id="confirm-modal-title">
            <b>
              {t(title)}
            </b>
          </Modal.Title>
          <div className="d-flex align-items-center">
              <CloseIcon onClick={onClose} data-testid="confirm-modal-close"/>
          </div>
        </Modal.Header>
        <Modal.Body className="build-modal-body">
          <div
            className="d-flex flex-column"
            id="confirm-modal-message"
          >
            <div
              className="message-primary"
              data-testid="confirm-modal-primary-message"
              aria-label="Primary message"
            >
              {t(message)}
            </div>
            {messageSecondary && (
              <div
                className="message-secondary"
                data-testid="confirm-modal-secondary-message"
                aria-label="Secondary message"
              >
                {t(messageSecondary)}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-start">
          <CustomButton
            variant={"primary"}
            size="lg"
            label={primaryBtnText}
            disabled={primaryBtnDisable}
            onClick={primaryBtnAction}
            dataTestId={primaryBtndataTestid}
            ariaLabel={primaryBtnariaLabel}
            buttonLoading={buttonLoading}
          />
          {secondaryBtnText && <CustomButton
            variant="secondary"
            size="lg"
            label={secondaryBtnText}
            onClick={secondaryBtnAction}
            dataTestId={secondoryBtndataTestid}
            ariaLabel={secondoryBtnariaLabel}
            disabled={secondaryBtnDisable}
            buttonLoading={secondaryBtnLoading}
          />}
        </Modal.Footer>
      </Modal>
  );
});

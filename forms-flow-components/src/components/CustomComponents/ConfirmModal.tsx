import React from "react";
import Modal from "react-bootstrap/Modal";
import {CustomButton} from "./Button";
import { CloseIcon } from "../SvgIcons/index";

interface ConfirmModalProps {
  show: boolean;
  onClose: () => void;
  secondayBtnAction: () => void;
  title: string;
  message: string;
  messageSecondary?: string;
  primaryBtnAction: () => void;
  primaryBtnText: string;
  primaryBtnDisable?: boolean;
  secondaryBtnText: string;
  secondoryBtndataTestid?: string;
  primaryBtndataTestid?: string;
  primaryBtnariaLabel?: string;
  secondoryBtnariaLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = React.memo(({
  show,
  onClose,
  secondayBtnAction,
  title,
  message,
  messageSecondary = '',
  primaryBtnAction,
  primaryBtnText,
  primaryBtnDisable = false,
  secondaryBtnText,
  secondoryBtndataTestid = 'cancel-button',
  primaryBtndataTestid = 'Confirm-button',
  primaryBtnariaLabel = 'Confirm Button',
  secondoryBtnariaLabel = 'Cancel Button'
}) => {
  return (
    <>
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
              {title}
            </b>
          </Modal.Title>
          <div className="d-flex align-items-center">
              <CloseIcon onClick={onClose} />
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
        <Modal.Footer className="d-flex justify-content-start">
          <CustomButton
            variant={"primary"}
            size="lg"
            label={primaryBtnText}
            disabled={primaryBtnDisable}
            onClick={primaryBtnAction}
            dataTestid={primaryBtndataTestid}
            ariaLabel={primaryBtnariaLabel}
          />
          <CustomButton
            variant="secondary"
            size="lg"
            label={secondaryBtnText}
            onClick={secondayBtnAction}
            dataTestid={secondoryBtndataTestid}
            ariaLabel={secondoryBtnariaLabel}
          />
        </Modal.Footer>
      </Modal>
    </>
  );
});

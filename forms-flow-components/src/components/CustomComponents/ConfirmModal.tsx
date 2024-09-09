import React from "react";
import Modal from "react-bootstrap/Modal";
import {CustomButton} from "./Button";
import { CloseIcon } from "../SvgIcons/index";

interface ConfirmModalProps {
  show: boolean;
  onCancel: () => void;
  title: string;
  message: string;
  messageSecondary?: string;
  onConfirm: () => void;
  confirmText: string;
  cancelText: string;
  cancelBtndataTestid?: string;
  confirmBtndataTestid?: string;
  confirmBtnariaLabel?: string;
  cancelBtnariaLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = React.memo(({
  show,
  onCancel,
  title,
  message,
  messageSecondary = '',
  onConfirm,
  confirmText,
  cancelText,
  cancelBtndataTestid = 'cancel-button',
  confirmBtndataTestid = 'Confirm-button',
  confirmBtnariaLabel = 'Confirm Button',
  cancelBtnariaLabel = 'Cancel Button'
}) => {
  return (
    <>
      <Modal
        show={show}
        onHide={onCancel}
        dialogClassName="modal-50w"
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
              <CloseIcon onClick={onCancel} />
          </div>
        </Modal.Header>
        <Modal.Body className="p-5">
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
            label={confirmText}
            onClick={onConfirm}
            dataTestid={confirmBtndataTestid}
            ariaLabel={confirmBtnariaLabel}
          />
          <CustomButton
            variant="secondary"
            size="lg"
            label={cancelText}
            onClick={onCancel}
            dataTestid={cancelBtndataTestid}
            ariaLabel={cancelBtnariaLabel}
          />
        </Modal.Footer>
      </Modal>
    </>
  );
});

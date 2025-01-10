import React from "react";
import Modal from "react-bootstrap/Modal";
import {CustomButton} from "./Button";
import { CloseIcon } from "../SvgIcons/index";

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
  return (
      <Modal
        show={show}
        onHide={onClose}
        size="sm"
        centered={true}
        data-testid="error-modal"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-message"
      >
        <Modal.Header>
          <Modal.Title id="error-modal-title" className="text-danger">
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
            id="error-modal-message"
          >
            <div
              className="message-primary"
              data-testid="error-modal-primary-message"
              aria-label="Primary message"
            >
              {message}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-start">
          <CustomButton
            variant={"secondary"}
            size="lg"
            label={primaryBtnText}
            onClick={primaryBtnAction}
            dataTestid={primaryBtndataTestid}
            ariaLabel={primaryBtnariaLabel}
          />
        </Modal.Footer>
      </Modal>
  );
});

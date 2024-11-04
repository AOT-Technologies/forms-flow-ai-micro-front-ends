import React from "react";
import Modal from "react-bootstrap/Modal";
import { CloseIcon } from "../SvgIcons/index";

interface BuildModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  contents: {
    heading: string;
    body: string;
    onClick?: () => void;
    id: number;
  }[];
}

const buildModalContent = (
  contents: {
    id: number;
    heading: string;
    body: string;
    onClick?: () => void;
  }[]
) => {
  return (
    <>
      {contents.map(({ id,heading, body, onClick }) => (
        <div className="col-md-6 build-contents" key={id} onClick={onClick}>
          <span className="mb-3 content-heading">{heading}</span>
          <span>{body}</span>
        </div>
      ))}
    </>
  );
};

export const BuildModal: React.FC<BuildModalProps> = React.memo(
  ({ show, onClose, title, contents }) => {
    return (
      <>
        <Modal
          show={show}
          onHide={onClose}
          size="sm"
          centered={true}
          data-testid="build-modal"
          aria-labelledby="build-modal-title"
          aria-describedby="build-modal-message"
          className="build-modal"
        >
          <Modal.Header>
            <Modal.Title id="build-modal-title">
              <b>{title}</b>
            </Modal.Title>
            <div className="d-flex align-items-center">
              <CloseIcon onClick={onClose} />
            </div>
          </Modal.Header>
          <Modal.Body className="build-modal-body d-flex">
            {buildModalContent(contents)}
          </Modal.Body>
        </Modal>
      </>
    );
  }
);

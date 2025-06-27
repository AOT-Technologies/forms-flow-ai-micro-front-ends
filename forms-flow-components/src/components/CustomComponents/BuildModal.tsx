import React from "react";
import Modal from "react-bootstrap/Modal";
import { CloseIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";

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
  }[],
  t: (key: string) => string
) => {
  const handleKeyDown = (event, onClick) => {
    if (event.key === "Enter" || event.key === " ") {
        onClick?.();
    }
  };
  return (
    <>
      {contents.map(({ id, heading, body, onClick }) => (
        <button
          className="col-md-6 build-contents"
          key={id}
          onClick={onClick}
          tabIndex={0}
          onKeyDown={(event) => handleKeyDown(event, onClick)}
          aria-label={`Button for ${heading}`} 
          data-testid={`button-${id}`}
        >
          <span className="mb-3 content-heading">{t(heading)}</span>
          <span className="content-body">{t(body)}</span>
        </button>
      ))}
    </>
  );
};

export const BuildModal: React.FC<BuildModalProps> = React.memo(
  ({ show, onClose, title, contents }) => {
    const { t } = useTranslation();
    return (
      <Modal
        show={show}
        onHide={onClose}
        centered={true}
        data-testid="build-modal"
        aria-labelledby="build-modal-title"
        aria-describedby="build-modal-message"
        dialogClassName="build-modal"
        size="sm"
      >
        <Modal.Header>
          <Modal.Title id="build-modal-title">
            <b>{t(title)}</b>
          </Modal.Title>
          <div className="d-flex align-items-center">
            <CloseIcon onClick={onClose} dataTestId="modal-close"/>
          </div>
        </Modal.Header>
        <Modal.Body className="d-flex">
        {buildModalContent(contents, t)}
        </Modal.Body>
      </Modal>
    );
  }
);

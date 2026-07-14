import React from "react";
import { AppModal } from "./AppModal";
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
          key={id}
          onClick={onClick}
          tabIndex={0}
          onKeyDown={(event) => handleKeyDown(event, onClick)}
          aria-label={`Button for ${heading}`} 
          data-testid={`button-${id}`}
        >
          <h3>{t(heading)}</h3>
          <p>{t(body)}</p>
        </button>
      ))}
    </>
  );
};

export const BuildModal: React.FC<BuildModalProps> = React.memo(
  ({ show, onClose, title, contents }) => {
    const { t } = useTranslation();
    return (
      <AppModal
        show={show}
        onHide={onClose}
        data-testid="build-modal"
        aria-labelledby="build-modal-title"
        aria-describedby="build-modal-message"
        size="sm"
      >
        <AppModal.Header>
          <AppModal.Title id="build-modal-title">
            <p>{t(title)}</p>
          </AppModal.Title>
          <div className="icon-close" onClick={onClose} data-testId="modal-close">
            <CloseIcon />
          </div>
        </AppModal.Header>
        <AppModal.Body className="choice">
        {buildModalContent(contents, t)}
        </AppModal.Body>
      </AppModal>
    );
  }
);

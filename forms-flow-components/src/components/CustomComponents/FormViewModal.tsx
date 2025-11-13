import React from "react";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { CloseIcon } from "../SvgIcons/index";
import { StyleServices } from "@formsflow/service";

interface FormViewModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  formContent?: React.ReactNode;

  // Additional props
  className?: string;
  dataTestId?: string;
  titleDataTestId?: string;
  closeOnBackdrop?: boolean;
}

export const FormViewModal: React.FC<FormViewModalProps> = React.memo(({
  show,
  onClose,
  title,
  children,
  formContent,
  className = "",
  dataTestId = "form-view-modal",
  titleDataTestId = "form-view-modal-title",
  closeOnBackdrop = true,
}) => {
  const { t } = useTranslation();
  const darkColor = StyleServices.getCSSVariable("--secondary-dark");

  const handleClose = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      dialogClassName={`form-view-modal ${className}`}
      aria-labelledby="form-view-modal-title"
      data-testid={dataTestId}
      backdrop={closeOnBackdrop ? true : "static"}
      keyboard={closeOnBackdrop}
      centered
    >
      <Modal.Header className="d-flex justify-content-between align-items-center">
        <Modal.Title id="form-view-modal-title" data-testid={titleDataTestId}>
          <p className="m-0">
            {t(title)}
          </p>
        </Modal.Title>
        <div className="icon-close" onClick={onClose} data-testid="form-view-modal-close" role="button">
            <CloseIcon dataTestId="form-view-modal-close"/>
          </div>
      </Modal.Header>

      <Modal.Body className="form-view-modal-body custom-scroll">
        {formContent || children}
      </Modal.Body>
    </Modal>
  );
});

FormViewModal.displayName = "FormViewModal";

export default FormViewModal;


import React from "react";
import { AppModal } from "./AppModal";
import { useTranslation } from "react-i18next";
import { CloseIcon } from "../SvgIcons/index";

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

  const handleClose = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <AppModal
      show={show}
      onHide={handleClose}
      dialogClassName={`form-view-modal ${className}`}
      aria-labelledby="form-view-modal-title"
      data-testid={dataTestId}
      backdrop={closeOnBackdrop ? true : "static"}
      keyboard={closeOnBackdrop}
      centered
    >
      <AppModal.Header className="d-flex justify-content-between align-items-center">
        <AppModal.Title id="form-view-modal-title" data-testid={titleDataTestId}>
          <p className="m-0">
            {t(title)}
          </p>
        </AppModal.Title>
        <div className="icon-close" onClick={onClose} data-testid="form-view-modal-close">
            <CloseIcon dataTestId="form-view-modal-close"/>
          </div>
      </AppModal.Header>

      <AppModal.Body className="form-view-modal-body custom-scroll">
        {formContent || children}
      </AppModal.Body>
    </AppModal>
  );
});

FormViewModal.displayName = "FormViewModal";

export default FormViewModal;


import React from "react";
import "./printConfirmationDialog.scss";

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  primaryBtnCaption: string;
  secondaryBtnCaption: string;
}

const PrintConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  message,
  onConfirm,
  onCancel,
  primaryBtnCaption,
  secondaryBtnCaption,
}) => {
  return (
    <div className="modal-overlay">
      <div className="confirmation-dialog">
      <button className="dialog-close btn-secondary" onClick={onCancel}>
        ×
      </button>
        <h2 className="dialog-header">Print Form</h2>
        <hr />
        <div className="dialog-message">
          <p>{message}</p>
        </div>
        <hr />
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {secondaryBtnCaption}
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            {primaryBtnCaption}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintConfirmationDialog;
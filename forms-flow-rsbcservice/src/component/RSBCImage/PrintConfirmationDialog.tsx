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
    <div className="confirmation-dialog">
      <p>{message}</p>
      <button className="yes-button" onClick={onConfirm}>
          {primaryBtnCaption}
      </button>
      <button className="no-button" onClick={onCancel}>
          {secondaryBtnCaption}
      </button>
    </div>
  );
};

export default PrintConfirmationDialog;

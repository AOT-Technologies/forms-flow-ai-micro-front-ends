import React from "react";
import "./printConfirmationDialog.scss";

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const PrintConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="confirmation-dialog">
      <p>{message}</p>
      <button className="yes-button" onClick={onConfirm}>
        Yes
      </button>
      <button className="no-button" onClick={onCancel}>
        No
      </button>
    </div>
  );
};

export default PrintConfirmationDialog;

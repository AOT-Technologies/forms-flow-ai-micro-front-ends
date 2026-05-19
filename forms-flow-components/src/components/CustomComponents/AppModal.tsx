import React, { forwardRef } from "react";
import { Modal, ModalProps } from "react-bootstrap";

type AppModalSize = "sm" | "md" | "lg";

interface AppModalProps extends Omit<ModalProps, "size"> {
  size?: AppModalSize;
}

const AppModalBase = forwardRef<HTMLDivElement, AppModalProps>(
  ({ size, dialogClassName, ...props }, ref) => {
    const combinedDialogClassName = [
      dialogClassName,
      size === "md" ? "app-modal-md" : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <Modal
        ref={ref as any}
        {...props}
        size={size === "md" ? undefined : size}
        dialogClassName={combinedDialogClassName}
      />
    );
  }
);

AppModalBase.displayName = "AppModal";

export const AppModal = Object.assign(AppModalBase, {
  Header: Modal.Header,
  Body: Modal.Body,
  Footer: Modal.Footer,
  Title: Modal.Title,
  Dialog: Modal.Dialog,
});

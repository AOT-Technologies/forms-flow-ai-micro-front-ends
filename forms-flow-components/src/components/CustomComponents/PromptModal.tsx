import React, { memo, useCallback, useMemo, forwardRef } from "react";
import Modal from "react-bootstrap/Modal";
import { V8CustomButton } from "./CustomButton";
import { useTranslation } from "react-i18next";
import { PromptInfoIcon, WarningIcon, TickIcon, PromptErrorIcon } from "../SvgIcons";

/**
 * PromptModal is a reusable, accessible modal component for forms-flow apps.
 * 
 * Usage:
 * <PromptModal show={true} onClose={handleClose} title="Warning" message="Are you sure?" primaryBtnText="OK" primaryBtnAction={handleOk} />
 * <PromptModal show={true} type="error" title="Error" message="Something went wrong" primaryBtnText="Retry" secondaryBtnText="Cancel" />
 */

type ModalType = "info" | "warning" | "success" | "error";

interface PromptModalProps extends Omit<React.ComponentPropsWithoutRef<"div">, 'children'> {
  /** Controls modal visibility */
  show: boolean;
  /** Called when modal should be closed */
  onClose: () => void;
  /** Called when secondary button is clicked */
  secondaryBtnAction: () => void;
  /** Modal title (translation key) */
  title: string;
  /** Modal message content (translation key) */
  message: string;
  /** Called when primary button is clicked */
  primaryBtnAction: () => void;
  /** Primary button text (translation key) */
  primaryBtnText: string;
  /** Disables primary button */
  primaryBtnDisable?: boolean;
  /** Test ID for primary button */
  primaryBtndataTestid?: string;
  /** ARIA label for primary button */
  primaryBtnariaLabel?: string;
  /** Shows loading state on primary button */
  buttonLoading?: boolean;
  /** Secondary button text (translation key) */
  secondaryBtnText: string;
  /** Disables secondary button */
  secondaryBtnDisable?: boolean;
  /** Test ID for secondary button */
  secondoryBtndataTestid?: string;
  /** ARIA label for secondary button */
  secondoryBtnariaLabel?: string;
  /** Shows loading state on secondary button */
  secondaryBtnLoading?: boolean;
  /** Third button text (translation key) */
  btnText: string;
  /** Disables third button */
  btnDisable?: boolean;
  /** Test ID for third button */
  btndataTestid?: string;
  /** ARIA label for third button */
  btnariaLabel?: string;
  /** Shows loading state on third button */
  btnLoading?: boolean;
  /** Called when third button is clicked */
  btnAction: () => void;
  /** Test ID for modal title */
  datatestId?: string;
  /** Modal type affecting icon and styling */
  type?: ModalType;
  /** Modal size */
  size?: "sm" | "lg" | "xl";
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Renders the appropriate icon based on modal type
 */
const renderModalIcon = (type?: string) => {
  switch (type?.toLowerCase()) {
    case "warning":
      return <WarningIcon />;
    case "info":
      return <PromptInfoIcon />;
    case "success":
      return <TickIcon color="#00C49A" />;
    case "error":
      return <PromptErrorIcon />;
    default:
      return null;
  }
};

/**
 * Enhanced PromptModal component with improved accessibility, performance, and maintainability
 */
const PromptModalComponent = forwardRef<HTMLDivElement, PromptModalProps>(({
  show,
  onClose,
  secondaryBtnAction,
  title,
  message = '',
  primaryBtnAction,
  primaryBtnText,
  primaryBtnDisable = false,
  primaryBtndataTestid = 'prompt-button',
  primaryBtnariaLabel = 'Prompt Button',
  buttonLoading = false,
  secondaryBtnText,
  secondaryBtnDisable = false,
  secondoryBtndataTestid = 'cancel-button',
  secondoryBtnariaLabel = 'Cancel Button',
  secondaryBtnLoading = false,
  datatestId,
  type,
  size = 'sm',
  btnText,
  btnDisable = false,
  btndataTestid = 'ok-button',
  btnariaLabel = 'Ok Button',
  btnLoading = false,
  btnAction,
  className = '',
  ariaLabel,
  dataTestId,
  ...restProps
}, ref) => {
  const { t } = useTranslation();

  // Memoized modal className calculation
  const modalClassName = useMemo(() => buildClassNames(
    'prompt-modal',
    type === "error" && "error-modal",
    type === "success" && "success-modal",
    className
  ), [type, className]);

  // Memoized title color based on type
  const titleColor = useMemo(() => ({
    color: type === 'warning' 
      ? 'var(--red-100)' 
      : 'var(--gray-dark)',
  }), [type]);

  // Memoized modal icon
  const modalIcon = useMemo(() => renderModalIcon(type), [type]);

  // Memoized translated content
  const translatedTitle = useMemo(() => t(title), [t, title]);
  const translatedMessage = useMemo(() => t(message), [t, message]);
  
  return (
    <Modal
      ref={ref}
      show={show}
      onHide={onClose}
      size={size}
      data-testid={dataTestId || "prompt-modal"}
      aria-labelledby="prompt-modal-title"
      aria-describedby="prompt-modal-message"
      className={modalClassName}
      centered
      {...restProps}
    >
      <Modal.Body className="prompt-modal-body">
        <div
          className="prompt-modal-title-container d-flex flex-column"
          id="prompt-modal-title"
        >
          <div className="prompt-icon">
            {modalIcon}
          </div>

          <div
            className="prompt-title"
            data-testid={datatestId}
            aria-label={ariaLabel || "Prompt title"}
            style={titleColor}
          >
            {translatedTitle}
          </div>
        </div>
        {message && (
          <div
            className="prompt-message"
            data-testid="prompt-modal-message"
            aria-label="Prompt message"
          >
            {translatedMessage}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="buttons-row">
          {primaryBtnText && (
            <V8CustomButton
              label={primaryBtnText}
              disabled={primaryBtnDisable}
              onClick={primaryBtnAction}
              dataTestId={primaryBtndataTestid}
              ariaLabel={primaryBtnariaLabel}
              loading={buttonLoading}
              variant="primary"
            />
          )}
          {secondaryBtnText && (
            <V8CustomButton
              label={secondaryBtnText}
              onClick={secondaryBtnAction}
              dataTestId={secondoryBtndataTestid}
              ariaLabel={secondoryBtnariaLabel}
              disabled={secondaryBtnDisable}
              loading={secondaryBtnLoading}
              variant="secondary"
            />
          )}
          {btnText && (
            <V8CustomButton
              label={btnText}
              onClick={btnAction}
              dataTestId={btndataTestid}
              ariaLabel={btnariaLabel}
              disabled={btnDisable}
              loading={btnLoading}
              variant="primary"
            />
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
});

// Set display name for better debugging
PromptModalComponent.displayName = "PromptModal";

// Export memoized component for performance optimization
export const PromptModal = memo(PromptModalComponent);

// Export types for consumers
export type { PromptModalProps, ModalType };

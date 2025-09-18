import React from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";
import { useTranslation } from "react-i18next";
import { SuccessIcon, WarningIcon } from "../SvgIcons";


interface PromptModalProps {
  show: boolean;
  onClose: () => void;
  secondaryBtnAction: () => void;
  title: any;
  message: string;
  primaryBtnAction: () => void;
  primaryBtnText: string;
  primaryBtnDisable?: boolean;
  primaryBtndataTestid?: string;
  primaryBtnariaLabel?: string;
  buttonLoading?:boolean;
  secondaryBtnText: string;
  secondaryBtnDisable?: boolean;
  secondoryBtndataTestid?: string;
  secondoryBtnariaLabel?: string;
  secondaryBtnLoading?:boolean;
  datatestId?: string;
  type?: string;
}

export const PromptModal: React.FC<PromptModalProps> = React.memo(({
  show,
  onClose,
  secondaryBtnAction,
  title,
  message='',
  primaryBtnAction,
  primaryBtnText,
  primaryBtnDisable = false,
  primaryBtndataTestid = 'prompt-button',
  primaryBtnariaLabel = 'Prompt Button',
  buttonLoading= false,
  secondaryBtnText,
  secondaryBtnDisable = false,
  secondoryBtndataTestid = 'cancel-button',
  secondoryBtnariaLabel = 'Cancel Button',
  secondaryBtnLoading= false,
  datatestId,
  type
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      show={show}
      onHide={onClose}
      size="sm"
      data-testid="prompt-modal"
      aria-labelledby="prompt-modal-title"
      aria-describedby="prompt-modal-message"
      className="prompt-modal"
      centered
    >
      <Modal.Body
        className="prompt-modal-body"
      >
        <div
          className="prompt-modal-title-container d-flex flex-column"
          id="prompt-modal-title"
        >
          <div className="prompt-icon">
            {type === 'warning' ? (
              <WarningIcon  />
            ) : (
              <SuccessIcon/>
            )}
          </div>

          <div
            className="prompt-title"
            data-testid={datatestId}
            aria-label="Prompt title"
            style={{
              color: type === 'warning' ? '#E57373' : '#4A4A4A',
            }}
          >
            {t(title)}
          </div>
        </div>
        {message && (
          <div
            className="prompt-message"
            data-testid="prompt-modal-message"
            aria-label="Prompt message"
          >
            {t(message)}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer
      >
        <div
          className="buttons-row"
        >
          {secondaryBtnText && <CustomButton
            label={secondaryBtnText}
            onClick={secondaryBtnAction}
            dataTestId={secondoryBtndataTestid}
            ariaLabel={secondoryBtnariaLabel}
            disabled={secondaryBtnDisable}
            buttonLoading={secondaryBtnLoading}
            secondary
          />}
          {primaryBtnText && <CustomButton
            label={primaryBtnText}
            disabled={primaryBtnDisable}
            onClick={primaryBtnAction}
            dataTestId={primaryBtndataTestid}
            ariaLabel={primaryBtnariaLabel}
            buttonLoading={buttonLoading}
          />}
        </div>
      </Modal.Footer>
    </Modal>
  );
});

import React from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";
import { useTranslation } from "react-i18next";
import { PromptInfoIcon, WarningIcon, TickIcon, PromptErrorIcon } from "../SvgIcons";

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
  buttonLoading?: boolean;
  secondaryBtnText: string;
  secondaryBtnDisable?: boolean;
  secondoryBtndataTestid?: string;
  secondoryBtnariaLabel?: string;
  secondaryBtnLoading?:boolean;
  btnText: string;
  btnDisable?: boolean;
  btndataTestid?: string;
  btnariaLabel?: string;
  btnLoading?:boolean;
  btnAction: ()=>void;
  datatestId?: string;
  type?: string;
}

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
  type,
  btnText,
  btnDisable = false,
  btndataTestid='ok-button',
  btnariaLabel='Ok Button',
  btnLoading=false,
  btnAction
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
      className={`prompt-modal${type === 'error' ? ' error-modal' : type=='success'? ' success-modal':''}`}
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
            {type && renderModalIcon(type)}
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
            {primaryBtnText && <CustomButton
                label={primaryBtnText}
                disabled={primaryBtnDisable}
                onClick={primaryBtnAction}
                dataTestId={primaryBtndataTestid}
                ariaLabel={primaryBtnariaLabel}
                buttonLoading={buttonLoading}
            />}
          {secondaryBtnText && <CustomButton
            label={secondaryBtnText}
            onClick={secondaryBtnAction}
            dataTestId={secondoryBtndataTestid}
            ariaLabel={secondoryBtnariaLabel}
            disabled={secondaryBtnDisable}
            buttonLoading={secondaryBtnLoading}
            secondary
          />}
          {btnText && <CustomButton
            label={btnText}
            onClick={btnAction}
            dataTestId={btndataTestid}
            ariaLabel={btnariaLabel}
            disabled={btnDisable}
            buttonLoading={btnLoading}
          />}
        </div>
      </Modal.Footer>
    </Modal>
  );
});

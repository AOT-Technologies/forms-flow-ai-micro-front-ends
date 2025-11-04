import React from "react";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { V8CustomButton } from "./CustomButton";
import { CloseIcon } from "../SvgIcons/index";
import { StyleServices } from "@formsflow/service";

interface ReusableLargeModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  content?: React.ReactNode;

  // Footer button props
  primaryBtnText?: string;
  primaryBtnAction?: () => void;
  primaryBtnDisable?: boolean;
  primaryBtndataTestid?: string;
  primaryBtnariaLabel?: string;
  buttonLoading?: boolean;

  secondaryBtnText?: string;
  secondaryBtnAction?: () => void;
  secondaryBtnDisable?: boolean;
  secondaryBtnLoading?: boolean;
  secondoryBtndataTestid?: string;
  secondoryBtnariaLabel?: string;
}

export const ReusableLargeModal: React.FC<ReusableLargeModalProps> = ({
  show,
  onClose,
  title,
  subtitle,
  content,

  primaryBtnText,
  primaryBtnAction,
  primaryBtnDisable,
  primaryBtndataTestid,
  primaryBtnariaLabel,
  buttonLoading,

  secondaryBtnText,
  secondaryBtnAction,
  secondaryBtnDisable,
  secondaryBtnLoading,
  secondoryBtndataTestid,
  secondoryBtnariaLabel,
}) => {
  const { t } = useTranslation();
  const darkColor = StyleServices.getCSSVariable("--ff-gray-darkest");

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      dialogClassName="reusable-large-modal"
      aria-labelledby="reusable-modal-title"
    >
      <Modal.Header>
        <div className="modal-header-content">
          <Modal.Title id="reusable-modal-title">
            {t(title)}
            <div onClick={onClose}>
              <CloseIcon color={darkColor} />
            </div>
          </Modal.Title>

          {subtitle && (
          <div className="modal-subtitle">
            {subtitle}
          </div>
          )}
        </div>
      </Modal.Header>

      {content && <Modal.Body>{content}</Modal.Body>}

      {/* <Modal.Footer>
        {secondaryBtnText && (
          <V8CustomButton
            label={t(secondaryBtnText)}
            onClick={secondaryBtnAction}
            dataTestId={secondoryBtndataTestid}
            ariaLabel={secondoryBtnariaLabel}
            disabled={secondaryBtnDisable}
            loading={secondaryBtnLoading}
            variant="secondary"
          />
        )}
        {primaryBtnText && (
          <V8CustomButton
            label={t(primaryBtnText)}
            disabled={primaryBtnDisable}
            onClick={primaryBtnAction}
            dataTestId={primaryBtndataTestid}
            ariaLabel={primaryBtnariaLabel}
            loading={buttonLoading}
            variant="primary"
          />
        )}
      </Modal.Footer> */}
    </Modal>
  );
};

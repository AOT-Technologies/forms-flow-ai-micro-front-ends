import React from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";
import { CloseIcon } from "../SvgIcons/index";

interface HistoryModalProps {
  show: boolean;
  onClose: () => void;
  revertBtnAction: () => void;
  title: string;
  loadMoreBtnAction: () => void;
  revertBtnText: string;
  loadMoreBtnText: string;
  revertBtndataTestid?: string;
  revertBtnariaLabel?: string;
  loadMoreBtndataTestid?: string;
  loadMoreBtnariaLabel?: string;
  formHistory: FormHistory[];
}

interface FormHistory {
  formId: string;
  createdBy: string;
  createdAt: string;
  changeLog: {
    cloned_form_id: string;
    new_version: boolean;
    version: string;
  }[];
  majorVersion: number;
  minorVersion: number;
  version: string;
  isMajor: boolean;
}

export const HistoryModal: React.FC<HistoryModalProps> = React.memo(
  ({
    show,
    onClose,
    title,
    revertBtnAction,
    loadMoreBtnAction,
    revertBtnText,
    loadMoreBtnText,
    revertBtndataTestid = "revert-button",
    revertBtnariaLabel = "Revert Button",
    loadMoreBtndataTestid = "loadmore-button",
    loadMoreBtnariaLabel = "Loadmore Button",
    formHistory,
  }) => {
    console.log(formHistory);
    const renderHistory = () => {
      return formHistory.map((entry) => {
        const isMajorVersion = entry.isMajor;

        return (
          <React.Fragment key={entry.version}>
            {isMajorVersion && (
              <div className="major-version-box">
                <div className="col-md-4 bold-headings d-flex align-items-center">
                  Version {entry.version}
                </div>
                <div className="col-md-2">
                  <div className="bold-headings">Last Edit On</div>
                  <div className="normal-text">12/12/2012</div>
                </div>
                <div className="col-md-2">
                  <div className="bold-headings">Last Edit By</div>
                  <div className="normal-text">{entry.createdBy}</div>
                </div>
                <div className="col-md-2">
                  <div className="bold-headings">Published On</div>
                  <div className="normal-text">12/12/2012</div>
                </div>
                <div className="col-md-2">
                  <CustomButton
                    variant="secondary"
                    size="sm"
                    label={revertBtnText}
                    onClick={revertBtnAction}
                    dataTestid={revertBtndataTestid}
                    ariaLabel={revertBtnariaLabel}
                  />
                </div>
              </div>
            )}
            {!isMajorVersion && (
              <div className="minor-version-box custom-offset-2rem">
                <div className="col-md-4 bold-headings d-flex align-items-center">
                  Version {entry.version}
                </div>
                <div className="col-md-2">
                  <div className="bold-headings">Last Edit On</div>
                  <div className="normal-text">12/12/2012</div>
                </div>
                <div className="col-md-2">
                  <div className="bold-headings">Last Edit By</div>
                  <div className="normal-text">{entry.createdBy}</div>
                </div>
                <div className="col-md-2">
                  <div className="bold-headings">Published On</div>
                  <div className="normal-text">12/12/2012</div>
                </div>
                <div className="col-md-2">
                  <CustomButton
                    variant="secondary"
                    size="sm"
                    label={revertBtnText}
                    onClick={revertBtnAction}
                    dataTestid={revertBtndataTestid}
                    ariaLabel={revertBtnariaLabel}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      });
    };

    return (
      <>
        <Modal
          show={show}
          onHide={onClose}
          dialogClassName="modal-70w"
          data-testid="confirm-modal"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-message"
        >
          <Modal.Header>
            <Modal.Title id="confirm-modal-title">
              <b>{title}</b>
            </Modal.Title>
            <div className="d-flex align-items-center">
              <CloseIcon onClick={onClose} />
            </div>
          </Modal.Header>
          <Modal.Body className="history-modal-body">
            {renderHistory()}
            </Modal.Body>
          <Modal.Footer className="d-flex justify-content-center border-0">
            <CustomButton
              variant="secondary"
              size="sm"
              label={loadMoreBtnText}
              onClick={loadMoreBtnAction}
              dataTestid={loadMoreBtndataTestid}
              ariaLabel={loadMoreBtnariaLabel}
            />
          </Modal.Footer>
        </Modal>
      </>
    );
  }
);

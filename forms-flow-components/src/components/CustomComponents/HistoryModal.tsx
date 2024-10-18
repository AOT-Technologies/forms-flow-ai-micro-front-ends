import React from "react";
import { useState, useRef, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";
import { CloseIcon } from "../SvgIcons/index";

interface HistoryModalProps {
  show: boolean;
  onClose: () => void;
  revertBtnAction: (cloneId: string | null) => void;
  title: string;
  loadMoreBtnAction: () => void;
  revertBtnText: string;
  loadMoreBtnText: string;
  revertBtndataTestid?: string;
  revertBtnariaLabel?: string;
  loadMoreBtndataTestid?: string;
  loadMoreBtnariaLabel?: string;
  formHistory: FormHistory[];
  categoryType: string;
}

interface FormHistory {
  formId: string;
  createdBy: string;
  created: string;
  changeLog: {
    cloned_form_id: string;
    new_version: boolean;
  };
  majorVersion: number;
  minorVersion: number;
  version: string;
  isMajor: boolean;
  processType?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = String(date.getFullYear()).slice(-2); // Last two digits of year
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  // Convert 24-hour format to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, "0");

  return `${day}-${month}-${year} ${formattedHours}:${minutes}${ampm}`;
};

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
    categoryType,
  }) => {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [clonedFormId, setClonedFormId] = useState<string | null>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const lastEntryRef = useRef<HTMLDivElement>(null);

    const handleRevertClick = (version: string, cloned_form_id: string) => {
      setSelectedVersion(version);
      setClonedFormId(cloned_form_id);
      setShowConfirmModal(true);
      onClose();
    };

    const handleKeepLayout = () => {
      setShowConfirmModal(false);
    };

    const handleReplaceLayout = () => {
      revertBtnAction(clonedFormId);
      setShowConfirmModal(false);
    };
    const adjustTimelineHeight = () => {
        const timelineElement = timelineRef.current;
        const loadMoreElement = loadMoreRef.current;
        const lastEntryElement = lastEntryRef.current;
  
        if (timelineElement && loadMoreElement && lastEntryElement) {
          const loadMoreHeight = loadMoreElement.offsetHeight;
          const lastEntryHeight = lastEntryElement.offsetHeight;
          const newHeight = `calc(100% - ${loadMoreHeight + lastEntryHeight}px)`;
  
          timelineElement.style.height = newHeight;
        }
      };

      useEffect(() => {
        adjustTimelineHeight();
        window.addEventListener("resize", adjustTimelineHeight); 
  
        return () => {
          window.removeEventListener("resize", adjustTimelineHeight);
        };
      }, [show]);

    const renderHistory = () => {
      return formHistory.map((entry, index) => {
        const isMajorVersion = entry.isMajor;
        const version = `${entry.majorVersion}.${entry.minorVersion}`;
        const cloned_form_id =
          categoryType === "FORM" ? entry.changeLog.cloned_form_id : null;
        const isLastEntry = index === formHistory.length - 1;
        return (
          <React.Fragment key={`${entry.version}-${index}`}>
            {isMajorVersion && (
              <div
              ref={isLastEntry ? lastEntryRef : null}
                className={`history-entry ${
                  categoryType === "WORKFLOW"
                    ? "workflow-major-grid "
                    : "major-version-grid"
                }`}
              >
                <div className="bold-headings">Version {version}</div>
                <div className="last-edit-on">
                  <div className="bold-headings">Last Edit On</div>
                  <div className="normal-text">{formatDate(entry.created)}</div>
                </div>
                <div className="last-edit-by">
                  <div className="bold-headings">Last Edit By</div>
                  <div className="normal-text">{entry.createdBy}</div>
                </div>
                <div className="published-on">
                  <div className="bold-headings">Published On</div>
                  <div className="normal-text">{formatDate(entry.created)}</div>
                </div>
                {categoryType === "WORKFLOW" && (
                  <div className="type">
                    <div className="bold-headings">Type</div>
                    <div className="normal-text">{entry.processType}</div>
                  </div>
                )}
                <div className="revert-btn">
                  <CustomButton
                    variant="secondary"
                    size="sm"
                    label={revertBtnText}
                    onClick={() => handleRevertClick(version, cloned_form_id)}
                    dataTestid={revertBtndataTestid}
                    ariaLabel={revertBtnariaLabel}
                  />
                </div>
              </div>
            )}
            {!isMajorVersion && (
              <div
                ref={isLastEntry ? lastEntryRef : null}
                className={`history-entry ${
                  categoryType === "WORKFLOW"
                    ? "workflow-minor-grid"
                    : "minor-version-grid"
                }`}
              >
                <div className="bold-headings">Version {version}</div>
                <div className="last-edit-on">
                  <div className="bold-headings">Last Edit On</div>
                  <div className="normal-text">{formatDate(entry.created)}</div>
                </div>
                <div className="last-edit-by">
                  <div className="bold-headings">Last Edit By</div>
                  <div className="normal-text">{entry.createdBy}</div>
                </div>
                <div className="published-on">
                  <div className="bold-headings">Published On</div>
                  <div className="normal-text">{formatDate(entry.created)}</div>
                </div>
                {categoryType === "WORKFLOW" && (
                  <div className="type">
                    <div className="bold-headings">Type</div>
                    <div className="normal-text">{entry.processType}</div>
                  </div>
                )}
                <div className="revert-btn">
                  <CustomButton
                    variant="secondary"
                    size="sm"
                    label={revertBtnText}
                    onClick={() => handleRevertClick(version, cloned_form_id)}
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
            <div className="d-flex align-items-center ">
              <CloseIcon onClick={onClose} />
            </div>
          </Modal.Header>
          <Modal.Body className="history-modal-body">
            <div ref={timelineRef} className="timeline"></div>
            <div className="history-content">
              {renderHistory()}
              <div ref={loadMoreRef} className="d-flex justify-content-center mt-4">
                <CustomButton
                  variant="secondary"
                  size="sm"
                  label={loadMoreBtnText}
                  onClick={loadMoreBtnAction}
                  dataTestid={loadMoreBtndataTestid}
                  ariaLabel={loadMoreBtnariaLabel}
                />
              </div>
            </div>
          </Modal.Body>
        </Modal>

        {/* Confirmation Modal */}
        {selectedVersion && (
          <Modal
            show={showConfirmModal}
            onHide={() => setShowConfirmModal(false)}
            dialogClassName="modal-50w"
            data-testid="confirm-revert-modal"
          >
            <Modal.Header>
              <Modal.Title>
                <b>Use Layout from Version {selectedVersion}</b>
              </Modal.Title>
              <CloseIcon onClick={() => setShowConfirmModal(false)} />
            </Modal.Header>
            <Modal.Body className="">
              This will copy the layout from Version {selectedVersion}{" "}
              overwriting your existing layout.
            </Modal.Body>
            <Modal.Footer className="">
              <CustomButton
                variant="primary"
                size="md"
                label="Keep Current Layout"
                onClick={handleKeepLayout}
              />
              <CustomButton
                variant="secondary"
                size="md"
                label="Replace Current Layout"
                onClick={handleReplaceLayout}
              />
            </Modal.Footer>
          </Modal>
        )}
      </>
    );
  }
);
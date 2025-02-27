import React, { useState, useRef, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { CloseIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";
import { HelperServices } from "@formsflow/service";

interface FormSubmissionHistoryModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  loadMoreBtnAction: () => void;
  loadMoreBtnText: string;
  loadMoreBtndataTestid?: string;
  loadMoreBtnariaLabel?: string;
  allHistory: SubmissionHistory[];
  historyCount: number;
  disabledData?: { key: string; value: any };
}

interface SubmissionHistory {
  created?: string;
  applicationStatus?: string;
  id?: string;
}

const HistoryField = ({
  fields,
}: {
  fields: { id: number; value: string }[];
}) => {
  return (
    <>
      {fields.map(({ id, value }) => (
        <div key={id}>
          <div className="normal-text">{value}</div>
        </div>
      ))}
    </>
  );
};

export const FormSubmissionHistoryModal: React.FC<FormSubmissionHistoryModalProps> =
  React.memo(
    ({
      show,
      onClose,
      title,
      allHistory,
      historyCount,
  
    }) => {
      const { t } = useTranslation();
      const timelineRef = useRef<HTMLDivElement>(null);
      const loadMoreRef = useRef<HTMLDivElement>(null);
      const lastEntryRef = useRef<HTMLDivElement>(null);

      const handleClose = () => {
        onClose();
      };
      const adjustTimelineHeight = () => {
        const timelineElement = timelineRef.current;
        const loadMoreElement = loadMoreRef.current;
        const lastEntryElement = lastEntryRef.current;

        if (timelineElement && lastEntryElement) {
          const lastEntryHeight = lastEntryElement.offsetHeight;
          if (loadMoreElement) {
            const loadMoreHeight = loadMoreElement.offsetHeight;
            const newHeight = `calc(100% - ${
              loadMoreHeight + lastEntryHeight
            }px)`;
            timelineElement.style.height = newHeight;
          } else {
            const newHeight = `calc(100% - ${lastEntryHeight}px)`;
            timelineElement.style.height = newHeight;
          }
        }
      };

      useEffect(() => {
        adjustTimelineHeight();
        window.addEventListener("resize", adjustTimelineHeight);
        return () => {
          window.removeEventListener("resize", adjustTimelineHeight);
        };
      }, [show, allHistory]);

      const renderHistory = () => {
        return allHistory.map((entry, index) => {
          const isLastEntry = index === allHistory.length - 1;
          const fields = [
            { id: 1, value: entry.applicationStatus || "N/A" },
            {
              id: 2,
              value: entry.created
                ? HelperServices?.getLocalDateAndTime(entry.created)
                : "N/A",
            },
          ];

          return (
            <React.Fragment>
              {
                <div
                  ref={isLastEntry ? lastEntryRef : null}
                  className="form-version-grid"
                >
                  
                  <HistoryField fields={fields} />
                </div>
              }
            </React.Fragment>
          );
        });
      };

      return (
        <Modal
          show={show}
          onHide={handleClose}
          dialogClassName="modal-50w"
          data-testid="history-modal"
          aria-labelledby="history-modal-title"
          aria-describedby="history-modal-message"
          size="sm"
        >
          <Modal.Header>
            <Modal.Title id="history-modal-title">
              <b>{t(title)}</b>
            </Modal.Title>
            <div className="d-flex align-items-center">
              <CloseIcon onClick={handleClose} />
            </div>
          </Modal.Header>
          <Modal.Body className="form-history-modal-body">
            {historyCount > 0 && (
              <div ref={timelineRef} className="form-timeline"></div>
            )}
            <div className="history-content">{renderHistory()}</div>
          </Modal.Body>
        </Modal>
      );
    }
  );

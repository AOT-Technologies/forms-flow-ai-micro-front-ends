import React, { useEffect, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import { CloseIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";
import { HelperServices } from "@formsflow/service";

interface FormSubmissionHistoryModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  allHistory: SubmissionHistory[];
  historyCount: number;
}

interface SubmissionHistory {
  created?: string;
  applicationStatus?: string;
  id?: string;
}

const HistoryField = ({ fields }: { fields: { id: number; value: string }[] }) => (
  <>
    <p className="heading">
      {fields.map(({ id, value }) => (
        <>
          {value}
        </>
      ))}
    </p>

    <div className="details">
      <div>
        <p>Created On</p>
        <p>28-05-2025, 02:44:06 PM</p>
      </div>
    </div>
  </>
);

export const FormSubmissionHistoryModal: React.FC<FormSubmissionHistoryModalProps> = React.memo(
  ({ show, onClose, title, allHistory, historyCount }) => {
    const { t } = useTranslation();
    const timelineRef = useRef<HTMLDivElement>(null);
    const lastEntryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const adjustTimelineHeight = () => {
        if (timelineRef.current && lastEntryRef.current) {
          const lastEntryHeight = lastEntryRef.current.offsetHeight;
          timelineRef.current.style.height = `calc(100% - ${lastEntryHeight}px)`;
        }
      };
      
      adjustTimelineHeight();
      window.addEventListener("resize", adjustTimelineHeight);
      return () => window.removeEventListener("resize", adjustTimelineHeight);
    }, [show, allHistory]);

    return (
      <Modal
        show={show}
        onHide={onClose}
        dialogClassName="form-submission-history-modal"
        data-testid="form-history-modal"
        aria-labelledby="form-history-modal-title"
        aria-describedby="form-history-modal-message"
        size="sm"
      >
        <Modal.Header data-testid="form-history-modal-header">
          <Modal.Title id="form-history-modal-title" data-testid="form-history-modal-title" aria-label="Form history modal title">
            <p>{t(title)}</p>
          </Modal.Title>

          <div className="icon-close" onClick={onClose}>
            <CloseIcon aria-label="Close form-history-modal" data-testid="close-icon" />
          </div>
        </Modal.Header>
        <Modal.Body className="history-modal-body" data-testid="form-history-modal-body" aria-label="Form history modal body">
          {historyCount > 0 ? (
            <>
            <div className="history-content" data-testid="form-history-content" aria-label="Form history content">
              <div ref={timelineRef} className="timeline" data-testid="form-history-timeline" aria-label="Form history timeline"></div>
              
                {allHistory.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    ref={index === allHistory.length - 1 ? lastEntryRef : null}
                    className="version major"
                    data-testid={`form-history-entry-${index}`}
                    aria-label={`Form history entry ${index}`}
                  >
                    <HistoryField
                      fields={[
                        { id: 1, value: entry.applicationStatus || "N/A" },
                        { id: 2, value: entry.created ? HelperServices.getLocalDateAndTime(entry.created) : "N/A" },
                      ]}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center" data-testid="form-history-no-entry" aria-label="No submission history found">{t("No submission history found")}</div>
          )}
        </Modal.Body>
      </Modal>
    );
  }
);

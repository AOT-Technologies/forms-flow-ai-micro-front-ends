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

const HistoryField = ({ fields, created }: { fields: { id: number; value: string }[]; created?: string }) => (
  
  <>
    <p className="heading">
      {fields.map(({ id, value }) => (
        <React.Fragment key={id}>
          {value}
        </React.Fragment>
      ))}
    </p>

    <div className="details">
      <div>
        <p>Created On</p>
        <p className="text-nowrap">{created ? HelperServices.getLocalDateAndTime(created) : "N/A"}</p>
      </div>
    </div>
  </>
);

export const FormSubmissionHistoryModal: React.FC<FormSubmissionHistoryModalProps> = React.memo(
  ({ show, onClose, title, allHistory, historyCount }) => {
    const { t } = useTranslation();
    const lastEntryRef = useRef<HTMLDivElement>(null);

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
              <div className="timeline" data-testid="form-history-timeline" aria-label="Form history timeline"></div>
              
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
                      ]}
                      created={entry.created}
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

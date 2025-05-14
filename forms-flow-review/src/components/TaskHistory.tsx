import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import Modal from "react-bootstrap/Modal";
import { CloseIcon } from "@formsflow/components";
import { useTranslation } from "react-i18next";
import { HelperServices } from "@formsflow/service";
import { getFormUrl } from "../api/services/formatterService";
import { MULTITENANCY_ENABLED } from "../constants/index";

interface TaskHistoryModalProps {
  show: boolean;
  onClose: () => void;
}

interface SubmissionHistory {
  created?: string;
  applicationStatus?: string;
  id?: string;
}

const HistoryField = ({
  fields,
}: {
  fields: {
    id?: number;
    header?: string;
    value?: string;
    applicationStatus?: string;
  }[];
}) => (
  <>
    {fields?.length > 0 &&
      fields.map(({ id, value, header, applicationStatus }) => (
        <div
          key={id}
          className={`normal-text d-flex justify-content-between ${
            id === 1 ? "w-30" : ""
          }`}
          data-testid={`history-field-${id}`}
          aria-label={`History field ${id}`}
        >
          <div className="content-headings me-auto">{applicationStatus}</div>
          <div className="text-end">
            <div className="content-headings">{header}</div>
            {value}
          </div>
        </div>
      ))}
  </>
);

export const TaskHistoryModal: React.FC<TaskHistoryModalProps> = React.memo(
  ({ show, onClose }) => {
    const { t } = useTranslation();
    const timelineRef = useRef<HTMLDivElement>(null);
    const lastEntryRef = useRef<HTMLDivElement>(null);
    const appHistory = useSelector((state: any) => state.task?.appHistory);
    const tenantKey = useSelector(
      (state: any) => state.tenants?.tenantData?.tenantkey
    );
    const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";

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
    }, [show, appHistory]);

    const viewSubmission = (data) => {
      const { formId, submissionId } = data;
      const url = getFormUrl(formId, submissionId, redirectUrl);
      return (
        <button
          data-testid={`submission-details-button-${data.id}`}
          className="btn-table btn btn-secondary"
          onClick={() => window.open(url, "_blank")}
        >
          {t("View Submission")}
        </button>
      );
    };

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
          <Modal.Title
            id="form-history-modal-title"
            data-testid="form-history-modal-title"
            aria-label="Form history modal title"
          >
            <b>{t("History")}</b>
          </Modal.Title>
          <CloseIcon
            onClick={onClose}
            aria-label="Close form-history-modal"
            data-testid="close-icon"
          />
        </Modal.Header>
        <Modal.Body
          className="form-history-modal-body"
          data-testid="form-history-modal-body"
          aria-label="Form history modal body"
        >
          {appHistory?.length ? (
            <>
              <div
                ref={timelineRef}
                className="form-timeline"
                data-testid="form-history-timeline"
                aria-label="Form history timeline"
              ></div>
              <div
                className="history-content"
                data-testid="form-history-content"
                aria-label="Form history content"
              >
                {appHistory.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    ref={index === appHistory.length - 1 ? lastEntryRef : null}
                    className="form-version-grid"
                    data-testid={`form-history-entry-${index}`}
                    aria-label={`Form history entry ${index}`}
                  >
                    <HistoryField
                      fields={[
                        {
                          id: 1,
                          header: "",
                          applicationStatus: entry.applicationStatus || "N/A",
                        },
                        {
                          id: 2,
                          header: "Submitter By",
                          value: entry.submittedBy || "N/A",
                        },
                        {
                          id: 3,
                          header: "Created On",
                          value: entry.created
                            ? HelperServices.getLocalDateAndTime(entry.created)
                            : "N/A",
                        },
                        {
                          id: 4,
                          header: "",
                          value: viewSubmission(entry),
                        },
                      ]}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              className="text-center"
              data-testid="form-history-no-entry"
              aria-label="No submission history found"
            >
              {t("No submission history found")}
            </div>
          )}
        </Modal.Body>
      </Modal>
    );
  }
);

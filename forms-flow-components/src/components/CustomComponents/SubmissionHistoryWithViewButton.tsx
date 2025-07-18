import React, { useEffect, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import { CloseIcon } from "..//SvgIcons/index";
import { useTranslation } from "react-i18next";
import { HelperServices } from "@formsflow/service";
import ProcessDiagram from "./BpmnDiagramView";

interface SubmissionHistoryWithViewButtonProps {
  show: boolean;
  onClose: () => void;
  redirectUrl: string;
  histories: SubmissionHistory[];
  showBpmnDiagram?: boolean;
  diagramXML: string;
  activityId: string;
  isProcessDiagramLoading: boolean;
  isHistoryListLoading: boolean;
  showDiagramTools?:boolean;
}

interface SubmissionHistory {
  id?: string | number;
  created?: string;
  applicationStatus?: string;
  submittedBy?: string;
  formId?: string;
  submissionId?: string;
}

export const SubmissionHistoryWithViewButton: React.FC<SubmissionHistoryWithViewButtonProps> =
  React.memo(
    ({
      show,
      onClose,
      redirectUrl,
      histories,
      showBpmnDiagram,
      diagramXML,
      activityId,
      isProcessDiagramLoading,
      isHistoryListLoading,
      showDiagramTools = false
    }) => {
      const { t } = useTranslation();
      const timelineRef = useRef<HTMLDivElement>(null);
      const lastEntryRef = useRef<HTMLDivElement>(null);
      const historyContentRef = useRef(null);
      const flexClass = showBpmnDiagram
        ? "flex-column justify-content-start align-items-start gap-3"
        : "flex-row justify-content-between align-items-center";
      useEffect(() => {
        const adjustTimelineHeight = () => {
          if (timelineRef.current && historyContentRef.current) {
            const contentHeight = historyContentRef.current.offsetHeight;
            timelineRef.current.style.height = `${contentHeight}px`;
          }
        };
     
        if (lastEntryRef.current) {
          adjustTimelineHeight();
          window.addEventListener("resize", adjustTimelineHeight);
          return () =>
            window.removeEventListener("resize", adjustTimelineHeight);
        }
      }, [
        show,
        histories,
        lastEntryRef,
        historyContentRef?.current?.offsetHeight,
      ]);

      const viewSubmission = (data: SubmissionHistory): JSX.Element => {
        const { formId, submissionId } = data;
        const url = `${window.location.origin}${redirectUrl}form/${formId}/submission/${submissionId}`;
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
          size={showBpmnDiagram ? "lg" : "sm"}
        >
          <Modal.Header data-testid="form-history-modal-header">
            <Modal.Title
              id="form-history-modal-title"
              data-testid="form-history-modal-title"
              aria-label="Form history modal title"
            >
              <p>{t("History")}</p>
            </Modal.Title>

            <div className="icon-close" onClick={onClose}>
              <CloseIcon aria-label="Close form-history-modal" data-testid="close-icon" />
            </div>
            
          </Modal.Header>
          <Modal.Body
          className="side-by-side-process-history"
            data-testid="form-history-modal-body"
            aria-label="Form history modal body"
          >
            {isHistoryListLoading ? (
              <>loading</>
            ) : (
         
                <>
                  {showBpmnDiagram && (
                    <div>
                      <ProcessDiagram
                        diagramXML={diagramXML ?? ""}
                        activityId={activityId ?? ""}
                        showDiagramTools={showDiagramTools}
                        isProcessDiagramLoading={isProcessDiagramLoading}
                      />
                    </div>
                  )}
                  
                  {histories?.length ? (
                    <div className="history-modal-body">
                      <div
                        className="history-content submissions"
                        data-testid="form-history-content"
                        aria-label="Form history content"
                        ref={historyContentRef}
                      >
                        <div className="timeline" data-testid="form-history-timeline" aria-label="Form history timeline"></div>
                        {histories.map((entry, index) => (
                          <div
                            key={entry.id ?? index}
                            ref={
                              index === histories.length - 1
                                ? lastEntryRef
                                : null
                            }
                            className="version major"
                            data-testid={`form-history-entry-${index}`}
                            aria-label={`Form history entry ${index}`}
                          >
                            <p className="heading">
                              {entry.applicationStatus}
                            </p>
                            <div className="details">
                              <div>
                                <p>
                                  {t("Submitter By")}
                                </p>
                                <p>
                                  {entry.submittedBy}
                                </p>
                              </div>
                              <div>
                                <p>
                                  {t("Created On")}
                                </p>
                                <p>
                                  {entry.created ? HelperServices.getLocalDateAndTime(entry.created) : "N/A"}
                                </p>
                              </div>
                            </div>

                            {viewSubmission(entry)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="history-modal-body"
                      data-testid="form-history-no-entry"
                      aria-label="No submission history found"
                    >
                      {t("No submission history found.")}
                    </div>
                  )}
                </>
             
            )}
          </Modal.Body>
        </Modal>
      );
    }
  );

export default SubmissionHistoryWithViewButton;

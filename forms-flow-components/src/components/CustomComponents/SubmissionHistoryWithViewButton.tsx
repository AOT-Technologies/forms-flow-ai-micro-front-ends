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
              <b>{t("History")}</b>
            </Modal.Title>
            <CloseIcon
              onClick={onClose}
              aria-label="Close form-history-modal"
              data-testid="close-icon"
            />
          </Modal.Header>
          <Modal.Body
            className="p-0"
            data-testid="form-history-modal-body"
            aria-label="Form history modal body"
          >
            {isHistoryListLoading ? (
              <>loading</>
            ) : (
         
                <div
                  className={`${
                    showBpmnDiagram && "d-flex justify-content-between gap-3 flex-column flex-lg-row analyse-submision-history-modal"}`}
                >
                  {showBpmnDiagram && (
                    <div className="p-5">
                      <ProcessDiagram
                        diagramXML={diagramXML ?? ""}
                        activityId={activityId ?? ""}
                        showDiagramTools={showDiagramTools}
                        isProcessDiagramLoading={isProcessDiagramLoading}
                      />
                    </div>
                  )}

                  {histories?.length ? (
                    <div
                      className={`${
                        showBpmnDiagram ? "p-5 history-div-left-border" : "mt-5"
                      }`}
                    >
                      <div
                        className={`position-relative ${
                          showBpmnDiagram ? "mt-5" : "p-5"
                        }`}
                      >
                        <div
                          ref={timelineRef}
                          className="form-timeline"
                          style={
                            showBpmnDiagram
                              ? { top: "-43px", left: "80px" }
                              : {}
                          }
                          data-testid="form-history-timeline"
                          aria-label="Form history timeline"
                        ></div>
                        <div
                          className="d-flex flex-column gap-3"
                          data-testid="form-history-content"
                          aria-label="Form history content"
                          ref={historyContentRef}
                        >
                          {histories.map((entry, index) => (
                            <div
                              key={entry.id ?? index}
                              ref={
                                index === histories.length - 1
                                  ? lastEntryRef
                                  : null
                              }
                              className={`form-history-entry version-style d-flex  ${flexClass}`}
                              data-testid={`form-history-entry-${index}`}
                              aria-label={`Form history entry ${index}`}
                            >
                              <div className="w-30 content-headings me-auto">
                                {entry.applicationStatus}
                              </div>
                              <div
                                className={`normal-text w-100 gap-${
                                  showBpmnDiagram ? "5" : "3"
                                } d-flex justify-content-${
                                  showBpmnDiagram ? "between" : "end"
                                } align-items-center`}
                              >
                                <div>
                                  <div className="content-headings">
                                    {t("Submitter By")}
                                  </div>
                                  {entry.submittedBy}
                                </div>
                                <div>
                                  <div className="content-headings">
                                    {t("Created On")}
                                  </div>
                                  {entry.created
                                    ? HelperServices.getLocalDateAndTime(
                                        entry.created
                                      )
                                    : "N/A"}
                                </div>
                              </div>

                              <div
                                className={`${!showBpmnDiagram && "w-50 d-flex justify-content-end"}`}
                              >
                                {viewSubmission(entry)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-center"
                      data-testid="form-history-no-entry"
                      aria-label="No submission history found"
                    >
                      {t("No submission history found")}
                    </div>
                  )}
                </div>
             
            )}
          </Modal.Body>
        </Modal>
      );
    }
  );

export default SubmissionHistoryWithViewButton;

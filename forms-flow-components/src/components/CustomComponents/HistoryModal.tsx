import React, { useState, useRef, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";
import { CloseIcon } from "../SvgIcons/index";
import { ConfirmModal } from "./ConfirmModal";
import { useTranslation } from "react-i18next";
import { HelperServices, StorageService} from "@formsflow/service";

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
  loadMoreBtndataTestId?: string;
  loadMoreBtnariaLabel?: string;
  allHistory: AllHistory[];
  categoryType: string;
  historyCount: number;
  currentVersionId?:number|string;
  disabledData:{key:string,value:any}
  ignoreFirstEntryDisable?: boolean
  disableAllRevertButton?: boolean
}

interface AllHistory {
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
  publishedOn?: string;
  id?: string;
}

 

const HistoryField = ({ fields }) => {
    return (
      <div className="details">
        {fields.map(({ id, heading, value }) => (
          <div key={id}>
            <div className="content-headings">{heading}</div>
            <div className="normal-text">{value}</div>
          </div>
        ))}
      </div>
    );
  };

const RevertField = ({
  variant,
  size,
  label,
  onClick,
  dataTestId,
  ariaLabel,
  disabled=false,
}) => {
  return (
    <div className="revert-btn">
      <CustomButton
        disabled={disabled}
        label={label}
        onClick={onClick}
       dataTestId={dataTestId}
        ariaLabel={ariaLabel}
        actionTable
      />
    </div>
  );
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
    loadMoreBtndataTestId = "loadmore-button",
    loadMoreBtnariaLabel = "Loadmore Button",
    allHistory,
    categoryType,
    historyCount,
    disableAllRevertButton = false,
    ignoreFirstEntryDisable = false,
    disabledData = {key:"", value:""} // we can pass the key and its value based on that we can disable revert button eg: key:"processKey",value:"bpmn" if the data[key] == value it will disable
  }) => {
    const { t } = useTranslation();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [clonedFormId, setClonedFormId] = useState<string | null>(null);
    const [processId, setProcessId] = useState<string | null>(null);
    const [hasLoadedMoreForm, setHasLoadedMoreForm] = useState(false);
    const [hasLoadedMoreWorkflow, setHasLoadedMoreWorkflow] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const lastEntryRef = useRef<HTMLDivElement>(null);
    const currentCategoryLabel = categoryType === "FORM" ? "Layout" : "Flow";

    const handleRevertClick = (
      version: string,
      cloned_form_id: string,
      process_id: string
    ) => {
      setSelectedVersion(version);
      setClonedFormId(cloned_form_id);
      setProcessId(process_id);
      setShowConfirmModal(true);
      onClose();
    };

    const handleClose = () => {
      onClose();
      setHasLoadedMoreForm(false);
      setHasLoadedMoreWorkflow(false);
    };

    const handleKeepLayout = () => {
      setShowConfirmModal(false);
    };

    const handleReplaceLayout = () => {
      const idToRevert = categoryType === "FORM" ? clonedFormId : processId;
      revertBtnAction(idToRevert);
      setShowConfirmModal(false);
      setHasLoadedMoreForm(false);
      setHasLoadedMoreWorkflow(false);
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
      // adjustTimelineHeight();
      // window.addEventListener("resize", adjustTimelineHeight);
      if (show) {
        if (!hasLoadedMoreForm && categoryType === "FORM") {
          setHasLoadedMoreForm(false);
        } else if (!hasLoadedMoreWorkflow && categoryType === "WORKFLOW") {
          setHasLoadedMoreWorkflow(false);
        }
      }

      return () => {
        window.removeEventListener("resize", adjustTimelineHeight);
      };
    }, [show, allHistory]);

    const handleLoadMore = () => {
      loadMoreBtnAction();
      if (categoryType === "FORM") {
        setHasLoadedMoreForm(true);
      } else if (categoryType === "WORKFLOW") {
        setHasLoadedMoreWorkflow(true);
      }
    };

    const renderLoadMoreButton = () => {
        const shouldRenderButton = 
          (categoryType === "FORM" && !hasLoadedMoreForm) || 
          (categoryType === "WORKFLOW" && !hasLoadedMoreWorkflow);
        
        return shouldRenderButton ? (
          <div className="load-more" ref={loadMoreRef}>
            <CustomButton
              label={loadMoreBtnText}
              onClick={handleLoadMore}
             dataTestId={loadMoreBtndataTestId}
              ariaLabel={loadMoreBtnariaLabel}
              secondary
            />
          </div>
        ) : null;
      };      

    const renderHistory = () => {
      return allHistory.map((entry, index) => {
        const isMajorVersion = entry.isMajor;
        const version = `${entry.majorVersion}.${entry.minorVersion}`;
        const cloned_form_id =
          categoryType === "FORM" ? entry.changeLog.cloned_form_id : null;
        const process_id = categoryType === "WORKFLOW" ? entry.id : null;
        const isLastEntry = index === allHistory.length - 1;  
        const userRoles = JSON.parse(StorageService.get(StorageService.User.USER_ROLE));
        const isCreateDesigns = userRoles?.includes("create_designs");
        const isViewDesigns = userRoles?.includes("view_designs");
        const isReadOnly = isViewDesigns && !isCreateDesigns
        const revertButtonDisabled = isReadOnly || disableAllRevertButton || entry[disabledData.key] == disabledData.value || (!ignoreFirstEntryDisable && index === 0);
        const fields = [
            { id:1, heading: entry.publishedOn ? t("Published On") : "", value: entry.publishedOn ? HelperServices?.getLocalDateAndTime(entry.publishedOn) : "" },
            { id:2, heading: t("Saved On"), value: HelperServices?.getLocalDateAndTime(entry.created) },
            { id:3, heading: t("Saved By"), value: entry.createdBy },
            ...(categoryType === "WORKFLOW"
              ? [{ id:4, heading: t("Type"), value: entry.processType === "LOWCODE" ? "No-Code" : entry.processType }]
              : []),
          ];

        return (
          <React.Fragment key={`${entry.version}-${index}`}>
            {isMajorVersion && (
              <div
                ref={isLastEntry ? lastEntryRef : null}
                className={`version major-version-grid ${
                  categoryType === "WORKFLOW" ? "workflow-major-grid " : ""
                }`}
              >
                <div className="content-headings">Version {version}</div>
                <HistoryField fields={fields} />
                <RevertField
                  variant="secondary"
                  size="sm"
                  disabled={revertButtonDisabled}
                  label={revertBtnText}
                  onClick={() =>
                    handleRevertClick(version, cloned_form_id, process_id)
                  }
                 dataTestId={revertBtndataTestid}
                 ariaLabel={revertBtnariaLabel}
                />
              </div>
            )}
            {!isMajorVersion && (
              <div
                ref={isLastEntry ? lastEntryRef : null}
                className={`version minor-version-grid ${
                  categoryType === "WORKFLOW" ? "workflow-minor-grid" : ""
                }`}
              >
                <div className="content-headings">Version {version}</div>
                <HistoryField key={`${entry.version}-${index}`} fields={fields} />
                <RevertField
                  variant="secondary"
                  size="sm"
                  label={revertBtnText}
                  disabled={revertButtonDisabled}
                  onClick={() =>
                    handleRevertClick(version, cloned_form_id, process_id)
                  }
                  dataTestId={revertBtndataTestid}
                  ariaLabel={revertBtnariaLabel}
                />
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
          onHide={handleClose}
          dialogClassName="modal-sm"
          data-testid="history-modal"
          aria-labelledby="history-modal-title"
          aria-describedby="history-modal-message"
        >
          <Modal.Header>
            <Modal.Title id="history-modal-title">
              <p>{t(title)}</p>
            </Modal.Title>
            <div className="icon-close" onClick={handleClose}>
              <CloseIcon data-testid="close-icon" />
            </div>
          </Modal.Header>
          <Modal.Body className="history-modal-body">
            <div className="history-content">
              {historyCount > 0 && (
                <div ref={timelineRef} className="timeline"></div>
              )}
              {renderHistory()}
            </div>
            {historyCount > 4 && renderLoadMoreButton()}
          </Modal.Body>
        </Modal>

        {/* Confirmation Modal */}
        {selectedVersion && (
          <ConfirmModal
            show={showConfirmModal}
            title={t(`Use ${currentCategoryLabel} from Version ${selectedVersion}`)}
            message={t(
              `This will copy the ${currentCategoryLabel.toLowerCase()} from Version ${selectedVersion} overwriting your existing ${currentCategoryLabel.toLowerCase()}.`
            )}
            primaryBtnAction={handleKeepLayout}
            onClose={() => setShowConfirmModal(false)}
            primaryBtnText={t(`Keep Current ${currentCategoryLabel}`)}
            secondaryBtnText={t(`Replace Current ${currentCategoryLabel}`)}
            secondaryBtnAction={handleReplaceLayout}
            secondoryBtndataTestid="confirm-revert-button"
          />
        )}
      </>
    );
  }
);

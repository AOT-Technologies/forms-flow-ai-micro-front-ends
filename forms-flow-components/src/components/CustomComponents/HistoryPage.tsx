import React, { useState, useRef, useEffect } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { useTranslation } from "react-i18next";
import { HelperServices, StorageService } from "@formsflow/service";
import { GridColDef } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import { V8CustomButton } from "./CustomButton";
import { ReusableTable } from "./ReusableTable";
import { PromptModal } from "./PromptModal";


interface HistoryPageProps {
  revertBtnAction: (cloneId: string | null) => void;
  loadMoreBtnAction: () => void;
  revertBtnText: string;
  revertBtndataTestid?: string;
  revertBtnariaLabel?: string;
  allHistory: AllHistory[];
  categoryType: string;
  currentVersionId?: number | string;
  disabledData: { key: string; value: any };
  disableAllRevertButton?: boolean;
  loading?: boolean;
  refreshBtnAction: () => void;
  handlePaginationModelChange:()=>void;
  paginationModel:any;
  hideRevertForNoCode?: boolean;
  autoHeight?: boolean;
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

export const HistoryPage: React.FC<HistoryPageProps> = React.memo(
  ({
    revertBtnAction,
    revertBtnText,
    revertBtndataTestid = "revert-button",
    revertBtnariaLabel = "Revert Button",
    allHistory,
    categoryType,
    disableAllRevertButton = false,
    disabledData = { key: "", value: "" }, // we can pass the key and its value based on that we can disable revert button eg: key:"processKey",value:"bpmn" if the data[key] == value it will disable
    loading = false,
    refreshBtnAction,
    handlePaginationModelChange,
    paginationModel,
    hideRevertForNoCode = false,
    autoHeight = false,
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

    const handleRevertClick = (params: any) => {
      // For WORKFLOW category (BPMN, DMN, and LOWCODE), handle them the same way
      if (categoryType === "WORKFLOW" && (params.processType === "BPMN" || params.processType === "DMN" || params.processType === "LOWCODE")) {
        const version = `${params.majorVersion}.${params.minorVersion}`;
        setShowConfirmModal(true);
        setSelectedVersion(version);
        setProcessId(params.id);
      } else {
        // For FORM category, show confirmation modal
        setShowConfirmModal(true);
        setSelectedVersion(params.version);
        setClonedFormId(params.changeLog?.cloned_form_id);
        setProcessId(params.id);
      }
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
        if (!hasLoadedMoreForm && categoryType === "FORM") {
          setHasLoadedMoreForm(false);
        } else if (!hasLoadedMoreWorkflow && categoryType === "WORKFLOW") {
          setHasLoadedMoreWorkflow(false);
        }

      return () => {
        window.removeEventListener("resize", adjustTimelineHeight);
      };
    }, [allHistory]);

    const generateRows = (historyData: AllHistory[]) => {
      return historyData.map((entry, index) => ({
        id: entry.id || `${entry.formId}-${index}`,
        index: index,
        ...entry,
      }));
    };

const generateColumns = (): GridColDef[] => {
  const columns: GridColDef[] = [
    {
      field: 'version',
      headerName: t('Version'),
      flex: 0.6,
      sortable: false,
      headerAlign: 'left',
      align: 'left',
      valueGetter: (value, row) => `${row.majorVersion}.${row.minorVersion}`,
    },
    {
      field: 'publishedOn',
      headerName: t('Published on'),
      flex: 1,
      sortable: false,
      headerAlign: 'left',
      align: 'left',
      valueGetter: (value, row) => 
        row.publishedOn ? HelperServices?.getLocalDateAndTime(row.publishedOn) : '-',
    },
    {
      field: 'created',
      headerName: t('Last saved'),
      flex: 1,
      sortable: false,
      headerAlign: 'left',
      align: 'left',
      valueGetter: (value, row) => HelperServices?.getLocalDateAndTime(row.created),
    },
    {
      field: 'createdBy',
      headerName: t('Saved by'),
      flex: 1.2,
      sortable: false,
      headerAlign: 'left',
      align: 'left',
    },
  ];

  // Add TYPE column only for WORKFLOW category (after Saved by)
  if (categoryType === "WORKFLOW") {
    columns.push({
      field: 'processType',
      headerName: t('Type'),
      flex: 0.8,
      sortable: false,
      headerAlign: 'left',
      align: 'left',
      valueGetter: (value, row) => row.processType || '-',
    });
  }

  // Add actions column
  columns.push({
    field: "actions",
    renderHeader: () => (
        <V8CustomButton
          variant="secondary"
          label={t("Refresh")}
          onClick={refreshBtnAction}
          dataTestId="refresh-button"
          ariaLabel={t("Refresh Button")}
        />
    ),
    flex: 0.9,
    sortable: false,
    headerAlign: 'right',
    headerClassName: 'last-column',
    align: 'right',
   renderCell: (params) => {
  if(params.row.index === 0){
    return null;
  }

  // Hide revert button for No Code entries when user switched from No-Code to BPMN
  if (hideRevertForNoCode && params.row.processType === "LOWCODE") {
    return null;
  }

  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE)
  );
  const isCreateDesigns = userRoles?.includes("create_designs");
  const isViewDesigns = userRoles?.includes("view_designs");
  const isReadOnly = isViewDesigns && !isCreateDesigns;
  const revertButtonDisabled =
    isReadOnly ||
    disableAllRevertButton ||
    params.row[disabledData.key] == disabledData.value;
  return <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', py: 0.5, justifyContent: 'flex-end' }}>
    <V8CustomButton
      label={revertBtnText}
      variant="secondary"
      disabled={revertButtonDisabled}
      onClick={() => handleRevertClick(params.row)}
      dataTestId={revertBtndataTestid}
      ariaLabel={t(revertBtnariaLabel)}
      />
    </Box>
}
  });

  return columns;
};

    return (
      <>
        <div
          className="historypage-container"
          data-testid="history-page"
          aria-labelledby={t("history-page-table")}
          aria-describedby="history-page-table">
          <ReusableTable
            rows={generateRows(allHistory)}
            columns={generateColumns()}
            paginationMode="client"
            sortingMode="client"
            hideFooter
            disableColumnResize
            rowHeight={55}
            disableColumnMenu
            disableRowSelectionOnClick
            loading={loading}
            noRowsLabel={t("No history found")}
            autoHeight={autoHeight}
            sx={{ height: "auto", width: "100%" }}
          />
        </div>

        {/* Confirmation Modal */}
        {selectedVersion && (
          // <ConfirmModal
          //   show={showConfirmModal}
          //   title={t(
          //     `Use ${currentCategoryLabel} from Version ${selectedVersion}`
          //   )}
          //   message={t(
          //     `This will copy the ${currentCategoryLabel.toLowerCase()} from Version ${selectedVersion} overwriting your existing ${currentCategoryLabel.toLowerCase()}.`
          //   )}
          //   primaryBtnAction={handleKeepLayout}
          //   onClose={() => setShowConfirmModal(false)}
          //   primaryBtnText={t(`Keep Current ${currentCategoryLabel}`)}
          //   secondaryBtnText={t(`Replace Current ${currentCategoryLabel}`)}
          //   secondaryBtnAction={handleReplaceLayout}
          //   secondoryBtndataTestid="confirm-revert-button"
          // />

        <PromptModal
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
          size="sm"
          type="info"
        />
        )}
      </>
    );
  }
);

import React, { useState, useRef, useEffect } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { useTranslation } from "react-i18next";
import { HelperServices, StorageService, StyleServices } from "@formsflow/service";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Paper } from "@mui/material";
import { V8CustomButton, } from "./CustomButton";
import { RefreshIcon } from "../SvgIcons/index";

const iconColor = StyleServices.getCSSVariable('--ff-gray-medium-dark');

interface HistoryPageProps {
  revertBtnAction: (cloneId: string | null) => void;
  loadMoreBtnAction: () => void;
  revertBtnText: string;
  revertBtndataTestid?: string;
  revertBtnariaLabel?: string;
  allHistory: AllHistory[];
  categoryType: string;
  historyCount: number;
  currentVersionId?: number | string;
  disabledData: { key: string; value: any };
  disableAllRevertButton?: boolean;
  loading?: boolean;
  refreshBtnAction: () => void;
  handlePaginationModelChange:()=>void,
  paginationModel:any,
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
    historyCount,
    disableAllRevertButton = false,
    disabledData = { key: "", value: "" }, // we can pass the key and its value based on that we can disable revert button eg: key:"processKey",value:"bpmn" if the data[key] == value it will disable
    loading = false,
    refreshBtnAction,
    handlePaginationModelChange,
    paginationModel,
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
      params: any
    ) => {
      if (params.processType === "BPMN") {
        const version = `${params.majorVersion}.${params.minorVersion}`;
        setSelectedVersion(version);
        setProcessId(params.id);
        revertBtnAction(params.id);
      } else {
        setShowConfirmModal(true);
        setSelectedVersion(params.version);
        setClonedFormId(params.cloned_form_id);
        setProcessId(params.process_id);
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

      return [
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
        {
          field: "actions",
          renderHeader: () => (
              <V8CustomButton
                variant="secondary"
                icon={<RefreshIcon color={iconColor} />}
                iconOnly
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
        },
      ];
    };

    return (
      <>
        <Paper sx={{ height: { sm: 400, md: 510, lg: 510 }, width: "100%" }}
          className="historypage-container"
          data-testid="history-page"
          aria-labelledby={t("history-page-table")}
          aria-describedby="history-page-table">
          <DataGrid
            rows={generateRows(allHistory)}
            columns={generateColumns()}
            paginationMode="server"
            paginationModel={paginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            hideFooterSelectedRowCount
            disableColumnResize
            rowHeight={55}
            columnHeaderHeight={55}
            disableColumnMenu
            disableRowSelectionOnClick
            loading={loading}
            onPaginationModelChange={handlePaginationModelChange}
            rowCount={historyCount}
            slotProps={{
              loadingOverlay: {
                variant: 'skeleton',
                noRowsVariant: 'skeleton',
              },
            }}
          />
        </Paper>

        {/* Confirmation Modal */}
        {selectedVersion && (
          <ConfirmModal
            show={showConfirmModal}
            title={t(
              `Use ${currentCategoryLabel} from Version ${selectedVersion}`
            )}
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

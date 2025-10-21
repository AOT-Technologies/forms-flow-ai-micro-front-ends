import React, { useState, useRef, useEffect } from "react";
import { CustomButton } from "./Button";
// import { CloseIcon } from "../SvgIcons/index";
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
  // loadMoreBtnText: string;
  revertBtndataTestid?: string;
  revertBtnariaLabel?: string;
  // loadMoreBtndataTestId?: string;
  // loadMoreBtnariaLabel?: string;
  allHistory: AllHistory[];
  categoryType: string;
  historyCount: number;
  currentVersionId?: number | string;
  disabledData: { key: string; value: any };
  ignoreFirstEntryDisable?: boolean;
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

// const HistoryField = ({ fields }) => {
//   return (
//     <div className="details">
//       {fields.map(({ id, heading, value }) => (
//         <>
//           {heading ? (
//             <div key={id}>
//               <p>{heading}</p>
//               <p>{value}</p>
//             </div>
//           ) : (
//             ""
//           )}
//         </>
//       ))}
//     </div>
//   );
// };

// const RevertField = ({
//   variant,
//   size,
//   label,
//   onClick,
//   dataTestId,
//   ariaLabel,
//   disabled = false,
// }) => {
//   return (
//     <CustomButton
//       disabled={disabled}
//       label={label}
//       onClick={onClick}
//       dataTestId={dataTestId}
//       ariaLabel={ariaLabel}
//       actionTable
//     />
//   );
// };

export const HistoryPage: React.FC<HistoryPageProps> = React.memo(
  ({
    revertBtnAction,
    // loadMoreBtnAction,
    revertBtnText,
    // loadMoreBtnText,
    revertBtndataTestid = "revert-button",
    revertBtnariaLabel = "Revert Button",
    // loadMoreBtndataTestId = "loadmore-button",
    // loadMoreBtnariaLabel = "Loadmore Button",
    allHistory,
    categoryType,
    historyCount,
    disableAllRevertButton = false,
    ignoreFirstEntryDisable = false,
    disabledData = { key: "", value: "" }, // we can pass the key and its value based on that we can disable revert button eg: key:"processKey",value:"bpmn" if the data[key] == value it will disable
    // handleRefresh,
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
      setShowConfirmModal(true);
      if (params.processType === "BPMN") {
        const version = `${params.majorVersion}.${params.minorVersion}`;
        setSelectedVersion(version);
        setProcessId(params.id);
        revertBtnAction;
      } else {
        setSelectedVersion(params.version);
        setClonedFormId(params.cloned_form_id);
        setProcessId(params.process_id);
      }
      // onClose();
    };

    useEffect(() => {
      console.log("allHistory on page load:", allHistory);
    }, []);

    // const handleClose = () => {
    //   // onClose();
    //   setHasLoadedMoreForm(false);
    //   setHasLoadedMoreWorkflow(false);
    // };

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
      // if (show) {
        if (!hasLoadedMoreForm && categoryType === "FORM") {
          setHasLoadedMoreForm(false);
        } else if (!hasLoadedMoreWorkflow && categoryType === "WORKFLOW") {
          setHasLoadedMoreWorkflow(false);
        }
      // }

      return () => {
        window.removeEventListener("resize", adjustTimelineHeight);
      };
    }, [allHistory]);

    // const handleLoadMore = () => {
    //   loadMoreBtnAction();
    //   if (categoryType === "FORM") {
    //     setHasLoadedMoreForm(true);
    //   } else if (categoryType === "WORKFLOW") {
    //     setHasLoadedMoreWorkflow(true);
    //   }
    // };

    // const renderLoadMoreButton = () => {
    //   const shouldRenderButton =
    //     (categoryType === "FORM" && !hasLoadedMoreForm) ||
    //     (categoryType === "WORKFLOW" && !hasLoadedMoreWorkflow);

    //   return shouldRenderButton ? (
    //     <div className="load-more" ref={loadMoreRef}>
    //       <CustomButton
    //         label={loadMoreBtnText}
    //         onClick={handleLoadMore}
    //         dataTestId={loadMoreBtndataTestId}
    //         ariaLabel={loadMoreBtnariaLabel}
    //         secondary
    //       />
    //     </div>
    //   ) : null;
    // };
 
    // const paginationModel = { page: 0, pageSize: 10 };

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
          width: 100,
          sortable: true,
          valueGetter: (value, row) => `${row.majorVersion}.${row.minorVersion}`,
        },
        {
          field: 'publishedOn',
          headerName: t('Published On'),
          width: 200,
          sortable: false,
          valueGetter: (value, row) => 
            row.publishedOn ? HelperServices?.getLocalDateAndTime(row.publishedOn) : '-',
        },
        {
          field: 'created',
          headerName: t('Last Saved'),
          width: 200,
          sortable: false,
          valueGetter: (value, row) => HelperServices?.getLocalDateAndTime(row.created),
        },
        {
          field: 'createdBy',
          headerName: t('Saved By'),
          width: 250,
          sortable: false,
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
          flex: 1,
          sortable: false,
          renderCell: (params) => {
            if(params.row.index === 0) {
              return null;
            }
            const cloned_form_id =
              categoryType === "FORM" ? params.row.changeLog.cloned_form_id : null;
            const process_id = categoryType === "WORKFLOW" ? params.row.id : null;
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

            return <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', py: 0.5 }}>
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

    // const renderHistory = () => {
    //   return allHistory.map((entry, index) => {
    //     const isMajorVersion = entry.isMajor;
    //     const version = `${entry.majorVersion}.${entry.minorVersion}`;
    //     const cloned_form_id =
    //       categoryType === "FORM" ? entry.changeLog.cloned_form_id : null;
    //     const process_id = categoryType === "WORKFLOW" ? entry.id : null;
    //     const isLastEntry = index === allHistory.length - 1;
    //     const userRoles = JSON.parse(
    //       StorageService.get(StorageService.User.USER_ROLE)
    //     );
    //     const isCreateDesigns = userRoles?.includes("create_designs");
    //     const isViewDesigns = userRoles?.includes("view_designs");
    //     const isReadOnly = isViewDesigns && !isCreateDesigns;
    //     const revertButtonDisabled =
    //       isReadOnly ||
    //       disableAllRevertButton ||
    //       entry[disabledData.key] == disabledData.value ||
    //       (!ignoreFirstEntryDisable && index === 0);
    //     const fields = [
    //       {
    //         id: 1,
    //         heading: entry.publishedOn ? t("Published On") : "",
    //         value: entry.publishedOn
    //           ? HelperServices?.getLocalDateAndTime(entry.publishedOn)
    //           : "",
    //       },
    //       {
    //         id: 2,
    //         heading: t("Saved On"),
    //         value: HelperServices?.getLocalDateAndTime(entry.created),
    //       },
    //       { id: 3, heading: t("Saved By"), value: entry.createdBy },
    //       ...(categoryType === "WORKFLOW"
    //         ? [
    //             {
    //               id: 4,
    //               heading: t("Type"),
    //               value:
    //                 entry.processType === "LOWCODE"
    //                   ? "No-Code"
    //                   : entry.processType,
    //             },
    //           ]
    //         : []),
    //     ];

    //     return (
    //       <React.Fragment key={`${entry.version}-${index}`}>
    //         {isMajorVersion && (
    //           <div
    //             ref={isLastEntry ? lastEntryRef : null}
    //             className={`version major ${
    //               categoryType === "WORKFLOW" ? "workflow" : ""
    //             }`}
    //           >
    //             <p className="heading">Version {version}</p>
    //             <HistoryField fields={fields} />
    //             <RevertField
    //               variant="secondary"
    //               size="sm"
    //               disabled={revertButtonDisabled}
    //               label={revertBtnText}
    //               onClick={() =>
    //                 handleRevertClick(version, cloned_form_id, process_id)
    //               }
    //               dataTestId={revertBtndataTestid}
    //               ariaLabel={revertBtnariaLabel}
    //             />
    //           </div>
    //         )}
    //         {!isMajorVersion && (
    //           <div
    //             ref={isLastEntry ? lastEntryRef : null}
    //             className={`version minor ${
    //               categoryType === "WORKFLOW" ? "workflow" : ""
    //             }`}
    //           >
    //             <p className="heading">Version {version}</p>
    //             <HistoryField
    //               key={`${entry.version}-${index}`}
    //               fields={fields}
    //             />
    //             <RevertField
    //               variant="secondary"
    //               size="sm"
    //               label={revertBtnText}
    //               disabled={revertButtonDisabled}
    //               onClick={() =>
    //                 handleRevertClick(version, cloned_form_id, process_id)
    //               }
    //               dataTestId={revertBtndataTestid}
    //               ariaLabel={revertBtnariaLabel}
    //             />
    //           </div>
    //         )}
    //       </React.Fragment>
    //     );
    //   });
    // };
    return (
      <>
        {/* <div
          className="historypage-container"
          data-testid="history-page"
          aria-labelledby="history-page-title"
          aria-describedby="history-page-message"
        >
          <div className="historypage-header">
            <div className="historypage-title" id="history-page-title">
              <p>{t(title)}</p>
            </div>
            <div className="icon-close" onClick={handleClose}>
              <CloseIcon data-testid="close-icon" />
            </div>
          </div>
          <div className="historypage-body">
            <div className="history-content">
              {historyCount > 0 && (
                <div ref={timelineRef} className="timeline"></div>
              )}
              {renderHistory()}
            </div>
            {historyCount > 4 && renderLoadMoreButton()}
          </div>
        </div> */}
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

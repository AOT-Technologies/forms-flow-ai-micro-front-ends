import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  PromptModal,
  ReusableTable,
  V8CustomButton,
  V8CustomDropdownButton,
} from "@formsflow/components";
import {
  GovernedContentRecord,
  fetchGovernedContentList,
  getApiErrorMessage,
  retireGovernedContent,
} from "../../services/governedContent";
import { getOwner, getPolicyReference, isRetired } from "./governedBlock";
import RetiredChip from "./RetiredChip";

// Figma REV 1.1 (zero state), REV 1.2 / 1.7 (library), REV 3.1–3.4 (retire
// from the row menu; retired rows stay, badged, last, with View only),
// REV 4.1 / 4.5 (read-only while governed content is off).

interface GovernedContentListProps {
  onCreate: () => void;
  // Opens a block: editable when active, read-only once retired.
  onEdit: (id: number) => void;
  // Governed content is off: no creating, editing or retiring.
  readOnly?: boolean;
  // Shown as "Go to Organization" on the off notice when provided.
  onOpenOrganization?: () => void;
}

interface GovernedContentRow {
  id: number;
  name: string;
  requirement: GovernedContentRecord["requirement"];
  owner: string;
  policyReference: string;
  retired: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGINATION = { page: 0, pageSize: 10 };
const DEFAULT_SORT_MODEL: { field: string; sort: "asc" | "desc" }[] = [];
const getRowId = (row: GovernedContentRow) => row.id;

// Active before retired, required before optional, then alphabetical;
// header sorting overrides this.
const byStatusRequirementThenName = (
  a: GovernedContentRow,
  b: GovernedContentRow
) => {
  if (a.retired !== b.retired) return a.retired ? 1 : -1;
  if (a.requirement !== b.requirement)
    return a.requirement === "required" ? -1 : 1;
  return a.name.localeCompare(b.name);
};

const toRow = (record: GovernedContentRecord): GovernedContentRow => ({
  id: record.id,
  name: record.name,
  requirement: record.requirement,
  owner: getOwner(record),
  policyReference: getPolicyReference(record),
  retired: isRetired(record),
});

// A div, not a span: the theme forces every span in a grid cell to
// display: block with ellipsis, which would stack the chip under the name.
const renderName = (params: { row: GovernedContentRow }) => (
  <div className="ff-governed-list__name">
    {params.row.name}
    {params.row.retired && (
      <RetiredChip dataTestId={`governed-content-retired-${params.row.id}`} />
    )}
  </div>
);

const GovernedContentList: React.FC<GovernedContentListProps> = ({
  onCreate,
  onEdit,
  readOnly = false,
  onOpenOrganization,
}) => {
  const { t } = useTranslation();
  const [records, setRecords] = useState<GovernedContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [sortModel, setSortModel] = useState(DEFAULT_SORT_MODEL);
  const [paginationModel, setPaginationModel] = useState(DEFAULT_PAGINATION);
  const [retireCandidate, setRetireCandidate] =
    useState<GovernedContentRow | null>(null);
  const [retiring, setRetiring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGovernedContentList()
      .then((data) => {
        if (cancelled) return;
        setRecords(data);
        setLoadError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setRecords([]);
        setLoadError(
          getApiErrorMessage(err, t("Governed content could not be loaded."))
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, t]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  const rows = useMemo(
    () => records.map(toRow).sort(byStatusRequirementThenName),
    [records]
  );

  const handleRetire = useCallback(() => {
    if (!retireCandidate) return;
    setRetiring(true);
    retireGovernedContent(retireCandidate.id)
      .then(() => {
        toast.success(t("Block retired successfully"));
        refresh();
      })
      .catch((err) =>
        toast.error(
          getApiErrorMessage(
            err,
            t("The block could not be retired. Please try again.")
          )
        )
      )
      .finally(() => {
        setRetiring(false);
        setRetireCandidate(null);
      });
  }, [retireCandidate, refresh, t]);

  const renderActions = useCallback(
    (params: { row: GovernedContentRow }) =>
      params.row.retired ? (
        <V8CustomButton
          label={t("View")}
          variant="secondary"
          onClick={() => onEdit(params.row.id)}
          dataTestId={`governed-content-view-${params.row.id}`}
          ariaLabel={t("View {{name}}", { name: params.row.name })}
        />
      ) : (
        <V8CustomDropdownButton
          label={t("Edit")}
          onLabelClick={() => onEdit(params.row.id)}
          dropdownItems={[
            {
              label: t("Retire"),
              value: "retire",
              onClick: () => setRetireCandidate(params.row),
              dataTestId: `governed-content-retire-${params.row.id}`,
              ariaLabel: t("Retire {{name}}", { name: params.row.name }),
              className: "delete-dropdown-item",
            },
          ]}
          variant="secondary"
          menuPosition="right"
          disabled={readOnly}
          dataTestId={`governed-content-edit-${params.row.id}`}
          ariaLabel={t("Edit {{name}}", { name: params.row.name })}
        />
      ),
    [onEdit, readOnly, t]
  );

  const renderRefresh = useCallback(
    () => (
      <V8CustomButton
        variant="secondary"
        label={t("Refresh")}
        onClick={refresh}
        dataTestId="governed-content-refresh"
      />
    ),
    [refresh, t]
  );

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: t("Name"),
        flex: 2,
        minWidth: 200,
        sortable: true,
        cellClassName: "text-break",
        renderCell: renderName,
      },
      {
        field: "requirement",
        headerName: t("Type"),
        flex: 0.7,
        minWidth: 100,
        sortable: false,
        renderCell: (params: { row: GovernedContentRow }) =>
          params.row.requirement === "required" ? t("Required") : t("Optional"),
      },
      {
        field: "owner",
        headerName: t("Owner"),
        flex: 1,
        minWidth: 140,
        sortable: true,
        cellClassName: "text-break",
      },
      {
        field: "policyReference",
        headerName: t("Policy reference"),
        flex: 1.5,
        minWidth: 160,
        sortable: false,
        cellClassName: "text-break",
      },
      {
        field: "actions",
        headerName: "",
        renderHeader: renderRefresh,
        renderCell: renderActions,
        sortable: false,
        headerAlign: "right",
        align: "right",
        width: 110,
        minWidth: 110,
        flex: 0,
        headerClassName: "last-column",
        cellClassName: "last-column",
      },
    ],
    [renderActions, renderRefresh, t]
  );

  const renderEmptyState = useCallback(() => {
    let emptyText = t(
      "Create a block to give form designers approved wording, like a privacy or retention notice."
    );
    if (loadError) emptyText = loadError;
    else if (readOnly)
      emptyText = t(
        "Once governed content is on, blocks you create here give form designers approved wording, like a privacy or retention notice."
      );
    return (
      <div
        className="ff-governed-list__empty"
        role="status"
        data-testid="governed-content-empty"
      >
        <p className="ff-governed-list__empty-title">
          {loadError
            ? t("Governed content could not be loaded")
            : t("No governed content yet")}
        </p>
        <p className="ff-governed-list__empty-text">{emptyText}</p>
        <V8CustomButton
          label={loadError ? t("Try again") : t("Create new block")}
          variant="primary"
          onClick={loadError ? refresh : onCreate}
          disabled={!loadError && readOnly}
          dataTestId={
            loadError
              ? "governed-content-retry"
              : "governed-content-empty-create"
          }
        />
      </div>
    );
  }, [loadError, onCreate, readOnly, refresh, t]);

  const customSlots = useMemo(
    () => ({ noRowsOverlay: renderEmptyState }),
    [renderEmptyState]
  );

  return (
    <div className="ff-governed-list" data-testid="governed-content-table">
      {readOnly && (
        <div
          className="ff-governed-list__off-notice"
          role="status"
          data-testid="governed-content-off-notice"
        >
          <p className="ff-governed-list__off-text">
            {/* Zero state (REV 4.1) points the way; a library (REV 4.5) says what's locked. */}
            {!loading && records.length === 0
              ? t(
                  "Governed content is off. Turn it on in Organization to start creating blocks."
                )
              : t(
                  "Governed content is off. Blocks can’t be created, changed or retired."
                )}
          </p>
          {onOpenOrganization && (
            <V8CustomButton
              label={t("Go to Organization")}
              variant="primary"
              onClick={onOpenOrganization}
              dataTestId="governed-content-go-to-organization"
            />
          )}
        </div>
      )}

      <ReusableTable
        columns={columns}
        rows={rows}
        loading={loading}
        getRowId={getRowId}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        paginationMode="client"
        sortingMode="client"
        disableColumnMenu
        disableRowSelectionOnClick
        disableVirtualization
        customSlots={customSlots}
        hideFooter={rows.length === 0}
        autoHeight
        disableColumnResize={false}
      />

      <PromptModal
        show={Boolean(retireCandidate)}
        onClose={() => !retiring && setRetireCandidate(null)}
        title={t("Retire this block?")}
        message={t(
          "{{name}} is removed from each form carrying it the next time that form is opened and saved.",
          { name: retireCandidate?.name ?? "" }
        )}
        type="danger"
        primaryBtnText={t("Retire")}
        primaryBtnAction={handleRetire}
        primaryBtndataTestid="governed-content-retire-confirm"
        buttonLoading={retiring}
        secondaryBtnText={t("Cancel")}
        secondaryBtnAction={() => setRetireCandidate(null)}
        secondoryBtndataTestid="governed-content-retire-cancel"
        secondaryBtnDisable={retiring}
        dataTestId="governed-content-retire-modal"
      />
    </div>
  );
};

export default GovernedContentList;

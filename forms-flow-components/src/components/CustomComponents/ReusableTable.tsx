import React, { useCallback, useMemo } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useTranslation } from "react-i18next";
import { NewSortDownIcon, bundleIcon as BundleIcon } from "../SvgIcons";
import { StyleServices } from "@formsflow/service";
import { EmptyState, EmptyStateAction } from "./EmptyState";

interface ReusableTableProps {
  columns: any[];
  rows: any[];
  rowCount?: number;
  loading?: boolean;
  sortModel?: any[];
  onSortModelChange?: (model: any) => void;
  paginationModel?: any;
  onPaginationModelChange?: (model: any) => void;
  getRowId?: (row: any) => string | number;
  pageSizeOptions?: number[];
  rowHeight?: number;
  sx?: object;
  dataGridProps?: object;
  noRowsLabel?: string;
  emptyStateMessage?: string;
  emptyStateAction?: EmptyStateAction;
  disableColumnResize?: boolean;
  disableColumnMenu?: boolean;
  disableRowSelectionOnClick?: boolean;
  paginationMode?: "server" | "client";
  sortingMode?: "server" | "client";
  customSlots?: object;
  customSlotProps?: object;
  customLocaleText?: object;
  enableStickyActions?: boolean;
  disableVirtualization?: boolean;
  enableRowExpansion?: boolean;
  notesField?: string;
  hideFooter?: boolean;
  autoHeight?: boolean;
  showBundleIcon?: boolean;
  formNameField?: string;
  formTypeField?: string;
}

// Module-level defaults: identical values to the previous inline defaults, hoisted so
// their identity is stable across renders. Several of them are useMemo dependencies
// below (getRowId -> memoizedRows, customSlots -> defaultSlots, customLocaleText ->
// defaultLocaleText), so fresh per-render identities forced those memos (and the
// DataGrid) to rebuild on every render whenever the caller omitted the prop.
const DEFAULT_SORT_MODEL: any[] = [];
const DEFAULT_GET_ROW_ID = (row: any) => row.id || row._id;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_SX = { height: "100%", width: "100%" };
const DEFAULT_DATA_GRID_PROPS = {};
const DEFAULT_CUSTOM_SLOTS = {};
const DEFAULT_CUSTOM_SLOT_PROPS = {};
const DEFAULT_CUSTOM_LOCALE_TEXT = {};
// Stable identities for values handed straight to the DataGrid (see C.9): none of
// these close over component state, so they can live at module scope.
const DEFAULT_SORTING_ORDER: ("asc" | "desc")[] = ["asc", "desc"];
const internalGetRowId = (row: any) => row.id;
const getRowClassName = (params: any) => {
  if (params.row.__isExpansionRow__) {
    return "expansion-row";
  }
  return "";
};

export const ReusableTable: React.FC<ReusableTableProps> = ({
  columns = [],
  rows = [],
  rowCount,
  loading = false,
  sortModel = DEFAULT_SORT_MODEL,
  onSortModelChange,
  paginationModel,
  onPaginationModelChange,
  getRowId = DEFAULT_GET_ROW_ID,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  rowHeight = 55,
  sx = DEFAULT_SX,
  dataGridProps = DEFAULT_DATA_GRID_PROPS,
  noRowsLabel,
  emptyStateMessage,
  emptyStateAction,
  disableColumnResize = true,
  disableColumnMenu = true,
  disableRowSelectionOnClick = true,
  paginationMode = "server",
  sortingMode = "server",
  customSlots = DEFAULT_CUSTOM_SLOTS,
  customSlotProps = DEFAULT_CUSTOM_SLOT_PROPS,
  customLocaleText = DEFAULT_CUSTOM_LOCALE_TEXT,
  enableStickyActions = false,
  disableVirtualization = false,
  enableRowExpansion = false,
  notesField = "notes",
  hideFooter = false,
  autoHeight = false,
  showBundleIcon = false,
  formNameField = "formName",
  formTypeField = "formType",
}) => {
  const { t } = useTranslation();
  // Memoized CSS variable read (getComputedStyle forces a style recalc) — same
  // pattern as Search.tsx; also keeps the defaultSlots memo below stable.
  const iconColor = useMemo(
    () => StyleServices.getCSSVariable("--ff-gray-medium-dark"),
    []
  );

  // Create empty state overlay slot if emptyStateMessage or emptyStateAction is provided
  const emptyStateOverlay = useMemo(() => {
    if (emptyStateMessage || emptyStateAction) {
      return () => (
        <div className="d-flex align-items-center justify-content-center h-100">
          <EmptyState
            message={emptyStateMessage || noRowsLabel || "No data available"}
            action={emptyStateAction}
            dataTestId="reusable-table-empty-state"
          />
        </div>
      );
    }
    return undefined;
  }, [emptyStateMessage, emptyStateAction, noRowsLabel]);

  const defaultSlots = useMemo(() => {
    const slots: any = {
      columnSortedDescendingIcon: () => (
        <div>
          <NewSortDownIcon color={iconColor} />
        </div>
      ),
      columnSortedAscendingIcon: () => (
        <div style={{ transform: "rotate(180deg)" }}>
          <NewSortDownIcon color={iconColor} />
        </div>
      ),
    };

    // Add empty state overlay if provided and not already in customSlots
    if (emptyStateOverlay && !(customSlots as any)?.noRowsOverlay) {
      slots.noRowsOverlay = emptyStateOverlay;
    }

    // Merge with custom slots (custom slots take precedence)
    return {
      ...slots,
      ...customSlots,
    };
  }, [iconColor, customSlots, emptyStateOverlay]);

  const defaultSlotProps = useMemo(
    () => ({
      ...customSlotProps,
    }),
    [customSlotProps]
  );

  // Stable slotProps object for the DataGrid (C.9). Merge order preserved: the
  // loadingOverlay default first so consumer-provided slotProps still override it.
  const mergedSlotProps = useMemo(
    () => ({
      loadingOverlay: {
        variant: "skeleton" as const,
        noRowsVariant: "skeleton" as const,
      },
      ...defaultSlotProps,
    }),
    [defaultSlotProps]
  );

  const defaultLocaleText = useMemo(() => {
    return {
      noRowsLabel: noRowsLabel || t("No data available"),
      ...customLocaleText,
    };
  }, [noRowsLabel, customLocaleText, t]);

  // Enhanced columns - modify first column to render expansion content
  const enhancedColumns: GridColDef[] = useMemo(() => {
    const baseColumns = showBundleIcon
      ? columns.map((col) => {
          if (col.field !== formNameField) return col;
          return {
            ...col,
            renderCell: (params: any) => {
              const isBundle = params.row[formTypeField] === "bundle";
              const original = col.renderCell
                ? col.renderCell(params)
                : params.value;
              if (!isBundle) return original;
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    maxWidth: "100%",
                  }}
                >
                  <div
                    style={{
                      flex: "0 1 auto",
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    {original}
                  </div>
                  <span
                    style={{
                      marginLeft: "8px",
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <BundleIcon />
                  </span>
                </div>
              );
            },
          };
        })
      : columns;

    if (!enableRowExpansion) return baseColumns;

    const modifiedColumns = baseColumns.map((col, index) => {
      if (index === 0) {
        return {
          ...col,
          renderCell: (params: any) => {
            // Check if this is an expansion row
            if (params.row.__isExpansionRow__) {
              return (
                <div className="notes-wrapper">
                  <span className="notes-label">Notes:</span>

                  <div className="notes-box">
                    {params.row.__notes__ || "No notes available"}
                  </div>
                </div>
              );
            }

            // Original cell renderer for regular rows
            return col.renderCell ? col.renderCell(params) : params.value;
          },
        };
      }

      // Hide other columns for expansion rows
      return {
        ...col,
        renderCell: (params: any) => {
          if (params.row.__isExpansionRow__) return null;
          return col.renderCell ? col.renderCell(params) : params.value;
        },
      };
    });

    return modifiedColumns;
  }, [
    columns,
    enableRowExpansion,
    showBundleIcon,
    formNameField,
    formTypeField,
  ]);

  // Transform rows to include expansion rows automatically
  const memoizedRows = useMemo(() => {
    if (!enableRowExpansion) {
      return (rows || []).map((row, index) => ({
        ...row,
        id: getRowId(row) || `row-${index}`,
      }));
    }

    const transformedRows: any[] = [];

    (rows || []).forEach((row, index) => {
      const rowId = getRowId(row) || `row-${index}`;
      const hasNotes = row[notesField]?.trim();

      // Add main row
      transformedRows.push({
        ...row,
        id: rowId,
        __isExpansionRow__: false,
      });

      // Auto-expand: Add expansion row if notes exist (always visible)
      if (hasNotes) {
        transformedRows.push({
          id: `${rowId}-expansion`,
          __isExpansionRow__: true,
          __parentId__: rowId,
          __notes__: row[notesField],
        });
      }
    });

    return transformedRows;
  }, [rows, getRowId, enableRowExpansion, notesField]);

  // Stable per-rowHeight callback so the DataGrid's getRowHeight identity only
  // changes when rowHeight actually changes (C.9).
  const defaultGetRowHeight = useCallback(
    (params: any) => {
      if (params.model.__isExpansionRow__) {
        // Auto-expand: always show expansion rows with auto height
        return "auto";
      }
      return rowHeight;
    },
    [rowHeight]
  );

  // Use custom getRowHeight from dataGridProps if provided, otherwise use default
  const getRowHeight =
    (dataGridProps as any)?.getRowHeight || defaultGetRowHeight;

  const paperSx = autoHeight
    ? { ...sx, height: "auto", minHeight: "auto" }
    : sx;

  // Build className for DataGrid based on conditions
  const dataGridClassName = [
    "reusable-table",
    disableColumnResize && "disable-column-resize",
    autoHeight && "auto-height",
    enableStickyActions && "action-column-sticky",
  ]
    .filter(Boolean)
    .join(" ");

  const dataGridSx = {
    ...sx,
  };

  return (
    <Paper sx={paperSx}>
      <DataGrid
        disableColumnResize={disableColumnResize}
        columns={enhancedColumns}
        rows={memoizedRows}
        rowCount={rowCount}
        loading={loading}
        paginationMode={paginationMode}
        sortingMode={sortingMode}
        disableColumnMenu={disableColumnMenu}
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        paginationModel={paginationModel}
        getRowId={internalGetRowId}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={pageSizeOptions}
        getRowHeight={getRowHeight}
        getRowClassName={getRowClassName}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        slots={defaultSlots}
        disableVirtualization={
          enableRowExpansion ? true : disableVirtualization
        }
        hideFooter={hideFooter}
        autoHeight={autoHeight}
        slotProps={mergedSlotProps}
        localeText={defaultLocaleText}
        className={dataGridClassName}
        sx={dataGridSx}
        {...dataGridProps}
        sortingOrder={DEFAULT_SORTING_ORDER}
      />
    </Paper>
  );
};

export default ReusableTable;

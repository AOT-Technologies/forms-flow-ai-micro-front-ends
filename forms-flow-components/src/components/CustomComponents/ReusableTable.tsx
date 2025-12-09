import React, { useMemo } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useTranslation } from "react-i18next";
import { NewSortDownIcon } from "../SvgIcons";
import { StyleServices } from "@formsflow/service";

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
}

export const ReusableTable: React.FC<ReusableTableProps> = ({
  columns = [],
  rows = [],
  rowCount,
  loading = false,
  sortModel = [],
  onSortModelChange,
  paginationModel,
  onPaginationModelChange,
  getRowId = (row) => row.id || row._id,
  pageSizeOptions = [10, 25, 50, 100],
  rowHeight = 55,
  sx = { height: "100%", width: "100%" },
  dataGridProps = {},
  noRowsLabel,
  disableColumnResize = true,
  disableColumnMenu = true,
  disableRowSelectionOnClick = true,
  paginationMode = "server",
  sortingMode = "server",
  customSlots = {},
  customSlotProps = {},
  customLocaleText = {},
  enableStickyActions = false,
  disableVirtualization = false,
  enableRowExpansion = false,
  notesField = 'notes',
  hideFooter = false,
  autoHeight = false,
}) => {
  const { t } = useTranslation();
  const iconColor = StyleServices.getCSSVariable('--ff-gray-medium-dark');

  const defaultSlots = useMemo(() => ({
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
    ...customSlots,
  }), [iconColor, customSlots]);

  const defaultSlotProps = useMemo(() => ({
    ...customSlotProps,
  }), [customSlotProps]);

  const defaultLocaleText = useMemo(() => ({
    noRowsLabel: noRowsLabel || t("No data available"),
    ...customLocaleText,
  }), [noRowsLabel, customLocaleText, t]);

  // Enhanced columns - modify first column to render expansion content
  const enhancedColumns: GridColDef[] = useMemo(() => {
    if (!enableRowExpansion) return columns;

    const modifiedColumns = columns.map((col, index) => {
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
  }, [columns, enableRowExpansion]);

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

  const getRowClassName = (params: any) => {
    if (params.row.__isExpansionRow__) {
      return 'expansion-row';
    }
    return '';
  };

  const defaultGetRowHeight = (params: any) => {
    if (params.model.__isExpansionRow__) {
      // Auto-expand: always show expansion rows with auto height
      return 'auto';
    }
    return rowHeight;
  };

  // Use custom getRowHeight from dataGridProps if provided, otherwise use default
  const getRowHeight = (dataGridProps as any)?.getRowHeight || defaultGetRowHeight;

  const paperSx = autoHeight 
    ? { ...sx, height: 'auto', minHeight: 'auto' }
    : sx;

  // Build className for DataGrid based on conditions
  const dataGridClassName = [
    'reusable-table',
    disableColumnResize && 'disable-column-resize',
    autoHeight && 'auto-height',
    enableStickyActions && 'action-column-sticky',
  ].filter(Boolean).join(' ');

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
        getRowId={(row) => row.id}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={pageSizeOptions}
        getRowHeight={getRowHeight}
        getRowClassName={getRowClassName}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        slots={defaultSlots}
        disableVirtualization={enableRowExpansion ? true : disableVirtualization}
        hideFooter={hideFooter}
        autoHeight={autoHeight}
        slotProps={{
          loadingOverlay: {
            variant: 'skeleton',
            noRowsVariant: 'skeleton',
          },
          ...defaultSlotProps,
        }}
        localeText={defaultLocaleText}
        className={dataGridClassName}
        sx={dataGridSx}
        {...dataGridProps}
        sortingOrder={['asc', 'desc']}
      />
    </Paper>
  );
};

export default ReusableTable;
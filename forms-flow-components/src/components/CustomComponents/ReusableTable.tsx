import React, { useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
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
  sx = { height: { sm: 400, md: 510, lg: 665 }, width: "100%" },
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
}) => {
  const { t } = useTranslation();
  const iconColor = StyleServices.getCSSVariable('--ff-gray-medium-dark');

  // Default sort icons
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

  // Default slot props
  const defaultSlotProps = useMemo(() => ({
    ...customSlotProps,
  }), [customSlotProps]);

  // Default locale text
  const defaultLocaleText = useMemo(() => ({
    noRowsLabel: noRowsLabel || t("No data available"),
    ...customLocaleText,
  }), [noRowsLabel, customLocaleText, t]);

  // Memoized rows to ensure proper ID assignment
  const memoizedRows = useMemo(() => {
    return (rows || []).map((row, index) => ({
      ...row,
      id: getRowId(row) || `row-${index}`,
    }));
  }, [rows, getRowId]);

  return (
    <Paper sx={sx}>
      <DataGrid
        disableColumnResize={disableColumnResize}
        columns={columns}
        rows={memoizedRows}
        rowCount={rowCount}
        loading={loading}
        paginationMode={paginationMode}
        sortingMode={sortingMode}
        disableColumnMenu={disableColumnMenu}
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        paginationModel={paginationModel}
        getRowId={getRowId}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={pageSizeOptions}
        rowHeight={rowHeight}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        slots={defaultSlots}
        disableVirtualization ={disableVirtualization}
        slotProps={{
          loadingOverlay: {
            variant: 'skeleton',
            noRowsVariant: 'skeleton',
          },
          ...defaultSlotProps,
        }}
        localeText={defaultLocaleText}
        className={enableStickyActions ? 'action-column-sticky' : ''} //to avoid resizing of actions column

        sx={{
          ...(disableColumnResize && {
            '& .MuiDataGrid-columnSeparator': {
              display: 'none !important',
            },
          }),
          ...sx, 
        }}
        {...dataGridProps}
        sortingOrder={['asc', 'desc']}
      />
    </Paper>
  );
};

export default ReusableTable;

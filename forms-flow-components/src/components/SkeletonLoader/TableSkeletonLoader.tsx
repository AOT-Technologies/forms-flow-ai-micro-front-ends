import React, { FC, memo, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface TableSkeletonProps {
  columns: number;
  rows: number;
  cellHeight?: number;
}

export const TableSkeleton: FC<TableSkeletonProps> = memo(
  ({ columns, rows, cellHeight = 25 }) => {
    const generateUUIDs = useMemo(
      () => ({
        columns: Array.from({ length: columns }, () => crypto.randomUUID()),
        rows: Array.from({ length: rows }, () => crypto.randomUUID()),
        pagination: Array.from({ length: 7 }, () => crypto.randomUUID())
      }),
      [columns, rows]
    );

    const renderSkeletonCells = () =>
      generateUUIDs.columns.map((uuid) => (
        <td key={uuid}>
          <Skeleton height={cellHeight} />
        </td>
      ));

    const renderLastRowWithPagination = () => (
      <>
        <td className="rounded-bl">
          <Skeleton height={cellHeight} />
        </td>
        <td colSpan={3} className="text-center">
          <div className="d-flex justify-content-center gap-2">
            {generateUUIDs.pagination.map((uuid) => (
              <Skeleton key={uuid} height={40} width={40} circle />
            ))}
          </div>
        </td>
        <td className="rounded-br">
          <Skeleton height={cellHeight} />
        </td>
      </>
    );

    return (
      <div className="custom-tables-wrapper" role="status" aria-label="Loading table data">
        <table className="table table-skeleton">
          <thead>
            <tr>
              {generateUUIDs.columns.map((uuid) => (
                <th key={uuid}>
                  <Skeleton height={cellHeight} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {generateUUIDs.rows.map((uuid, rowIndex) => {
              const isLastRow = rowIndex === rows - 1;
              return (
                <tr key={uuid} className={isLastRow ? "no-border-bottom" : ""}>
                  {isLastRow
                    ? renderLastRowWithPagination()
                    : renderSkeletonCells()}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);


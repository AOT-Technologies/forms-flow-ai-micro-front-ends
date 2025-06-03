import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface ResizableTableSkeletonProps {
  columns?: number;
  rows?: number;
  cellHeight?: number;
  cellWidth?: number;
}

export const ResizableTableSkeleton: React.FC<ResizableTableSkeletonProps> = ({
  columns = 5,
  rows = 5,
  cellHeight = 32,
  cellWidth = 150,
}) => {
  return (
    <div className="resizable-table-container skeleton-wrapper">
      <div className="table-scroll-wrapper resizable-scroll">
        <table className="resizable-table">
          <thead className="resizable-header">
            <tr>
              {Array.from({ length: columns }).map((_, idx) => (
                <th
                  key={`head-${idx}`}
                  style={{
                    width: `${cellWidth}px`,
                    padding: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  <Skeleton height={cellHeight} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={`row-${rowIdx}`}>
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td
                    key={`cell-${rowIdx}-${colIdx}`}
                    style={{
                      width: `${cellWidth}px`,
                      padding: "0.75rem",
                      textAlign: "center",
                    }}
                  >
                    <Skeleton height={cellHeight} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

 

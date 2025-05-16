import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

interface Column {
  name: string;
  width: number;
  sortKey: string;
  resizable?: boolean;
  newWidth?: number; // Add this property to the interface
}

interface ResizableTableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any, columns: Column[], rowIndex: number) => JSX.Element;
  renderHeaderCell: (
    column: Column, 
    index: number, 
    columnsLength: number, 
    currentResizingColumn: any, 
    handleMouseDown: (index: number, column: any, e: React.MouseEvent) => void
  ) => JSX.Element;
  emptyMessage?: string;
  onColumnResize?: (column: Column, newWidth: number) => void;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  containerClassName?: string;
  scrollWrapperClassName?: string;
  dataTestId?: string;
  ariaLabel?: string;
}

export const ReusableResizableTable: React.FC<ResizableTableProps> = ({
  columns,
  data,
  renderRow,
  renderHeaderCell,
  emptyMessage = "No data found",
  onColumnResize,
  tableClassName = "resizable-table",
  headerClassName = "resizable-header",
  bodyClassName = "",
  containerClassName = "resizable-table-container",
  scrollWrapperClassName = "table-scroll-wrapper resizable-scroll",
  dataTestId = "resizable-table",
  ariaLabel = "Resizable data table",
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<Column | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Column resizing logic
  const handleMouseDown = useCallback(
    (index: number, column: Column, e: React.MouseEvent): void => {
      if (!columns[index].resizable) return;
      resizingRef.current = column;
      startXRef.current = e.pageX;
      startWidthRef.current = columns[index].width;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [columns]
  );

  const handleMouseMove = useCallback((e: MouseEvent): void => {
    if (resizingRef.current === null) return;
    const diff = e.pageX - startXRef.current;
    const newWidth = Math.max(50, startWidthRef.current + diff);
    
    // Update the newWidth property on the resizing column
    if (resizingRef.current) {
      resizingRef.current.newWidth = newWidth;
    }
    
    // Update column width in state
    setColumns((prev) =>
      prev.map((col) =>
        col.sortKey === resizingRef.current?.sortKey
          ? { ...col, width: newWidth }
          : col
      )
    );
  }, []);

  const handleMouseUp = useCallback((): void => {
    if (resizingRef.current && onColumnResize && resizingRef.current.newWidth) {
      onColumnResize(resizingRef.current, resizingRef.current.newWidth);
    }
    
    // Reset the resizing reference and remove event listeners
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, onColumnResize]);

  // State to manage columns
  const [columnsState, setColumns] = useState<Column[]>(columns);

  // Update columns when props change
  useEffect(() => {
    setColumns(columns);
  }, [columns]);

  // Cleanup function to remove event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      className={containerClassName}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      <div 
        className={scrollWrapperClassName}
        ref={scrollWrapperRef}
        data-testid={`${dataTestId}-scroll-wrapper`}
      >
        <table 
          ref={tableRef}
          className={tableClassName}
          data-testid={`${dataTestId}-table`}
        >
          <thead className={headerClassName}>
            <tr>
              {columnsState.map((column, index) => (
                renderHeaderCell(
                  column,
                  index,
                  columnsState.length,
                  resizingRef.current,
                  handleMouseDown
                )
              ))}
            </tr>
          </thead>
          <tbody className={bodyClassName}>
            {data.length === 0 ? (
              <tr className="empty-row">
                <td 
                  colSpan={columnsState.length}
                  className="empty-table-message"
                  data-testid={`${dataTestId}-empty-message`}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => renderRow(item, columnsState, index))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReusableResizableTable;

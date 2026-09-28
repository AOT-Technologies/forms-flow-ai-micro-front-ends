import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// MUI X DataGrid v8 needs TextEncoder at module-load time and ResizeObserver at
// render time; jsdom provides neither. Polyfill before requiring the component
// (require, not import, so the polyfills are installed first).
if (typeof (global as any).TextEncoder === "undefined") {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof (global as any).TextDecoder === "undefined") {
  (global as any).TextDecoder = TextDecoder;
}
if (typeof (global as any).ResizeObserver === "undefined") {
  (global as any).ResizeObserver = require("resize-observer-polyfill");
}

const {
  ReusableTable,
} = require("../components/CustomComponents/ReusableTable");

describe("ReusableTable Component", () => {
  const columns = [
    { field: "name", headerName: "Name", width: 150 },
    { field: "status", headerName: "Status", width: 150 },
  ];

  const rows = [
    { id: "row-1", name: "First Form", status: "Active" },
    { id: "row-2", name: "Second Form", status: "Inactive" },
  ];

  it("renders rows with default props (module-level defaults)", () => {
    render(
      <ReusableTable
        columns={columns}
        rows={rows}
        rowCount={rows.length}
        disableVirtualization
      />
    );

    expect(screen.getByText("First Form")).toBeInTheDocument();
    expect(screen.getByText("Second Form")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("still renders rows after a re-render with the same data", () => {
    const { rerender } = render(
      <ReusableTable
        columns={columns}
        rows={rows}
        rowCount={rows.length}
        disableVirtualization
      />
    );

    rerender(
      <ReusableTable
        columns={columns}
        rows={rows}
        rowCount={rows.length}
        disableVirtualization
      />
    );

    expect(screen.getByText("First Form")).toBeInTheDocument();
    expect(screen.getByText("Second Form")).toBeInTheDocument();
  });

  it("resolves row ids via the default getRowId (_id fallback)", () => {
    const mongoRows = [{ _id: "abc-1", name: "Mongo Form", status: "Draft" }];
    render(
      <ReusableTable
        columns={columns}
        rows={mongoRows}
        rowCount={1}
        disableVirtualization
      />
    );

    expect(screen.getByText("Mongo Form")).toBeInTheDocument();
  });
});

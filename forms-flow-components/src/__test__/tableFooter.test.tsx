import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
 import { TableFooter } from "../components/CustomComponents/TableFooter";
 

const renderTableFooter = (props: any) => {
  return render(<table><tbody><TableFooter {...props} /></tbody></table>);
};

describe("TableFooter component", () => {
  const defaultProps = {
    limit: 10,
    activePage: 1,
    totalCount: 100,
    handlePageChange: jest.fn(),
    onLimitChange: jest.fn(),
    pageOptions: [
      { value: 5, text: "5" },
      { value: 10, text: "10" },
      { value: 20, text: "20" },
    ],
  };

  it("renders showing text with correct values", () => {
     renderTableFooter(defaultProps);
    expect(screen.getByText(/Showing 1 to 10 of 100/i)).toBeInTheDocument();
  });

  it("does not render pagination when totalCount is less than or equal to 5", () => {
    renderTableFooter({...defaultProps, totalCount:5});
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

 

  it("handles page limit change", () => {
    renderTableFooter(defaultProps);
    fireEvent.click(screen.getByTestId("page-limit-dropdown-toggle"));
    fireEvent.click(screen.getByTestId("page-limit-dropdown-item-20"));
    expect(defaultProps.onLimitChange).toHaveBeenCalledWith(20);
  });

  it("displays correct range for last page", () => {
    renderTableFooter({...defaultProps, 
        activePage:10,
        limit:10,
        totalCount:95
    });
 
    expect(screen.getByText(/Showing 91 to 95 of 95/i)).toBeInTheDocument();
  });
 
});

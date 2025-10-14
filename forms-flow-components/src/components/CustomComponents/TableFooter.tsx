import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Pagination from "react-js-pagination";
import { Dropdown } from "react-bootstrap";
import { DownArrowIcon, AngleLeftIcon, AngleRightIcon } from "../SvgIcons/index";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
interface PageOption {
  value: number;
  text: string;
}

interface TableFooterProps {
  limit: number;
  activePage: number;
  totalCount: number;
  handlePageChange: (page: number) => void;
  onLimitChange: (newLimit: number) => void;
  pageOptions: PageOption[];
  loader?: boolean;
}

export const TableFooter: React.FC<TableFooterProps> = ({
  limit,
  activePage,
  totalCount,
  handlePageChange,
  onLimitChange,
  pageOptions,
  loader = false,
}) => {
  const { t } = useTranslation();
  
  const paginationUUIDs = useMemo(
    () => Array.from({ length: 5 }, () => crypto.randomUUID()),
    []
  );
    if (loader) {
    return (
      <td>
        <div className="d-flex justify-content-between align-items-center flex-md-row p-2">
          <Skeleton height={20} width={200} />
          <div className="d-flex flex-row">
            {paginationUUIDs.map((uuid) => (
              <Skeleton key={uuid}  height={40} width={40} circle />
            ))}
          </div>
          <Skeleton height={20} width={200} />
        </div>
      </td>
    );
  }
  return (
    <>
    {/* <tr> */}
      <div className="table-footer">
        <div className="table-footer-showing">
          <span>
            {t("Showing")} {limit * activePage - (limit - 1)} {t("to")}&nbsp;
            {Math.min(limit * activePage, totalCount)} {t("of")}&nbsp;
            {totalCount}
          </span>
        </div>

        {totalCount > 5 ? (
          <>
          <div className="table-footer-pages">
            <Pagination
              activePage={activePage}
              itemsCountPerPage={limit}
              totalItemsCount={totalCount}
              pageRangeDisplayed={5}
              itemClass="page-item"
              linkClass="page-link"
              onChange={handlePageChange}
              prevPageText={
                <AngleLeftIcon />
              }
              nextPageText={
                <AngleRightIcon />
              }
            />
          </div>

          {pageOptions && (         
            <div className="table-footer-rowsper">              
              <span className="pagination-text">{t("Rows per page")}</span>
              <div className="pagination-dropdown">
                <Dropdown data-testid="page-limit-dropdown" >
                  <Dropdown.Toggle
                    variant="light"
                    id="dropdown-basic"
                    data-testid="page-limit-dropdown-toggle"
                  >
                    {limit}
                    <DownArrowIcon />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {pageOptions.map((option) => (
                      <Dropdown.Item
                        key={option.value}
                        type="button"
                        data-testid={`page-limit-dropdown-item-${option.value}`}
                        onClick={() => onLimitChange(option.value)}
                      >
                        {option.text}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          )}
          </>
        ) : null}
      </div>
    {/* </tr> */}

    {/*  
    <tr>
      <td colSpan={3}>
        <div className="d-flex justify-content-between align-items-center flex-column flex-md-row">
          <span>
            {t("Showing")} {limit * activePage - (limit - 1)} {t("to")}&nbsp;
            {Math.min(limit * activePage, totalCount)} {t("of")}&nbsp;
            {totalCount}
          </span>
        </div>
      </td>
      {totalCount > 5 ? (
        <>
          <td colSpan={3}>
            <div className="d-flex align-items-center justify-content-center">
              <Pagination
                activePage={activePage}
                itemsCountPerPage={limit}
                totalItemsCount={totalCount}
                pageRangeDisplayed={5}
                itemClass="page-item"
                linkClass="page-link"
                onChange={handlePageChange}
                prevPageText={
                  <span data-testid="goto-previous"><AngleLeftIcon /></span>
                }
                nextPageText={
                  <span data-testid="goto-next"><AngleRightIcon /></span>
                }
                
              />
            </div>
          </td>
          {pageOptions && (
            <td colSpan={3}>           
             <div className="d-flex align-items-center justify-content-end">              
              <span className="pagination-text">{t("Rows per page")}</span>
              <div className="pagination-dropdown">
                <Dropdown data-testid="page-limit-dropdown" >
                  <Dropdown.Toggle
                    variant="light"
                    id="dropdown-basic"
                    data-testid="page-limit-dropdown-toggle"
                  >
                    {limit}
                    <DownArrowIcon />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {pageOptions.map((option) => (
                      <Dropdown.Item
                        key={option.value}
                        type="button"
                        data-testid={`page-limit-dropdown-item-${option.value}`}
                        onClick={() => onLimitChange(option.value)}
                      >
                        {option.text}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </td>
          )}
          
        </>
      ) : null}
    </tr>
    */}
    </>
  );
};

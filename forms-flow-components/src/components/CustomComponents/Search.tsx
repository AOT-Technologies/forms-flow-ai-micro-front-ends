import React, { FC } from 'react';
import { InputGroup, FormControl } from 'react-bootstrap';
import { ClearIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";


interface CustomSearchProps {
    searchLoading?: boolean;
    handleClearSearch: () => void;
    search: string;
    setSearch: (value: string) => void;
    handleSearch: () => void;
    placeholder?: string;
    title?: string;
    dataTestId: string;
}

export const CustomSearch: FC<CustomSearchProps> = ({
    searchLoading,
    handleClearSearch,
    search,
    setSearch,
    handleSearch,
    placeholder = "Search...",
    title = "Search",
    dataTestId
}) => {
    const { t } = useTranslation();
    const inputClassNames = ` ${searchLoading ? 'is-searching' : search ? 'has-value' : ''
        }`;

    return (
        // <InputGroup className="d-flex align-items-center p-0 search-box input-group">
        <div className="input-search">
            {/* <div className="form-control-with-icon w-25"> */}
                <input
                    className={inputClassNames}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => (e.key === 'Enter' && handleSearch())}
                    placeholder={t(placeholder)}
                    title={t(title)}
                    data-testid={dataTestId}
                    aria-label={placeholder}
                />
                {search && (
                    // <span className={`d-flex search-box-icon ${searchLoading ? 'loading' : ''}`} >
                    <>
                        {!searchLoading ? (
                            <button className="icon" onClick={handleClearSearch}>
                                <ClearIcon
                                    // width={16}
                                    // height={16}
                                    // onClick={handleClearSearch}
                                    data-testid="form-search-clear-button"
                                />
                            </button>
                        ) : (
                            <div className="search-spinner" data-testid="search-spinner"></div>
                        )}

                    </>
                )}
            {/* </div> */}
        </div>
        // </InputGroup>
    );
};


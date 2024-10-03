import React, { FC } from 'react';
import { InputGroup, FormControl } from 'react-bootstrap';
import { CloseIcon } from "../SvgIcons/index";

interface CustomSearchProps {
    searchFormLoading: boolean;
    handleClearSearch: () => void;
    search: string;
    setSearch: (value: string) => void;
    handleSearch: () => void;
    placeholder?: string;
    title?: string;
    dataTestId: string;
}

export const CustomSearch: FC<CustomSearchProps> = ({
    searchFormLoading,
    handleClearSearch,
    search,
    setSearch,
    handleSearch,
    placeholder = "Search...",
    title = "Search",
    dataTestId
}) => {
    const inputClassNames = `d-flex align-items-center search-box-input ${searchFormLoading ? 'is-searching' : search ? 'has-value' : ''
        }`;

    return (
        <InputGroup className="d-flex align-items-center p-0 search-box input-group">
            <div className="form-control-with-icon w-100">
                <FormControl
                    className={inputClassNames}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => (e.key === 'Enter' && handleSearch())}
                    placeholder={placeholder}
                    title={title}
                    data-testid={dataTestId}
                    aria-label={placeholder}
                />
                {search && (
                    <span
                        className={`d-flex search-box-icon ${searchFormLoading ? 'loading' : ''}`}
                        onClick={!searchFormLoading && handleClearSearch}
                    >
                        {!searchFormLoading ? (
                            <CloseIcon
                                width={16}
                                height={16}
                                onClick={handleClearSearch}
                                data-testid="form-search-clear-button"

                            />
                        ) : (
                            <div className="search-spinner"></div>
                        )}

                    </span>
                )}
            </div>
        </InputGroup>
    );
};


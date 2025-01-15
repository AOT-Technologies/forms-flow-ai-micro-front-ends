import React, { FC } from 'react';
import { InputGroup, FormControl } from 'react-bootstrap';
import { CloseIcon } from "../SvgIcons/index";
import { useTranslation } from "react-i18next";


interface CustomSearchProps {
    searchLoading: boolean;
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
    const inputClassNames = `d-flex align-items-center search-box-input ${searchLoading ? 'is-searching' : search ? 'has-value' : ''
        }`;

    return (
        <InputGroup className="d-flex align-items-center p-0 search-box input-group">
            <div className="form-control-with-icon w-100">
                <FormControl
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
                    <span
                        className={`d-flex search-box-icon ${searchLoading ? 'loading' : ''}`}
                    >
                        {!searchLoading ? (
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


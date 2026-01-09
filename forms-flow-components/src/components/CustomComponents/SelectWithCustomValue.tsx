import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, memo } from "react";
import { createPortal } from "react-dom";
import { DownArrowIcon, UpArrowIcon, VerticalLineIcon } from "../SvgIcons";
import { ListGroup } from "react-bootstrap";
import { CustomSearch } from "./Search";
import { CustomTextInput } from "./CustomTextInput";

/**
 * Dropdown option interface for SelectWithCustomValue component
 */
export interface SelectWithCustomValueOptionType {
    /** Display text for the option */
    label: string;
    /** Value associated with the option */
    value: string | number;
    /** Optional icon rendered alongside the label */
    icon?: React.ReactNode;
}

/**
 * Dropdown variant type for SelectWithCustomValue
 */
export type SelectWithCustomValueVariant = "primary" | "secondary";

/**
 * Props for `SelectWithCustomValue` component.
 * Optimized, accessible dropdown component with search functionality and custom value options.
 */
export interface SelectWithCustomValueProps
    extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
    /** Array of options to display in the dropdown */
    /** Currently selected value */
    /** Currently selected value */
    options: SelectWithCustomValueOptionType[];
    value?: string | number;
    /** Callback function when selection changes */
    onChange?: (value: string | number) => void;
    /** Whether the dropdown is disabled */
    disabled?: boolean;
    /** Default value to show when nothing is selected */
    defaultValue?: string | number;
    /** Whether to render as searchable input field */
    searchDropdown?: boolean;
    /** HTML id attribute for the dropdown */
    id?: string;
    /** Test ID for automated testing */
    dataTestId?: string;
    /** Accessible label for screen readers */
    ariaLabel?: string;
    /** Visual variant of the dropdown ('primary' or 'secondary') */
    variant?: SelectWithCustomValueVariant;
    className?: string;
    dropdownWrapperClassName?: string;
    dropdownItemClassName?: string;
    /** Show a CustomSearch input at the top of the options list */
    searchable?: boolean;
    /** Placeholder for the CustomSearch input */
    customSearchPlaceholder?: string;
    /** Custom width for the dropdown (e.g., '300px', '20rem', '100%') */
    width?: string | number;
    /** Callback when "Enter custom value" is clicked */
    onEnterCustomValue?: () => void;
    /** Callback when "Select additional variables" is clicked */
    onSelectAdditionalVariables?: () => void;
    /** Custom label for "Enter custom value" option */
    customValueLabel?: string;
    /** Custom label for "Select additional variables" option */
    additionalVariablesLabel?: string;
    /** Placeholder text for the dropdown button and custom input */
    placeholder?: string;

    /** --- New props for dependent dropdown --- */
    secondDropdown?: boolean;
    dependentOptions?: Record<string, SelectWithCustomValueOptionType[]>; // map primaryValue -> secondary options
    secondDefaultValue?: string | number;
    secondValue?: string | number;
    onSecondChange?: (value: string | number) => void;
}

/** Utility: build className string */
const buildClassNames = (
    ...classes: (string | false | null | undefined)[]
): string => classes.filter(Boolean).join(" ");

type DisplayLabelParams = {
    opts: SelectWithCustomValueOptionType[];
    selValue: string | number | undefined;
    defaultVal?: string | number;
    placeholder?: string;
};

const getDisplayLabel = ({
    opts,
    selValue,
    defaultVal,
    placeholder = "",
}: DisplayLabelParams): React.ReactNode => {
    const selected = opts?.find((o) => o.value === selValue);
    if (selected) {
        return (
            <span className="dropdown-text-content">
                {selected.icon && <span className="dropdown-icon">{selected.icon}</span>}
                <span>{selected.label}</span>
            </span>
        );
    }

    const defaultMatch = opts?.find((o) => o.value === defaultVal);
    if (defaultMatch) {
        return (
            <span className="dropdown-text-content">
                {defaultMatch.icon && <span className="dropdown-icon">{defaultMatch.icon}</span>}
                <span>{defaultMatch.label}</span>
            </span>
        );
    }

    if (selValue && !opts?.some((o) => o.value === selValue)) {
        return String(selValue);
    }

    if (!selValue && !defaultVal) {
        return <span className="dropdown-text-placeholder">{placeholder}</span>;
    }

    return defaultVal ?? "";
};

/** Dropdown position interface */
interface DropdownPosition {
    top: number;
    left: number;
    width: number;
}

/** SelectWithCustomValue Component */
const SelectWithCustomValueComponent = forwardRef<HTMLDivElement, SelectWithCustomValueProps>(
    (
        {
            options,
            value,
            onChange,
            disabled = false,
            defaultValue,
            searchDropdown = false,
            id = "",
            dataTestId = "",
            ariaLabel = "",
            className = "",
            variant = "primary",
            dropdownWrapperClassName,
            dropdownItemClassName,
            width,

            // Top-of-list CustomSearch
            searchable = false,
            customSearchPlaceholder = "Search all forms",

            // Special action items
            onEnterCustomValue,
            onSelectAdditionalVariables,
            customValueLabel = "Enter custom value",
            additionalVariablesLabel = "Select additional variables",
            placeholder = "Choose a variable or value",

            // Secondary dropdown support
            secondDropdown = false,
            dependentOptions = {},
            secondDefaultValue,
            secondValue,
            onSecondChange,
            ...restProps
        },
        ref
    ) => {
        // ---------- PRIMARY DROPDOWN ----------
        const [isOpen, setIsOpen] = useState<boolean>(false);
        const [selectedValue, setSelectedValue] = useState<string | number | undefined>(
            value || defaultValue
        );
        const [searchTerm, setSearchTerm] = useState<string>("");
        const [isCustomValueMode, setIsCustomValueMode] = useState<boolean>(false);
        const [customInputValue, setCustomInputValue] = useState<string>("");
        const [shouldAutoFocus, setShouldAutoFocus] = useState<boolean>(false);

        // ---------- SECONDARY DROPDOWN ----------
        const [secondIsOpen, setSecondIsOpen] = useState<boolean>(false);
        const [secondSelectedValue, setSecondSelectedValue] = useState<
            string | number | undefined
        >(secondValue || secondDefaultValue);

        const dropdownRef = useRef<HTMLDivElement>(null);
        const primaryWrapperRef = useRef<HTMLDivElement>(null);
        const primaryMenuRef = useRef<HTMLDivElement | null>(null);
        const [primaryPosition, setPrimaryPosition] = useState<DropdownPosition | null>(null);
        const [isMounted, setIsMounted] = useState(false);

        // --- Common state transition helpers ---
        const closeDropdownAndClearSearch = useCallback(() => {
            setIsOpen(false);
            setSearchTerm("");
        }, []);

        const exitCustomMode = useCallback(() => {
            setIsCustomValueMode(false);
            setShouldAutoFocus(false);
        }, []);

        // --- Custom value mode helpers ---
        const enterCustomMode = useCallback(
            (initialValue: string = "") => {
                setIsCustomValueMode(true);
                setCustomInputValue(initialValue);
                setShouldAutoFocus(true);
                closeDropdownAndClearSearch();
            },
            [closeDropdownAndClearSearch]
        );

        const commitCustomValue = useCallback(
            (trimmedValue: string) => {
                setSelectedValue(trimmedValue);
                exitCustomMode();
                onChange?.(trimmedValue);
            },
            [onChange, exitCustomMode]
        );

        const cancelCustomModeAndShowDropdown = useCallback(() => {
            exitCustomMode();
            setCustomInputValue("");
            setSelectedValue(undefined);
            setIsOpen(true);
            setSearchTerm("");
            // Don't call onChange with undefined - let user select a new value
        }, [exitCustomMode]);

        // Update values if props change
        useEffect(() => {
            setSelectedValue(value || defaultValue);
            // If value is set externally and it's not in options, it might be a custom value
            if (value && !options.some(opt => opt.value === value)) {
                setIsCustomValueMode(true);
                setCustomInputValue(String(value));
                setShouldAutoFocus(false); // Don't autoFocus when value is set externally
            }
        }, [value, defaultValue, options]);

        useEffect(() => {
            setSecondSelectedValue(secondValue || secondDefaultValue);
        }, [secondValue, secondDefaultValue]);

        useEffect(() => {
            setIsMounted(typeof document !== "undefined");
        }, []);

        const updatePosition = useCallback(
            (
                wrapper: React.RefObject<HTMLDivElement>,
                setter: React.Dispatch<React.SetStateAction<DropdownPosition | null>>
            ) => {
                if (!wrapper.current) return;
                const rect = wrapper.current.getBoundingClientRect();
                setter({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            },
            []
        );

        useEffect(() => {
            if (!isOpen) return;
            const handleUpdate = () => updatePosition(primaryWrapperRef, setPrimaryPosition);
            handleUpdate();
            window.addEventListener("scroll", handleUpdate, true);
            window.addEventListener("resize", handleUpdate);
            return () => {
                window.removeEventListener("scroll", handleUpdate, true);
                window.removeEventListener("resize", handleUpdate);
            };
        }, [isOpen, updatePosition]);

        // Handle click outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent): void => {
                const target = event.target as Node;
                const inDropdown = dropdownRef.current?.contains(target);
                const inMenu = primaryMenuRef.current?.contains(target);
                const inWrapper = primaryWrapperRef.current?.contains(target);
                if (!inDropdown && !inMenu && !inWrapper) {
                    closeDropdownAndClearSearch();
                    setSecondIsOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [closeDropdownAndClearSearch]);

        /** Handle primary toggle */
        const handleToggle = useCallback(() => {
            if (!disabled) {
                // If current value is a custom value (not in options), enter edit mode
                if (selectedValue && !options.some(opt => opt.value === selectedValue)) {
                    enterCustomMode(String(selectedValue));
                } else {
                    setIsOpen((prev) => !prev);
                }
            }
        }, [disabled, selectedValue, options, enterCustomMode]);

        /** Handle secondary toggle */
        const handleSecondToggle = useCallback(() => {
            if (!disabled) setSecondIsOpen((prev) => !prev);
        }, [disabled]);

        /** Handle primary select */
        const handleOptionClick = useCallback(
            (optionValue: string | number): void => {
                setSelectedValue(optionValue);
                closeDropdownAndClearSearch();
                exitCustomMode();
                onChange?.(optionValue);

                // Reset dependent dropdown when parent changes
                // Do NOT auto-select the first secondary option; require user action
                if (secondDropdown) {
                    // Clear secondary selection and wait for manual pick
                    setSecondSelectedValue('');
                }
            },
            [onChange, secondDropdown, dependentOptions, onSecondChange, closeDropdownAndClearSearch, exitCustomMode]
        );

        /** Handle secondary select */
        const handleSecondSelect = useCallback(
            (optionValue: string | number): void => {
                setSecondSelectedValue(optionValue);
                setSecondIsOpen(false);
                onSecondChange?.(optionValue);
            },
            [onSecondChange]
        );

        /** Filtered primary options (excluding special items) */
        const filteredOptions = useMemo(() => {
            const filtered = searchable && searchTerm
                ? options.filter((o) =>
                    o.label.toLowerCase().includes(searchTerm.toLowerCase())
                )
                : options;
            return filtered;
        }, [options, searchable, searchTerm]);

        // Memoized selected option
        const selectedOption = useMemo(() => {
            return options?.find(opt => opt.value === selectedValue);
        }, [options, selectedValue]);

        const secondaryOptions = useMemo(() => {
            if (!secondDropdown || !selectedValue) return [];
            return dependentOptions[selectedValue] || [];
        }, [dependentOptions, secondDropdown, selectedValue]);

        /** Arrow icon */
        const renderArrowIcon = (open: boolean) => {
            const iconColor = disabled ? "#c5c5c5" : "#4a4a4a";
            return open ? (
                <UpArrowIcon color={iconColor} />
            ) : (
                <DownArrowIcon color={iconColor} />
            );
        };

        /** Handle special action items */
        const handleCustomValueClick = useCallback(() => {
            // Set initial input value to current selected value if it's a string
            if (selectedValue && typeof selectedValue === "string") {
                enterCustomMode(selectedValue);
            } else {
                enterCustomMode("");
            }
            onEnterCustomValue?.();
        }, [enterCustomMode, onEnterCustomValue, selectedValue]);

        const handleAdditionalVariablesClick = useCallback(() => {
            closeDropdownAndClearSearch();
            exitCustomMode();
            onSelectAdditionalVariables?.();
        }, [onSelectAdditionalVariables, closeDropdownAndClearSearch, exitCustomMode]);

        /** Handle custom input value change for CustomTextInput (uses setValue callback) */
        const handleCustomInputSetValue = useCallback((newValue: string) => {
            setCustomInputValue(newValue);
            
            // If input is cleared, exit custom value mode and show dropdown
            if (newValue.trim() === "" && isCustomValueMode) {
                cancelCustomModeAndShowDropdown();
            }
        }, [isCustomValueMode, cancelCustomModeAndShowDropdown]);

        /** Handle Enter key press in custom input */
        const handleCustomInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const trimmedValue = customInputValue.trim();
                if (trimmedValue) {
                    commitCustomValue(trimmedValue);
                } else {
                    // If Enter is pressed with empty input, show dropdown
                    cancelCustomModeAndShowDropdown();
                }
            } else if (e.key === "Escape") {
                // Exit custom value mode and show dropdown
                cancelCustomModeAndShowDropdown();
            }
        }, [commitCustomValue, customInputValue, cancelCustomModeAndShowDropdown]);

        /** Handle blur on custom input */
        const handleCustomInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
            const trimmedValue = customInputValue.trim();
            if (trimmedValue) {
                commitCustomValue(trimmedValue);
            } else {
                // If input is empty, exit custom value mode and show dropdown
                cancelCustomModeAndShowDropdown();
            }
        }, [commitCustomValue, customInputValue, cancelCustomModeAndShowDropdown]);

        const renderSpecialItems = (
            itemClass: string | undefined,
            showSpecialItems: boolean
        ) => {
            if (!showSpecialItems) return null;

            return (
                <>
                    <ListGroup.Item
                        className={buildClassNames(
                            "custom-dropdown-item",
                            "custom-dropdown-item-special",
                            itemClass
                        )}
                        onClick={handleCustomValueClick}
                        data-testid={`${dataTestId}-enter-custom-value`}
                    >
                        <span className="dropdown-option-content">
                            <span>{customValueLabel}</span>
                        </span>
                    </ListGroup.Item>

                    {onSelectAdditionalVariables && (
                        <ListGroup.Item
                            className={buildClassNames(
                                "custom-dropdown-item",
                                "custom-dropdown-item-special",
                                itemClass
                            )}
                            onClick={handleAdditionalVariablesClick}
                            data-testid={`${dataTestId}-select-additional-variables`}
                        >
                            <span className="dropdown-option-content">
                                <span>{additionalVariablesLabel}</span>
                            </span>
                        </ListGroup.Item>
                    )}
                </>
            );
        };

        const renderMenu = (
            opts: SelectWithCustomValueOptionType[],
            selValue: string | number | undefined,
            selectFn: (value: string | number) => void,
            variantType: SelectWithCustomValueVariant,
            itemClass: string | undefined,
            showSpecialItems: boolean,
            menuRef?: React.MutableRefObject<HTMLDivElement | null>,
            position?: DropdownPosition | null
        ) => {
            const shouldPortal = isMounted && position && typeof document !== "undefined";

            const content = (
                <div
                    ref={(node) => {
                        if (menuRef) {
                            menuRef.current = node;
                        }
                    }}
                    className={buildClassNames(
                        "custom-dropdown-options",
                        `custom-dropdown-options--${variantType}`
                    )}
                    style={
                        shouldPortal && position
                            ? {
                                  position: "absolute",
                                  top: position.top,
                                  left: position.left,
                                  width: position.width,
                                  zIndex: 2000,
                                  maxHeight: "10.75rem",
                              }
                            : undefined
                    }
                >
                    {searchable && (
                        <div className="custom-dropdown-search">
                            <CustomSearch
                                search={searchTerm}
                                setSearch={setSearchTerm}
                                handleSearch={() => {}}
                                placeholder={customSearchPlaceholder}
                                dataTestId={`${dataTestId}-dropdown-search`}
                            />
                        </div>
                    )}

                    {renderSpecialItems(itemClass, showSpecialItems)}

                    {opts.length > 0 ? (
                        opts.map((option) => (
                            <ListGroup.Item
                                key={option.value}
                                className={buildClassNames(
                                    "custom-dropdown-item",
                                    itemClass,
                                    option.value === selValue && "selected"
                                )}
                                onClick={() => selectFn(option.value)}
                                aria-selected={option.value === selValue}
                                data-testid={`${dataTestId}-${option.value}`}
                            >
                                <span className="dropdown-option-content">
                                    {option.icon && (
                                        <span className="dropdown-icon">{option.icon}</span>
                                    )}
                                    <span>{option.label}</span>
                                </span>
                            </ListGroup.Item>
                        ))
                    ) : (
                        !showSpecialItems && (
                            <ListGroup.Item className="custom-dropdown-item no-results">
                                No Matching Results
                            </ListGroup.Item>
                        )
                    )}
                </div>
            );

            return { content, shouldPortal };
        };

        const renderButton = (
            opts: SelectWithCustomValueOptionType[],
            selValue: string | number | undefined,
            isOpenState: boolean,
            toggleFn: () => void,
            variantType: SelectWithCustomValueVariant,
            defaultVal?: string | number
        ) => (
            <button
                type="button"
                className={buildClassNames(
                    "custom-selectdropdown",
                    `custom-selectdropdown--${variantType}`,
                    disabled && "disabled"
                )}
                onClick={toggleFn}
                aria-expanded={isOpenState}
                aria-haspopup="listbox"
                disabled={disabled}
            >
                <span className="dropdown-text">
                    {getDisplayLabel({
                        opts,
                        selValue,
                        defaultVal,
                        placeholder,
                    })}
                </span>
                {renderArrowIcon(isOpenState)}
            </button>
        );

        /** Generic dropdown renderer (used for both primary and secondary) */
        const renderDropdown = (
            opts: SelectWithCustomValueOptionType[],
            selValue: string | number | undefined,
            isOpenState: boolean,
            toggleFn: () => void,
            selectFn: (value: string | number) => void,
            variantType: SelectWithCustomValueVariant,
            defaultVal?: string | number,
            wrapperClass?: string,
            itemClass?: string,
            showSpecialItems: boolean = false,
            wrapperRef?: React.RefObject<HTMLDivElement>,
            menuRef?: React.MutableRefObject<HTMLDivElement | null>,
            position?: DropdownPosition | null
        ) => {
            if (showSpecialItems && isCustomValueMode) {
                return (
                    <div
                        ref={wrapperRef}
                        className={buildClassNames("dropdown-wrapper", wrapperClass)}
                        onKeyDown={handleCustomInputKeyDown}
                    >
                        <CustomTextInput
                            value={customInputValue}
                            setValue={handleCustomInputSetValue}
                            onBlur={handleCustomInputBlur}
                            disabled={disabled}
                            placeholder={placeholder}
                            dataTestId={`${dataTestId}-custom-input`}
                            autoFocus={shouldAutoFocus}
                        />
                    </div>
                );
            }

            const { content, shouldPortal } = renderMenu(
                opts,
                selValue,
                selectFn,
                variantType,
                itemClass,
                showSpecialItems,
                menuRef,
                position
            );

            return (
                <div
                    ref={wrapperRef}
                    className={buildClassNames("dropdown-wrapper", wrapperClass)}
                >
                    {renderButton(
                        opts,
                        selValue,
                        isOpenState,
                        toggleFn,
                        variantType,
                        defaultVal
                    )}
                    {isOpenState &&
                        !disabled &&
                        (shouldPortal ? createPortal(content, document.body) : content)}
                </div>
            );
        };

        const containerClassName = useMemo(
            () =>
                buildClassNames(
                    "selectdropdown-container",
                    "selectdropdown-container--custom-value",
                    `selectdropdown-container--${variant}`,
                    className
                ),
            [className, variant]
        );

        // Compute automatic block spacing based on whether a secondary dropdown will render
        const hasSecondary = secondDropdown && (secondaryOptions.length > 0);
        const { style: incomingStyle, ...restDivProps } = restProps as { style?: React.CSSProperties } & Record<string, any>;
        const containerStyle: React.CSSProperties | undefined = {
            ...(incomingStyle || {}),
            ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
            ...(secondDropdown && { marginBottom: hasSecondary ? "5rem" : "2rem" })
        };

        return (
            <div
                ref={(node) => {
                    dropdownRef.current = node;
                    if (typeof ref === "function") ref(node);
                    else if (ref) ref.current = node;
                }}
                className={containerClassName}
                data-testid={dataTestId}
                style={containerStyle}
                {...restDivProps}
            >
                {/* --- PRIMARY DROPDOWN --- */}
                {renderDropdown(
                    filteredOptions,
                    selectedValue,
                    isOpen,
                    handleToggle,
                    handleOptionClick,
                    variant,
                    defaultValue,
                    dropdownWrapperClassName,
                    dropdownItemClassName,
                    true, // Show special items for primary dropdown
                    primaryWrapperRef,
                    primaryMenuRef,
                    primaryPosition
                )}

                {/* --- SECONDARY DROPDOWN (Indented) --- */}
                {secondDropdown && secondaryOptions.length > 0 && (

                    <div className="secondary-dropdown-container">
                        <VerticalLineIcon color="#E5E5E5" className='vertical-line-icon' />

                        <div className="secondary-dropdown-line" />
                        <div className="secondary-dropdown-inner">
                            {renderDropdown(
                                secondaryOptions,
                                secondSelectedValue,
                                secondIsOpen,
                                handleSecondToggle,
                                handleSecondSelect,
                                "secondary",
                                secondDefaultValue,
                                dropdownWrapperClassName,
                                dropdownItemClassName,
                                false, // Show special items for secondary dropdown
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

SelectWithCustomValueComponent.displayName = "SelectWithCustomValue";

export const SelectWithCustomValue = memo(SelectWithCustomValueComponent);
export type {
    SelectWithCustomValueProps as SelectWithCustomValuePropsType,
};

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SelectDropdown, SelectDropdownOptionType } from "./SelectDropdown";
import type { SelectDropdownPropsType } from "./SelectDropdown";

export interface UserOption {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username: string;
}

export interface UserSelectProps
  extends Omit<SelectDropdownPropsType, "options" | "searchDropdown"> {
  users: UserOption[];
  includeEmailInLabel?: boolean;
  showAsText?: boolean;
}

const getDisplayName = (user: UserOption): string => {
  if (user.firstName && user.lastName) return `${user.lastName}, ${user.firstName}`;
  if (user.lastName) return user.lastName;
  if (user.firstName) return user.firstName;
  return user.username;
};

export const UserSelect: React.FC<UserSelectProps> = ({
  users,
  value,
  onChange,
  disabled = false,
  ariaLabel = "user-select",
  dataTestId = "user-select",
  includeEmailInLabel = false,
  showAsText = false,
  className,
  ...rest
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedUserOptions = useMemo<SelectDropdownOptionType[]>(() => {
    return (users || [])
      .map(user => {
        const name = getDisplayName(user);
        const label = includeEmailInLabel && user.email ? `${name} (${user.email})` : name;
        return { label, value: user.username };
      })
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  }, [users, includeEmailInLabel]);

  const options = useMemo<SelectDropdownOptionType[]>(() => [
    { label: t("Assign to me"), value: "me" },
    { label: t("Unassigned"), value: "unassigned" },
    ...sortedUserOptions
  ], [sortedUserOptions, t]);

  const selectedOption = useMemo(
    () => options.find(opt => opt.value === value),
    [options, value]
  );

  const displayText = selectedOption?.label || "";

  const showDropdown = showAsText && (isHovered || isFocused || isClicked);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!(isFocused || isClicked || isHovered)) return;
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
        setIsClicked(false);
        setIsHovered(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFocused, isClicked, isHovered]);

  // Select and focus input utility
  const selectAndFocusInput = useCallback(() => {
    setTimeout(() => {
      const input = containerRef.current?.querySelector('input');
      if (input) {
        (input as HTMLInputElement).select();
        (input as HTMLInputElement).focus();
      }
    }, 100);
  }, []);

  // Handlers
  const handleTextClick = useCallback(() => {
    if (!disabled) {
      setIsClicked(prev => !prev);
      if (!isClicked) selectAndFocusInput();
    }
  }, [disabled, isClicked, selectAndFocusInput]);

  const handleDropdownOpen = useCallback(() => {
    selectAndFocusInput();
  }, [selectAndFocusInput]);

  const handleValueChange = useCallback((newValue: string | number) => {
    // Only call onChange if the value actually changed
    if (newValue !== value) {
      setIsFocused(false);
      setIsClicked(false);
      setIsHovered(false);
      onChange?.(newValue);
    }
  }, [onChange, value]);

  if (showAsText && !showDropdown) {
    return (
      <div
        ref={containerRef}
        className={`user-select-text${className ? ` ${className}` : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={handleTextClick}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={ariaLabel}
        data-testid={dataTestId}
        style={{ 
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        {displayText}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => {
        setIsFocused(true);
        handleDropdownOpen();
      }}
      onBlur={() => setIsFocused(false)}
      className="userSelect-container"
    >
      <SelectDropdown
        options={options}
        value={value}
        onChange={handleValueChange}
        disabled={disabled}
        searchDropdown={true}
        ariaLabel={ariaLabel}
        dataTestId={dataTestId}
        className={className}
        {...rest}
      />
    </div>
  );
};

export default UserSelect;

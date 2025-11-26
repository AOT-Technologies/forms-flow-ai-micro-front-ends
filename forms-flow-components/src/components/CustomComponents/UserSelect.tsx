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
  shortMeLabel?: boolean;
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
  shortMeLabel = false,
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

  const options = useMemo<SelectDropdownOptionType[]>(() => {
    // Default option labels shown in the dropdown list before selection
    let meOptionLabel = t("Assign to me");
    let unassignOptionLabel = t("Unassign");

    // When selected, override labels for  display 
    if (value === "me") {
      meOptionLabel = shortMeLabel ? t("Me") : t("Assigned to me");
    }
    if (value === "unassigned") {
      unassignOptionLabel = t("Unassigned");
    }

    return [
      { label: meOptionLabel, value: "me" },
      { label: unassignOptionLabel, value: "unassigned" },
      ...sortedUserOptions
    ];
  }, [sortedUserOptions, t, shortMeLabel, value]);

  const selectedOption = useMemo(
    () => options.find(opt => opt.value === value),
    [options, value]
  );

  const displayText = selectedOption?.label || "";

  const showDropdown = showAsText && (isHovered || isFocused || isClicked);

  const isPortalMenuTarget = useCallback((target: EventTarget | null) => {
    return target instanceof HTMLElement && !!target.closest(".custom-dropdown-options");
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!(isFocused || isClicked || isHovered)) return;
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      if (isPortalMenuTarget(target)) {
        return;
      }
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
  }, [isFocused, isClicked, isHovered, isPortalMenuTarget]);

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
    // Always propagate for special options 'me' and 'unassigned' to allow re-triggering claim/unclaim
    const isSpecial = newValue === 'me' || newValue === 'unassigned';
    if (newValue !== value || isSpecial) {
      setIsFocused(false);
      setIsClicked(false);
      setIsHovered(false);
      onChange?.(newValue);
    }
  }, [onChange, value]);

  if (showAsText && !showDropdown) {
    const isUserSelection = value !== "me" && value !== "unassigned" && !!displayText;
    const textNode = (shortMeLabel === false && isUserSelection)
      ? (
        <span>
          {t("Assigned to")}{" "}
          <span
            title={displayText}
            className="selected-assignee-label"
          >
            {displayText}
          </span>
        </span>
      ) : displayText;
    return (
      <div
        ref={containerRef}
        className={`user-select-text${className ? ` ${className}` : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={(event) => {
          if (isPortalMenuTarget(event.relatedTarget)) return;
          setIsHovered(false);
        }}
        onFocus={e => {
          setIsFocused(true);
          // Ensure focus is visible when tabbing
          if (e.type === "focus" && e.currentTarget === document.activeElement) {
            e.currentTarget.style.outline = "2px solid #2684FF";
          }
        }}
        onBlur={e => {
          if (isPortalMenuTarget(e.relatedTarget)) return;
          setIsFocused(false);
          e.currentTarget.style.outline = "none";
        }}
        onClick={handleTextClick}
        onKeyDown={e => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTextClick();
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={ariaLabel}
        data-testid={dataTestId}
        style={{ 
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        {textNode}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={(event) => {
        if (isPortalMenuTarget(event.relatedTarget)) return;
        setIsHovered(false);
      }}
      onFocus={() => {
        setIsFocused(true);
        handleDropdownOpen();
      }}
      onBlur={(event) => {
        if (isPortalMenuTarget(event.relatedTarget)) return;
        setIsFocused(false);
      }}
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

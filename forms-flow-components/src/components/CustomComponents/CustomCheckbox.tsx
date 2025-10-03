import * as React from "react";
import { forwardRef, memo, useCallback, useRef, useMemo } from "react";
import Form from "react-bootstrap/Form";
import { useTranslation } from "react-i18next";

/**
 * Checkbox option descriptor for `CustomCheckbox`.
 */
export interface CheckboxOption {
  /** Text label or translation key for the option */
  label: string;
  /** Value associated with this option */
  value: any;
  /** Optional: disable this specific option */
  disabled?: boolean;
  /** Optional: called when this option is clicked */
  onClick?: () => void;
}

/**
 * Props for `CustomCheckbox` checkbox group component.
 * Optimized, accessible, and i18n-aware checkbox group.
 */
export interface CustomCheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<"fieldset">, "onChange"> {
  /** Checkbox options to render */
  items: CheckboxOption[];
  /** Visual style variant */
  variant?: "primary" | "secondary";
  /** Group name (shared across all checkbox inputs) */
  name?: string;
  /** Test ID prefix for automated testing */
  dataTestId?: string;
  /** Accessible name if no visible legend is provided */
  ariaLabel?: string;
  /** Optional ID base used to generate item IDs */
  id?: string;
  /** Currently selected values (controlled) - array of values */
  selectedValues?: any[];
  /** Alias for selectedValues for backward compatibility */
  value?: any[];
  /** Called when selection changes; receives the selected values array and event */
  onChange?: (values: any[], event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Visible group label; rendered as a <legend> */
  legend?: string;
  /** Backward-compat: alias for legend */
  label?: string;
  /** Display checkboxes inline (horizontal) */
  inline?: boolean;
  /** Disable the entire group */
  disabled?: boolean;
  /** Mark the group as required */
  required?: boolean;
  /** Additional class for each option wrapper */
  optionClassName?: string;
}

/**
 * Utility to combine class names conditionally.
 */
const buildClassNames = (
  ...classes: (string | false | null | undefined)[]
): string => classes.filter(Boolean).join(" ");

// Ensure each checkbox group instance has a unique fallback id/name
let __checkboxGroupInstanceCounter = 0;

/**
 * CustomCheckbox: Accessible, memoized checkbox group with i18n support.
 *
 * Usage:
 * <CustomCheckbox
 *   name="permissions"
 *   legend="Permissions"
 *   items={[{label: 'Read', value: 'read'}, {label: 'Write', value: 'write'}]}
 *   selectedValues={values}
 *   onChange={(vals) => setValues(vals)}
 * />
 */
const CustomCheckboxComponent = forwardRef<HTMLFieldSetElement, CustomCheckboxProps>(
  (
    {
      items,
      name,
      dataTestId = "",
      id = "",
      ariaLabel = "",
      legend,
      label,
      inline = true,
      variant = "primary",
      disabled = false,
      required = false,
      optionClassName = "",
      selectedValues,
      value,
      onChange,
      className = "",
      ...restProps
    },
    ref
  ) => {
    const { t } = useTranslation();

    // Prefer selectedValues; support value as a legacy alias
    const effectiveSelectedValues = selectedValues !== undefined ? selectedValues : value || [];

    const handleChange = useCallback(
      (optionValue: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const currentValues = [...effectiveSelectedValues];
        const isChecked = currentValues.includes(optionValue);

        if (isChecked) {
          // Remove from selection
          const newValues = currentValues.filter(val => val !== optionValue);
          onChange?.(newValues, event);
        } else {
          // Add to selection
          const newValues = [...currentValues, optionValue];
          onChange?.(newValues, event);
        }
      },
      [disabled, onChange, effectiveSelectedValues]
    );

    const groupClassName = buildClassNames(
      "custom-checkbox",
      `custom-checkbox--${variant}`,
      inline && "custom-checkbox--inline",
      disabled && "is-disabled",
      className
    );

    // fieldset with legend provides native grouping and accessible name
    const groupIdRef = useRef<string>(id || name || `checkbox-group-${++__checkboxGroupInstanceCounter}`);
    const groupIdBase = groupIdRef.current;

    const groupLegend = legend || label;

    // Manage focusable items and arrow-key navigation within the group
    const optionRefs = useRef<(HTMLInputElement | null)[]>([]);
    const enabledIndexes: number[] = useMemo(
      () =>
        items
          .map((opt, idx) => ({ idx, disabled: disabled || !!opt.disabled }))
          .filter((x) => !x.disabled)
          .map((x) => x.idx),
      [items, disabled]
    );

    // Move focus only (do not toggle). Per WCAG/APG for checkboxes, Space toggles.
    const focusByIndex = useCallback(
      (targetIndex: number) => {
        const input = optionRefs.current[targetIndex];
        if (!input) return;
        input.focus();
      },
      []
    );

    const findNextEnabledIndex = useCallback(
      (start: number, delta: number) => {
        if (enabledIndexes.length === 0) return -1;
        let startPos = Math.max(0, start);
        
        for (const _ of items) {
          const nextPos = (startPos + delta + items.length) % items.length;
          if (items[nextPos] && !disabled && !items[nextPos].disabled) {
            return nextPos;
          }
          startPos = nextPos;
        }
        return -1;
      },
      [disabled, enabledIndexes.length, items]
    );

    // Toggle current checkbox on Enter or Space
    const handleOptionKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = event;
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        event.stopPropagation();
        (event.currentTarget as HTMLInputElement).click();
      }
    }, []);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLFieldSetElement>) => {
        if (disabled) return;
        const { key } = event;
        const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"] as const;
        if (!arrowKeys.includes(key as any)) return;

        event.preventDefault();
        event.stopPropagation();

        const activeEl = document.activeElement as HTMLInputElement | null;
        const currentIndex = optionRefs.current.indexOf(activeEl);
        const fallbackIndex = enabledIndexes.length > 0 ? enabledIndexes[0] : -1;
        const baseIndex = currentIndex === -1 ? fallbackIndex : currentIndex;

        if (baseIndex === -1) return;

        if (key === "Home") {
          focusByIndex(enabledIndexes[0]);
          return;
        }
        if (key === "End") {
          const lastEnabledIndex = enabledIndexes.length > 0 ? enabledIndexes.at(-1) : -1;
          if (lastEnabledIndex !== -1) focusByIndex(lastEnabledIndex);
          return;
        }

        const delta = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
        const nextIndex = findNextEnabledIndex(baseIndex, delta);
        if (nextIndex !== -1) focusByIndex(nextIndex);
      },
      [disabled, enabledIndexes, findNextEnabledIndex, focusByIndex]
    );

    return (
      <Form className={groupClassName}>
        <fieldset
          ref={ref}
          id={groupIdBase}
          aria-label={!groupLegend ? ariaLabel : undefined}
          aria-disabled={disabled}
          aria-required={required}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          {...restProps}
        >
          {groupLegend ? <legend>{t(groupLegend)}</legend> : null}
          {items.map((option, index) => {
            const optionId = `${groupIdBase}-${index + 1}`;
            const isChecked = effectiveSelectedValues.includes(option.value);
            const isOptionDisabled = disabled || !!option.disabled;
            const isTabbable = enabledIndexes.includes(index);
            
            return (
              <Form.Check
                inline={inline}
                label={t(option.label)}
                value={String(option.value)}
                name={name || groupIdBase}
                type="checkbox"
                id={optionId}
                data-testid={`${dataTestId}-inline-checkbox-${index + 1}`}
                key={String(option.value ?? option.label ?? index)}
                checked={!!isChecked}
                disabled={isOptionDisabled}
                onChange={handleChange(option.value)}
                onClick={option.onClick}
                className={buildClassNames("v8-form-check", optionClassName)}
                required={required}
                tabIndex={isTabbable ? 0 : -1}
                onKeyDown={handleOptionKeyDown}
                ref={(el: HTMLInputElement | null) => {
                  optionRefs.current[index] = el;
                }}
              />
            );
          })}
        </fieldset>
      </Form>
    );
  }
);

CustomCheckboxComponent.displayName = "CustomCheckbox";

export const CustomCheckbox = memo(CustomCheckboxComponent);

export type { CustomCheckboxProps as TCustomCheckboxProps };

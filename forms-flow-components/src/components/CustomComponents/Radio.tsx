import React, { forwardRef, memo, useCallback, useRef, useMemo } from "react";
import Form from "react-bootstrap/Form";
import { useTranslation } from "react-i18next";

/**
 * Radio option descriptor for `CustomRadioButton`.
 */
export interface RadioOption {
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
 * Props for `CustomRadioButton` radio group component.
 * Optimized, accessible, and i18n-aware radio group.
 */
export interface CustomRadioButtonProps
  extends Omit<React.ComponentPropsWithoutRef<"fieldset">, "onChange"> {
  /** Radio options to render */
  items: RadioOption[];
  /** Visual style variant */
  variant?: "primary" | "secondary";
  /** Group name (shared across all radio inputs) */
  name?: string;
  /** Test ID prefix for automated testing */
  dataTestId?: string;
  /** Accessible name if no visible legend is provided */
  ariaLabel?: string;
  /** Optional ID base used to generate item IDs */
  id?: string;
  /** Currently selected value (controlled) */
  selectedValue?: any;
  /** Alias for selectedValue for backward compatibility */
  value?: any;
  /** Called when selection changes; receives the selected value and event */
  onChange?: (value: any, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Visible group label; rendered as a <legend> */
  legend?: string;
  /** Backward-compat: alias for legend */
  label?: string;
  /** Display radios inline (horizontal) */
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

// Ensure each radio group instance has a unique fallback id/name
let __radioGroupInstanceCounter = 0;

/**
 * CustomRadioButton: Accessible, memoized radio group with i18n support.
 *
 * Usage:
 * <CustomRadioButton
 *   name="status"
 *   legend="Status"
 *   items={[{label: 'Active', value: 'A'}, {label: 'Inactive', value: 'I'}]}
 *   selectedValue={value}
 *   onChange={(val) => setValue(val)}
 * />
 */
const CustomRadioButtonComponent = forwardRef<HTMLFieldSetElement, CustomRadioButtonProps>(
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
      selectedValue,
      value,
      onChange,
      className = "",
      ...restProps
    },
    ref
  ) => {
    const { t } = useTranslation();

    // Prefer selectedValue; support value as a legacy alias
    const effectiveSelectedValue = selectedValue !== undefined ? selectedValue : value;

    const handleChange = useCallback(
      (optionValue: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onChange?.(optionValue, event);
      },
      [disabled, onChange]
    );

    const groupClassName = buildClassNames(
      "custom-radio-button",
      `custom-radio-button--${variant}`,
      inline && "custom-radio-button--inline",
      disabled && "is-disabled",
      className
    );

    // fieldset with legend provides native grouping and accessible name
    const groupIdRef = useRef<string>(id || name || `radio-group-${++__radioGroupInstanceCounter}`);
    const groupIdBase = groupIdRef.current;

    const groupLegend = legend || label;

    // Manage roving tabindex and arrow-key navigation within the group
    const optionRefs = useRef<(HTMLInputElement | null)[]>([]);
    const enabledIndexes: number[] = useMemo(
      () =>
        items
          .map((opt, idx) => ({ idx, disabled: disabled || !!opt.disabled }))
          .filter((x) => !x.disabled)
          .map((x) => x.idx),
      [items, disabled]
    );

    const checkedIndex = items.findIndex((opt) => effectiveSelectedValue === opt.value);
    const firstEnabledIndex = enabledIndexes.length > 0 ? enabledIndexes[0] : -1;

    const focusAndSelectByIndex = useCallback(
      (targetIndex: number) => {
        const input = optionRefs.current[targetIndex];
        if (!input) return;
        input.focus();
        // Trigger change for controlled update
        input.click();
      },
      []
    );

    const findNextEnabledIndex = useCallback(
      (start: number, delta: number) => {
        if (enabledIndexes.length === 0) return -1;
        const startPos = Math.max(0, start);
        let nextPos = startPos;
        for (let i = 0; i < items.length; i += 1) {
          nextPos = (nextPos + delta + items.length) % items.length;
          if (!items[nextPos] || disabled || items[nextPos].disabled) continue;
          return nextPos;
        }
        return -1;
      },
      [disabled, enabledIndexes.length, items]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLFieldSetElement>) => {
        if (disabled) return;
        const { key } = event;
        const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"] as const;
        if (!arrowKeys.includes(key as any)) return;

        event.preventDefault();
        event.stopPropagation();

        const activeEl = document.activeElement as HTMLElement | null;
        const currentIndex = optionRefs.current.findIndex((el) => el === activeEl);
        const fallbackIndex = checkedIndex !== -1 ? checkedIndex : firstEnabledIndex;
        const baseIndex = currentIndex !== -1 ? currentIndex : fallbackIndex;

        if (baseIndex === -1) return;

        if (key === "Home") {
          focusAndSelectByIndex(firstEnabledIndex);
          return;
        }
        if (key === "End") {
          const lastEnabledIndex = enabledIndexes.length > 0 ? enabledIndexes[enabledIndexes.length - 1] : -1;
          if (lastEnabledIndex !== -1) focusAndSelectByIndex(lastEnabledIndex);
          return;
        }

        const delta = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
        const nextIndex = findNextEnabledIndex(baseIndex, delta);
        if (nextIndex !== -1) focusAndSelectByIndex(nextIndex);
      },
      [checkedIndex, disabled, enabledIndexes, findNextEnabledIndex, firstEnabledIndex, focusAndSelectByIndex]
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
          const isChecked = effectiveSelectedValue === option.value;
          const isOptionDisabled = disabled || !!option.disabled;
          const isTabbable = isChecked || (checkedIndex === -1 && index === firstEnabledIndex);
          return (
            <Form.Check
              inline={inline}
              label={t(option.label)}
              value={String(option.value)}
              name={name || groupIdBase}
              type="radio"
              id={optionId}
              data-testid={`${dataTestId}-inline-radio-${index + 1}`}
              key={String(option.value ?? option.label ?? index)}
              checked={!!isChecked}
              disabled={isOptionDisabled}
              onChange={handleChange(option.value)}
              onClick={option.onClick}
              className={optionClassName}
              required={required}
              tabIndex={isTabbable ? 0 : -1}
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

CustomRadioButtonComponent.displayName = "CustomRadioButton";

export const CustomRadioButton = memo(CustomRadioButtonComponent);

export type { CustomRadioButtonProps as TCustomRadioButtonProps };

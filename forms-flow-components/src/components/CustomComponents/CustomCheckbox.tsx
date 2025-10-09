import * as React from "react";
import { forwardRef, memo, useCallback } from "react";
import Form from "react-bootstrap/Form";
import { useTranslation } from "react-i18next";

/**
 * Props for `CustomCheckbox` single checkbox component.
 * Optimized, accessible, and i18n-aware checkbox.
 */
export interface CustomCheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "onChange" | "type" | "size"> {
  /** Text label or translation key for the checkbox */
  label: string;
  /** Visual style variant */
  variant?: "primary" | "secondary";
  /** Size variant */
  size?: "default" | "small";
  /** Checkbox name attribute */
  name?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Optional ID for the checkbox */
  id?: string;
  /** Checked state (controlled) */
  checked?: boolean;
  /** Called when checkbox state changes; receives the new checked state and event */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Disable the checkbox */
  disabled?: boolean;
  /** Mark the checkbox as required */
  required?: boolean;
  /** Additional class for the checkbox wrapper */
  wrapperClassName?: string;
  /** Optional: called when checkbox is clicked */
  onClick?: () => void;
  /** Value attribute for the checkbox */
  value?: string | number;
}

/**
 * Utility to combine class names conditionally.
 */
const buildClassNames = (
  ...classes: (string | false | null | undefined)[]
): string => classes.filter(Boolean).join(" ");

// Ensure each checkbox instance has a unique fallback id
let __checkboxInstanceCounter = 0;

/**
 * CustomCheckbox: Accessible, memoized single checkbox with i18n support.
 *
 * Usage:
 * <CustomCheckbox
 *   name="agree"
 *   label="I agree to the terms"
 *   checked={isChecked}
 *   onChange={(checked) => setIsChecked(checked)}
 *   size="small"  // optional: "default" | "small"
 *   variant="primary"  // optional: "primary" | "secondary"
 * />
 */
const CustomCheckboxComponent = forwardRef<HTMLInputElement, CustomCheckboxProps>(
  (
    {
      label,
      name,
      dataTestId = "",
      id,
      variant = "primary",
      size = "default",
      disabled = false,
      required = false,
      wrapperClassName = "",
      checked = false,
      value,
      onChange,
      onClick,
      className = "",
      ...restProps
    },
    ref
  ) => {
    const { t } = useTranslation();

    // Generate a unique ID if not provided
    const checkboxId = id || `checkbox-${++__checkboxInstanceCounter}`;

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const newChecked = event.target.checked;
        onChange?.(newChecked, event);
      },
      [disabled, onChange]
    );

    const formClassName = buildClassNames(
      "custom-checkbox",
      `custom-checkbox--${variant}`,
      size === "small" && "custom-checkbox--small",
      disabled && "is-disabled",
      wrapperClassName
    );

    return (
      <Form className={formClassName}>
        <Form.Check
          label={t(label)}
          value={value !== undefined ? String(value) : undefined}
          name={name}
          type="checkbox"
          id={checkboxId}
          data-testid={dataTestId || `checkbox-${checkboxId}`}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          onClick={onClick}
          className={buildClassNames("v8-form-check", className)}
          required={required}
          ref={ref}
          {...restProps}
        />
      </Form>
    );
  }
);

CustomCheckboxComponent.displayName = "CustomCheckbox";

export const CustomCheckbox = memo(CustomCheckboxComponent);

export type { CustomCheckboxProps as TCustomCheckboxProps };

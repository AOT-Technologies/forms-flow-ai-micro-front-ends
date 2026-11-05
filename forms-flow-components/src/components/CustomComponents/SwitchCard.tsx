import React, { forwardRef, memo, useMemo } from "react";
import { Switch, SwitchVariant } from "./Switch";

/**
 * SwitchCard is a bordered card with a toggle switch, a title and an optional
 * description beside it. The card takes a tinted "on" style while checked.
 *
 * Usage:
 * <SwitchCard checked={on} onChange={setOn} label={t("Feature is ON")} />
 * <SwitchCard
 *   checked={on}
 *   onChange={setOn}
 *   label={t("Feature is OFF")}
 *   description={t("What the feature does")}
 *   colors={{ checkedBorder: "var(--ff-primary-light)" }}
 * />
 */

/** Optional colour overrides; any CSS colour value or theme variable. */
interface SwitchCardColors {
  border?: string;
  background?: string;
  checkedBorder?: string;
  checkedBackground?: string;
  label?: string;
  description?: string;
}

interface SwitchCardProps
  extends Omit<
    React.ComponentPropsWithoutRef<"div">,
    "children" | "onChange" | "color"
  > {
  /** Whether the switch is on */
  checked?: boolean;
  /** Callback when the switch is toggled */
  onChange?: (checked: boolean) => void;
  /** Disables the switch */
  disabled?: boolean;
  /** Title beside the switch (already translated); also the switch's accessible name */
  label: string;
  /** Text below the title (already translated); omitted when not provided */
  description?: React.ReactNode;
  /** Colour overrides for the card, title and description */
  colors?: SwitchCardColors;
  /** Visual style variant of the inner switch */
  switchType?: SwitchVariant;
  /** HTML id of the switch button */
  id?: string;
  /** Additional CSS classes for the card */
  className?: string;
  /** Test ID prefix: the switch gets "<id>-switch", the description "<id>-description" */
  dataTestId?: string;
}

// Each colour override maps onto a CSS custom property read by the theme
// (v8-scss/_switchCard), so the defaults stay in the stylesheet.
const COLOR_VARIABLES: Record<keyof SwitchCardColors, string> = {
  border: "--switch-card-border",
  background: "--switch-card-background",
  checkedBorder: "--switch-card-checked-border",
  checkedBackground: "--switch-card-checked-background",
  label: "--switch-card-label-color",
  description: "--switch-card-description-color",
};

const buildColorStyle = (
  colors?: SwitchCardColors
): React.CSSProperties | undefined => {
  if (!colors) return undefined;
  const style: Record<string, string> = {};
  (Object.keys(COLOR_VARIABLES) as (keyof SwitchCardColors)[]).forEach(
    (key) => {
      if (colors[key]) style[COLOR_VARIABLES[key]] = colors[key];
    }
  );
  return style as React.CSSProperties;
};

const SwitchCardComponent = forwardRef<HTMLDivElement, SwitchCardProps>(
  (
    {
      checked = false,
      onChange,
      disabled = false,
      label,
      description,
      colors,
      switchType = "default",
      id,
      className = "",
      dataTestId = "switch-card",
      ...restProps
    },
    ref
  ) => {
    const colorStyle = useMemo(() => buildColorStyle(colors), [colors]);
    const hasDescription =
      description !== undefined && description !== null && description !== "";

    const cardClassName = [
      "switch-card",
      checked && "switch-card--checked",
      !hasDescription && "switch-card--no-description",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={ref}
        className={cardClassName}
        style={colorStyle}
        data-testid={dataTestId}
        {...restProps}
      >
        <Switch
          id={id}
          className="switch-card-switch"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          label={label}
          type={switchType}
          dataTestId={`${dataTestId}-switch`}
        />
        {hasDescription && (
          <p
            className="switch-card-description"
            data-testid={`${dataTestId}-description`}
          >
            {description}
          </p>
        )}
      </div>
    );
  }
);

SwitchCardComponent.displayName = "SwitchCard";

export const SwitchCard = memo(SwitchCardComponent);

export type { SwitchCardProps, SwitchCardColors };

import React, { forwardRef, memo, useId } from "react";

/**
 * TitledSection is a page section with a title over a divider, an optional note
 * at the right of the title (a count, a status) and its content below.
 *
 * Usage:
 * <TitledSection title={t("Required content")}>
 *   <ul>...</ul>
 * </TitledSection>
 * <TitledSection
 *   title={t("Optional content")}
 *   note={t("{{count}} available, none in use", { count })}
 *   dataTestId="optional-content"
 * >
 *   ...
 * </TitledSection>
 */

type HeadingLevel = 2 | 3 | 4 | 5 | 6;

interface TitledSectionProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "title"> {
  /** Section title (already translated); also the section's accessible name */
  title: React.ReactNode;
  /** Text at the right of the title (already translated); announced when it changes */
  note?: React.ReactNode;
  /** Heading level of the title, to fit the page's outline */
  headingLevel?: HeadingLevel;
  /** Section content */
  children?: React.ReactNode;
  /** Additional CSS classes for the section */
  className?: string;
  /** Test ID prefix: the title gets "<id>-title", the note "<id>-note" */
  dataTestId?: string;
}

const TitledSectionComponent = forwardRef<HTMLElement, TitledSectionProps>(
  (
    {
      title,
      note,
      headingLevel = 2,
      children,
      className = "",
      dataTestId = "titled-section",
      ...restProps
    },
    ref
  ) => {
    const titleId = useId();
    const Heading = `h${headingLevel}` as const;
    const hasNote = note !== undefined && note !== null && note !== "";

    return (
      <section
        ref={ref}
        className={["titled-section", className].filter(Boolean).join(" ")}
        aria-labelledby={titleId}
        data-testid={dataTestId}
        {...restProps}
      >
        <div className="titled-section-header">
          <Heading
            id={titleId}
            className="titled-section-title"
            data-testid={`${dataTestId}-title`}
          >
            {title}
          </Heading>
          {hasNote && (
            <span
              className="titled-section-note"
              aria-live="polite"
              data-testid={`${dataTestId}-note`}
            >
              {note}
            </span>
          )}
        </div>
        {children}
      </section>
    );
  }
);

TitledSectionComponent.displayName = "TitledSection";

export const TitledSection = memo(TitledSectionComponent);

export type { TitledSectionProps };

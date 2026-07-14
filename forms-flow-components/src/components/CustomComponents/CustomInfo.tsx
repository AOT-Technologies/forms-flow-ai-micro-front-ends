import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { InfoIcon } from "../SvgIcons/index";

type InfoVariant = "primary" | "secondary" | "error" | "warning" | "plain";

interface CustomInfoProps {
    content: string;
    variant?: InfoVariant;
    className?: string;
    dataTestId?: string;
    /** Optional icon override (replaces the default InfoIcon). */
    icon?: React.ReactNode;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

export const CustomInfo: FC<CustomInfoProps> = ({ 
    content,
    variant = "primary",
    className,
    dataTestId,
    icon
}) => { 
  const { t } = useTranslation();
  
  // Replace `\n` with <br /> tags (no trailing <br />)
  const contentLines = content.split("\n");
  const formattedContent = contentLines.map((line, idx) => (
    <React.Fragment key={`${idx}-${line.trim().replace(/\s+/g, "-")}`}>
      {t(line)}
      {idx < contentLines.length - 1 ? <br /> : null}
    </React.Fragment>
  ));

  const panelClassName = buildClassNames(
    "info-panel",
    `info-panel--${variant}`,
    className
  );

  return (
    <div className={panelClassName} data-testid={dataTestId}>
      <div className="info-icon">
        {icon ?? <InfoIcon variant={variant} />}
      </div>
      <div className="info-content">{formattedContent}</div>
    </div>
  );
};

export type { CustomInfoProps, InfoVariant };
import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { InfoIcon } from "../SvgIcons/index";

type InfoVariant = "primary" | "secondary" | "error" | "warning";

interface CustomInfoProps {
    content: string;
    variant?: InfoVariant;
    className?: string;
    dataTestId?: string;
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
    dataTestId
}) => { 
  const { t } = useTranslation();
  
   // Replace `\n` with <br /> tags and use the line itself as a key
   const formattedContent = content.split("\n").map((line) => (
    <React.Fragment key={line.trim().replace(/\s+/g, "-")}>
      {t(line)}
      <br />
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
        <InfoIcon variant={variant} />
      </div>
      <div className="info-content">{formattedContent}</div>
    </div>
  );
};

export type { CustomInfoProps, InfoVariant };
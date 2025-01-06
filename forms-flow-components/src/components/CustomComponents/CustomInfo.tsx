import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { InfoIcon } from "../SvgIcons/index";


interface CustomInfoProps {
    heading: string ;
    content: string ;
    className?: string ;
}

export const CustomInfo: FC<CustomInfoProps> = ( { 
    heading ,
    content ,
    className ,
}) => { 
  const { t } = useTranslation();
  
  // Replace `\n` with <br /> tags
  // Create a unique key for each line using a random identifier (e.g., Date.now combined with a line)
  const formattedContent = content.split("\n").map((line) => (
    <React.Fragment key={`${line}-${Date.now()}`}>
      {t(line)}
      <br />
    </React.Fragment>
  ));

  return (
    <div className={`info-panel ${className}`}>
      <div className="d-flex align-items-center">
        <InfoIcon />
        <div className="field-label ms-2">{t(heading)}</div>
      </div>
      <div className="info-content">{formattedContent}</div> {/* Render formatted content */}
    </div>
  );
};
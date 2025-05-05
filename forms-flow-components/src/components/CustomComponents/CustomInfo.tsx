import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { NewInfoIcon } from "../SvgIcons/index";


interface CustomInfoProps {
    heading: string ;
    content: string ;
    className?: string ;
    dataTestId?: string;
}

export const CustomInfo: FC<CustomInfoProps> = ( { 
    heading ,
    content ,
    className ,
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


  return (
    <div className={`info-panel ${className}`} data-test-id={dataTestId}>
      <div className="d-flex align-items-center">
        <NewInfoIcon />
        <div className="field-label ms-2">{t(heading)}</div>
      </div>
      <div className="info-content">{formattedContent}</div> {/* Render formatted content */}
    </div>
  );
};
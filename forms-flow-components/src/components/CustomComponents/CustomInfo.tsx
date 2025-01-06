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
  
  // Replace `\n` with <br /> tags and use the index as the key
  const formattedContent = content.split("\n").map((line, index) => (
    <React.Fragment key={`line-${index}`}>
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
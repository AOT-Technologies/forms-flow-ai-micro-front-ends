import React ,{ FC } from "react";
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
    return (
        <div className={`info-panel ${className}`}>
        <div className="d-flex align-items-center">
          <InfoIcon />
          <div className="field-label ms-2">{t(heading)}</div>
        </div>
        <div className="info-content">
          {t(content)}
        </div>
      </div>
    )
};
import React from "react";
import Badge from "react-bootstrap/Badge";
import { useTranslation } from "react-i18next";


interface CustomPillProps {
  label: string;
  secondaryLabel: string;
  icon?: React.ReactNode;
  bg: string;
  dataTestId?: string;
  ariaLabel?: string;
  onClick?: () => void; 
  className?: string;
}

export const CustomPill: React.FC<CustomPillProps> = ({
  label,
  icon,
  bg,
 dataTestId = "",
  ariaLabel = "",
  secondaryLabel="",
  onClick,
  className = "",
}) => {
  const { t } = useTranslation();
  return (
    <div>
  <Badge
    pill
    bg={bg}
    data-testid={dataTestId}
    aria-label={ariaLabel}
  >
    <div className={`d-flex justify-content-between align-items-center ${className}`}>
      <div className="d-flex flex-column">
        <p className="primary-label mb-0">{label}</p>
        {secondaryLabel && (
          <p className="secondary-label mb-0">{secondaryLabel}</p>
        )}
      </div>
      {icon && (
        <div className="ms-2 d-flex align-items-center">
          <button 
        className="button-as-div"
        aria-label="click icon" 
        data-testid="click-icon"
         onClick={(e) => {
                  e.stopPropagation(); 
                  onClick?.();
                }}>{icon}</button>
        </div>
      )}
    </div>
  </Badge>
</div>

  );
};

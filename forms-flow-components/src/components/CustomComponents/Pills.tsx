import React from "react";
import Badge from "react-bootstrap/Badge";
import {  DeleteIcon } from "../SvgIcons/index";

interface CustomPillProps {
  label: string;
  secondaryLabel: string;
  icon?: React.ReactNode;
  bg: string;
  dataTestid?: string;
  ariaLabel?: string;
  onClick?: () => void; 
}

export const CustomPill: React.FC<CustomPillProps> = ({
  label,
  icon,
  bg,
  dataTestid = "",
  ariaLabel = "",
  secondaryLabel="",
  onClick,
}) => {
  return (
    <div>
      <Badge pill variant={bg} data-testid={dataTestid} aria-label={ariaLabel}>
        <span className="primary-label">{label}</span> 
        { secondaryLabel && (<span className="secondary-label" >{secondaryLabel}</span>)}
        {icon && 
        <button 
        className="button-as-div"
        aria-label="click icon" 
        data-testid="click-icon"
        onClick={onClick}>{icon}</button>}
      </Badge>{" "}
    </div>
  );
};

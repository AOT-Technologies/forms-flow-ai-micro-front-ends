import React from "react";
import Badge from "react-bootstrap/Badge";
import { CloseIcon } from "../SvgIcons/index";

interface CustomPillProps {
  label: string;
  icon?: boolean;
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
  onClick,
}) => {
  return (
    <div>
      <Badge pill variant={bg} data-testid={dataTestid} aria-label={ariaLabel}>
        {label} {icon && <CloseIcon color="#253DF4" onClick={onClick} />}
      </Badge>{" "}
    </div>
  );
};

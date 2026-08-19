import React from "react";
import { BrandingLogo, FORMSFLOW_LOGO_ICON_SVG } from "./themeConstants";

interface BrandingToggleProps {
  value: BrandingLogo;
  onChange: (key: BrandingLogo) => void;
}

const BrandingToggle: React.FC<BrandingToggleProps> = ({ value, onChange }) => {
  return (
    <div className="ff-branding-toggle" role="group">
      <button
        type="button"
        role="radio"
        aria-checked={value === "none"}
        className={`ff-branding-toggle__option${value === "none" ? " ff-branding-toggle__option--selected" : ""}`}
        onClick={() => onChange("none")}
      >
        None
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "formsflow"}
        className={`ff-branding-toggle__option ff-branding-toggle__option--logo${value === "formsflow" ? " ff-branding-toggle__option--selected" : ""}`}
        onClick={() => onChange("formsflow")}
      >
        <span
          className="ff-branding-toggle__icon"
          dangerouslySetInnerHTML={{ __html: FORMSFLOW_LOGO_ICON_SVG }}
        />
        <span className="ff-branding-toggle__label">
          formsflow<em>.ai</em>
        </span>
      </button>
    </div>
  );
};

export default BrandingToggle;

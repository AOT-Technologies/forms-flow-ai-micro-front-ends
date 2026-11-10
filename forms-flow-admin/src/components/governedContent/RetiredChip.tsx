import React from "react";
import { useTranslation } from "react-i18next";

// Figma chip/Retired: marks a retired block in the library and on View block.
// A div so the theme's grid-cell span rule (display: block) doesn't apply.

const RetiredChip: React.FC<{ dataTestId?: string }> = ({ dataTestId }) => {
  const { t } = useTranslation();
  return (
    <div className="ff-governed-chip" data-testid={dataTestId}>
      {t("Retired")}
    </div>
  );
};

export default RetiredChip;

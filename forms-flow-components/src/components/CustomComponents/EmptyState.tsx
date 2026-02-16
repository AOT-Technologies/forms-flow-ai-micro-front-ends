import React from "react";
import { useTranslation } from "react-i18next";
import { V8CustomButton } from "./CustomButton";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  size?: "small" | "medium" | "large";
  dataTestId?: string;
}

export interface EmptyStateProps {
  message: string;
  action?: EmptyStateAction;
  className?: string;
  dataTestId?: string;
}

/**
 * Reusable EmptyState component for displaying empty states in tables and lists
 * Supports customizable messages and optional action buttons
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  action,
  className = "",
  dataTestId = "empty-state",
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`reusable-table-empty-state ${className}`}
      data-testid={dataTestId}
      role="status"
      aria-live="polite"
    >
      <p className="reusable-table-empty-state-message">{t(message)}</p>
      {action && (
        <div className="reusable-table-empty-state-action">
          <V8CustomButton
            variant={action.variant || "primary"}
            size={action.size || "medium"}
            label={t(action.label)}
            onClick={action.onClick}
            dataTestId={action.dataTestId || "empty-state-action-button"}
          />
        </div>
      )}
    </div>
  );
};

export default EmptyState;

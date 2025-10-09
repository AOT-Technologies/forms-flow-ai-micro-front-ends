import React from "react";
import { Breadcrumb } from "react-bootstrap";

// Represents a single breadcrumb item
export interface BreadcrumbItem {
  label: string;
  id?: string;
}

export enum BreadcrumbVariant {
  DEFAULT = "default",
  MINIMIZED = "minimized",
}

// Props for the BreadCrumbs component
interface BreadCrumbsProps {
  items: BreadcrumbItem[];
  variant?: BreadcrumbVariant;
  underline?: boolean;
  onBreadcrumbClick?: (item: BreadcrumbItem) => void;
}

export const BreadCrumbs: React.FC<BreadCrumbsProps> = ({
  items,
  variant = BreadcrumbVariant.DEFAULT,
  underline = false,
  onBreadcrumbClick
}) => {
  return (
    <Breadcrumb
      className={`breadcrumb-custom breadcrumb-${variant} ${
        underline ? "breadcrumb-underline" : ""
      }`}
      data-testid="breadcrumbs"
      aria-label="breadcrumb-navigation"
    >
      {items.map((item, index) => (
        <Breadcrumb.Item
          linkAs="button"
          key={item.label}
          active={!underline && index === items.length - 1}
          linkProps={{
            type: "button",
            style: {
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              color: "inherit",
              textDecoration: "underline",
            },
          onClick: () => {
              if (onBreadcrumbClick) {
                onBreadcrumbClick(item);
              }
            },
          }}
          data-testid={`breadcrumb-item-${index}`}
          aria-label={`breadcrumb-${item.label}`}>
          {item.label}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

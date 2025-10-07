import React from "react";
import { Breadcrumb } from "react-bootstrap";

// Represents a single breadcrumb item
export interface BreadcrumbItem {
  label: string;
  path?: string;
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
}

export const BreadCrumbs: React.FC<BreadCrumbsProps> = ({
  items,
  variant = BreadcrumbVariant.DEFAULT,
  underline = false,
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
          key={`${item.label}-${item.path || "no-path"}`}
          href={item.path ? item.path : undefined}
          active={index === items.length - 1}
          data-testid={`breadcrumb-item-${index}`}
          aria-label={`breadcrumb-${item.label}`}
        >
          {item.label}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

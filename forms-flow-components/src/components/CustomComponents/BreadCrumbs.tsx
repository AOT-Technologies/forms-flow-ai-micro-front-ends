import React from "react";
import { Breadcrumb } from "react-bootstrap";

// Represents a single breadcrumb item
export interface BreadcrumbItem {
  label: string; 
  path?: string; 
}

// Props for the BreadCrumbs component
interface BreadCrumbsProps {
  items: BreadcrumbItem[]; 
}

export const BreadCrumbs: React.FC<BreadCrumbsProps> = ({ items }) => {
  return (
    <Breadcrumb
      className="breadcrumb-custom"
      data-testid="breadcrumbs"
      aria-label="breadcrumb-navigation"
    >
      {items.map((item, index) => (
        <Breadcrumb.Item
          key={index}
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

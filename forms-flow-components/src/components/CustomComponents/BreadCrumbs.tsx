// components/BreadCrumbs.tsx
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
    <Breadcrumb className="breadcrumb-custom">
      {items.map((item, index) => (
        <Breadcrumb.Item
          key={index} 
          href={item.path ? item.path : undefined} 
          active={index === items.length - 1} 
        >
          {item.label} 
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

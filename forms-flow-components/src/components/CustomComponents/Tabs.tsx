import React from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

interface TabItem {
  eventKey: string;
  title: string;
  content: React.ReactNode;
}

interface CustomTabsProps {
  defaultActiveKey: string;
  id?: string;
  tabs: TabItem[];
  dataTestid?: string;
  ariaLabel?: string;
  onSelect?: (eventKey: string | null) => void;
  className? : string;
}

export const CustomTabs: React.FC<CustomTabsProps> = ({
  defaultActiveKey,
  id = "custom-tab",
  tabs,
  dataTestid = "",
  ariaLabel = "",
  onSelect,
  className ,
}) => {
  return (
    <Tabs
      defaultActiveKey={defaultActiveKey}
      id={id}
      className={`custom-tabs ${className}`}
      data-testid={dataTestid}
      aria-label={ariaLabel}
      onSelect={onSelect}
    >
      {tabs.map((tab, index) => (
        <Tab key={index} eventKey={tab.eventKey} title={tab.title} data-testid={`${dataTestid}-tab-${tab.eventKey}`} >
          {tab.content}
        </Tab>
      ))}
    </Tabs>
  );
};

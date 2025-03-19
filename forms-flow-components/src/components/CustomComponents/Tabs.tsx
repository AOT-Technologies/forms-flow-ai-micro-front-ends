import React from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useTranslation } from "react-i18next";


interface TabItem {
  eventKey: string;
  title: string;
  content: string | React.ReactNode;
}

interface CustomTabsProps {
  defaultActiveKey: string;
  id?: string;
  tabs: TabItem[];
 dataTestId?: string;
  ariaLabel?: string;
  onSelect?: (eventKey: string | null) => void;
  className? : string;
}

export const CustomTabs: React.FC<CustomTabsProps> = ({
  defaultActiveKey,
  id = "custom-tab",
  tabs,
 dataTestId = "",
  ariaLabel = "",
  onSelect,
  className ,
}) => {
  const { t } = useTranslation();
  return (
    <Tabs
      defaultActiveKey={defaultActiveKey}
      id={id}
      className={`custom-tabs ${className}`}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      onSelect={onSelect}
    >
      {tabs.map((tab, index) => (
        <Tab key={index} eventKey={tab.eventKey} title={tab.title} data-testid={`${dataTestId}-tab-${tab.eventKey}`} >
          {tab.content}
        </Tab>
      ))}
    </Tabs>
  );
};

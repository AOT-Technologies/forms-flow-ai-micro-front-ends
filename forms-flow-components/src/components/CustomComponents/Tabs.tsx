import React, { useEffect, useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs"; 


interface TabItem {
  eventKey: string;
  title: string;
  content: string | React.ReactNode;
  className?: string;
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
  const [key,setKey] = useState(defaultActiveKey)
  const handleChange = (newKey)=>{
    setKey(newKey);
    onSelect?.(newKey);
  }
  useEffect(()=>{
    setKey(defaultActiveKey);
  },[defaultActiveKey])

  return (
    <Tabs
      id={id}
      activeKey={key}
      className={`custom-tabs ${className}`}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      onSelect={handleChange}
    >
      {tabs.map((tab, index) => (
        <Tab
          className={tab.className}
          key={`${tab.eventKey}-${index}`}
          eventKey={tab.eventKey}
          title={tab.title}
          data-testid={`${dataTestId}-tab-${tab.eventKey}`}
        >
          {tab.content}
        </Tab>
      ))}
    </Tabs>
  );
};

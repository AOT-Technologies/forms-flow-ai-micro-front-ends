import React from "react";
import Accordion from "react-bootstrap/Accordion";
import "./Sidebar.scss";
import { Link, useLocation, useHistory  } from "react-router-dom";
import ChevronIcon from "./chevronicon.svg";
import { MULTITENANCY_ENABLED } from "../constants/constants";
import { useTranslation } from "react-i18next";

const MenuComponent = ({ eventKey, mainMenu, subMenu, optionsCount }) => {
  const location = useLocation();
  const history = useHistory();
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  const { t } = useTranslation();
  const noOptionsMenu = optionsCount === "0";
  const handleHeaderClick = () => {
    if (noOptionsMenu) {
      const taskMenu = subMenu.find(menu => menu.path === "task");
      if (taskMenu) {
        history.push(`${baseUrl}${taskMenu.path}`);
      }
    }
  };

  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header 
        data-testid={`accordion-header-${eventKey}`} 
        aria-label={`Accordion header for ${mainMenu}`} 
        className={`${noOptionsMenu ? "no-arrow" : ""} ${
          noOptionsMenu && subMenu.some(menu => menu.matchExp && menu.matchExp.test(location.pathname)) ? "active" : ""
        }`}
        onClick={noOptionsMenu ? handleHeaderClick : undefined}
        >
          {!noOptionsMenu && (
        <img src={ChevronIcon} alt="Chevron icon" className="custom-chevron" />
          )}
        <span>{mainMenu}</span>
      </Accordion.Header>
      {!noOptionsMenu && (
      <Accordion.Body>
        {subMenu.map((menu, index) => (
          <Link
            key={index}
            to={`${baseUrl}${menu.path}`}
            className={`accordion-link ${
              menu.matchExp
                ? menu.matchExp.test(location.pathname)
                  ? "active"
                  : ""
                : ""
            } `}
            data-testid={`accordion-link-${index}`}
            aria-label={`Link to ${menu.name}`}
          >
            {menu.name}
          </Link>
        ))}
      </Accordion.Body>
      )}
    </Accordion.Item>
  );
};

export default MenuComponent;

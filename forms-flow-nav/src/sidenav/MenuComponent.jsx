import React from "react";
import Accordion from "react-bootstrap/Accordion";
import "./Sidebar.scss";
import { Link, useLocation, useHistory } from "react-router-dom";
// import ChevronIcon from "./chevronicon.svg";
import { ChevronIcon } from "@formsflow/components";
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
      subMenu.map((item, index) => {
        history.push(`${baseUrl}${item.path}`);
      });
    }
  };

  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header
        data-testid={`accordion-header-${eventKey}`}
        aria-label={`Accordion header for ${mainMenu}`}
        className={`${noOptionsMenu ? "no-arrow" : ""} ${
          noOptionsMenu &&
          subMenu.some((menu) =>
            menu.matchExps &&
            menu.matchExps.some((exp) => exp.test(location.pathname))
          )
            ? "active"
            : ""
        }`}
        onClick={noOptionsMenu ? handleHeaderClick : undefined}
      >
        {!noOptionsMenu && (
          // <img
          //   src={ChevronIcon}
          //   alt="Chevron icon"
          //   className="custom-chevron"
          // />
          <ChevronIcon className="custom-chevron" color={getComputedStyle(document.documentElement).getPropertyValue("--ff-gray-800")}/>
        )}
        <span>{t(mainMenu)}</span>
      </Accordion.Header>
      {!noOptionsMenu && (
        <Accordion.Body>
          {subMenu.map((menu, index) => (
            <Link
              key={index}
              to={`${baseUrl}${menu.path}`}
              className={`accordion-link ${
                menu.matchExps && menu.matchExps.some((exp) => exp.test(location.pathname))
                  ? "active"
                  : ""
              } `}
              data-testid={`accordion-link-${index}`}
              aria-label={`Link to ${menu.name}`}
            >
              {t(menu.name)}
            </Link>
          ))}
        </Accordion.Body>
      )}
    </Accordion.Item>
  );
};

export default MenuComponent;

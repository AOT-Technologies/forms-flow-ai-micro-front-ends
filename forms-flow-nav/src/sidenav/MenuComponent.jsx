import React from "react";
import Accordion from "react-bootstrap/Accordion";
import "./Sidebar.scss";
import { Link, useLocation, useHistory } from "react-router-dom";
import { ChevronIcon ,ShowPremiumIcons } from "@formsflow/components";
import { MULTITENANCY_ENABLED} from "../constants/constants";
import { useTranslation } from "react-i18next";
import { StorageService } from "@formsflow/service";
import PropTypes from "prop-types";

const MenuComponent = ({
  eventKey,
  mainMenu,
  subMenu,
  optionsCount,
  subscribe,
  baseUrl
}) => {
  const [tenant, setTenant] = React.useState({});
  const [activeMenu, setActiveMenu] = React.useState(null); 
  const location = useLocation();
  const history = useHistory();
  const { t } = useTranslation();
  const noOptionsMenu = optionsCount === "0";
  React.useEffect(() => {
    subscribe("ES_TENANT", (msg, data) => {
      if (data) {
        setTenant(data);
        if (!JSON.parse(StorageService.get("TENANT_DATA"))?.name) {
          StorageService.save("TENANT_DATA", JSON.stringify(data.tenantData));
        }
      }
    });
  }, []);

  React.useEffect(() => {
    const activePath = subMenu.find((menu) => location.pathname.includes(menu.path));
    setActiveMenu(activePath ? activePath.path : null);
  }, [location, subMenu]);

  
  const handleHeaderClick = () => {
    if (noOptionsMenu) {
      subMenu?.map((item, index) => {
        history.push(`${baseUrl}${item.path}`);
      });
    }
  };

  const isActive = (menuPath) => location.pathname.includes(menuPath);

  const getIconColor = (menuPath) => {
    return activeMenu === menuPath || isActive(menuPath) 
      ? getComputedStyle(document.documentElement).getPropertyValue("--ff-white")
      : getComputedStyle(document.documentElement).getPropertyValue("--ff-primary");
  };
  

  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header
        data-testid={`accordion-header-${eventKey}`}
        aria-label={`Accordion header for ${mainMenu}`}
        className={`${noOptionsMenu ? "no-arrow" : ""} ${
          isActive(mainMenu) ? "active-header" : ""
        }`}
        onClick={noOptionsMenu ? handleHeaderClick : undefined}
      >
        {!noOptionsMenu && (
          <ChevronIcon
            width="10"
            height="5"
            className="custom-chevron"
            color={getComputedStyle(document.documentElement).getPropertyValue(
              "--ff-gray-800"
            )}
          />
        )}
        <span>{t(mainMenu)}</span>
      </Accordion.Header>
      {!noOptionsMenu && (
        <Accordion.Body>
          {subMenu?.map((menu, index) => (
            <Link
              key={index}
              to={`${baseUrl}${menu.path}`}
              className={`accordion-link d-flex justify-content-between ${
                isActive(menu.path) ? "active" : ""
              }`}
              data-testid={`accordion-link-${index}`}
              aria-label={`Link to ${menu.name}`}
            >
              {t(menu.name)}
              {(menu.name.toLowerCase() === "bundle" || menu.name.toLowerCase() === "integrations") && (
                <ShowPremiumIcons color={getIconColor(menu.path)} /> 
              )}
            </Link>
          ))}
        </Accordion.Body>
      )}
    </Accordion.Item>
  );
};

MenuComponent.propTypes = {
  eventKey: PropTypes.string.isRequired,
  mainMenu: PropTypes.string.isRequired,
  subMenu: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      matchExps: PropTypes.arrayOf(PropTypes.instanceOf(RegExp)),
    })
  ).isRequired,
  optionsCount: PropTypes.string.isRequired,
  subscribe: PropTypes.func.isRequired,
  baseUrl: PropTypes.string.isRequired,
};

export default MenuComponent;

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
    let activePath = null;
    for (const menu of subMenu) {
      const matchedExp = menu?.supportedSubRoutes?.find(subRoute => location.pathname.includes(subRoute));
      if (matchedExp) {
        activePath = menu;
        setActiveMenu(activePath ? activePath.path : null);
        break;
      }
    }    

  }, [location, subMenu]);

  const setActiveTab = (menu) => {
    if (menu.supportedSubRoutes?.length) {
      return menu.supportedSubRoutes.find(
        (route) =>
          location.pathname.includes(route) &&
          !(menu.unsupportedSubRoutes?.some((excluded) => location.pathname.includes(excluded)))
      );
    }
    return location.pathname.includes(menu.path);
  };  

  const handleHeaderClick = () => {
    if (noOptionsMenu) {
      subMenu?.map((item, index) => {
        history.push(`${baseUrl}${item.path}`);
      });
    }
  };

  const isActive = (menu) => setActiveTab(menu);

  const getIconColor = (menu) => {
    return isActive(menu) 
      ? getComputedStyle(document.documentElement).getPropertyValue("--ff-white")
      : getComputedStyle(document.documentElement).getPropertyValue("--ff-primary");
  };
  
  const chevronColor =
  getComputedStyle(document.documentElement).getPropertyValue(
    "--navbar-main-menu-active-font-color"
  )?.trim() || getComputedStyle(document.documentElement).getPropertyValue(
    "--ff-gray-800"
  ).trim();

  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header
        data-testid={`accordion-header-${eventKey}`}
        aria-label={`Accordion header for ${mainMenu}`}
        className={`${noOptionsMenu ? "no-arrow" : ""} ${
          isActive(mainMenu) && "active-header"
        }`}
        onClick={noOptionsMenu ? handleHeaderClick : undefined}
      >
        {!noOptionsMenu && (
          <ChevronIcon
            width="10"
            height="5"
            className="custom-chevron"
            color={chevronColor}
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
                isActive(menu) && "active"
              }`}
              data-testid={`sidenav-${(menu.name || menu.path).replace(/\s+/g, '-').toLowerCase()}`}
              aria-label={`Link to ${menu.name}`}
            >
              {t(menu.name)}
              {menu.isPremium && (
                <ShowPremiumIcons color={getIconColor(menu)} /> 
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
      supportedSubRoutes: PropTypes.arrayOf(PropTypes.string), // This will be the list of supported sub-routes for menu item for highlighting that menu item,
      unsupportedSubRoutes: PropTypes.arrayOf(PropTypes.string), // This will be the list of unsupported sub-routes for menu item . Helpful in routes discriminating routes like form & formflow. 
    })
  ).isRequired,
  optionsCount: PropTypes.string.isRequired,
  subscribe: PropTypes.func.isRequired,
  baseUrl: PropTypes.string.isRequired,
};

export default MenuComponent;

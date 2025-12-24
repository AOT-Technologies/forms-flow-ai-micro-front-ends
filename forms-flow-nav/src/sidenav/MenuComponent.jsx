import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import Accordion from "react-bootstrap/Accordion";
import "./Sidebar.scss";
import { Link, useLocation, useHistory } from "react-router-dom";
import { ChevronIcon, ShowPremiumIcons, NavbarTaskIcon, NavbarSubmitIcon, NavbarBuildIcon, NavbarAnalyzeIcon, NavbarManageIcon } from "@formsflow/components";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

/**
 * MenuComponent is a collapsible navigation menu item for the sidebar.
 * 
 * Features:
 * - Unified icon rendering with fade transitions
 * - Active state management for menu items
 * - Collapsible accordion behavior
 * - Premium feature indicators
 * - Accessibility support
 * 
 * Usage:
 * <MenuComponent 
 *   eventKey="tasks" 
 *   mainMenu="Tasks" 
 *   subMenu={[...]} 
 *   optionsCount="0" 
 *   baseUrl="/" 
 *   collapsed={false} 
 * />
 */

const MenuComponent = ({
  eventKey,
  mainMenu,
  subMenu,
  optionsCount,
  baseUrl,
  collapsed
}) => {
  const location = useLocation();
  const history = useHistory();
  const { t } = useTranslation();
  const noOptionsMenu = optionsCount === "0";

  /**
   * Determines if a menu item is currently active based on the current route
   * @param menu - The menu item to check
   * @returns boolean indicating if the menu is active
   */
  const setActiveTab = useCallback((menu) => {
    if (menu.supportedSubRoutes?.length) {
      return menu.supportedSubRoutes.some(
        (route) =>
          location.pathname.includes(route) &&
          !(menu.unsupportedSubRoutes?.some((excluded) => location.pathname.includes(excluded)))
      );
    }
    return location.pathname.includes(menu.path);
  }, [location.pathname]);

  /**
   * Checks if a menu item is currently active
   */
  const isActive = useCallback((menu) => {
    // Pure predicate for active state – no side effects, just a check
    if (menu.supportedSubRoutes?.length) {
      return menu.supportedSubRoutes.some(
        (route) =>
          location.pathname.includes(route) &&
          !(menu.unsupportedSubRoutes?.some((excluded) => location.pathname.includes(excluded)))
      );
    }
    return location.pathname.includes(menu.path);
  }, [location.pathname]);

  const isMainMenuOrSubmenuActive = useCallback(() => {
    if (!Array.isArray(subMenu) || subMenu.length === 0) {
      return false;
    }
    return subMenu.some(menu => isActive(menu));
  }, [subMenu, isActive]);
  
  /**
   * Handles header click for menu items without sub-options
   * Navigates to the first submenu item if available
   */
  const handleHeaderClick = useCallback(() => {
    if (noOptionsMenu && subMenu?.length > 0) {
      history.push(`${baseUrl}${subMenu[0].path}`);
    }
  }, [noOptionsMenu, subMenu, baseUrl, history]);

  /**
   * Gets the appropriate icon color based on (main menu or submenu) active state
   */
  const getIconColor = useCallback((menu) => {
    const root = document.documentElement;
    return isActive(menu) 
      ? getComputedStyle(root).getPropertyValue("--ff-white")
      : getComputedStyle(root).getPropertyValue("--ff-primary");
  }, [isActive]);
  
  /**
   * Icon mapping for different menu types
   * Maps menu names to their corresponding icon components
   */
  const ICON_MAP = useMemo(() => ({
    tasks: NavbarTaskIcon,
    submit: NavbarSubmitIcon,
    build: NavbarBuildIcon,
    analyze: NavbarAnalyzeIcon,
    manage: NavbarManageIcon,
  }), []);

  /**
   * Normalized menu name for icon lookup
   */
  const lowerMainMenu = useMemo(() => (mainMenu || "").toLowerCase(), [mainMenu]);

  /**
   * If main menu or any of its submenus is active, main menu icon should be active
   */
  const mainMenuOrSubmenuActive = useMemo(() => isMainMenuOrSubmenuActive(), [isMainMenuOrSubmenuActive]);

  /**
   * Computed icon colors based on active state
   * Uses CSS custom properties for theming
   */
  const iconColors = useMemo(() => {
    const root = document.documentElement;
    const activeColor = getComputedStyle(root).getPropertyValue("--navbar-menu-font-color-active")?.trim();
    const inactiveColor = getComputedStyle(root).getPropertyValue("--navbar-submenu-font-color")?.trim();
    const color = mainMenuOrSubmenuActive ? activeColor : inactiveColor;
    return { iconFillColor: color, strokeColor: color };
  }, [mainMenuOrSubmenuActive]);

  /**
   * Icon component for the current menu type
   * Returns null if no specific icon is available
   */
  const IconComponent = useMemo(() => ICON_MAP[lowerMainMenu] || null, [ICON_MAP, lowerMainMenu]);

  /**
   * The intended icon element to render
   * Builds the appropriate icon based on menu type, options, and collapsed state
   */
  const intendedIconElement = useMemo(() => {
    // For menus with sub-options, show ChevronIcon when expanded
    if (!noOptionsMenu && !collapsed) {
      return (
        <ChevronIcon
          className="custom-chevron"
          color={iconColors.iconFillColor}
        />
      );
    }

    // For collapsed state or menus without sub-options, show specific icons
    if (IconComponent) {
      return (
        <IconComponent
          fillColor={iconColors.iconFillColor}
          strokeColor={iconColors.strokeColor}
        />
      );
    }

    // Fallback for menus without sub-options
    if (!noOptionsMenu) {
      return (
        <ChevronIcon
          className="custom-chevron"
          color={iconColors.iconFillColor}
        />
      );
    }

    return null;
  }, [IconComponent, iconColors, noOptionsMenu, collapsed]);

  /**
   * Icon visibility state management
   * Handles fade-in/fade-out transitions to prevent flickering
   */
  const hasIcon = intendedIconElement !== null;
  const [iconVisible, setIconVisible] = useState(hasIcon);
  const [renderIcon, setRenderIcon] = useState(hasIcon);
  const fadeTimerRef = useRef(null);

  /**
   * Effect to handle icon visibility transitions
   * Provides smooth fade-in/fade-out animations
   */
  useEffect(() => {
    // Clear any existing timers
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    if (hasIcon) {
      // Ensure icon is rendered, then fade in
      setRenderIcon(true);
      // Next tick to allow DOM to attach before transition
      requestAnimationFrame(() => setIconVisible(true));
    } else {
      // Fade out
      setIconVisible(false);
      // After transition, unmount icon
      fadeTimerRef.current = setTimeout(() => setRenderIcon(false), 300);
    }

    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [hasIcon]);


  /**
   * Builds CSS class names for the accordion header
   * @returns string of CSS classes
   */
  const buildHeaderClassName = useCallback(() => {
    const classes = [];
    if (noOptionsMenu) classes.push("no-arrow");
    if (mainMenuOrSubmenuActive) classes.push("active-header");
    return classes.join(" ");
  }, [noOptionsMenu, mainMenuOrSubmenuActive]);

  /**
   * Builds CSS class names for submenu links
   * @param menu - The submenu item
   * @returns string of CSS classes
   */
  const buildLinkClassName = useCallback((menu) => {
    const classes = ["accordion-link", "d-flex", "justify-content-between"];
    if (isActive(menu)) classes.push("active");
    return classes.join(" ");
  }, [isActive]);

  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header
        data-testid={`accordion-header-${eventKey}`}
        aria-label={`Accordion header for ${mainMenu}`}
        className={buildHeaderClassName()}
        onClick={noOptionsMenu ? handleHeaderClick : undefined}
      >
        {/* Icon with fade transition */}
        {renderIcon && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'opacity 300ms',
              opacity: iconVisible ? 1 : 0,
            }}
            aria-hidden="true"
          >
            {intendedIconElement}
          </span>
        )}
        
        {/* Menu label - hidden when collapsed */}
        <span hidden={collapsed}>
          {t(mainMenu)}
        </span>
      </Accordion.Header>
      
      {/* Submenu items - only render if menu has options */}
      {!noOptionsMenu && (
        <Accordion.Body hidden={collapsed}>
          {subMenu?.map((menu, index) => (
            <Link
              key={`${menu.path}-${index}`}
              to={`${baseUrl}${menu.path}`}
              className={buildLinkClassName(menu)}
              data-testid={`sidenav-${(menu.name || menu.path).replace(/\s+/g, '-').toLowerCase()}`}
              aria-label={`Link to ${menu.name}`}
            >
              <span className="menu-item-text">
                {t(menu.name)}
              </span>

              {/* Premium feature indicator */}
              {menu.isPremium && (
                <ShowPremiumIcons 
                  color={getIconColor(menu)} 
                  aria-label="Premium feature"
                /> 
              )}
            </Link>
          ))}
        </Accordion.Body>
      )}
    </Accordion.Item>
  );
};

/**
 * PropTypes for runtime validation
 * Provides type checking and documentation for component props
 */
MenuComponent.propTypes = {
  /** Unique identifier for the accordion item */
  eventKey: PropTypes.string.isRequired,
  /** Main menu display name */
  mainMenu: PropTypes.string.isRequired,
  /** Array of submenu items */
  subMenu: PropTypes.arrayOf(
    PropTypes.shape({
      /** Path for navigation */
      path: PropTypes.string.isRequired,
      /** Display name for the menu item */
      name: PropTypes.string.isRequired,
      /** Routes that should highlight this menu item */
      supportedSubRoutes: PropTypes.arrayOf(PropTypes.string),
      /** Routes that should not highlight this menu item */
      unsupportedSubRoutes: PropTypes.arrayOf(PropTypes.string),
      /** Whether this is a premium feature */
      isPremium: PropTypes.bool,
    })
  ).isRequired,
  /** Number of options (determines if menu has sub-items) */
  optionsCount: PropTypes.string.isRequired,
  /** Base URL for navigation */
  baseUrl: PropTypes.string.isRequired,
  /** Whether the sidebar is collapsed */
  collapsed: PropTypes.bool.isRequired
};

// Set display name for better debugging
MenuComponent.displayName = "MenuComponent";

export default MenuComponent;

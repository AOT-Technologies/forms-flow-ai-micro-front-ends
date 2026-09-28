import React, { useCallback, useMemo } from "react";
import "./Sidebar.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShowPremiumIcons,
  NavbarHomeIcon,
  NavbarTaskIcon,
  NavbarSubmitIcon,
  NavbarBuildIcon,
  NavbarAnalyzeIcon,
  NavbarManageIcon,
  NavbarFormsIcon,
  NavbarBundlesIcon,
  NavbarSubflowsIcon,
  NavbarDecisionTablesIcon,
  NavbarSubmissionsIcon,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

/**
 * MenuComponent renders one entry of the sidebar navigation.
 *
 * Two shapes, chosen by optionsCount (see the Phase 3 "8.3 / Expanded" design):
 * - a plain row (optionsCount "0") that links straight to its single target;
 * - a section: a non-interactive label followed by its children as flat rows,
 *   each with its own icon. Sections are always open — there is no accordion
 *   and no chevron.
 *
 * Usage:
 * <MenuComponent
 *   eventKey="build"
 *   mainMenu="Build"
 *   subMenu={[...]}
 *   optionsCount="5"
 *   baseUrl="/"
 *   collapsed={false}
 * />
 */

/**
 * Icon for a top-level entry, keyed by lowercased menu name.
 * Module scope: the map is constant, so it is never rebuilt per render.
 */
const MAIN_ICONS = {
  home: NavbarHomeIcon,
  tasks: NavbarTaskIcon,
  submit: NavbarSubmitIcon,
  build: NavbarBuildIcon,
  analyze: NavbarAnalyzeIcon,
  manage: NavbarManageIcon,
};

/**
 * Icon for a child row, keyed by the submenu item's name. Dashboards has no
 * glyph in the Phase 3 design and falls back to its section's icon.
 */
const SUB_ICONS = {
  Forms: NavbarFormsIcon,
  Bundles: NavbarBundlesIcon,
  Subflows: NavbarSubflowsIcon,
  "Decision Tables": NavbarDecisionTablesIcon,
  Metrics: NavbarAnalyzeIcon,
  Submissions: NavbarSubmissionsIcon,
};

const MenuComponent = ({
  eventKey,
  mainMenu,
  subMenu,
  optionsCount,
  baseUrl,
  collapsed,
  badgeCount,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const noOptionsMenu = optionsCount === "0";

  /**
   * Checks if a menu item is currently active
   */
  const isActive = useCallback(
    (menu) => {
      // Pure predicate for active state – no side effects, just a check
      if (menu.supportedSubRoutes?.length) {
        return menu.supportedSubRoutes.some(
          (route) =>
            location.pathname.includes(route) &&
            !menu.unsupportedSubRoutes?.some((excluded) =>
              location.pathname.includes(excluded)
            )
        );
      }
      return location.pathname.includes(menu.path);
    },
    [location.pathname]
  );

  const isMainMenuOrSubmenuActive = useCallback(() => {
    if (!Array.isArray(subMenu) || subMenu.length === 0) {
      return false;
    }
    return subMenu.some((menu) => isActive(menu));
  }, [subMenu, isActive]);

  /**
   * Handles a plain row click: navigates to the first submenu target.
   */
  const handleRowClick = useCallback(
    (event) => {
      if (noOptionsMenu && subMenu?.length > 0) {
        event.preventDefault();
        navigate(`${baseUrl}${subMenu[0].path}`);
      }
    },
    [noOptionsMenu, subMenu, baseUrl, navigate]
  );

  /**
   * Resolves the stroke/fill pair for a glyph.
   *
   * The Phase 3 glyphs are stroke-drawn over a filled disc: the stroke carries
   * the active/inactive state, the fill is only the backdrop behind it and so
   * stays neutral regardless of state.
   */
  const readColors = useCallback((active) => {
    const styles = getComputedStyle(document.documentElement);
    const activeColor = styles
      .getPropertyValue("--navbar-menu-font-color-active")
      ?.trim();
    const inactiveColor = styles
      .getPropertyValue("--navbar-submenu-font-color")
      ?.trim();
    return {
      fillColor: styles.getPropertyValue("--ff-white")?.trim(),
      strokeColor: active ? activeColor : inactiveColor,
    };
  }, []);

  const lowerMainMenu = useMemo(
    () => (mainMenu || "").toLowerCase(),
    [mainMenu]
  );

  const mainMenuOrSubmenuActive = useMemo(
    () => isMainMenuOrSubmenuActive(),
    [isMainMenuOrSubmenuActive]
  );

  const mainColors = useMemo(
    () => readColors(mainMenuOrSubmenuActive),
    [readColors, mainMenuOrSubmenuActive]
  );

  /**
   * Builds one navigable row: icon, label, and the collapsed-rail flyout.
   */
  const renderRow = useCallback(
    ({
      key,
      to,
      label,
      Icon,
      colors,
      active,
      testId,
      onClick,
      isPremium,
      badge,
    }) => {
      const hasBadge = badge !== undefined && badge !== null;
      return (
        <li className="menu-row" key={key}>
          <Link
            to={to}
            onClick={onClick}
            className={`menu-link${active ? " active" : ""}`}
            data-testid={testId}
            aria-label={label}
            aria-current={active ? "page" : undefined}
          >
            {Icon && (
              <span className="menu-icon" aria-hidden="true">
                <Icon
                  fillColor={colors.fillColor}
                  strokeColor={colors.strokeColor}
                />
                {/* On the rail the count pill has nowhere to go, so it shows as
                  a dot on the glyph instead. */}
                {collapsed && hasBadge && <span className="menu-badge-dot" />}
              </span>
            )}

            <span className="menu-label" hidden={collapsed}>
              {label}
            </span>

            {isPremium && (
              <ShowPremiumIcons
                color={colors.strokeColor}
                aria-label={t("Premium feature")}
              />
            )}

            {/* Count badge - expanded only, as in the Figma "Tasks" row */}
            {!collapsed && hasBadge && (
              <span className="menu-badge" data-testid={`menu-badge-${testId}`}>
                {badge}
              </span>
            )}

            {/* Collapsed rail flyout. Shown purely on CSS hover/focus, and
              aria-hidden because the link already carries the same name. */}
            {collapsed && (
              <span className="menu-flyout" aria-hidden="true">
                {label}
              </span>
            )}
          </Link>
        </li>
      );
    },
    [collapsed, t]
  );

  // --- plain row -----------------------------------------------------------
  if (noOptionsMenu) {
    const label = t(mainMenu);
    return renderRow({
      key: eventKey,
      to: `${baseUrl}${subMenu?.[0]?.path ?? ""}`,
      label,
      Icon: MAIN_ICONS[lowerMainMenu] || null,
      colors: mainColors,
      active: mainMenuOrSubmenuActive,
      // Kept from the accordion markup: existing test ids are a contract.
      testId: `accordion-header-${eventKey}`,
      onClick: handleRowClick,
      badge: badgeCount,
    });
  }

  // --- section: label + always-visible children ----------------------------
  const SectionIcon = MAIN_ICONS[lowerMainMenu] || null;
  return (
    <li className="menu-section">
      <p
        className="menu-section-title"
        hidden={collapsed}
        data-testid={`menu-section-${eventKey}`}
      >
        {t(mainMenu)}
      </p>
      <ul className="menu-sublist" aria-label={t(mainMenu)}>
        {subMenu?.map((menu, index) => {
          const active = isActive(menu);
          return renderRow({
            key: `${menu.path}-${index}`,
            to: `${baseUrl}${menu.path}`,
            label: t(menu.name),
            Icon: SUB_ICONS[menu.name] || SectionIcon,
            colors: readColors(active),
            active,
            testId: `sidenav-${(menu.name || menu.path)
              .replace(/\s+/g, "-")
              .toLowerCase()}`,
            isPremium: menu.isPremium,
          });
        })}
      </ul>
    </li>
  );
};

/**
 * PropTypes for runtime validation
 * Provides type checking and documentation for component props
 */
MenuComponent.propTypes = {
  /** Unique identifier for the menu entry */
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
  /** Number of options ("0" renders a plain row, otherwise a section) */
  optionsCount: PropTypes.string.isRequired,
  /** Base URL for navigation */
  baseUrl: PropTypes.string.isRequired,
  /** Whether the sidebar is collapsed */
  collapsed: PropTypes.bool.isRequired,
  /** Optional count rendered as a pill badge on the expanded row */
  badgeCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

// Set display name for better debugging
MenuComponent.displayName = "MenuComponent";

export default MenuComponent;

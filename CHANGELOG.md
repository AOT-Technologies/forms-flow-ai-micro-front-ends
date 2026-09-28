# Changelog for formsflow.ai

Mark items as `Added`, `Changed`, `Fixed`, `Modified`, `Removed`, `Untested Features`, `Upcoming Features`, `Known Issues`

## 8.3.0 - 27-09-2026

`Added`

**forms-flow-admin**
* Added a new **Style** tab under Manage to theme the application and forms — accent/button colour selection, font selection, button shape toggle, live style preview, and branding logo upload restricted to the Owner role.
* Added user status management to the Users tab — status column, suspend/reactivate actions with a confirmation modal, and self-suspend controls hidden for the logged-in user.
* Added pagination, total user count, filtering and sorting to the Users tab.
* Added group (role) listing and assignment for users.
* Added users listing within the Roles tab.
* Added filter and sort to the Dashboards tab.
* Added an organization usage summary card showing submission usage against the active subscription plan.
* Manage tabs are now URL-routed (`/admin/:tab`), so each tab is directly linkable and bookmarkable.

**forms-flow-components**
* Added style editor components — `StyleEditor`, `ColorPicker`, `FontPicker`, `ButtonShapeToggle` and `BrandingToggle`.
* Added the `AddWithDropdown` component and the `useFormTheme` hook for applying tenant form themes.
* Exported `DownloadPDFButton` from the component barrel.
* Added new Storybook stories for application logo and navbar icons.

**forms-flow-service**
* Added usage metering — the `fetchFeatureUsage` service and shared usage helpers used by both the admin usage card and forms-flow-web.
* Added the `getColumnPresetSizing` helper and table column presets for consistent table column sizing across micro-frontends.
* Added responsive breakpoint tokens and helpers (`BREAKPOINTS`, `CONTAINERS`, `BREAKPOINT_TIERS`, `mediaFrom`, `mediaBelow`, `resolveTier`).

**forms-flow-nav**
* Added the redesigned sidebar with updated styles and an improved hamburger menu for smaller screens.

**forms-flow-review**
* Added support for `forms-flow-process-gateway`, including the socket connection.

**forms-flow-submissions**
* Added support for `forms-flow-process-gateway`.

**forms-flow-theme**
* Added a breakpoint token tier and a tiered responsive page canvas.
* Added new styles for the usage tracking cards, the add-with-dropdown component and the redesigned sidebar.

`Modified`

**forms-flow-review**
* Made the BPM API URL prefix environment configurable.

**forms-flow-submissions**
* Made the BPM API URL prefix environment configurable.

**forms-flow-components**
* Button with dropdown now opens on hover instead of click.

**forms-flow-admin**
* Hid the Camunda admin role from the filter-by dropdown.
* Updated the permission tree.

**forms-flow-theme**
* Hid system fields in the form builder.

`Generic Changes`
* Performance and maintainability refactor across all eight packages — dead-code removal, stable render identities in shared tables and lists, lazy-loaded detail routes, memoized route/style lookups, and repaired lint, format and test tooling.
* Added missing `data-testid` and `aria-label` attributes on interactive elements across all packages.
* Resolved dependency security alerts across all packages.
* Shared onboarding details across micro-frontends via local storage.

`Fixed`

**forms-flow-admin**
* Fixed an invalid-token error when saving from Manage → Style in production and multitenant setups.
* Fixed Users page flickering, user role listing, dropdown list and filter dropdown issues.
* Excluded service-account users from the roles user list.
* Truncated long template names in the theme list.
* Fixed the next billing date format.

**forms-flow-submissions**
* Fixed bundle export and PDF download failures in analyze submissions.
* Fixed bundle submissions not rendering in the analyze history modal.
* The Flow tab is now shown only for BPMN workflows.

**forms-flow-service**
* A token with no roles is now treated as a valid session instead of failing login.

**forms-flow-components**
* Deduplicated `useFormTheme` across packages and fixed theme inheritance, a load race condition and a CSS injection issue.
* Fixed colour picker clipping and dropdown positioning issues.

**forms-flow-theme**
* Fixed the import file UI, default hidden field styling, BPMN builder input field borders and table styling issues.

`Generic Changes`
* Fixed mobile and responsive layout issues across the nav, admin, components, review and submissions modules.

## 8.2.5 - 22-07-2026

`Added`
**forms-flow-components**
* Redesigned breadcrumbs and added a new medium variant.
* Added centralized `AppModal` wrapper and bundle progress stepper components.

**forms-flow-review**
* Redesigned reviewer module for bundle re-introduction.
* Added assignee candidate groups support.

**forms-flow-submissions**
* Redesigned analyze-submissions for bundle re-introduction with access-based form listing.

**forms-flow-admin**
* Added role removal confirmation modal.
* Replaced the legacy react-bootstrap table with `ReusableTable`.

**forms-flow-themes**
* Added new css to support redesigned breadcrumbs, bundle, and stepper pages.

**scripts**
* Added release version-bump CLI scripts for Windows and macOS.

`Modified`
* Upgraded React to 18.3.1, single-spa, and formio packages across all micro-frontends.

`Fixed`
* Fixed bundle, task assignee dropdown, shared-filter, and admin table pagination issues.
* Fixed export PDF failure, anonymous form navbar rendering, and various UI issues (scrollbars, tab borders, variable tab).

## 8.2.0 - 05-05-2026

`Added`
**forms-flow-admin**
* Added candidate groups column to roles table
* Added five default stabdardized roles and description to roles table

**forms-flow-components**
* Added new icons to the component library

**forms-flow-review**
* Added Quick filter feature to field filter

`Modified`
**forms-flow-admin**
* Changed Upgrade button click to open subscription plans 

`Fixed`
* Fixed minor UI issues

## 8.1.1- 31-03-2026

`Fixed`

**forms-flow-admin**
* Users not listing in the multitenant realm role page issue fixed


## 8.1.0 - 26-02-2026

`Added`

**forms-flow-components**
* Added a new auto variable selection modal for improved form variable management.
* Added new icons to the component library.

**forms-flow-admin**
* Added external URL links in the Organization tab for premium instances:
  * Upgrade link for license upgrade
  * Terms and Conditions
  * Privacy Policy
  * Sales Contact

`Modified`

**forms-flow-review**
* Reordering and hiding filters are now independent sections, separated by scope — shared filters and private filters are managed individually.

**forms-flow-admin**
* Redesigned the Admin module with a tabbed navigation structure consisting of four tabs:
  * **Organization** — manage organization-level settings and external links
  * **Users** — manage users within the tenant
  * **Roles** — manage roles and permissions
  * **Dashboards** — manage dashboard access and visibility

**forms-flow-nav**
* Redesigned the Profile Settings panel to include all essential user details, a reset password option, and a read-only view of the user's assigned permissions.

`Fixed`

**forms-flow-theme**
* Fixed scrolling issues and various minor UI inconsistencies across the application.

`Removed`

**forms-flow-admin**
* Removed the manual user registration button from the Admin page, as user onboarding is now handled through the invite flow and replaced with Add new users button which will invite user to application through email

## 8.0.1 - 2025-12-17

`Fixed`
**forms-flow-review**
* Fixed multiple application status issue in task history.
* Fixed task table resize saving issue.

`Modified`
**forms-flow-components**
* Updated breadcrumb design

`Generic Changes`
* Fixed UI issues and enhanced overall interface

## 8.0.0 - 2025-11-28

`Modified`

**forms-flow-admin**

* Role-based permissions have been simplified to high-level access only, with no separate sub-level permissions for individual categories

**forms-flow-components**
* Modified custom components

`Geneic Changes`
* UI design modified for forms-flow-review and forms-flow-submissions modules

## 7.3.0 - 2025-10-14

`Added`

**forms-flow-submissions**

* Added bundle forms to the analyze-submissions filter list

`Modified`

**forms-flow-review**
* Bundle review functionality moved to forms-flow-review from open source
  
**forms-flow-service**
* Form.io token fetching logic has been moved to forms-flow-service
  
`Fixed`

**forms-flow-review**
* Minor issues fixed in the reviewer page

**forms-flow-submissions**
* Minor issues fixed in the analyze-submissions page

`Known Issues`

* Field-level search is not supported for bundle forms from the collapsible sidebar in analyze-submissions
* Reviewer page does not support creating filters for bundle forms.

## 7.2.0 - 2025-08-14

`Added`

**forms-flow-components**
* Added new reusable components:
  * Variable selection modal component
  * Collapsible search component

**forms-flow-submissions**
* Added data layer in analyse-submissions to support form specific submissions filtering 

`Modified`
**forms-flow-submissions**
* Modified the UI of analyse-submissions with reusable components

`Fixed`
**forms-flow-review**
* Fixed bugs in review module

## 7.1.0 - 2025-07-01

`Added`

**forms-flow-components**
* Added new reusable components:
  * Resizable table 
  * Drag and drop component to hide and re-order
  * Button component with checkbox
  * Multi-select dropdown
  * BPMN diagram view
  * Date filter
  * Filter sort
  * New svg icons

**forms-flow-review**
* Added new micro-frontend to handle reviewer journey

**forms-flow-submissions**
* New micro-frontend to handle analyze submissions

`Modified`

**forms-flow-nav**
* Modified sidebar menus and sub-menus

**forms-flow-admin**
* Modified existing permissions

**forms-flow-theme**
* Modified style changes to support new design

## 7.0.0 - 2025-01-10

`Added`

**forms-flow-admin**
* Added permission selection option in role creation modal

**forms-flow-theme**
* Added new root variables to support the updated UI design
* Added style changes to support new design

**forms-flow-components**
* New micro-frontend to include reusable UI components
* Added new reusable components:
  * Svg Icons
  * Svg Images
  * Custom components:
    * Modals 
    * Button 
    * Form elements 
    * Table elements
<br><br>


`Modified`

**forms-flow-admin**
* Renamed Admin menu as Manage and moved to sidebar

**forms-flow-nav**
* Modified Navbar to sidebar with updated design







## 6.0.2 - 2024-06-05

`Generic Changes`
* The tenant user's default language is set from their data, tenant data, or the default application language.
* Updated Spanish resource bundle
  
## 6.0.1 - 2024-05-16

`Added`

**forms-flow-service**
* Added resource bundle for Spanish

## 6.0.0 - 2024-04-05

`Added`

**forms-flow-admin**
* Added incorporate a user across multiple tenants

**forms-flow-inegration**
* Added new component for ipaas integration
  
`Generic Changes`
* Fixed UI issues



## 5.3.0 - 2023-11-24

`Added`

**forms-flow-service**
  - Added date and time service
  - Added resource bundle 

`Modified`

**forms-flow-admin**
 - Modified user interface and improved user experience 
 - Modified footer style
 
**forms-flow-nav**
 - Modified navbar style
   
**forms-flow-theme**
 - Modified CSS to SCSS and folder structure
 - Modified toast color override
 

## 5.2.0 - 2022-07-07

`Added`

**forms-flow-admin**
  - Role creation functionality
  - User role management
 
**forms-flow-nav**
  - Separated to micro front-end service

**forms-flow-service**
  - Added storage services
  - Integrated Keycloak services
  - Implemented API call services
    
**forms-flow-theme**
  - All css components added to forms-flow-theme

`Generic changes`
 - Implemented pub-sub mechanism to emit and receive events
    

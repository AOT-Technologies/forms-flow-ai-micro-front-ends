# Changelog for formsflow.ai

Mark items as `Added`, `Changed`, `Fixed`, `Modified`, `Removed`, `Untested Features`, `Upcoming Features`, `Known Issues`

## 7.0.0 - 2025-12-10

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
    

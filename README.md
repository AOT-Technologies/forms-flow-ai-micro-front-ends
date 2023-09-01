# forms-flow-ai-micro-front-ends

![React](https://img.shields.io/badge/React-17.0.2-blue)

[![forms-flow-nav-CD](https://github.com/AOT-Technologies/forms-flow-ai-micro-front-ends/actions/workflows/forms-flow-nav.cd.yml/badge.svg)](https://github.com/AOT-Technologies/forms-flow-ai-micro-front-ends/actions/workflows/forms-flow-nav.cd.yml)
[![forms-flow-admin-CD](https://github.com/AOT-Technologies/forms-flow-ai-micro-front-ends/actions/workflows/forms-flow-admin-cd.yml/badge.svg)](https://github.com/AOT-Technologies/forms-flow-ai-micro-front-ends/actions/workflows/forms-flow-admin-cd.yml)
[![forms-flow-service-CD](https://github.com/AOT-Technologies/forms-flow-ai-micro-front-ends/actions/workflows/forms-flow-service.yml/badge.svg)](https://github.com/AOT-Technologies/forms-flow-ai-micro-front-ends/actions/workflows/forms-flow-service.yml)
[![forms-flow-theme-CD](https://github.com/AOT-Technologies/forms-flow-ai-micro-front-ends/actions/workflows/forms-flow-theme.yml/badge.svg)](https://github.com/AOT-Technologies/forms-flow-ai-micro-front-ends/actions/workflows/forms-flow-theme.yml)

forms-flow-ai-micro-front-ends is a collection of micro front-end applications to support formsflow.ai.

## components overview

1. forms-flow-admin

The admin module includes functionalities available for the user with admin privilages. Currently admin module contains dashboard management, role management, user management. This UI is only available for users with `formsflow-admin` role.

2. forms-flow-nav

The navbar for formsflow.ai, this module is available for all users. This module trigger the routing, internationalization, and login/logout functionalities.

3. forms-flow-service

This module contains all the common functionalties used by micro front-ends. The common services include authentication service, storage APIs etc.

4. forms-flow-theme

This module contains the common style sheet shared by all micro-front-ends. This module supports theming by providing the option to use desired themes by modifying the css variables.

All the modules are built with `single-spa`, a javascript router for micro front-end microsevices.

## Prerequisites
 - Nodejs 16 or above
 - Make sure the ports `8080`, `8001`, `8081`, `8082` are available.

# Getting started
1. Clone the repo
2. run `npm install && npm start` by checking into all modules
 note: while running `npm install` in `forms-flow-admin` might throw some error due to version conflict, just run the same command with `--force` flag to resolve this issue. This is happening since we migrated the specific module from legacy codebase and some dependencies are to be maintained and will resolve this in future.
3. clone the formsflow.ai [https://github.com/AOT-Technologies/forms-flow-ai] repo.
4. check into `master` brach
5. check into `forms-flow-web-root-config` directory
6. update public/config/config.js with all the configurations
7. run `npm install && npm start`
8. check into `forms-flow-web` directory
9. run `npm install && npm start` make sure this module run on port 3001
10. The application should be available at port 3000

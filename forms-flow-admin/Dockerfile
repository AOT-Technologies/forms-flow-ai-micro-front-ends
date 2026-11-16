# Build context is the REPO ROOT (the theme mixins live outside this package):
#   docker build -f forms-flow-admin/Dockerfile .
# base image
FROM node:24.22.3-alpine3.24@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build-stage

# set working directory
WORKDIR /forms-flow-admin/app
 

# add `/app/node_modules/.bin` to $PATH
ENV PATH /forms-flow-admin/app/node_modules/.bin:$PATH

RUN apk upgrade --no-cache

# The npm bundled with the base image ships vulnerable undici/tar/brace-expansion/ip-address
RUN npm install -g npm@11.21.2

# install and cache app dependencies

COPY forms-flow-admin/package-lock.json /forms-flow-admin/app/package-lock.json
COPY forms-flow-admin/package.json /forms-flow-admin/app/package.json

RUN npm ci --force

# Shared theme mixins, placed so src/index.scss's
# "../../forms-flow-theme/scss/v8-scss/mixins" import resolves as in a checkout
COPY forms-flow-theme/scss/v8-scss/_mixins.scss /forms-flow-admin/forms-flow-theme/scss/v8-scss/

COPY forms-flow-admin/ /forms-flow-admin/app/

RUN npm run build:webpack


FROM nginx:1.30.6-alpine3.24-slim@sha256:e2355aa95529a7999dad94ddcb45a8768abf6fb0b204c93b1a3ffce477d7b893 AS production-stage

# set label for image
LABEL Name="formsflow"

RUN mkdir /app
COPY --from=build-stage /forms-flow-admin/app/dist /usr/share/nginx/html
COPY forms-flow-admin/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
WORKDIR /usr/share/nginx/html/config
# COPY .env .
RUN apk upgrade --no-cache && apk add --no-cache bash


CMD ["nginx", "-g", "daemon off;"]

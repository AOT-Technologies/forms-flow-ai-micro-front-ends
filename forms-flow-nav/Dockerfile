# Build context is the REPO ROOT (webpack.formio.js and the theme mixins live
# outside this package):
#   docker build -f forms-flow-nav/Dockerfile .
# base image
FROM node:26.13.1-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build-stage

# set working directory
WORKDIR /forms-flow-nav/app
 

# add `/app/node_modules/.bin` to $PATH
ENV PATH /forms-flow-nav/app/node_modules/.bin:$PATH

RUN apk upgrade --no-cache

# The npm bundled with the base image ships vulnerable undici/tar/brace-expansion/ip-address
RUN npm install -g --ignore-scripts npm@11.21.2

# install and cache app dependencies

COPY forms-flow-nav/package-lock.json /forms-flow-nav/app/package-lock.json
COPY forms-flow-nav/package.json /forms-flow-nav/app/package.json

RUN npm ci

# Shared files, placed one level above the app so the repo-relative
# "../webpack.formio" and "../../../forms-flow-theme/..." paths resolve as in a checkout
COPY webpack.formio.js /forms-flow-nav/
COPY forms-flow-theme/scss/v8-scss/_mixins.scss /forms-flow-nav/forms-flow-theme/scss/v8-scss/

COPY forms-flow-nav/ /forms-flow-nav/app/

RUN npm run build:webpack


FROM nginx:1.31.8-alpine3.24-slim@sha256:4c734d33ee731135dc9f2349914a34551c920f4451fca8bb05bf5880eb9079e8 AS production-stage

# set label for image
LABEL Name="formsflow"

RUN mkdir /app
COPY --from=build-stage /forms-flow-nav/app/dist /usr/share/nginx/html
COPY forms-flow-nav/nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
WORKDIR /usr/share/nginx/html/config
# COPY .env .
RUN apk upgrade --no-cache && apk add --no-cache bash

# Run as the image's unprivileged "nginx" user (numeric, so Kubernetes
# runAsNonRoot can verify it). nginx.conf listens on 8080 and keeps its pid
# and temp files in /tmp, so no root access is needed at runtime.
USER 101


CMD ["nginx", "-g", "daemon off;"]

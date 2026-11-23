# base image
FROM node:26.13.1-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build-stage

# set working directory
WORKDIR /forms-flow-service/app
 

# add `/app/node_modules/.bin` to $PATH
ENV PATH /forms-flow-service/app/node_modules/.bin:$PATH

RUN apk upgrade --no-cache

# The npm bundled with the base image ships vulnerable undici/tar/brace-expansion/ip-address
RUN npm install -g --ignore-scripts npm@11.21.2

# install and cache app dependencies

COPY package-lock.json /forms-flow-service/app/package-lock.json
COPY package.json /forms-flow-service/app/package.json

RUN npm ci

COPY . /forms-flow-service/app/

RUN npm run build:webpack


FROM nginx:1.31.9-alpine3.24-slim@sha256:5bfced78d24d644270bedb0a9968697042e38d5c03fb6354603df025279c1cbe AS production-stage

# set label for image
LABEL Name="formsflow"

RUN mkdir /app
COPY --from=build-stage /forms-flow-service/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

WORKDIR /usr/share/nginx/html/config
# COPY .env .
RUN apk upgrade --no-cache && apk add --no-cache bash

# Run as the image's unprivileged "nginx" user (numeric, so Kubernetes
# runAsNonRoot can verify it). nginx.conf listens on 8080 and keeps its pid
# and temp files in /tmp, so no root access is needed at runtime.
USER 101


CMD ["nginx", "-g", "daemon off;"]

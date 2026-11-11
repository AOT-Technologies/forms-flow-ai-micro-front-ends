# Build context is the REPO ROOT (the theme mixins live outside this package):
#   docker build -f forms-flow-admin/Dockerfile .
# base image
FROM node:24.21.0-alpine as build-stage

# set working directory
WORKDIR /forms-flow-admin/app
 

# add `/app/node_modules/.bin` to $PATH
ENV PATH /forms-flow-admin/app/node_modules/.bin:$PATH

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# install and cache app dependencies

COPY forms-flow-admin/package-lock.json /forms-flow-admin/app/package-lock.json
COPY forms-flow-admin/package.json /forms-flow-admin/app/package.json

RUN npm ci --force

# Shared theme mixins, placed so src/index.scss's
# "../../forms-flow-theme/scss/v8-scss/mixins" import resolves as in a checkout
COPY forms-flow-theme/scss/v8-scss/_mixins.scss /forms-flow-admin/forms-flow-theme/scss/v8-scss/

COPY forms-flow-admin/ /forms-flow-admin/app/

RUN npm run build:webpack


FROM nginx:1.15.2-alpine as production-stage

# set label for image
LABEL Name="formsflow"

RUN mkdir /app
COPY --from=build-stage /forms-flow-admin/app/dist /usr/share/nginx/html
COPY forms-flow-admin/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
WORKDIR /usr/share/nginx/html/config
# COPY .env .
RUN apk add --no-cache bash


CMD ["nginx", "-g", "daemon off;"]

# Build context is the REPO ROOT (webpack.formio.js lives outside this package):
#   docker build -f forms-flow-components/Dockerfile .
# base image
FROM node:26.13.0-alpine as build-stage

# set working directory
WORKDIR /forms-flow-components/app
 

# add `/app/node_modules/.bin` to $PATH
ENV PATH /forms-flow-components/app/node_modules/.bin:$PATH

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# install and cache app dependencies

COPY forms-flow-components/package-lock.json /forms-flow-components/app/package-lock.json
COPY forms-flow-components/package.json /forms-flow-components/app/package.json

RUN npm ci --force

# Shared webpack helpers, placed one level above the app so the
# repo-relative "../webpack.formio" require resolves as in a checkout
COPY webpack.formio.js /forms-flow-components/

COPY forms-flow-components/ /forms-flow-components/app/

RUN npm run build:webpack


FROM nginx:1.31.8-alpine as production-stage

# set label for image
LABEL Name="formsflow"

RUN mkdir /app
COPY --from=build-stage /forms-flow-components/app/dist /usr/share/nginx/html
COPY forms-flow-components/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
WORKDIR /usr/share/nginx/html/config
# COPY .env .
RUN apk add --no-cache bash


CMD ["nginx", "-g", "daemon off;"]

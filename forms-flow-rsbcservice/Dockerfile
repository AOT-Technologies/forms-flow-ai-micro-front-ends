# base image
FROM node:16.20.1-alpine as build-stage

# set working directory
WORKDIR /forms-flow-rsbcservice/app
 

# add `/app/node_modules/.bin` to $PATH
ENV PATH /forms-flow-rsbcservice/app/node_modules/.bin:$PATH

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# install and cache app dependencies

COPY package-lock.json /forms-flow-rsbcservice/app/package-lock.json
COPY package.json /forms-flow-rsbcservice/app/package.json

RUN npm install

COPY . /forms-flow-rsbcservice/app/

RUN npm run build:webpack


FROM nginx:1.15.2-alpine as production-stage

# set label for image
LABEL Name="formsflow"

RUN mkdir /app
COPY --from=build-stage /forms-flow-rsbcservice/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

WORKDIR /usr/share/nginx/html/config
# COPY .env .
RUN apk add --no-cache bash


CMD ["nginx", "-g", "daemon off;"]

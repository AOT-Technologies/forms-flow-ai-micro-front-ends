# Build context is the REPO ROOT (webpack.formio.js and the theme mixins live
# outside this package):
#   docker build -f forms-flow-review/Dockerfile .
# base image
FROM node:26.13.0-alpine as build-stage

# set working directory
WORKDIR /forms-flow-review/app
 

# add `/app/node_modules/.bin` to $PATH
ENV PATH /forms-flow-review/app/node_modules/.bin:$PATH

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# install and cache app dependencies

COPY forms-flow-review/package-lock.json /forms-flow-review/app/package-lock.json
COPY forms-flow-review/package.json /forms-flow-review/app/package.json

RUN npm ci --force

# Shared files, placed one level above the app so the repo-relative
# "../webpack.formio" and "../../forms-flow-theme/..." paths resolve as in a checkout
COPY webpack.formio.js /forms-flow-review/
COPY forms-flow-theme/scss/v8-scss/_mixins.scss /forms-flow-review/forms-flow-theme/scss/v8-scss/

# Copy only necessary files
COPY forms-flow-review/src/ /forms-flow-review/app/src/
COPY forms-flow-review/webpack.config.js forms-flow-review/tsconfig.json forms-flow-review/babel.config.json forms-flow-review/jest.config.js /forms-flow-review/app/
 
RUN npm run build:webpack


FROM nginx:1.31.8-alpine as production-stage

# set label for image
LABEL Name="formsflow"

RUN mkdir /app
COPY --from=build-stage /forms-flow-review/app/dist /usr/share/nginx/html
COPY forms-flow-review/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
WORKDIR /usr/share/nginx/html/config
# COPY .env .
RUN apk add --no-cache bash


CMD ["nginx", "-g", "daemon off;"]

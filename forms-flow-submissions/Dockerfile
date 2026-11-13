# Build context is the REPO ROOT (webpack.formio.js and the theme mixins live
# outside this package):
#   docker build -f forms-flow-submissions/Dockerfile .
# base image
FROM node:26.13.0-alpine as build-stage

# set working directory
WORKDIR /forms-flow-submissions/app
 

# add `/app/node_modules/.bin` to $PATH
ENV PATH /forms-flow-submissions/app/node_modules/.bin:$PATH

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# install and cache app dependencies

COPY forms-flow-submissions/package-lock.json /forms-flow-submissions/app/package-lock.json
COPY forms-flow-submissions/package.json /forms-flow-submissions/app/package.json

RUN npm ci --force

# Shared files, placed one level above the app so the repo-relative
# "../webpack.formio" and "../../forms-flow-theme/..." paths resolve as in a checkout
COPY webpack.formio.js /forms-flow-submissions/
COPY forms-flow-theme/scss/v8-scss/_mixins.scss /forms-flow-submissions/forms-flow-theme/scss/v8-scss/

# Copy only necessary files
COPY forms-flow-submissions/src/ /forms-flow-submissions/app/src/
COPY forms-flow-submissions/webpack.config.js forms-flow-submissions/tsconfig.json forms-flow-submissions/babel.config.json forms-flow-submissions/jest.config.js /forms-flow-submissions/app/
 
RUN npm run build:webpack


FROM nginx:1.31.8-alpine as production-stage

# set label for image
LABEL Name="formsflow"

RUN mkdir /app
COPY --from=build-stage /forms-flow-submissions/app/dist /usr/share/nginx/html
COPY forms-flow-submissions/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
WORKDIR /usr/share/nginx/html/config
# COPY .env .
RUN apk add --no-cache bash


CMD ["nginx", "-g", "daemon off;"]

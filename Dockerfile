#
# Docker NodeJS Typescript Starter
# Example Dockerfile
#
FROM node:16-alpine3.12 AS build

# Intall missing dependencies
RUN apk add --update \
  bash \
  build-base

RUN apk add --no-cache --virtual .gyp python3 make g++

# Create App dir
RUN mkdir -p /app

# Set working directory to App dir
WORKDIR /app

EXPOSE 1883
EXPOSE 8080
EXPOSE 9229
# Copy project files
COPY . .

# Install dependencies

RUN yarn install
RUN yarn build
CMD ["yarn", "serve"]
ARG NODE_ENV
FROM node:18 as base
LABEL authors="Abbas Aliyev"
LABEL description="Dockerfile for ERP AERO express.js app"

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

FROM base AS production
COPY dist/ ./dist
EXPOSE 80
CMD [ "npm", "run", "start:prod" ]

FROM base AS development
COPY tsconfig.json ./
COPY src/ ./src
EXPOSE 3000
CMD [ "npm", "run", "start:dev" ]

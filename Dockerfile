# Source: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:8
WORKDIR ./
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "./bin/www"]
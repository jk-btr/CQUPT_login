#build
FROM node:24-alpine

WORKDIR /home/node
COPY . /home/node

RUN npm run build

USER node
EXPOSE 8081

CMD ["npm","run", "dev"]

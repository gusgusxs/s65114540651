FROM node:18

WORKDIR /app

COPY Frontend/package*.json ./Frontend/
RUN cd Frontend && npm install

COPY Backend/package*.json ./Backend/
RUN cd Backend && npm install

COPY Frontend ./Frontend
COPY Backend ./Backend

EXPOSE 10651
EXPOSE 20651

RUN npm install -g npm-run-all

CMD ["npx", "npm-run-all", "-p", \
     "frontend:dev", "backend:start"]

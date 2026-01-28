FROM node:22.20.0-alpine
LABEL authors="Antspihl"

# install http-server for serving static content
RUN npm install -g http-server

# make the 'app' folder the current working directory
WORKDIR /app

# copy package files
COPY package.json package-lock.json ./

# install project dependencies using npm
RUN npm ci

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# build the frontend
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD [ "http-server", "dist" ]

FROM node:22.20.0-alpine
LABEL authors="Antspihl"

# install pnpm
RUN npm install -g pnpm

# install simple http server for serving static content
RUN npm install -g http-server

# make the 'app' folder the current working directory
WORKDIR /app

# copy pnpm lock file and package.json
COPY package.json pnpm-lock.yaml ./

# install project dependencies
RUN pnpm install --frozen-lockfile

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

RUN pnpm run build

ENV PORT=3000
EXPOSE 3000

CMD [ "http-server", "dist" ]

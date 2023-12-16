# base

## Project setup

```
# yarn
yarn

# npm
npm install

# pnpm
pnpm install
```

### Compiles and hot-reloads for development

```
# yarn
yarn dev

# npm
npm run dev

# pnpm
pnpm dev
```

### Compiles and minifies for production

```
# yarn
yarn build

# npm
npm run build

# pnpm
pnpm build
```

### Lints and fixes files

```
# yarn
yarn lint

# npm
npm run lint

# pnpm
pnpm lint
```
### Docker Image Update
```
docker build -t antspihl/kassa-front:latest .

docker login

docker tag antspihl/kassa-front:latest antspihl/kassa-front:latest

docker push antspihl/kassa-front:latest
```

### Pull and run the image
```
docker login

docker pull antspihl/kassa-front:latest

docker-compose up
```

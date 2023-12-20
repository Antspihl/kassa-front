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
```bash
docker build -t antspihl/kassa-front:latest .
```
```bash
docker login
```
```bash
docker tag antspihl/kassa-front:latest antspihl/kassa-front:latest
```
```bash
docker push antspihl/kassa-front:latest
```

### Pull and run the image

```bash
docker login
```
```bash
docker pull antspihl/kassa-front:latest
```
```bash
docker run -it -p 3000:3000 --rm --name kassa-front ghcr.io/antspihl/kassa-front:latest
```

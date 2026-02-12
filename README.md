## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run dev
```

### One-step rebuild and deploy (u.sh)
Rebuilds the image, removes any existing container/image for the tag, and runs the new container.
```bash
chmod +x u.sh
./u.sh [tag] [host_port]
```
If no tag is provided, it defaults to `dev`. If no port is provided, it defaults to `3000`. The container name is `kassa-front`.

### Pull and run the image

```bash
docker login
```
```bash
docker pull antspihl/kassa-front:latest
```
```bash
docker run -d -p 3000:3000 --name kassa-front antspihl/kassa-front:latest
```

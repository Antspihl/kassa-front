## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run dev
```

### Docker Image Update. Replace [latest] with the version number.
```bash
docker build -t antspihl/kassa-front:[latest] .
```
```bash
docker login
```
```bash
docker push antspihl/kassa-front:[latest]
```

### Pull and run the image

```bash
docker login
```
```bash
docker pull antspihl/kassa-front:latest
```
```bash
docker run -it -p 3000:3000 --rm --name kassa-front antspihl/kassa-front:latest
```

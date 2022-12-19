# LabelL2e

This project was generated using [Nx](https://nx.dev).

<p style="text-align: center;"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="450"></p>

🔎 **Smart, Fast and Extensible Build System**

### Branch information

- main: production mode
- develop: development mode

### Install package

- node
- npm

```sh
npm install
```

```sh
npm install -g nx
```

### Run docker for db and redis local

```sh
docker-compose up -d
```

### Edit environment variables

```sh
cp .env.development.example .env (development mode)
```

### Migration data

```sh
npm run migration:run
```

### Run project on development mode

```sh
npm run l2e-backend:serve (api backend)
```

```sh
npm run l2e-crawler:serve (crawler)
```

```sh
npm run l2e-websocket:serve (websocket)
```

```sh
npm run l2e-queue:serve (queue)
```

### Test project

### Build project for production mode

```sh
npm run l2e-backend:build (api backend)
```

```sh
npm run l2e-crawler:build (crawler)
```

or

```sh
npm run build (both project)
```

### Run project for production mode

```sh
npm run l2e-backend:start (api backend)
```

```sh
npm run l2e-crawler:start (crawler)
```

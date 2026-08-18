# docker-fastify

A minimal Fastify + TypeScript service packaged with a multi-stage, non-root Docker image and run alongside Postgres 17 via Docker Compose.

## Endpoints

| Route          | Response                                              |
|----------------|-------------------------------------------------------|
| `GET /health`  | `200 {"status":"ok"}` — liveness probe (no DB call)   |
| `GET /users`   | `200` list of users read from Postgres                |
| anything else  | `404`                                                 |

## Quick start

```bash
docker compose up -d --build
```
```bash
curl -s http://localhost:3000/health                                  # {"status":"ok"}
curl -s http://localhost:3000/users                                   # seeded users from Postgres
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/nope   # 404
```

Tear down (keeps the database volume):

```bash
docker compose down          # data survives
docker compose down -v       # also delete the Postgres volume
```

### Dev mode (hot reload)

`docker compose up` automatically merges `docker-compose.override.yml`, which builds the `builder` stage, bind-mounts `./src`, and runs `tsx watch` — edit a `.ts` file and the server reloads.

### CI mode (no override)

The base file alone is deterministic and has no bind mounts:

```bash
docker compose -f docker-compose.yml up -d --build
docker compose -f docker-compose.yml config   # parses; no source: ./src
```

## Image size — why multi-stage

Built from the exact files in this repo:

| Image                             | Build               | Size       |
|-----------------------------------|---------------------|------------|
| `docker-fastify-api:multi`        | `Dockerfile`        | **367 MB** |
| `docker-fastify-api:single`       | `Dockerfile.single` | **440 MB** |

```bash
docker build -t docker-fastify-api:multi  .
docker build -f Dockerfile.single -t docker-fastify-api:single .
docker images docker-fastify-api --format '{{.Repository}}:{{.Tag}}\t{{.Size}}'
```

## Postgres data survives a restart

The database uses a named volume (`pgdata`), so a `docker compose down` (without `-v`) keeps the data. Verified with:

```bash
# 1) create a table + row
docker compose exec -T postgres psql -U appuser -d appdb \
  -c "CREATE TABLE persist_check (id int); INSERT INTO persist_check VALUES (42);"

# 2) stop and remove containers — but NOT the volume
docker compose down

# 3) bring the stack back up
docker compose up -d

# 4) the row is still there
docker compose exec -T postgres psql -U appuser -d appdb -c "SELECT * FROM persist_check;"
#  id
# ----
#  42
```

## Configuration

Environment variables (defaults set in `docker-compose.yml`; see `.env.example` for running outside Docker):

| Variable                               | Default                         |
|----------------------------------------|---------------------------------|
| `PORT` / `HOST`                        | `3000` / `0.0.0.0`              |
| `PGHOST` / `PGPORT`                    | `postgres` / `5432`             |
| `PGUSER` / `PGPASSWORD` / `PGDATABASE` | `appuser` / `apppass` / `appdb` |

Requires Node ≥ 22 for local (non-Docker) runs.
# Accessing PostgreSQL Inside Docker Containers

## Problem
PostgreSQL is running inside a Docker container, but `psql` from the host fails with "connection refused" even though the container is running.

## Why It Happens

The container's PostgreSQL listens on its internal network (e.g., `172.17.0.2:5432`), not on the host's `localhost`. Port mapping (`-p 5433:5432`) makes it accessible from OUTSIDE the host, but the host's `psql` trying to connect to `195.35.20.80:5433` may fail if:
- PostgreSQL is configured to only listen on `localhost` inside the container
- Firewall rules block the connection
- The host's `psql` is trying IPv6 while the container only listens on IPv4

## Solutions

### Method 1: docker exec (most reliable)
```bash
# Run psql inside the container
docker exec -it <postgres-container> psql -U postgres -d <database>

# Execute a SQL file
docker exec -i <postgres-container> psql -U postgres -d <database> < file.sql

# Pipe data in
cat file.sql | docker exec -i <postgres-container> psql -U postgres -d <database>
```

**Pros:** No network issues, always works if container is running
**Cons:** Can't use host's `pg_dump` directly — need to install it inside container or use `docker exec` with a client container

### Method 2: Host IP with correct port
```bash
# Connect via host IP (not localhost)
psql -h 195.35.20.80 -p 5433 -U postgres -d <database>
```

**Note:** `localhost:5433` may not work if PostgreSQL is bound to `0.0.0.0` inside container but host resolves `localhost` to `::1` (IPv6). Use the actual host IP or `127.0.0.1`.

### Method 3: Docker network IP
```bash
# Get container IP
docker inspect <postgres-container> --format '{{.NetworkSettings.IPAddress}}'

# Connect directly to container IP
psql -h 172.17.0.2 -p 5432 -U postgres -d <database>
```

## Installing psql on the Host

If the host doesn't have `psql`:

```bash
# Ubuntu/Debian
apt-get update && apt-get install -y postgresql-client

# Alpine (in a container)
apk add postgresql-client

# macOS
brew install libpq
```

**Session example (2026-05-10):**
VPS had no `psql` installed. `pg_dump` and `psql` commands returned "command not found". Installed `postgresql-client` package. Then tried to connect to `195.35.20.80:5433` from host's `psql` — got "connection refused". Realized PostgreSQL was inside Docker container. Switched to `docker exec -i <container> psql ...` approach for all restore operations.

## pg_dump from Host to Container

If you need to dump FROM the container's PostgreSQL:

```bash
# Install pg_dump inside a temporary container
docker run --rm --network container:<postgres-container> \
  postgres:15-alpine pg_dump -h localhost -U postgres -d <database> > backup.sql
```

Or use the host's `pg_dump` if you can connect to the exposed port:
```bash
pg_dump -h 195.35.20.80 -p 5433 -U postgres -d <database> > backup.sql
```

## Restoring to Container PostgreSQL

```bash
# From host, pipe to container's psql
cat backup.sql | docker exec -i <postgres-container> psql -U postgres -d <target-database>

# Or using host's psql if port is exposed
PGPASSWORD=<password> psql -h 195.35.20.80 -p 5433 -U postgres -d <target-database> -f backup.sql
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `psql: command not found` | postgresql-client not installed | `apt-get install postgresql-client` |
| `connection refused` | Wrong host/port or PG not listening | Use `docker exec` or check `docker ps` for correct port |
| `password authentication failed` | Wrong password | Verify `POSTGRES_PASSWORD` env var |
| `database "x" does not exist` | Database not created | `CREATE DATABASE x;` via `docker exec` |
| `syntax error at or near "pg_dump"` | SQL file contains error messages | Dump failed, file has error text instead of SQL. Re-run dump. |

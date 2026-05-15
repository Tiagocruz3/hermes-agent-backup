# Multi-Postgres Container Debug

When multiple Postgres containers exist on one host, identifying which has which databases/tables and exposing the right one on the right port.

## Scenario

Host has multiple Postgres containers:
- `supabase-db-rv2ci4jg5u013kwi9pzcw2h4` — Supabase system DB (auth, storage, realtime tables)
- `coolify-db` — Coolify internal DB
- `imfgfd7m9w6fzzrni951f8fl` — Coolify-managed standalone Postgres (user data: wpi, saas_coder)
- `wpi-db` — Manual container (may or may not have data)

User asks "why does my database have zero tables" — the answer is usually "you're looking at the wrong container."

## Diagnostic Sequence

### Step 1: List all Postgres containers
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}" | grep -i postg
```

### Step 2: Check databases in each container
```bash
# For each container:
docker exec <container> psql -U <user> -c "\l"
```

Common users: `postgres`, `supabase_admin`, `coolify`

### Step 3: Check tables in the target database
```bash
docker exec <container> psql -U <user> -d <dbname> -c "
  SELECT schemaname, tablename 
  FROM pg_tables 
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema') 
  ORDER BY schemaname, tablename;
"
```

### Step 4: Check port bindings
```bash
docker inspect <container> --format='{{json .NetworkSettings.Ports}}'
# Look for {"5432/tcp":[{"HostIp":"0.0.0.0","HostPort":"5433"}]}
```

No port binding = container only accessible via Docker internal network, not from host/VPS IP.

## Key Discovery (2026-05-11)

User's WPI database (10 tables: admins, agents, booking_log, courses, form_submissions, form_templates, leads, marketing_actions, processed_orders, profiles) was in container `imfgfd7m9w6fzzrni951f8fl` with **no host port mapping**.

The connection string `postgresql://postgres:brainstormnodes2026db@195.35.20.80:5433/wpi` failed because:
1. Port 5433 was not open (container had no `-p 5433:5432` binding)
2. The `wpi` database existed in that container, not in `coolify-db` or Supabase DB

## Coolify-Managed DB Volume Paths

Coolify-managed Postgres containers use a **nested volume path**:
- Volume mounts to `/var/lib/postgresql` (NOT `/var/lib/postgresql/data`)
- Actual data is at `/var/lib/postgresql/18/docker/` for Postgres 18
- Or `/var/lib/postgresql/15/docker/` for Postgres 15

**CRITICAL:** If you recreate a container with `-v volume:/var/lib/postgresql/data`, it will:
1. See an empty directory (because data is in `/var/lib/postgresql/18/docker/`)
2. Run `initdb` on the empty directory
3. Create a NEW empty database cluster
4. Lose access to the original data

**Correct mount for Coolify-managed volumes:**
```bash
docker run -d --name wpi-db -p 5433:5432 \
  -v postgres-data-imfgfd7m9w6fzzrni951f8fl:/var/lib/postgresql \
  postgres:18-alpine
```

NOT `/var/lib/postgresql/data` — that creates a new empty cluster.

## Postgres Version Mismatch

When recreating a container from an existing volume:
- Check `PG_VERSION` file in the volume: `cat /var/lib/postgresql/18/docker/PG_VERSION`
- Use the matching Postgres image version
- PG15 data + PG18 image = `initdb: error: directory exists but is not empty`
- PG18 data + PG15 image = `FATAL: database files are incompatible with server`

**Always match the image version to the data version.**

## Exposing a Hidden Container

If the container with data has no port binding:

```bash
# Option 1: Stop old container, recreate with port binding
docker stop old-container
docker rm old-container
docker run -d --name wpi-db -p 5433:5432 \
  -v original-volume:/var/lib/postgresql \
  -e POSTGRES_PASSWORD=<password> \
  postgres:<correct-version>-alpine

# Option 2: Add port binding to running container (not persistent across restarts)
docker run --rm --network container:old-container alpine sh -c "..."
```

## Verification After Fix

```bash
# From VPS host
curl -s telnet://localhost:5433 2>&1 | head -1

# Or from external machine
psql "postgresql://postgres:<password>@<vps-ip>:5433/wpi" -c "\dt"
```

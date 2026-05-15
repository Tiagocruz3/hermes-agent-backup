# Multiple Supabase Stacks on One Host

## Problem

Coolify can deploy multiple Supabase stacks. Each gets a unique random suffix (e.g., `rv2ci4jg5u013kwi9pzcw2h4`, `geebhc9pw31vt4o0hfgg08dl`). The user may want:
- One stack for production (`db.brainstormnodes.org`)
- One stack for a new project (`wpdb.brainstormnodes.org`)
- Or replace an old stack with a new one

## Container Naming Pattern

Each stack creates containers with the pattern `<service>-<stack-id>`:

| Service | Old Stack | New Stack |
|---------|-----------|-----------|
| Studio | `supabase-studio-rv2ci4jg5u013kwi9pzcw2h4` | `supabase-studio-geebhc9pw31vt4o0hfgg08dl` |
| DB | `supabase-db-rv2ci4jg5u013kwi9pzcw2h4` | `supabase-db-geebhc9pw31vt4o0hfgg08dl` |
| Kong | `supabase-kong-rv2ci4jg5u013kwi9pzcw2h4` | `supabase-kong-geebhc9pw31vt4o0hfgg08dl` |
| Edge Functions | `supabase-edge-functions-rv2ci4jg5u013kwi9pzcw2h4` | `supabase-edge-functions-geebhc9pw31vt4o0hfgg08dl` |

## Routing Multiple Studios via Traefik

Each studio can have its own subdomain. Traefik auto-connects to all project networks, so no manual network config needed.

```yaml
# /data/coolify/proxy/dynamic/services.yaml
http:
  routers:
    db-router:
      entryPoints:
        - https
      service: db-service
      rule: Host(`db.brainstormnodes.org`)
      tls:
        certResolver: letsencrypt
    wpdb-router:
      entryPoints:
        - https
      service: wpdb-service
      rule: Host(`wpdb.brainstormnodes.org`)
      tls:
        certResolver: letsencrypt
  services:
    db-service:
      loadBalancer:
        servers:
          - url: http://supabase-studio-rv2ci4jg5u013kwi9pzcw2h4:3000
    wpdb-service:
      loadBalancer:
        servers:
          - url: http://supabase-studio-geebhc9pw31vt4o0hfgg08dl:3000
```

## Deleting an Old Stack

To remove an entire old stack:

```bash
# Stop and remove ALL containers from the old stack
for c in $(docker ps -a --format "{{.Names}}" | grep rv2ci4jg5u013kwi9pzcw2h4); do
  docker stop $c
  docker rm $c
done

# Optionally remove the network
docker network rm rv2ci4jg5u013kwi9pzcw2h4 2>/dev/null || true

# Remove from Traefik config (edit services.yaml and restart proxy)
```

**CRITICAL:** Do NOT delete volumes unless you want to lose data. The old stack's data is in volumes like `postgres-data-rv2ci4jg5u013kwi9pzcw2h4`.

## Changing Project Name in Studio UI

The project name shown in Supabase Studio comes from env var `STUDIO_DEFAULT_PROJECT` (or `DEFAULT_PROJECT_NAME`). For Coolify-deployed stacks, edit the docker-compose file:

```bash
# Find the docker-compose for the stack
cd /data/coolify/services/geebhc9pw31vt4o0hfgg08dl

# Edit the env var
sed -i "s/STUDIO_DEFAULT_PROJECT: 'Default Project'/STUDIO_DEFAULT_PROJECT: 'WPI DB'/g" docker-compose.yml

# Recreate the studio container
docker compose up -d supabase-studio
```

**Note:** The studio container must be recreated (not just restarted) for env var changes to take effect.

## Session Example (2026-05-11)

User installed a new Supabase stack via Coolify Services. Wanted:
- `wpdb.brainstormnodes.org` → new stack
- Old `db.brainstormnodes.org` → keep or delete

Solution:
1. Added `wpdb.brainstormnodes.org` CNAME in Hostinger DNS
2. Added `wpdb-router` + `wpdb-service` to Traefik `services.yaml`
3. Pointing to `http://supabase-studio-geebhc9pw31vt4o0hfgg08dl:3000`
4. Traefik auto-routed because proxy is connected to all project networks
5. No manual `docker network connect` needed

## Pitfalls

1. **Don't confuse old and new studio containers** — `supabase-studio` (old manual) vs `supabase-studio-geebhc9pw31vt4o0hfgg08dl` (new Coolify)
2. **Check which container is actually running** — `docker ps | grep studio`
3. **Old manual containers may still exist** even after deploying new Coolify stack
4. **Traefik routes to whatever container matches the service URL** — verify the container name in `services.yaml` matches the running container

# Traefik HTTP 502 Bad Gateway — Debug Checklist

## Symptom
Domain returns HTTP 502 after Traefik config is applied.

## Root Causes (in order of frequency)

### 1. services.yaml port mismatch (MOST COMMON)
The `services.yaml` points to a port the container is NOT listening on.

**Check:**
```bash
# What port does the container actually listen on internally?
docker ps --format "table {{.Names}}\t{{.Ports}}"
# Shows: scraper   0.0.0.0:8082->8082/tcp
#                        ^^^^ host    ^^^^ internal (this goes in services.yaml)

# Test directly from Traefik container:
docker exec coolify-proxy wget -qO- http://scraper:8082/health
# If this works but domain gives 502, it's a Traefik routing issue
```

**Fix:** Update `/data/coolify/proxy/dynamic/services.yaml` to match the container's INTERNAL port, then `docker restart coolify-proxy`.

### 2. Container not on coolify network
**Check:** `docker network inspect coolify | grep <container-name>`
**Fix:** Recreate container with `--network coolify`

### 3. Traefik Docker provider not discovering labels
Even with correct labels, Traefik's Docker provider (`--providers.docker=true`) often fails to discover manually-run containers. The file provider is the only deterministic approach.

**Check:**
```bash
docker exec coolify-proxy wget -qO- http://localhost:8080/api/http/routers 2>/dev/null | grep -i <service-name>
```
If not found, labels aren't being picked up.

**Fix:** Use `services.yaml` file provider instead of Docker labels.

### 4. SSL certificate not yet issued
New subdomains need 2-5 minutes for Let's Encrypt after DNS propagation.

**Check:**
```bash
cat /data/coolify/proxy/acme.json | grep <subdomain>
```

**Fix:** Wait 5 minutes, then `docker restart coolify-proxy`.

### 5. Container is restarting/not healthy
**Check:** `docker ps` — STATUS should be `Up`, not `Restarting`
**Check:** `docker logs <container>` for errors

## Session Example: Scraper 502
- Deployed Python scraper on internal port 8082
- `services.yaml` still had `http://scraper:11235` (Crawl4AI's old port)
- Result: HTTP 502 Bad Gateway
- Fix: Updated `services.yaml` to `http://scraper:8082`
- Verification: `docker exec coolify-proxy wget -qO- http://scraper:8082/health` → `{"status":"healthy"}`

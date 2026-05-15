# Docker Network Isolation in Coolify

## The Problem

Coolify v4 creates **per-project Docker networks** when deploying services through its UI. Manually deployed containers via `docker run` go on the general `coolify` network. These networks are **isolated by default** — containers on different networks cannot reach each other by DNS name.

## How It Manifests

**Symptom 1:** `curl http://container-name:port` from one container to another returns `Could not resolve host` or `Temporary failure in name resolution`

**Symptom 2:** Auth proxy on `coolify` network cannot reach service on project-specific network

**Symptom 3:** Traefik routes to container but gets HTTP 502 (container exists but is on wrong network)

## Network Types

| Network | Created By | Used For | Example |
|---------|-----------|----------|---------|
| `coolify` | Coolify installer | Manual containers, Traefik proxy | `coolify` |
| `zoudyuiu6vxny41izi58u7b3` | Coolify Services deployment | Coolify-managed SearXNG | `searxng-zoudyuiu6vxny41izi58u7b3` |
| `bridge` | Docker default | Unspecified containers | varies |

## How to Check

```bash
# List all Docker networks
docker network ls

# Check which network a container is on
docker inspect <container> --format "{{json .NetworkSettings.Networks}}" | python3 -m json.tool

# Check if two containers share a network
docker network inspect <network-name> --format "{{json .Containers}}" | grep <container-name>
```

## Solutions

### Option 1: Connect Container to Multiple Networks (BEST for auth proxies)

```bash
# Connect auth-proxy to SearXNG's project network
docker network connect zoudyuiu6vxny41izi58u7b3 auth-proxy

# Now auth-proxy can resolve 'searxng:8080'
```

**Caveat:** Even after connecting, routing may be unreliable. The container's primary network may still be used for outbound DNS. Test thoroughly.

### Option 2: Use IP Address Instead of DNS Name

```bash
# Get container IP on specific network
docker inspect searxng-zoudyuiu6vxny41izi58u7b3 --format "{{json .NetworkSettings.Networks.zoudyuiu6vxny41izi58u7b3.IPAddress}}"
# → "172.16.2.3"

# Use IP in config instead of DNS name
TARGET = 'http://172.16.2.3:8080'
```

**Caveat:** IPs change when containers restart. Only use for static infrastructure.

### Option 3: Avoid Cross-Network Dependencies (SIMPLEST)

Don't put auth proxies or middleware between containers on different networks. Either:
- Deploy both containers on the same network
- Or don't proxy between them at all

**Session example (2026-05-10):** Tried to deploy nginx auth proxy on `coolify` network to protect SearXNG on `zoudyuiu6vxny41izi58u7b3` network. Multiple attempts failed:
1. DNS resolution failed (`Temporary failure in name resolution`)
2. `docker network connect` added the network but DNS still unreliable
3. Python auth proxy got empty responses even when connected to both networks
4. Eventually removed auth proxy entirely

**Solution:** Left SearXNG public (it's a search engine — inherently public) and only secured the scraper (which was on `coolify` network, same as Traefik).

## When This Happens

- Mixing Coolify UI-deployed services with manual `docker run` containers
- Adding auth layers (nginx, custom proxies) between services
- Trying to route from Traefik to containers not on `coolify` network
- Edge functions runtime trying to reach Coolify-managed databases

## Prevention

**Rule:** If you need two containers to talk to each other, put them on the same network from the start.

```bash
# When deploying manual containers, explicitly use coolify network
docker run -d --name myservice --network coolify ...

# If Coolify deployed a service you need to reach from manual containers,
# either connect your manual container to Coolify's project network,
# or redeploy the Coolify service with manual docker run on coolify network
```

## Testing Cross-Network Connectivity

```bash
# From inside container A, try to reach container B
docker exec container-a wget -qO- http://container-b:port/ || echo "FAIL"

# If DNS fails, try IP
docker exec container-a wget -qO- http://<container-b-ip>:port/ || echo "FAIL"

# From host, test via localhost (if port is exposed)
curl http://localhost:port/
```

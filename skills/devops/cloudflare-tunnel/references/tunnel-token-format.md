# Tunnel Token Format (JWT)

Cloudflare tunnel tokens are URL-safe base64-encoded JWTs with three dot-separated parts.

## Decoding a Token

```python
import base64, json

token = "eyJhIjoiMzQ4NWMyNDZjYjMxYzRhOTVlNjMzMzU1N2NmMjUzYTQiLCJ0IjoiYTlkOWJiNmQtZjIzZC00YWFiLTljYjgtYzY0MDA0NTQwMmE5IiwicyI6IlpUbGxOamhsWmpJdE9XRXlOeTAwTVdRM0xUZzVPVGd0WXpsbE56a3dPV1ZsWXpFMSJ9"

parts = token.split('.')
for p in parts:
    pad = 4 - len(p) % 4
    if pad != 4:
        p += '=' * pad
    print(base64.urlsafe_b64decode(p).decode())
```

## Fields

| Field | Key | Example |
|-------|-----|---------|
| Account ID | `a` | `3485c246cb31c4a95e6333557cf253a4` |
| Tunnel ID  | `t` | `a9d9bb6d-f23d-4aab-9cb8-c640045402a9` |
| Secret     | `s` | `e9e68ef2-9a27-41d7-8998-c9e7909eec15` (base64-encoded) |

## Why This Matters

- The token contains the **account ID** and **tunnel ID** — useful for API calls or dashboard lookups.
- The token is **NOT** a Cloudflare API bearer token — it cannot be used with `api.cloudflare.com/client/v4/` endpoints.
- To query tunnel details via API, you need a separate **Cloudflare API token** with "Cloudflare Tunnel:Read" permission.
- The `s` (secret) field is what authenticates the tunnel runner to Cloudflare's edge.

## Service Install Command

```bash
sudo cloudflared service install <token>
sudo systemctl enable --now cloudflared
```

This creates `/etc/systemd/system/cloudflared.service` with the token embedded in the `ExecStart` line.

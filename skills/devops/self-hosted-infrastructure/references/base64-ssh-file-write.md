# Base64 SSH File Write Pattern

## Problem

When writing multi-line files to a remote VPS via `sshpass` + `ssh`, bash on the remote host interprets backticks, dollar signs, and newlines. Heredocs (`cat << 'EOF'`) often fail because:
1. The sshpass command string itself gets parsed by local bash
2. Remote bash may still interpret some characters
3. Backticks in Traefik Host rules (`Host(\`domain\`)`) get stripped
4. Multi-line YAML with indentation becomes garbled

## Solution — Base64 Encoding

Encode the file content locally with `base64`, pass the single-line string through SSH, decode on the remote host. This is the ONLY method that reliably preserves ALL characters including backticks, newlines, and indentation.

### Workflow

**Step 1 — Write file locally**
```bash
cat > /tmp/services.yaml << 'EOF'
http:
  routers:
    myservice-router:
      entryPoints:
        - https
      service: myservice-service
      rule: Host(`myservice.example.com`)
      tls:
        certResolver: letsencrypt
  services:
    myservice-service:
      loadBalancer:
        servers:
          - url: http://container-name:8080
EOF
```

**Step 2 — Encode to base64**
```bash
cat /tmp/services.yaml | base64 -w0
# Output: aHR0cDoKICByb3V0ZXJzOgogICAgbXlzZXJ2aWNlLXJvdXRlcjoKICAgICAgZW50cnlQb2ludHM6CiAgICAgICAgLSBodHRwcwogICAgICBzZXJ2aWNlOiBteXNlcnZpY2Utc2VydmljZQogICAgICBydWxlOiBIb3N0KGBteXNlcnZpY2UuZXhhbXBsZS5jb21gKQogICAgICB0bHM6CiAgICAgICAgY2VydFJlc29sdmVyOiBsZXRzZW5jcnlwdAogIHNlcnZpY2VzOgogICAgbXlzZXJ2aWNlLXNlcnZpY2U6CiAgICAgIGxvYWRCYWxhbmNlcjoKICAgICAgICBzZXJ2ZXJzOgogICAgICAgICAgLSB1cmw6IGh0dHA6Ly9jb250YWluZXItbmFtZTo4MDgwCg==
```

**Step 3 — Send via SSH and decode on remote**
```bash
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no root@VPS_IP \
  "echo 'BASE64_STRING_HERE' | base64 -d > /data/coolify/proxy/dynamic/services.yaml"
```

**Full example — updating Traefik services.yaml:**
```bash
# Local machine
CONTENT=$(cat << 'EOF'
http:
  routers:
    functions-router:
      entryPoints:
        - https
      service: functions-service
      rule: Host(`functions.brainstormnodes.org`)
      tls:
        certResolver: letsencrypt
  services:
    functions-service:
      loadBalancer:
        servers:
          - url: http://edge-runtime:9000
EOF
)

B64=$(echo "$CONTENT" | base64 -w0)

sshpass -p 'Thiago515000#' ssh -o StrictHostKeyChecking=no root@195.35.20.80 \
  "echo '$B64' | base64 -d > /data/coolify/proxy/dynamic/services.yaml && docker restart coolify-proxy"
```

## Why This Works

| Method | Backticks | Newlines | Indentation | Special chars | Reliability |
|--------|-----------|----------|-------------|---------------|-------------|
| Heredoc via sshpass | ❌ Stripped | ⚠️ Sometimes | ⚠️ Fragile | ❌ Broken | Low |
| Python one-liner | ✅ Kept | ✅ Kept | ✅ Kept | ✅ Kept | Medium |
| printf + sed | ✅ Kept | ⚠️ Complex | ⚠️ Complex | ⚠️ Complex | Medium |
| **Base64 encode** | **✅ Kept** | **✅ Kept** | **✅ Kept** | **✅ Kept** | **High** |

## Verification

After writing, always verify the remote file:
```bash
sshpass -p 'PASSWORD' ssh root@VPS_IP \
  "cat /data/coolify/proxy/dynamic/services.yaml | head -5"
```

## Session Example (2026-05-11)

Used base64 encoding to write Traefik `services.yaml` with multiple routers (searxng, scraper, db, wpdb, functions) after sshpass heredoc failed repeatedly. The base64 method worked on first try and preserved all backticks in Host rules.

## When to Use

- **Always** for files containing backticks (Traefik Host rules)
- **Always** for multi-line YAML/JSON via sshpass
- **Always** when heredoc fails even once — don't retry heredoc, switch to base64
- **Preferred** over Python one-liner for files > 10 lines (cleaner)

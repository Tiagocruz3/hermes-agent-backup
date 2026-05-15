# SSH File Write Patterns (sshpass + bash escaping)

## Problem
When writing files to a remote VPS via `sshpass` + SSH, bash on the remote host interprets special characters:
- Backticks (`` ` ``) → command substitution
- Dollar signs (`$`) → variable expansion
- Double quotes (`"`) → interpolation
- Heredocs (`<<EOF`) → local interpretation before remote execution

## Solutions (ranked by reliability)

### 1. Base64 Encode (MOST RELIABLE — verified 2026-05-11)
Encode content locally, decode on remote. Handles ANY characters including backticks, quotes, newlines.

```bash
# Local machine: encode file to base64
base64 /tmp/myfile.yaml
# Output: aHR0cDovL3RyYWVmaWsuaHR0cC5yb3V0ZXJz... (long string)

# Remote: decode and write
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no user@host \
  "echo 'BASE64STRING' | base64 -d > /data/coolify/proxy/dynamic/services.yaml"
```

**Python automation:**
```python
import base64

content = """http:
  routers:
    functions-router:
      entryPoints:
        - https
      service: functions-service
      rule: Host(`functions.yourdomain.com`)
      tls:
        certResolver: letsencrypt
  services:
    functions-service:
      loadBalancer:
        servers:
          - url: http://edge-runtime:9000
"""

encoded = base64.b64encode(content.encode()).decode()
print(f"sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no user@host \\")
print(f'  "echo \'{encoded}\' | base64 -d > /data/coolify/proxy/dynamic/services.yaml"')
```

**Why this works:** Base64 is a pure ASCII representation with no shell-special characters. The remote `base64 -d` decodes back to exact original bytes.

### 2. Python One-Liner on Remote
Write file via Python on the remote host. Handles backticks and quotes safely.

```bash
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no user@host \
  'python3 -c "content = open(\"/dev/stdin\").read(); open(\"/data/coolify/proxy/dynamic/services.yaml\", \"w\").write(content)"' \
  < /tmp/myfile.yaml
```

**Limitation:** Requires Python3 on remote host. Not all minimal VPS images have it.

### 3. Single-Quoted Docker Labels (for docker run via sshpass)
When passing Traefik labels via sshpass, use single quotes to preserve backticks:

```bash
sshpass -p 'PASSWORD' ssh user@host \
  'docker run -d --name svc --network coolify \\
    -l '"'"'traefik.http.routers.x.rule=Host(`functions.yourdomain.com`)'"'"' \\
    -l '"'"'traefik.http.routers.x.entrypoints=https'"'"' \\
    image'
```

**Note:** The `"'"'` pattern (double-quote, single-quote, double-quote) creates a literal single quote inside a single-quoted SSH command string. This is bash escaping voodoo but it works.

### 4. printf + sed (for simple strings)
Write hex-escaped content, then sed-replace hex codes with actual characters:

```bash
sshpass -p 'PASSWORD' ssh user@host \
  'printf "%s\n" "Host(\x60domain\x60)" > /tmp/file && sed -i '"'"'s/\\x60/`/g'"'"' /tmp/file'
```

**Limitation:** Tedious for multi-line files. Only suitable for short strings.

### 5. Heredoc via SSH (LEAST RELIABLE)
```bash
sshpass -p 'PASSWORD' ssh user@host 'cat > /tmp/file << "EOF"
Host(`domain`)
EOF'
```

**Why it fails:** The heredoc terminator (`EOF`) is processed by the LOCAL shell before being sent to SSH. If the content contains shell-special characters, they get interpreted locally. Backticks in double-quoted heredocs are expanded. Single-quoted heredocs don't allow variable expansion but still have issues with nested quotes.

## Session Reference
- **2026-05-11:** Attempted to write `index.ts` to VPS via heredoc through sshpass. Failed due to backtick interpretation. Eventually succeeded by writing locally first, then using scp (not shown above). Later discovered base64 encoding is the most reliable pattern for future use.
- **2026-05-11:** Traefik config for `functions.brainstormnodes.org` was missing from `services.yaml`. Could not patch via local `patch` tool because file is on remote VPS. Must use SSH-based file write patterns.

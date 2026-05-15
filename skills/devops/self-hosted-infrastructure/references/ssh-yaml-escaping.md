# SSH YAML Escaping Techniques

When writing YAML files (especially Traefik dynamic configs) via SSH, backticks and special characters get interpreted by bash. This reference documents the reliable methods.

## The Problem

Traefik dynamic configs need backticks in `Host(`domain.com`)` rules. But SSH heredocs interpret backticks as command substitution:

```bash
# BROKEN — backticks get executed as commands
cat > file.yaml << 'EOF'
rule: Host(`domain.com`)  # bash tries to run "domain.com" as command!
EOF
```

## Solution 1: printf with hex codes + sed (Most Reliable)

```bash
printf "%s\n" \
  "http:" \
  "  routers:" \
  "    myservice:" \
  "      entryPoints:" \
  "        - https" \
  "      service: myservice" \
  "      rule: Host(\x60domain.com\x60)" \
  "      tls:" \
  "        certresolver: letsencrypt" \
  "  services:" \
  "    myservice:" \
  "      loadBalancer:" \
  "        servers:" \
  "          - url: http://container:port" \
  > /data/coolify/proxy/dynamic/services.yaml

# Replace hex backticks with real backticks
sed -i 's/\\x60/`/g' /data/coolify/proxy/dynamic/services.yaml
```

**Why this works:** `\x60` is the hex escape for backtick. printf writes it literally. sed replaces it after writing.

## Solution 2: Python One-Liner (Best for Complex Files)

```bash
python3 -c "
config = '''http:
  routers:
    myservice:
      entryPoints:
        - https
      service: myservice
      rule: Host(\`domain.com\`)
      tls:
        certresolver: letsencrypt
  services:
    myservice:
      loadBalancer:
        servers:
          - url: http://container:port
'''
with open('/data/coolify/proxy/dynamic/services.yaml', 'w') as f:
    f.write(config)
"
```

**Note:** In Python strings, backticks don't have special meaning, so they write correctly.

## Solution 3: Base64 Encode (Bulletproof for Any Content)

```bash
# On local machine (or in script)
echo "content with `backticks` and $variables" | base64
# → Y29udGVudCB3aXRoIGBiYWNrdGlja3NgIGFuZCAkdmFyaWFibGVzCg==

# On remote VPS
ssh root@vps 'echo "Y29udGVudCB3aXRoIGBiYWNrdGlja3NgIGFuZCAkdmFyaWFibGVzCg==" | base64 -d > /path/to/file.yaml'
```

**Best for:** Large files, complex templates, or when you want 100% certainty.

## Solution 4: Single Quotes with Dollar Escape (Simple Cases)

```bash
# If no variables need expansion, use single quotes
cat > file.yaml << 'EOF'
http:
  routers:
    myservice:
      rule: 'Host(`domain.com`)'
EOF
```

**Limitation:** Single quotes prevent ALL expansion (variables, backticks, etc.). Good for static files.

## Verification

Always verify the file after writing:

```bash
cat /data/coolify/proxy/dynamic/services.yaml | grep -E "rule:|url:"
# Should show: rule: Host(`domain.com`)
# NOT: rule: Host()  or  rule: Host(\x60domain.com\x60)
```

## Common Mistakes

1. **Using double quotes in heredoc:** `<< EOF` (without quotes) allows expansion — backticks execute.
2. **Using backslash-escaped backticks:** `\`` sometimes works, sometimes not depending on shell nesting.
3. **Forgetting sed replacement:** Writing `\x60` but never running `sed -i` leaves hex codes in file.
4. **SSH double-escaping:** When passing through Python → SSH → bash, escapes compound. Use base64 to avoid this.

## Quick Test

```bash
# Test if your method works
ssh root@vps 'printf "%s\n" "rule: Host(\x60test.com\x60)" | sed "s/\\x60/\`/g"'
# Expected output: rule: Host(`test.com`)
```

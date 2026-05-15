# Coolify v4.0.0 "New Resource" Page Stuck on Loading

## Symptom
Navigating to **Projects → My Project → + New** (or **+ Add Resource**) shows a blank page with "Loading..." text that never resolves. No resource type cards (Docker Image, GitHub, Services, etc.) ever appear.

## Root Cause
Coolify v4.0.0 has a known bug where the resource template catalog fails to load. This happens intermittently and is not related to network connectivity or DNS.

## Workarounds (in order of preference)

### 1. Hard Refresh (Fastest, sometimes works)
Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) 2-3 times. The page may eventually populate.

### 2. Navigate via Dashboard (Alternative path)
Instead of going through Projects → + New, try:
- Go to **Dashboard**
- Click **"+ Add Resource"** directly on the project card
- This sometimes bypasses the broken route

### 3. Restart Coolify Container
```bash
docker restart coolify
```
Wait 30 seconds, then refresh the page.

### 4. Use Terminal Deployment (Most Reliable)
If the user signals impatience ("just deploy", "don't worry about the UI", short misspelled demands), **immediately switch to terminal-based deployment**. Do NOT keep trying to fix the GUI.

Deploy services via:
- `docker run -d` with Traefik labels
- `docker compose up -d` for multi-container stacks
- Write dynamic config to `/data/coolify/proxy/dynamic/services.yaml`
- Restart Traefik: `docker restart coolify-proxy`

The services will NOT show in Coolify Projects dashboard, but they WILL work on their subdomains with SSL.

### 5. Check Coolify Logs (Diagnostic)
```bash
docker logs coolify --tail 50 2>&1 | grep -i "error\|loading\|template"
```

## When to Give Up on GUI
**Switch to terminal deployment immediately if:**
- User says "don't worry about coolify then" or "just deploy"
- "Loading..." persists after 3+ refresh attempts
- User asks for "apis and urls" instead of GUI management
- User sends a screenshot showing frustration

## User Preference Signal
This user's communication pattern:
- Short, often misspelled messages
- "just deploy", "make sure everything works", "give me the apis"
- Wants endpoints and credentials, not GUI screenshots
- Willing to accept terminal-only management if GUI is broken

**Rule:** Ask once about GUI vs terminal. If user signals terminal preference, commit fully to terminal deployment and never mention Coolify UI again in that session.

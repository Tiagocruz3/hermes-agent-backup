# Supabase Cloud → Self-Hosted Migration

## Problem
User has a cloud-hosted Supabase project and wants to clone it to self-hosted PostgreSQL on their VPS.

## CRITICAL — Project Ref Mismatch

The project ref in the dashboard URL (`supabase.com/dashboard/project/XYZ`) may NOT match the API endpoint ref. Always verify by checking:
- Dashboard → Settings → API → Project URL
- The ref in the Project URL is the correct one for API calls

**Session example (2026-05-10):**
- User provided project ref `amimhxhzvmzelffixzlp` from dashboard URL
- Actual API endpoint ref was `etfxttsccketjvytklz` (from screenshot of Settings → API)
- REST API calls with wrong ref returned empty/404
- Always verify from Settings → API, not dashboard URL

## CRITICAL — DNS Resolution Failures on VPS

The VPS may fail to resolve Supabase domains (`*.supabase.co`). This prevents:
- `pg_dump` from connecting to cloud DB
- REST API export scripts from fetching data
- Direct `psql` connections

**Symptom:** `nslookup project-ref.supabase.co` returns `NXDOMAIN` even though it resolves from your local machine.

**Cause:** VPS DNS configuration (systemd-resolved, /etc/resolv.conf) may use local resolver that fails.

**Fixes:**
1. Use Google's DNS: `nslookup project-ref.supabase.co 8.8.8.8`
2. Add to /etc/hosts: `echo "<ip> project-ref.supabase.co" >> /etc/hosts`
3. Get IP from local machine: `dig +short project-ref.supabase.co` then add to VPS hosts
4. **Best:** Run export scripts from your LOCAL machine (Mac/PC) where DNS works, then upload `.sql` to VPS

**Session example (2026-05-10):**
- VPS `nslookup` returned `NXDOMAIN` for `etfxttsccketjvytklz.supabase.co`
- Google DNS (8.8.8.8) also returned `NXDOMAIN`
- Local machine (Mac) resolved fine
- REST API export script failed on VPS due to DNS
- Solution: Run export from local machine, or use Supabase CLI locally

## Approaches

### Approach 1: Supabase CLI (Recommended — when it works)
```bash
# Link to project
supabase link --project-ref <project-ref>

# Dump everything
supabase db dump > backup.sql

# Or schema-only / data-only
supabase db dump --schema-only > schema.sql
supabase db dump --data-only > data.sql
```

**Requirements:**
- Docker Desktop running locally (supabase CLI needs it)
- Project ref from dashboard URL
- Service role key for auth

**Failure modes:**
- "Docker daemon not running" — need Docker Desktop
- "Local database version differs" — update `supabase/config.toml`
- "Cannot connect to Docker" — install/start Docker Desktop

### Approach 2: Direct pg_dump (when you have DB password)
```bash
# Using Supabase pooler (transaction mode, port 6543)
pg_dump "postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" \
  --schema-only --clean --if-exists > schema.sql

# Or direct connection (port 5432)
pg_dump "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" \
  --schema-only > schema.sql
```

**Password is NOT the JWT service_role key.** It's the actual PostgreSQL database password from:
- Supabase Dashboard → Settings → Database → Connection String
- Or reset via Settings → Database → Reset Password

**Common errors:**
- "Tenant or user not found" — wrong username format (needs `postgres.<project-ref>` for pooler)
- "Connection refused" — using port 5432 when pooler requires 6543
- "Password authentication failed" — using JWT key instead of DB password

### Approach 3: REST API Export (fallback when no DB password)
When user can't get the DB password (reset fails, CLI doesn't work), use the REST API with service_role key:

```python
import requests
import json

API_URL = "https://<project-ref>.supabase.co/rest/v1"
HEADERS = {
    "apikey": "<service_role_key>",
    "Authorization": "Bearer <service_role_key>"
}

# Get tables from API spec
r = requests.get(f"{API_URL}/", headers=HEADERS)
spec = r.json()

tables = []
for path, methods in spec.get("paths", {}).items():
    if path.startswith("/") and not path.startswith("/rpc/"):
        table_name = path.strip("/")
        if table_name and "get" in methods:
            tables.append(table_name)

# Export each table
for table in tables:
    r = requests.get(f"{API_URL}/{table}?limit=1000", headers=HEADERS)
    rows = r.json()
    # Generate INSERT statements...
```

**Limitations:**
- Only exports data, not schema (no CREATE TABLE statements)
- Must generate CREATE TABLE statements separately
- Pagination needed for tables with >1000 rows
- Doesn't handle foreign keys, triggers, functions

**Project ref mismatch issue:**
The project ref in the dashboard URL (`supabase.com/dashboard/project/XYZ`) may NOT match the API endpoint ref. Always verify by checking:
- Dashboard → Settings → API → Project URL
- The ref in the Project URL is the correct one for API calls

**Session example (2026-05-10):**
User provided project ref `amimhxhzvmzelffixzlp` from dashboard URL, but actual API endpoint was different. REST API calls returned empty. User later provided correct ref `etfxttsccketjvytklz` from screenshot. Always verify the Project URL from Settings → API, not the dashboard URL.

### Approach 4: Supabase Backup Download (easiest when available)
1. Dashboard → Database → Backups
2. Click "Download backup" (if available)
3. Get `.sql` file with complete schema + data
4. Import to self-hosted DB via psql or SQL Editor

**Limitation:** Free tier may not offer download — only "Restore" button.

## Restoring to Self-Hosted DB

```bash
# Via docker exec (since PostgreSQL is in container)
cat backup.sql | docker exec -i <postgres-container> psql -U postgres -d <target-db>

# Or use psql directly if client is installed
PGPASSWORD="<password>" psql -h <host> -p <port> -U postgres -d <target-db> -f backup.sql
```

**Common restore errors:**
- "psql: command not found" — install postgresql-client: `apt-get install postgresql-client`
- "Connection refused" — connecting to host IP instead of container; use `docker exec` instead
- "syntax error" — dump file contains error messages instead of SQL (connection failed during dump)

## Session Notes (2026-05-10)

**Attempted:**
1. Supabase CLI — failed because Docker Desktop not running
2. Direct pg_dump — failed because user provided JWT key instead of DB password
3. REST API export — initially failed due to wrong project ref, then DNS resolution issues on VPS
4. Supabase backup download — UI showed "Restore" buttons only, no download option

**Final state:** Migration incomplete. User needs to either:
- Install Docker Desktop and retry Supabase CLI
- Get actual DB password from Dashboard → Settings → Database
- Use the REST API export script with CORRECT project ref

**Key lessons:**
1. Always verify project ref from Settings → API, not dashboard URL
2. VPS DNS may fail to resolve Supabase domains — run exports from local machine
3. The JWT service_role key is NOT the DB password — need actual PostgreSQL password
4. Supabase CLI requires Docker Desktop running locally
5. Free tier backup download may not be available — only "Restore" button

---
name: supabase-migration
description: "Migrate databases from Supabase Cloud to self-hosted PostgreSQL. Covers CLI dump, pg_dump, REST API export, and backup download approaches."
tags: [supabase, migration, postgresql, self-hosted, backup, devops]
trigger: "User wants to clone, migrate, export, or backup a Supabase Cloud database to self-hosted PostgreSQL."
---

# Supabase Cloud → Self-Hosted Migration

## Problem
User has a cloud-hosted Supabase project and wants to clone it to self-hosted PostgreSQL on their VPS.

## Approaches (in order of preference)

### Approach 1: Supabase Backup Download (easiest, when available)
1. Dashboard → Database → Backups
2. Click "Download backup" (if available)
3. Get `.sql` file with complete schema + data
4. Import to self-hosted DB via psql or SQL Editor

**Limitation:** Free tier may only show "Restore" button, not "Download".

### Approach 2: Supabase CLI (most complete, needs Docker Desktop)
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
- Docker Desktop running locally
- Project ref from Settings → API (NOT dashboard URL)
- Service role key for auth

**Failure modes:**
- "Docker daemon not running" — need Docker Desktop
- "Local database version differs" — update `supabase/config.toml`

### Approach 3: Direct pg_dump (when you have DB password)
```bash
# Using Supabase pooler (transaction mode, port 6543)
# Username format: postgres.<project-ref>
pg_dump "postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" \
  --schema-only --clean --if-exists > schema.sql

# Or direct connection (port 5432)
pg_dump "postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" \
  --schema-only > schema.sql
```

**Password is NOT the JWT service_role key.** It's the actual PostgreSQL password from:
- Dashboard → Settings → Database → Connection String
- Or reset via Settings → Database → Reset Password

**Common errors:**
- "Tenant or user not found" — wrong username format (needs `postgres.<ref>` for pooler)
- "Connection refused" — using port 5432 when pooler requires 6543
- "Password authentication failed" — using JWT key instead of DB password

### Approach 4: REST API Export (fallback when no DB password)
When user can't get the DB password, use the REST API with service_role key:

**CRITICAL — Run from LOCAL machine, not VPS:**
The VPS may fail to resolve Supabase domains (`*.supabase.co`). Always run REST API export scripts from your local machine (Mac/PC), then upload the `.sql` file to the VPS.

**Symptom on VPS:** `nslookup project-ref.supabase.co` returns `NXDOMAIN` even though it resolves locally.

**Session example (2026-05-10):**
- VPS `nslookup` returned `NXDOMAIN` for `etfxttsccketjvytklz.supabase.co`
- Google DNS (8.8.8.8) also returned `NXDOMAIN`
- Local machine (Mac) resolved fine
- REST API export script failed on VPS due to DNS
- Solution: Run export from local machine

```python
import requests

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

### Approach 5: REST API Export with Schema Auto-Generation (VPS-compatible)

When DNS resolution fails on the VPS but you have the service_role key, generate the export script locally and run it on any machine with working DNS. Then upload the `.sql` file to the VPS.

**Complete workflow (verified 2026-05-10):**

1. **Get correct project ref from Settings → API** (NOT dashboard URL)
2. **Verify service_role key** works: `curl -H "apikey: <key>" https://<ref>.supabase.co/rest/v1/`
3. **Run export script** (see `templates/supabase-rest-export.py`)
4. **Upload `.sql` file to VPS** via `scp` or paste
5. **Inspect column names** from INSERT statements to build correct schema
6. **Create tables** with correct columns (drop old ones if schema mismatch)
7. **Import data** via `docker exec -i <container> psql -U postgres -d <db>`

**Schema mismatch handling:**
When importing to an existing database, the target schema may have wrong columns. Common causes:
- Previous import attempt created tables with guessed columns
- Different Supabase versions have different default columns
- Custom migrations added/removed columns

**Fix:**
```sql
-- Drop old tables with wrong schema
DROP TABLE IF EXISTS "table_name" CASCADE;

-- Recreate with correct columns (extract from INSERT statements)
CREATE TABLE "table_name" (
    "id" UUID PRIMARY KEY,
    "actual_column" TEXT,
    "another_column" JSONB,
    "created_at" TIMESTAMPTZ
);
```

**Session example (2026-05-10):**
- First migration attempt created `agents` table with `submitted_by` column (wrong)
- REST API export showed actual columns: `id`, `name`, `email`, `active`, `created_at`
- Import failed with "column 'active' does not exist"
- Fixed by dropping table and recreating with correct columns
- Re-imported successfully: 6 agents, 1475 leads, 1005 booking logs, etc.

**Merging multiple projects into one database:**
When user wants to eliminate multiple cloud DBs and merge into one self-hosted DB:

1. Export each project separately (different `.sql` files)
2. Create all tables in target database (may need prefixes if table names collide)
3. Import each project's data
4. Handle user merging for SSO (deduplicate by email, merge profiles)

**Session example (2026-05-10):**
- Migrated `etxfttscclketjvytklz` (FeedbackWPI): 34 form_templates, 439 form_submissions, 1 admin
- Migrated `amimhxhzvmzelffixzlp` (WPI): 1005 booking_log, 1475 leads, 997 processed_orders, 345 marketing_actions, 6 agents, 1 profile
- Total: 4303 records in unified WPI database
- Table names didn't collide, so no prefixing needed

## Critical: Verify the Correct Project Ref

The project ref in the dashboard URL (`supabase.com/dashboard/project/XYZ`) may NOT match the API endpoint ref. **Always verify by checking:**

1. Dashboard → Settings → API → Project URL
2. The ref in the Project URL is the correct one for API calls

**Session example (2026-05-10):**
User provided project ref `amimhxhzvmzelffixzlp` from dashboard URL, but actual API endpoint was `etfxttsccketjvytklz`. REST API calls returned empty. User later provided correct ref from screenshot of Settings → API.

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

## Tool Calling: Browser vs Terminal for Endpoint Checks

When verifying if a service endpoint (like `https://functions.brainstormnodes.org`) is live, prefer `terminal` with `curl` over `browser_navigate`. Browser tool may be blocked for internal/private addresses.

**Anti-pattern:** Retrying `browser_navigate` 50+ times after "Blocked" error.
**Correct:** One `browser_navigate` attempt, then switch to `curl -s <url> | head -20` via terminal.

**Session example (2026-05-10):** Tried to check `functions.brainstormnodes.org` via browser — blocked. Wasted 50+ retries. `curl` via terminal returned empty response immediately, correctly showing the endpoint was down.

## References
- `references/supabase-cloud-migration.md` — Detailed session notes from migration attempts

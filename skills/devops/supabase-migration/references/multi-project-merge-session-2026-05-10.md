# Multi-Project Supabase Migration Session — 2026-05-10

## Context
User wanted to eliminate multiple cloud Supabase databases and merge everything into one self-hosted WPI database on their VPS.

## Source Projects

### Project 1: `etxfttscclketjvytklz` (FeedbackWPI)
- **Tables:** `admins`, `form_templates`, `form_submissions`
- **Data:** 1 admin, 34 form templates, 439 form submissions
- **Export method:** REST API (service_role key)
- **Challenge:** VPS DNS couldn't resolve `etfxttsccketjvytklz.supabase.co`
- **Solution:** Export script written to VPS but DNS failed; user provided correct service_role key from Settings → API

### Project 2: `amimhxhzvmzelffixzlp` (WPI)
- **Tables:** `booking_log`, `leads`, `profiles`, `processed_orders`, `marketing_actions`, `agents`, `courses`
- **Data:** 1005 booking logs, 1475 leads, 1 profile, 997 processed orders, 345 marketing actions, 6 agents, 0 courses
- **Export method:** REST API (service_role key)
- **Challenge:** Initial project ref was wrong (user provided `amimhxhzvmzelffixzlp` but JWT showed `etxfttscclketjvytklz`)
- **Solution:** User provided correct service_role key with matching project ref from Settings → API

## Migration Workflow

### Step 1: Export via REST API
```python
import requests
import json

API_URL = "https://<correct-project-ref>.supabase.co/rest/v1"
HEADERS = {
    "apikey": "<service_role_key>",
    "Authorization": "Bearer <service_role_key>"
}

# Get API spec to discover tables
r = requests.get(f"{API_URL}/", headers=HEADERS)
spec = r.json()

# Extract table names from paths
tables = []
for path, methods in spec.get("paths", {}).items():
    if path.startswith("/") and not path.startswith("/rpc/"):
        table_name = path.strip("/")
        if table_name and "get" in methods:
            tables.append(table_name)

# Export each table with pagination
for table in tables:
    rows = []
    offset = 0
    limit = 1000
    while True:
        r = requests.get(f"{API_URL}/{table}?limit={limit}&offset={offset}", headers=HEADERS)
        batch = r.json()
        if not batch or not isinstance(batch, list):
            break
        rows.extend(batch)
        offset += limit
        if len(batch) < limit:
            break
    # Generate INSERT statements...
```

### Step 2: Discover Actual Columns
The export file contains INSERT statements with actual column names. Extract them:
```bash
# Get first INSERT for each table to see columns
grep "INSERT INTO \"table_name\"" export.sql | head -1
```

### Step 3: Create Correct Schema
```sql
-- Drop old tables if schema mismatch
DROP TABLE IF EXISTS "table_name" CASCADE;

-- Create with correct columns (from INSERT statements)
CREATE TABLE "table_name" (
    "id" UUID PRIMARY KEY,
    "actual_column" TEXT,
    "another_column" JSONB,
    "created_at" TIMESTAMPTZ
);
```

### Step 4: Import Data
```bash
# Via docker exec (PostgreSQL in container)
cat export.sql | docker exec -i <postgres-container> psql -U postgres -d wpi
```

## Critical Issues Encountered

### 1. Wrong Project Ref
- User initially provided `amimhxhzvmzelffixzlp` from dashboard URL
- Actual API endpoint was `etxfttscclketjvytklz` (from Settings → API)
- REST API returned empty until correct ref was used
- **Lesson:** Always verify project ref from Settings → API, not dashboard URL

### 2. Schema Mismatch on Re-import
- First migration attempt created `agents` table with guessed columns (`submitted_by`, `template_id`)
- REST API export showed actual columns: `id`, `name`, `email`, `active`, `created_at`
- Import failed: "column 'active' does not exist"
- **Fix:** Dropped table, recreated with correct columns, re-imported
- **Lesson:** Always extract actual columns from INSERT statements before creating schema

### 3. VPS DNS Resolution Failure
- VPS couldn't resolve `*.supabase.co` domains
- `nslookup` returned `NXDOMAIN` even with Google DNS (8.8.8.8)
- Local machine (Mac) resolved fine
- **Workaround:** Write export script to VPS, but if DNS fails, run from local machine and upload `.sql` file
- **Lesson:** Test DNS resolution early; have fallback to local execution

### 4. Password vs JWT Key Confusion
- User provided `service_role` JWT key thinking it was the DB password
- `pg_dump` failed with "Tenant or user not found"
- **Lesson:** JWT keys are for REST API, not PostgreSQL connections. Need actual DB password from Settings → Database.

## Final State

### Unified WPI Database
| Table | Rows | Source Project |
|-------|------|---------------|
| `admins` | 1 | etxfttscclketjvytklz |
| `form_templates` | 34 | etxfttscclketjvytklz |
| `form_submissions` | 439 | etxfttscclketjvytklz |
| `booking_log` | 1005 | amimhxhzvmzelffixzlp |
| `leads` | 1475 | amimhxhzvmzelffixzlp |
| `profiles` | 1 | amimhxhzvmzelffixzlp |
| `processed_orders` | 997 | amimhxhzvmzelffixzlp |
| `marketing_actions` | 345 | amimhxhzvmzelffixzlp |
| `agents` | 6 | amimhxhzvmzelffixzlp |
| **Total** | **4303** | **Both** |

### Connection String
```
postgresql://postgres:brainstormnodes2026db@195.35.20.80:5433/wpi
```

## User Preferences Observed
- User prefers direct action over explanations
- User gets frustrated with verbose responses
- User handles DB execution (assistant provides SQL, user runs)
- User wants all services managed through Coolify GUI when possible, but accepts terminal deployment when GUI fails
- User signals satisfaction with "beautiful", "lets test", "done" — STOP configuring immediately

# Merging Multiple Supabase Projects into One Self-Hosted Database

## Problem
User has 2+ Supabase cloud projects and wants to eliminate them all, merging data into a single self-hosted PostgreSQL database.

## When This Applies
- User says "I want to eliminate the need for 2 DBs" or "I want all in one DB"
- User has multiple Supabase projects (e.g., WPI, FeedbackWPI, SAAS Coder)
- User wants unified SSO across all apps

## Approach

### 1. Export Each Project
Use REST API export (see `supabase-migration` skill) since pg_dump often fails due to:
- Wrong project ref (dashboard URL ≠ API endpoint)
- Password confusion (JWT key ≠ DB password)
- VPS DNS resolution failures (`*.supabase.co` NXDOMAIN)

```python
# Export script from templates/supabase-rest-export.py
python3 supabase-rest-export.py
# Produces: project1_export.sql, project2_export.sql, etc.
```

### 2. Check for Table Name Collisions
```bash
# Extract table names from each export
grep "INSERT INTO" project1_export.sql | sed 's/INSERT INTO "\([^"]*\)".*/\1/' | sort -u
grep "INSERT INTO" project2_export.sql | sed 's/INSERT INTO "\([^"]*\)".*/\1/' | sort -u
```

**If collisions exist** (same table name in multiple projects):
- Option A: Add prefix (`project1_users`, `project2_users`)
- Option B: Merge data (deduplicate by ID or email)
- Option C: Use PostgreSQL schemas (`project1.users`, `project2.users`)

### 3. Create Unified Schema
Extract actual column names from INSERT statements:
```bash
# Get columns for each table
grep "INSERT INTO \"table_name\"" export.sql | head -1 | \
  sed 's/INSERT INTO "table_name" (\([^)]*\)).*/\1/' | \
  tr ',' '\n' | sed 's/^ *//;s/ *$//;s/"//g'
```

Create tables with correct columns:
```sql
CREATE TABLE "booking_log" (
    "id" UUID PRIMARY KEY,
    "order_id" TEXT,
    "biller_name" TEXT,
    -- ... etc
);
```

### 4. Import Data
```bash
# For each export file
cat project1_export.sql | docker exec -i <postgres-container> psql -U postgres -d wpi
cat project2_export.sql | docker exec -i <postgres-container> psql -U postgres -d wpi
```

### 5. Merge Users for SSO (if needed)
```sql
-- Find duplicate users by email
SELECT email, COUNT(*) 
FROM (
    SELECT email FROM project1_users
    UNION ALL
    SELECT email FROM project2_users
) combined
GROUP BY email
HAVING COUNT(*) > 1;

-- Merge strategy: keep one profile, update references
-- Or use UUID mapping table for cross-project references
```

## Verified Session: 2026-05-10

### Source Projects
| Project | Tables | Rows |
|---------|--------|------|
| `etxfttscclketjvytklz` (FeedbackWPI) | admins, form_templates, form_submissions | 474 |
| `amimhxhzvmzelffixzlp` (WPI) | booking_log, leads, profiles, processed_orders, marketing_actions, agents | 3829 |

### Result
- **Total tables in WPI DB:** 10
- **Total rows:** 4303
- **No collisions:** Table names were unique across projects
- **Users:** Only 1 profile in WPI project, no deduplication needed

### Connection String
```
postgresql://postgres:brainstormnodes2026db@195.35.20.80:5433/wpi
```

## Pitfalls

### Schema Mismatch
When re-importing to existing tables, columns may not match. Always:
1. Drop old tables if schema is wrong
2. Recreate with correct columns from INSERT statements
3. Re-import

### Foreign Key Conflicts
If tables have FK relationships across projects (e.g., `form_submissions.template_id` → `form_templates.id`), ensure parent tables are imported before child tables. The REST API export orders tables alphabetically, which may violate FK constraints.

**Fix:** Reorder INSERT statements or disable FK checks during import:
```sql
SET session_replication_role = 'replica';  -- disables FK checks
-- ... import data ...
SET session_replication_role = 'origin'; -- re-enable
```

### UUID Collisions
If both projects use UUID primary keys, collisions are statistically impossible but possible. Check:
```sql
SELECT id, COUNT(*) FROM combined_table GROUP BY id HAVING COUNT(*) > 1;
```

If found, regenerate one project's UUIDs before import.

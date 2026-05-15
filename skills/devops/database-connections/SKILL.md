---
name: database-connections
description: "Connect to PostgreSQL and other databases to query data, run analytics, and inspect schemas."
version: 1.0.0
author: Hermes
---

# Database Connections

Use this skill when the user wants to:
- Query their PostgreSQL database
- Inspect orders, users, or any table data
- Run analytics/reporting queries
- Export data from a database

## Prerequisites

- `psql` CLI (PostgreSQL client)
- Database connection string

## Quick Start

### Install psql (if missing)
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y postgresql-client
```

### Connect with connection string
```bash
# Direct PostgreSQL
psql "postgresql://user:pass@host:5432/dbname"
```

## Table Discovery

If `\dt` or schema listing fails, probe common table names:
```python
tables = ["orders", "courses", "users", "profiles", "tickets", "venues", 
          "instructors", "payments", "invoices", "coupons", "enrollments",
          "contacts", "leads", "bookings", "waitlist", "testimonials"]
found = {}
for t in tables:
    # query via your connection method
    found[t] = "accessible" if "error" not in res else "restricted/not_found"
```

Then query counts and samples from discovered tables.

## What You Can Do Once Connected

- **Query tables**: `SELECT * FROM orders WHERE status = 'completed'`
- **Count/aggregate**: `SELECT COUNT(*), status FROM orders GROUP BY status`
- **Recent activity**: `SELECT * FROM orders ORDER BY created_at DESC LIMIT 20`
- **Schema inspection**: `\dt` (list tables), `\d orders` (describe table)
- **Export**: `\copy (SELECT ...) TO '/path/to/file.csv' CSV HEADER`

## Security Notes
- Never commit connection strings with passwords to git
- Use `.env` files or environment variables
- **NEVER write to any database** (insert/update/delete) unless the user has explicitly authorized it in the current session. Read-only queries only by default.
- When a user says "remove credentials" or "delete access", do a full cleanup: delete skill directories, redact keys from logs/session files, update configs, and strip references from all skill docs.
- **Multiple Postgres containers on one host:** When user reports "zero tables" or missing data, check ALL Postgres containers. See `self-hosted-infrastructure/references/multi-postgres-container-debug.md` for the diagnostic sequence.

## Schema Mismatch Handling

When importing data to an existing database, the target schema may have wrong columns. Common causes:
- Previous import attempt created tables with guessed columns
- Different database versions have different default columns
- Custom migrations added/removed columns

**Symptom:** Import fails with "column X of relation Y does not exist"

**Fix:**
```sql
-- Drop old tables with wrong schema
DROP TABLE IF EXISTS "table_name" CASCADE;

-- Recreate with correct columns (extract from INSERT statements in export file)
CREATE TABLE "table_name" (
    "id" UUID PRIMARY KEY,
    "actual_column" TEXT,
    "another_column" JSONB,
    "created_at" TIMESTAMPTZ
);
```

**Session example (2026-05-10):**
- First migration created `agents` table with guessed columns (`submitted_by`, `template_id`)
- REST API export showed actual columns: `id`, `name`, `email`, `active`, `created_at`
- Import failed: "column 'active' does not exist"
- Fixed by dropping table and recreating with correct columns
- Re-imported successfully

**Prevention:** Always extract actual column names from INSERT statements in the export file before creating schema.

## Pitfalls
- **"psql: command not found"** → Install `postgresql-client` (package name varies by distro: `postgresql-client` on Ubuntu/Debian, `postgresql` on Alpine)
- **"connection refused" connecting to Docker PostgreSQL** → PostgreSQL inside Docker container is not accessible via host IP/port from host's `psql`. Use `docker exec -i <container> psql -U postgres -d <db>` instead, or `cat file.sql | docker exec -i <container> psql -U postgres -d <db>`
- **"connection refused"** → Check firewall, SSL mode, or use connection pooler URL
- **"password authentication failed"** → Verify credentials (note: JWT service_role key is NOT the DB password for Supabase cloud)
- **Dump file contains error messages** → `pg_dump` failed but wrote error text to the `.sql` file. Check file size (should be KB/MB, not bytes). Re-run with verbose flags to see actual error.
- **User removes database access** → Immediately delete the skill directory, redact all credentials from `~/.hermes/logs/` and `~/.hermes/sessions/`, update `webhook_subscriptions.json` to remove the skill reference, and strip Supabase/database references from any skill docs that mention them

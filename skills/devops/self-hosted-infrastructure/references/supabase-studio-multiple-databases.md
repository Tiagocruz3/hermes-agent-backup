# Supabase Studio: Multiple Databases

## Problem
Self-hosted Supabase Studio only shows ONE project name in the UI (set via `DEFAULT_PROJECT_NAME` env var). But you need multiple databases for different apps (WPI, SAAS Coder, etc.).

## How It Works

Supabase Studio self-hosted = **single project UI**. The `DEFAULT_PROJECT_NAME` environment variable sets what's displayed, but it only connects to one PostgreSQL database at a time.

However, PostgreSQL supports **multiple databases** within the same instance. You can create:
- `postgres` (default/system)
- `wpi` (Workplace Interventions app)
- `saas_coder` (SAAS Coder app)

## Creating Multiple Databases

```bash
# Create databases
docker exec <postgres-container> psql -U postgres -c "CREATE DATABASE wpi;"
docker exec <postgres-container> psql -U postgres -c "CREATE DATABASE saas_coder;"
```

## Accessing Different Databases

### Option 1: SQL Editor (switch within Studio)
1. Go to `https://db.brainstormnodes.org`
2. Log in with postgres credentials
3. Open **SQL Editor**
4. Run: `\c wpi` to switch to WPI database
5. Or use fully qualified queries: `SELECT * FROM wpi.public.users;`

**Limitation:** The Table Editor and other GUI views stay on the default database. SQL Editor is the only way to query other databases.

### Option 2: Separate Studio Instances (separate URLs)
Deploy one Studio container per database, each with different `DEFAULT_PROJECT_NAME`:

```bash
# WPI Studio
docker run -d --name supabase-studio-wpi --network coolify \
  -e DEFAULT_PROJECT_NAME="WPI" \
  -e SUPABASE_URL=http://195.35.20.80:5433 \
  -e STUDIO_PG_META_URL=http://195.35.20.80:5433 \
  -e POSTGRES_PASSWORD=brainstormnodes2026db \
  supabase/studio:latest

# SAAS Coder Studio  
docker run -d --name supabase-studio-saas --network coolify \
  -e DEFAULT_PROJECT_NAME="SAAS Coder" \
  -e SUPABASE_URL=http://195.35.20.80:5433 \
  -e STUDIO_PG_META_URL=http://195.35.20.80:5433 \
  -e POSTGRES_PASSWORD=brainstormnodes2026db \
  supabase/studio:latest
```

**Issue:** Both studios connect to the same PostgreSQL instance, but they both default to the `postgres` database. To make each studio connect to a specific database, you'd need to modify the connection string or use database-specific users.

**Better approach:** Just use ONE studio and switch databases via SQL Editor.

### Option 3: Custom Dashboard (recommended)
Build a simple HTML dashboard that shows all projects and links to the same Studio:

- Deploy nginx with a static HTML page
- List all databases with connection strings
- Link to `https://db.brainstormnodes.org` for the Studio
- Add notes: "Switch database via SQL Editor with `\c <dbname>`"

**Session example (2026-05-10):**
Deployed custom dashboard at `https://brainstormnodes.org` showing:
- WPI → Database: wpi
- SAAS Coder → Database: saas_coder  
- Default → Database: postgres

Each card links to the same Studio URL with a note: "Switch to 'wpi' database in Studio dropdown" (though dropdown doesn't exist — SQL Editor `\c` is the actual method).

## Renaming the Displayed Project

To change what's shown in the Studio UI:

```bash
# Stop and remove old studio
docker stop supabase-studio && docker rm supabase-studio

# Recreate with new name
docker run -d --name supabase-studio --network coolify \
  -e DEFAULT_ORGANIZATION_NAME="Brainstorm Nodes" \
  -e DEFAULT_PROJECT_NAME="WPI" \
  -e SUPABASE_URL=http://195.35.20.80:5433 \
  -e STUDIO_PG_META_URL=http://195.35.20.80:5433 \
  -e POSTGRES_PASSWORD=brainstormnodes2026db \
  supabase/studio:latest
```

**Note:** This only changes the DISPLAY name. The underlying database (`postgres` by default) stays the same. Data is not lost.

## API Keys Per Database

Since all databases share the same PostgreSQL instance, API keys are stored per database:

```sql
-- In wpi database
CREATE TABLE IF NOT EXISTS api_keys (key_name TEXT PRIMARY KEY, key_value TEXT, created_at TIMESTAMP DEFAULT NOW());
INSERT INTO api_keys (key_name, key_value) VALUES ('anon_key', '<jwt>'), ('service_key', '<jwt>');

-- In saas_coder database  
CREATE TABLE IF NOT EXISTS api_keys (key_name TEXT PRIMARY KEY, key_value TEXT, created_at TIMESTAMP DEFAULT NOW());
INSERT INTO api_keys (key_name, key_value) VALUES ('anon_key', '<jwt>'), ('service_key', '<jwt>');
```

## Limitations of Self-Hosted Studio

| Feature | Supabase Cloud | Self-Hosted Studio |
|---------|---------------|-------------------|
| Multiple projects | ✅ Yes | ❌ No (one UI) |
| Project switcher | ✅ Dropdown | ❌ Not available |
| Database switcher | ✅ Yes | ⚠️ Via SQL Editor only |
| Edge Functions | ✅ Built-in | ❌ Not included |
| Auth | ✅ Built-in | ❌ Not included |
| Storage | ✅ Built-in | ❌ Not included |
| Realtime | ✅ Built-in | ❌ Not included |

**For full Supabase features:** Deploy the complete stack (Kong, GoTrue, PostgREST, Storage, etc.) or use Supabase Cloud for those features and self-hosted PostgreSQL for data.

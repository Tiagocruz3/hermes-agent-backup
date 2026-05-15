# Supabase Self-Hosted SQL Snippets

User executes these himself. I provide, he runs via psql or Supabase dashboard SQL editor.

## Initial Setup (Post-Deploy)

### Create extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- for pgvector if using embeddings
```

### Create app schema (isolated from auth/storage)
```sql
CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON TABLES TO anon, authenticated;
```

## Auth-Related

### Create a test user (user runs after confirming email SMTP is configured)
```sql
-- Via Supabase Auth API, not raw SQL. Use GoTrue API or dashboard.
-- SQL-only alternative for local/dev:
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}'
);
```

## RLS Policies Template

```sql
-- Enable RLS on a table
ALTER TABLE app.my_table ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own rows
CREATE POLICY "Users can read own data" ON app.my_table
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own rows
CREATE POLICY "Users can insert own data" ON app.my_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own rows
CREATE POLICY "Users can update own data" ON app.my_table
  FOR UPDATE USING (auth.uid() = user_id);
```

## Edge Functions (Deno) — Config, Not SQL

Edge functions live in `supabase/functions/`. Deploy via CLI:
```bash
supabase functions deploy my-function
```

Or in self-hosted, place in the `edge-runtime` container's mounted volume at `/home/deno/functions/`.

## Storage Buckets

```sql
-- Create bucket (via Storage API, not raw SQL)
-- Use Supabase client or dashboard for bucket creation
```

## Backup/Restore Notes

Self-hosted Supabase backup:
```bash
# pg_dump from the db container
docker exec -it supabase-db pg_dump -U postgres -Fc supabase > backup.dump

# restore
docker exec -i supabase-db pg_restore -U postgres -d supabase < backup.dump
```

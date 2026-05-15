TTS: ElevenLabs voice Q7IOSFX7VG3cnK4eU8Z4 (user's custom JARVIS voice — immediately notices if generic voice is used instead). Vercel env: ELEVENLABS_VOICE_ID.
§
Browser lesson 2026-05-10/11: "Blocked" = permanent ban, switch to curl. "410 Gone" = session dead, use terminal only. Docker compose via SSH often times out — use docker run -d instead.
§
CRITICAL RULE: Never write to any database. User has explicitly forbidden all database write operations. Read-only queries are acceptable if needed, but no inserts, updates, deletes, or schema changes under any circumstances.
§
SaaS: AgentMe.app on Coolify v4, VPS 195.35.20.80, domain brainstormnodes.org. Stack: SearXNG (search.*, public), Python scraper (scrape.*, API key: bn_MggBVNDJhqSXmofsnmS2xggegp0EJRNq), Supabase Studio (db.*, org "Brainstorm Nodes", project "WPI"), Postgres on 5433 password brainstormnodes2026db. DBs: postgres, wpi, saas_coder. Edge functions runtime (functions.*, port 9000, image supabase/edge-runtime:v1.71.2, expects index.ts at ROOT of /opt/supabase/functions/). Dashboard at root domain. Coolify login: tiagocruz3@gmail.com / Thiago5150!. SSH root: Thiago515000#. Hostinger token: [REDACTED]. Wants LiteLLM API monetization + social media marketing. Traefik entrypoints: 'http'/'https'. SSL: /data/coolify/proxy/acme.json. Dynamic config: /data/coolify/proxy/dynamic/services.yaml. Coolify v4.0.0 'New Resource' page broken — use terminal deployment. Manual containers don't show in GUI.
§
WPI DB connection: postgresql://postgres:brainstormnodes2026db@195.35.20.80:5433/wpi. Container: wpi-db (recreated from Coolify-managed volume postgres-data-imfgfd7m9w6fzzrni951f8fl). Note: VPS has MULTIPLE Postgres containers — supabase-db (system tables), coolify-db (Coolify internal), wpi-db (user data with 10 tables).
§
Vercel token: fBqPJ1YF1WTq7xS5qO3LCTb4 (saved as skill: vercel-deploy)
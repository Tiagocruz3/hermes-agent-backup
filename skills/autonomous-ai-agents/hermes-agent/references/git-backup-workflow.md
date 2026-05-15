# Git Backup Workflow for Hermes Config

## Problem
The `.hermes/` directory contains a `.gitignore` file that blocks skills, config, and scripts from being tracked by git. This prevents backing up your Hermes setup to a repo.

## Solution
Use `git add -f` (force) to override the `.gitignore` for specific files you want to track.

## What to back up
```bash
cd ~
git add -f .hermes/skills/           # All custom skills
git add -f .hermes/config.yaml       # Main config
git add -f .hermes/scripts/          # Custom scripts
git add -f .hermes/plans/            # Any plans you've written
git add -f .kimi/config.toml         # Kimi CLI config
```

## What NOT to back up
- `.hermes/.env` — contains API keys and secrets
- `.hermes/auth.json` — OAuth tokens
- `.hermes/credentials/` — any credential files
- `.hermes/logs/` — transient logs
- `.hermes/cache/`, `.hermes/audio_cache/`, `.hermes/image_cache/` — rebuildable caches
- `.hermes/sessions/` — session transcripts (large, transient)

## Full backup script
```bash
cd ~
git init 2>/dev/null || true

# Add Hermes essentials (force to override .gitignore)
git add -f .hermes/skills/
git add -f .hermes/config.yaml
git add -f .hermes/scripts/ 2>/dev/null || true
git add -f .hermes/plans/ 2>/dev/null || true

# Add other tool configs
git add -f .kimi/config.toml 2>/dev/null || true

# Commit
git commit -m "Backup Hermes skills and config"

# Push to GitHub (create repo first)
git remote add origin https://github.com/YOURUSER/hermes-backup.git
git push -u origin master
```

## Restoring on a new machine
```bash
git clone https://github.com/YOURUSER/hermes-backup.git ~/hermes-backup
cp -r ~/hermes-backup/.hermes/skills ~/.hermes/
cp ~/hermes-backup/.hermes/config.yaml ~/.hermes/
# Then run hermes setup to configure API keys
```

## Pitfall: `.hermes/.gitignore` is aggressive
The default `.gitignore` ignores:
- `venv/`, `.venv/`, `node_modules/`
- `*.db`, `logs/`, `cache/`
- `*.pid`, `*.lock`
- `hermes-agent/.git/` (nested git)
- `audio_cache/`, `image_cache/`, `checkpoints/`

This means `git add .hermes/skills/` will silently do nothing unless you use `-f`.

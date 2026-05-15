# Hermes Agent Backup

Complete backup of Hermes Agent configuration for hardware deployment.

## Contents

- `config/` - Hermes configuration files
- `memories/` - Persistent memory (facts, preferences)
- `skills/` - Custom skills and workflows
- `systemd/` - Service configuration
- `install.sh` - One-command installer for new Ubuntu machines

## Quick Deploy

```bash
# On fresh Ubuntu 24.04
git clone https://github.com/Tiagocruz3/hermes-agent-backup.git
cd hermes-agent-backup
chmod +x install.sh
./install.sh
```

## What's Backed Up

✅ Configuration (config.yaml)
✅ API keys (.env template)
✅ Memories (MEMORY.md, USER.md)
✅ Skills (all custom skills)
✅ Personality (SOUL.md)
✅ Systemd service
✅ Gateway settings

## What's NOT Backed Up

❌ Session history (sessions/)
❌ Logs (logs/)
❌ Cache (cache/)
❌ Audio/image caches
❌ Database files

## Post-Install

1. Edit `~/.hermes/.env` with your actual API keys
2. Configure Telegram bot token in `~/.hermes/config.yaml`
3. Start chatting: `hermes chat "hello"`

## Hardware Requirements

- Ubuntu 24.04 LTS (or newer)
- 4GB RAM minimum (8GB recommended)
- 20GB disk space
- Internet connection

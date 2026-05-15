# Backing Up a Directory Containing Nested Git Repos

When creating a git backup of a directory that itself contains cloned repositories
(e.g. `~/.hermes/` containing `hermes-agent/.git/`), git will detect the nested
`.git` and treat it as a **submodule** — the outer repo records a pointer instead
of tracking the files. This breaks "full backup" intent.

## The Problem

```bash
cd ~/my-config-dir
git init
git add .        # git warns: "adding embedded git repository: nested-project"
git status       # shows nested-project as a submodule, not as tracked files
```

Adding `nested-project/.git/` to `.gitignore` **does not help on the initial add** —
git detects embedded repos at staging time, before `.gitignore` filtering.

## The Fix

```bash
# 1. Create the repo and init git
gh repo create my-backup --private
cd ~/my-config-dir
git init

# 2. Add .gitignore BEFORE staging (excludes rebuildables + nested .git)
cat > .gitignore << 'EOF'
venv/
node_modules/
__pycache__/
*.db
logs/
nested-project/.git/
EOF

# 3. Stage everything INCLUDING nested project
#    git will still warn about embedded repo — that's expected
git add .

# 4. Force-remove nested project from index (it's a submodule entry)
git rm --cached -f nested-project

# 5. Temporarily hide nested .git, re-add as flat files
mv nested-project/.git nested-project/.git.bak
git add nested-project/

# 6. Restore the nested .git (it's gitignored now, won't be tracked)
mv nested-project/.git.bak nested-project/.git

# 7. Commit and push
git branch -m main
git commit -m "Full backup"
git remote add origin https://github.com/user/my-backup.git
git push -u origin main
```

## Pitfall: The Renamed `.git.bak` Trap

If you rename `.git` → `.git.bak` and `git add` **before** adding
`nested-project/.git.bak/` to `.gitignore`, those files **will be committed**.
You'll end up with thousands of `.git.bak/objects/...` files in the repo.

**Fix:** `git rm --cached -r nested-project/.git.bak/ && git commit --amend`

Or add `.git.bak/` to `.gitignore` proactively:

```gitignore
nested-project/.git/
nested-project/.git.bak/
```

## `.gitignore` for Hermes backups (reference)

```gitignore
# Rebuildable
venv/
.venv/
node_modules/
__pycache__/
*.pyc
dist/
build/

# Large caches
models_dev_cache.json
context_length_cache.yaml
image_cache/
audio_cache/
checkpoints/

# State databases
*.db
*.db-shm
*.db-wal
logs/

# Locks / PIDs
*.pid
*.lock

# Nested git repos (add one line per nested repo)
hermes-agent/.git/
hermes-agent/.git.bak/

# Transient
.hermes_history
gateway.lock
cache/
```
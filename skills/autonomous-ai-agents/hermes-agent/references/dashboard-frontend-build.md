# Dashboard frontend build troubleshooting (captured session)

## Symptom
Running:

  hermes dashboard --host 127.0.0.1 --port 9119 --no-open

Exited with:

  Web UI frontend not built and npm is not available.
  Install Node.js, then run:  cd web && npm install && npm run build


## Observations
- `node` and `npm` were not installed (`node -v` / `npm -v` not found)
- The dashboard port was not listening (`ss -ltnp` showed no `:9119`)
- Attempting an apt install required sudo password (non-interactive sudo failed)
- Attempting `curl | bash` installation was blocked by policy in this environment


## Fix (source checkout)
1) Install Node.js + npm (choose one method appropriate to the environment):
- system package manager (requires sudo)
- user-local install (e.g., nvm) when sudo isnt available

2) Build the frontend:

  cd web
  npm install
  npm run build

3) Start the dashboard:

  hermes dashboard --host 127.0.0.1 --port 9119

4) Verify:

  hermes dashboard --status
  ss -ltnp | grep :9119

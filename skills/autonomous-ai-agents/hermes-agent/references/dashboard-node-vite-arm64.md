# Dashboard frontend build: Node/Vite version + ARM64 + npm optional-deps bug

This note captures a real failure mode when running `hermes dashboard` from a source checkout:

Symptoms when starting dashboard:
- Browser shows `ERR_CONNECTION_REFUSED` at `http://127.0.0.1:9119`
- `hermes dashboard` exits immediately with:
  - `Web UI frontend not built and npm is not available.`
  - OR frontend build errors during `npm run build`

## Root causes observed

1) Node version too old
- Example:
  - Node `v18.19.1`
  - Vite requires `Node >= 20.19` or `>= 22.12` (exact threshold depends on Vite version)

2) npm optional dependency bug / native binding missing
- Example error during build:
  - `Error: Cannot find native binding. npm has a bug related to optional dependencies ...`
  - Often shows up from Tailwind oxide (`@tailwindcss/oxide`)

3) Wrong CPU architecture tarball
- On ARM machines (e.g. `aarch64`), downloading an `linux-x64` Node tarball yields:
  - `cannot execute binary file: Exec format error`

## Fix: build frontend with a user-local Node (no sudo)

1) Confirm architecture:

```bash
uname -m
```

2) Download matching Node tarball (example uses Node 22.12.0):

ARM64 (aarch64):
```bash
mkdir -p ~/.local/node && cd ~/.local/node
wget -O node-v22.12.0-linux-arm64.tar.xz \
  https://nodejs.org/dist/v22.12.0/node-v22.12.0-linux-arm64.tar.xz
rm -rf node-v22.12.0-linux-arm64
tar -xf node-v22.12.0-linux-arm64.tar.xz
export PATH="$HOME/.local/node/node-v22.12.0-linux-arm64/bin:$PATH"
node -v
npm -v
```

x86_64:
```bash
mkdir -p ~/.local/node && cd ~/.local/node
wget -O node-v22.12.0-linux-x64.tar.xz \
  https://nodejs.org/dist/v22.12.0/node-v22.12.0-linux-x64.tar.xz
rm -rf node-v22.12.0-linux-x64
tar -xf node-v22.12.0-linux-x64.tar.xz
export PATH="$HOME/.local/node/node-v22.12.0-linux-x64/bin:$PATH"
node -v
npm -v
```

Note: if `curl` is the Snap build and errors writing in some locations, prefer `wget`.

3) Clear npm state to avoid the optional-deps binding bug:

```bash
cd ~/.hermes/hermes-agent/web
rm -rf node_modules package-lock.json
npm install
npm run build
```

The built artifacts should land in the Python package directory (often `hermes_cli/web_dist/`).

## Start + verify dashboard

```bash
hermes dashboard --host 127.0.0.1 --port 9119 --no-open

# verify listening
ss -ltnp | grep :9119
```

If the port is listening, the browser should load at:
- `http://127.0.0.1:9119`

## Common gotcha: localhost scope

If you open `127.0.0.1:9119` from a different device, it will fail.
`127.0.0.1` always means "this device".
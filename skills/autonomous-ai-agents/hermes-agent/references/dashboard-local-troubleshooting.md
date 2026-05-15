# Dashboard local troubleshooting (127.0.0.1:9119)

This reference captures a real failure chain where the browser couldnt connect because the dashboard server never started.

## Symptom
- Firefox: cant connect to `127.0.0.1:9119`
- `ss -ltnp | grep :9119` shows no listener

## What happened
Running `hermes dashboard --host 127.0.0.1 --port 9119 --no-open` exited immediately with:

```
Web UI frontend not built and npm is not available.
Install Node.js, then run:  cd web && npm install && npm run build
```

Additionally, importing the dashboard backend module indicated missing backend deps:

```
Web UI requires fastapi and uvicorn.
Install with: /usr/bin/python3 -m pip install 'fastapi' 'uvicorn[standard]'
```

On this machine, `pip` wasnt installed:

```
/usr/bin/python3: No module named pip
/usr/bin/python3: No module named ensurepip
```

## Fix (Debian/Ubuntu)

1) Install prerequisites:

```bash
sudo apt-get update
sudo apt-get install -y nodejs npm python3-pip
```

2) Build frontend:

```bash
cd ~/.hermes/hermes-agent/web
npm install
npm run build
```

3) Install backend deps:

```bash
python3 -m pip install 'fastapi' 'uvicorn[standard]'
```

4) Start + verify listener:

```bash
hermes dashboard --host 127.0.0.1 --port 9119 --no-open
ss -ltnp | grep :9119
curl -I http://127.0.0.1:9119
```

If `curl -I` returns `HTTP/1.1 405 Method Not Allowed` with `allow: GET`, thats still a good sign: the server is running; use a browser (GET) or `curl http://127.0.0.1:9119/`.

If you have multiple stale dashboard processes, stop them before restarting:
```bash
hermes dashboard --stop
```

## Notes
- If you see the browser error, dont debug the browser first: confirm the server is listening.
- `127.0.0.1` only works from the same machine that started the dashboard.

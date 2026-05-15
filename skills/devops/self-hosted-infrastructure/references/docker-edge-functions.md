# Docker-Based Edge Functions (Supabase Alternative)

## Why Docker Instead of Full Supabase Stack

Full Supabase stack (Kong, GoTrue, PostgREST, Storage, Edge Functions runtime, Realtime) requires **2-3GB extra RAM** and 10+ containers. On a small VPS (4GB-16GB), this is wasteful.

**Docker-based edge functions provide:**
- Same functionality (HTTP-triggered serverless functions)
- ~50-100MB RAM per function (vs 2-3GB for full Supabase)
- FastAPI/Node.js runtime (familiar, debuggable)
- No complex orchestration

## Architecture

```
User Request → Traefik (SSL) → Edge Functions Runtime (FastAPI) → Function Code (.py/.js)
                                                           ↓
                                                    PostgreSQL / External APIs
```

## Deployment

### 1. Create Runtime Container

```bash
docker run -d --name edge-functions --network coolify -p 8085:8085 \
  -v /opt/edge-functions:/app:ro \
  python:3.11-slim \
  bash -c "pip install fastapi uvicorn requests -q && python /app/runtime.py"
```

### 2. Runtime Code (runtime.py)

```python
from fastapi import FastAPI, Request, HTTPException
import subprocess
import os

app = FastAPI()
API_KEY = os.environ.get('API_KEY', 'default-key')
FUNCTIONS_DIR = '/app/functions'

@app.get('/')
def root():
    return {'status': 'ok', 'service': 'edge-functions'}

@app.get('/functions')
def list_functions():
    functions = []
    if os.path.exists(FUNCTIONS_DIR):
        for f in os.listdir(FUNCTIONS_DIR):
            if f.endswith(('.py', '.js')):
                functions.append(f)
    return {'functions': functions}

@app.post('/invoke/{name}')
def invoke(name: str, request: Request):
    # Verify API key
    key = request.headers.get('x-api-key') or request.headers.get('authorization', '').replace('Bearer ', '')
    if key != API_KEY:
        raise HTTPException(status_code=401, detail='Invalid or missing API key')
    
    # Get request body
    body = {}
    try:
        body = request.json()
    except:
        pass
    
    # Find function file
    func_path = os.path.join(FUNCTIONS_DIR, f'{name}.py')
    if not os.path.exists(func_path):
        func_path = os.path.join(FUNCTIONS_DIR, f'{name}.js')
    
    if not os.path.exists(func_path):
        raise HTTPException(status_code=404, detail=f'Function "{name}" not found')
    
    # Execute function
    if func_path.endswith('.py'):
        result = subprocess.run(
            ['python', func_path],
            input=json.dumps(body),
            capture_output=True,
            text=True,
            timeout=30
        )
    else:
        result = subprocess.run(
            ['node', func_path],
            input=json.dumps(body),
            capture_output=True,
            text=True,
            timeout=30
        )
    
    return {
        'statusCode': 200 if result.returncode == 0 else 500,
        'body': result.stdout if result.returncode == 0 else result.stderr,
        'headers': {'Content-Type': 'application/json'}
    }
```

### 3. Add Function Files

```bash
# Create function directory
mkdir -p /opt/edge-functions/functions

# Add a Python function
cat > /opt/edge-functions/functions/hello.py << 'EOF'
import json
import sys
import datetime

data = json.load(sys.stdin)
name = data.get('name', 'World')

result = {
    'message': f'Hello {name}!',
    'function': 'hello',
    'timestamp': datetime.datetime.now().isoformat()
}
print(json.dumps(result))
EOF
```

### 4. Add Traefik Route

```yaml
# /data/coolify/proxy/dynamic/services.yaml
http:
  routers:
    functions-router:
      entryPoints:
        - https
      service: functions-service
      rule: Host(`functions.yourdomain.com`)
      tls:
        certResolver: letsencrypt
  services:
    functions-service:
      loadBalancer:
        servers:
          - url: http://edge-functions:8085
```

### 5. Restart Traefik

```bash
docker restart coolify-proxy
```

## Usage

```bash
# List functions
curl https://functions.yourdomain.com/functions

# Invoke function
curl -X POST https://functions.yourdomain.com/invoke/hello \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name":"Brainstorm"}'
```

## Creating New Functions

Just add `.py` or `.js` files to `/opt/edge-functions/functions/`. They appear immediately in the list.

**Python function template:**
```python
import json
import sys

data = json.load(sys.stdin)
# Your logic here
result = {'status': 'success', 'data': data}
print(json.dumps(result))
```

**Node.js function template:**
```javascript
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
// Your logic here
const result = { status: 'success', data };
console.log(JSON.stringify(result));
```

## Limitations vs Full Supabase Edge Functions

| Feature | Docker Functions | Supabase Edge Functions |
|---------|-----------------|------------------------|
| Runtime | Python/Node.js | Deno |
| Cold start | ~1-2s (container always running) | ~100ms |
| Scale | Single container | Auto-scaling |
| Built-in auth | Manual (API key) | Supabase Auth integration |
| Storage | Direct DB connection | Supabase Storage API |
| Realtime | Manual polling/WebSocket | Built-in |

**When to use Docker functions:**
- Small VPS (4-16GB RAM)
- Few functions (< 20)
- No need for Deno runtime
- Want to avoid Supabase complexity

**When to use full Supabase:**
- Large scale (100+ functions)
- Need Deno/TypeScript specifically
- Need Supabase Auth integration
- Need auto-scaling

## Session Example (2026-05-10)

User wanted edge functions for their chat app. Full Supabase stack too heavy for VPS. Deployed Python FastAPI runtime on port 8085 with API key auth. Added `hello.py` function. User can add more functions by dropping `.py` files into `/opt/edge-functions/functions/`.

## DNS Note

`functions.yourdomain.com` needs a CNAME record pointing to root domain. If DNS is missing, Traefik can't get SSL certificate and returns HTTP 000. Always verify DNS exists before adding Traefik router.

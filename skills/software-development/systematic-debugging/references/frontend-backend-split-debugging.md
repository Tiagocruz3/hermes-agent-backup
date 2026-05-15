# Frontend-Backend Split Debugging

When a web app (React/Vite frontend + Express/Node backend) has bugs, quickly determine WHICH side is broken before fixing anything.

## The 30-Second Diagnostic

```bash
# 1. Is the backend running?
curl -s http://localhost:3001/api/health
# Expected: {"status":"online",...}
# If fails → backend issue (port conflict, crash, not started)

# 2. Is the backend responsive to chat?
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
# Expected: {"reply":"..."}
# If fails → backend logic issue

# 3. Is the frontend dev server running?
curl -s http://localhost:5173 | head -c 100
# Expected: HTML output
# If fails → frontend not started or wrong port
```

## Decision Tree

```
User reports: "button doesn't work" or "typing doesn't send"
        |
        v
+-- Backend health check --+
|   curl /api/health       |
+-----------+--------------+
            |
      +-----+-----+
      |           |
   FAILS       WORKS
      |           |
      v           v
Backend bug   Frontend bug
(port/conflict) (event handler,
                state, closure)
```

## Common Frontend-Only Bugs (Backend Healthy)

### 1. React stale closure in `useCallback`
**Symptom:** Button works on first click, then stops. Or works in one mode (voice) but not another (chat).
**Root cause:** `useCallback` dependency array includes a state variable that changes frequently. The callback gets recreated, but child components or event listeners hold stale references.
**Fix:** Remove the state from deps, use functional updates:
```ts
// BAD
const handler = useCallback(() => {
  setItems([...items, newItem])  // uses stale `items`
}, [items])

// GOOD
const handler = useCallback(() => {
  setItems(prev => [...prev, newItem])  // always fresh
}, [])  // no items dependency
```

### 2. SpeechRecognition race condition
**Symptom:** "Start Listening" button works sometimes, not others. State appears stuck.
**Root cause:** `onend` fires asynchronously after `.stop()`, desyncing React state.
**Fix:** Try/catch around `.start()` with auto-restart on "already started" error. See `voice-ui` skill pitfalls.

### 3. Event handler not wired
**Symptom:** Click does nothing, no network request.
**Root cause:** `onClick` prop missing, or passed to wrong element, or conditional rendering hides the handler.
**Fix:** Check React DevTools or add `console.log` in the handler to verify it's called.

## Backend-Only Bugs (Frontend Healthy)

### 1. Port already in use
**Symptom:** `EADDRINUSE` error on startup.
**Fix:** `lsof -i :3001` to find the process, then `kill <pid>` or use a different port.

### 2. CORS blocked
**Symptom:** Frontend shows "Network Error" but backend logs show 200.
**Fix:** Add `cors` middleware to Express, or ensure Vite proxy is configured.

### 3. Proxy misconfiguration
**Symptom:** Frontend fetches return 404 or HTML instead of JSON.
**Fix:** Check `vite.config.ts` proxy target matches actual backend port:
```ts
proxy: {
  '/api': { target: 'http://localhost:3001', changeOrigin: true }
}
```

## Session Example: Iron Me Voice UI

**Reported:** "Start Listening sometimes works, chat typing doesn't type"

**Diagnostic:**
1. `curl /api/health` → ✅ `{"status":"online"}`
2. `curl /api/chat` → ✅ `{"reply":"..."}`
3. Backend healthy → frontend bug

**Investigation:**
- Read `useVoice.ts` → found `.start()` without try/catch, `onend` desync
- Read `App.tsx` → found `messages` in `useCallback` deps causing stale closure
- Read `ChatPanel.tsx` → confirmed `onSend` prop was wired correctly

**Fixes:**
- Added try/catch + auto-restart to SpeechRecognition
- Removed `messages` from `useCallback` deps, used functional state updates

**Result:** Both voice and chat modes work reliably.

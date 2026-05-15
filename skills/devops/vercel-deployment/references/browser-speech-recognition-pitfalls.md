# Browser Speech Recognition Pitfalls

Session: 2026-05-15 — Iron Me JARVIS Voice UI debugging

## Problem
Tapping "Start Listening" causes UI to flash but no speech is captured. The `webkitSpeechRecognition` API starts then immediately fires `onend`, creating a race condition.

## Root Causes & Fixes

### 1. Recognition already running
Calling `.start()` when recognition is already active throws `InvalidStateError`.

**Fix:** Wrap in try/catch, auto-restart if needed:
```ts
const startListening = () => {
  try {
    recognition.start()
  } catch {
    // Already started — stop then restart
    try {
      recognition.stop()
      setTimeout(() => recognition.start(), 100)
    } catch {
      // Give up
    }
  }
}
```

### 2. onend fires after manual stop
The `onend` handler was setting `isListening = false` even when the user intentionally stopped. This creates a race where:
1. User taps "Stop Listening" → calls `.stop()`
2. `onend` fires → sets `isListening = false` (correct)
3. But if `onend` fires from an error, it also sets `isListening = false` (incorrect — should show error)

**Fix:** Use a ref to track intentional state:
```ts
const isListeningRef = useRef(false)

rec.onstart = () => {
  isListeningRef.current = true
  setIsListening(true)
}

rec.onend = () => {
  // Only auto-restart if we WANT to be listening
  if (isListeningRef.current) {
    try { rec.start() } catch { isListeningRef.current = false }
  } else {
    setIsListening(false)
  }
}

const stopListening = () => {
  isListeningRef.current = false  // Signal intent BEFORE calling stop
  rec.stop()
}
```

### 3. No error visibility
Users see flashing UI with no feedback about why it failed.

**Fix:** Surface errors in UI:
```ts
rec.onerror = (e) => {
  if (e.error === 'not-allowed') {
    setError('Microphone permission denied')
  } else if (e.error === 'no-speech') {
    setError('No speech detected')
  } else {
    setError(`Speech error: ${e.error}`)
  }
  setIsListening(false)
}
```

### 4. Browser compatibility
- **Chrome/Edge:** Full support (requires HTTPS or localhost)
- **Safari:** No support — `webkitSpeechRecognition` is undefined
- **Firefox:** No native support (needs polyfill/extension)

**Fix:** Detect and show fallback:
```ts
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
if (!SpeechRecognition) {
  setError('Speech recognition not supported. Use Chrome or Edge.')
}
```

### 5. HTTPS requirement
SpeechRecognition only works on HTTPS (or localhost). On HTTP, it may silently fail.

## Complete working pattern

See `templates/useVoice.ts` for the full hook implementation used in Iron Me.

## Key insight
The `isListening` React state and the `recognition` object's internal state can desync. Always use a ref (`isListeningRef`) to track the *intended* state, separate from the UI state. The ref is the source of truth for whether to auto-restart on `onend`.

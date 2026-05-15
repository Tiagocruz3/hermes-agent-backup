# Voice Conversation Mode — Auto-Turn & Interrupt Pattern

Session: 2026-05-15 — Iron Me JARVIS live voice chat

## Problem
User wants a "live chat" experience like ElevenLabs Conversational AI: talk to the AI, it talks back, continuous back-and-forth without manual button presses between turns.

## Solution Architecture

```
[User speaks] → [STT] → [AI API] → [TTS] → [Plays audio]
                    ↑                           ↓
                    └──── [Auto-restart listening] ←─┘
```

## Implementation

### 1. State Machine

Four states: `idle` → `listening` → `thinking` → `speaking` → (auto) `listening`

```ts
type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'
```

### 2. Auto-Turn Effect

After TTS finishes speaking, automatically start listening again:

```ts
useEffect(() => {
  if (conversationMode && !isSpeaking && !isTyping && !isListening) {
    const timeout = setTimeout(() => startListening(), 800)
    return () => clearTimeout(timeout)
  }
}, [isSpeaking, isTyping, isListening, conversationMode, startListening])
```

**Why 800ms delay:** Gives user a moment to process the response before mic activates. Prevents accidental self-interruption from ambient noise.

### 3. Interrupt Handler

While AI is speaking, user can cut in:

```ts
const handleInterrupt = () => {
  stopSpeaking()           // Stop audio playback
  setTimeout(() => startListening(), 200)  // Brief gap before mic opens
}
```

**UI:** Show "Interrupt" button (pulsing red) only while `isSpeaking` is true.

### 4. Conversation Transcript

Show last N messages in voice mode so user can follow the thread:

```tsx
{conversationMode && messages.length > 0 && (
  <div className="conversation-transcript">
    {messages.slice(-4).map(msg => (
      <div key={msg.id}>
        <span className={msg.role === 'user' ? 'cyan' : 'green'}>
          {msg.role === 'user' ? 'YOU: ' : 'JARVIS: '}
        </span>
        {msg.content.slice(0, 60)}
      </div>
    ))}
  </div>
)}
```

### 5. Voice ID from Environment

Read ElevenLabs voice ID from build-time env var (not hardcoded):

```ts
const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'fallback-id'
```

And in `.env.production`:
```
VITE_ELEVENLABS_VOICE_ID=Q7IOSFX7VG3cnK4eU8Z4
```

## Key Pitfalls

### Interrupt race condition
If user interrupts while AI response is still being fetched (not yet speaking), you need to cancel the pending TTS:

```ts
const abortControllerRef = useRef<AbortController | null>(null)

// Before fetching TTS
abortControllerRef.current = new AbortController()

// On interrupt
abortControllerRef.current?.abort()
stopSpeaking()
startListening()
```

### Auto-turn loops infinitely
If STT immediately returns empty (silence/noise), you can get an infinite loop: listen → empty → auto-listen → empty...

**Fix:** Only auto-turn if the last turn produced actual content:

```ts
const hadContentRef = useRef(false)

// After getting transcript
hadContentRef.current = transcript.length > 0

// In auto-turn effect
if (conversationMode && !isSpeaking && !isListening && hadContentRef.current) {
  hadContentRef.current = false
  startListening()
}
```

### Browser STT + TTS conflict
Some browsers can't capture mic while playing audio. Test thoroughly on target devices.

**Workaround:** Use separate audio contexts or add a small gap between speaking and listening.

## UI Patterns

| State | Orb Color | Label | Buttons |
|-------|-----------|-------|---------|
| idle | Cyan | J.A.R.V.I.S. | Start Listening |
| listening | Bright cyan | LISTENING | Stop Listening |
| thinking | Orange | PROCESSING | — |
| speaking | Green | SPEAKING | Interrupt |

## Complete Hook Interface

```ts
interface UseVoiceReturn {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => Promise<void>
  stopSpeaking: () => void
}
```

See `templates/useVoice.ts` for full implementation with Safari fallback.

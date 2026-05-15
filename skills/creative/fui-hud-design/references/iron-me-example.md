# Iron Me — Reference Implementation

Real-world JARVIS-style voice assistant UI built for this user.

## Repo
https://github.com/Tiagocruz3/iron-me

## Key Files

| File | Purpose |
|------|---------|
| `src/components/VoiceCore.tsx` | Main HUD with 7 ring layers, corner widgets, dock |
| `src/components/StatusBar.tsx` | Top bar with J.A.R.V.I.S. label, time, mode toggle |
| `src/components/ChatPanel.tsx` | Text chat fallback |
| `src/components/NotificationStack.tsx` | Approval/info cards |
| `src/hooks/useVoice.ts` | ElevenLabs WebSocket TTS + Web Speech STT |
| `src/index.css` | Tailwind v4 theme, gradient border CSS, animations |

## Design Decisions

- **Corner widgets over side panels** — denser, more cinematic, matches reference images
- **Gradient border buttons** — purple `#9d50bb` → cyan `#00d2ff`, pill shape, glow shadow
- **Bottom nav dock** — 5 icons in glass pill, centered, always visible
- **Command text box** — above core, blinking cursor, V2.0 tag
- **Responsive breakpoints**:
  - `xl:` (1280px+) — show corner widgets
  - `lg:` — not used for widgets (prefer corners)
  - `sm:` — scale up text, core, buttons

## ElevenLabs Integration

Voice ID: `Q7IOSFX7VG3cnK4eU8Z4`
Model: `eleven_flash_v2_5`
WebSocket URL: `wss://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream-input?model_id=eleven_flash_v2_5`

Fallback: native `SpeechSynthesisUtterance` with rate 1.1, pitch 0.9

## Screenshots

- `screenshot-desktop-v2.png` — 1440x900 with all widgets
- `screenshot-mobile-v2.png` — 390x844 core + dock only

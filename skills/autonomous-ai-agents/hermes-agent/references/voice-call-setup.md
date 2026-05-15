# Voice call integration with Hermes Agent

## Architecture

Two modes for voice interaction:

| Mode | Transport | Latency | Setup |
|------|----------|---------|-------|
| **Voice messages** | Telegram voice notes to STT to agent to TTS | ~5-10s | Already working |
| **Live voice call** | Local mic/speakers to STT to agent to TTS | ~2-3s | Run script on desktop |

## Current config

STT: local faster-whisper (free). TTS: ElevenLabs voice_id Q7IOSFX7VG3cnK4e8U4Z.
Auto-TTS for Telegram voice replies is enabled (auto_tts: true).

## Live voice call script

At ~/.hermes/scripts/hermes-voice-call.py — creates a phone-call experience:

```
source ~/.hermes/voice-bridge/.venv/bin/activate
python3 ~/.hermes/scripts/hermes-voice-call.py
```

Records mic until silence, transcribes via faster-whisper, sends to Hermes API (port 8642), speaks via ElevenLabs TTS. Loops until Ctrl+C.

## Audio hardware limitation

Hermes terminal tool runs in a server context — cannot access mic/speakers. Voice scripts must run from the user's desktop terminal, not the agent terminal tool.

## Live Telegram voice chat (not yet possible on ARM64)

tgcalls/pytgcalls won't build on ARM64 (native WebRTC requires cmake, tgcalls native compilation fails). Telethon alone can register for calls but cannot stream audio without native bindings.

## Venv location

~/.hermes/voice-bridge/.venv/ — contains telethon, faster-whisper, pyaudio, numpy, requests.

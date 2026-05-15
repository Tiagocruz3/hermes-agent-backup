---
name: hermes-voice-call
description: "Real-time voice conversation with Hermes Agent — local mic → STT → agent → ElevenLabs TTS → speakers. Like a phone call."
version: 1.0.0
metadata:
  hermes:
    tags: [voice, call, stt, tts, elevenlabs, whisper, pyaudio, realtime]
---

# Hermes Live Voice Call

Real-time spoken conversation with Hermes Agent. Records from microphone, transcribes with local Whisper, sends to Hermes for response, speaks back via ElevenLabs TTS. Works like a phone call — no typing needed.

## Quick Start

```bash
cd ~/.hermes/voice-bridge && source .venv/bin/activate
python ~/.hermes/scripts/hermes-voice-call.py
```

Speak naturally. Agent listens after silence, responds with voice. `Ctrl+C` to hang up.

## How It Works

```
Microphone → PyAudio (record until silence)
    → faster-whisper (transcribe)
    → Hermes API :8642 (agent response)
    → ElevenLabs TTS (voice_id: Q7IOSFX7VG3cnK4e8U4Z)
    → ffplay (speakers)
    → Loop
```

## Dependencies

```bash
# Create venv with dependencies
mkdir -p ~/.hermes/voice-bridge && python3 -m venv ~/.hermes/voice-bridge/.venv
source ~/.hermes/voice-bridge/.venv/bin/activate
pip install pyaudio faster-whisper numpy requests
sudo apt-get install -y portaudio19-dev ffmpeg
```

## Configuration

| Setting | Value | Source |
|---------|-------|--------|
| ElevenLabs voice | `Q7IOSFX7VG3cnK4e8U4Z` | `~/.hermes/config.yaml` tts.elevenlabs.voice_id |
| ElevenLabs key | auto-detected | `~/.hermes/.env` ELEVENLABS_API_KEY |
| Whisper model | `base` | local faster-whisper |
| Agent model | `deepseek/deepseek-v4-pro` | OpenRouter |
| Sample rate | 16000 Hz | PyAudio mono |

## Pitfalls

### PyAudio fails to install (ARM64)
Use pip directly in the venv — the system apt package isn't accessible from venvs:
```bash
source .venv/bin/activate && pip install pyaudio
```
Requires `portaudio19-dev` via apt first.

### No microphone detected
Check devices: `python3 -c "import pyaudio; print(pyaudio.PyAudio().get_device_count())"`

### ElevenLabs key not found
The script reads from `~/.hermes/.env`. Ensure `ELEVENLABS_API_KEY=...` is present.

### Agent API not reachable
The script calls `http://127.0.0.1:8642/v1/chat/completions` — requires Hermes API running.

### Volume threshold issues
Adjust `SILENCE_THRESHOLD` in the script if the agent doesn't detect your speech or cuts off too early (default: 500).

## Telegram Voice Messages (alternative)

For Telegram-based voice interaction (simpler, no local setup):
- Send a voice message in Telegram chat
- Hermes transcribes it (STT: local whisper, already enabled)
- Replies with ElevenLabs voice (auto_tts: true, already enabled)

This is the "quick" voice mode — no local script needed.

## Script Location

`~/.hermes/scripts/hermes-voice-call.py` — the full voice call script. Run from the voice-bridge venv.
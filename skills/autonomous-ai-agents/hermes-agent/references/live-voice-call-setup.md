# Live Voice Call Setup

## Architecture

Live voice call with Hermes Agent using local microphone/speakers:
```
mic → faster-whisper (STT) → Hermes API → ElevenLabs TTS → speakers
```

Does NOT go through Telegram voice chat (tgcalls won't build on ARM64).

## Setup

```bash
# Create venv
mkdir -p ~/.hermes/voice-bridge
python3 -m venv ~/.hermes/voice-bridge/.venv
source ~/.hermes/voice-bridge/.venv/bin/activate
pip install faster-whisper numpy requests pyaudio
```

System deps: `sudo apt-get install -y python3-pyaudio portaudio19-dev cmake`

## ARM64 Blockers

- `tgcalls` (PyTgCalls native binding) requires CMake + tgcalls C++ build which fails on ARM64
- `pip install pytgcalls` fails with `ResolutionImpossible` — tgcalls wheel not available for linux/arm64
- Local voice loop works; Telegram voice chat native integration blocked

## Script

Located at: `~/.hermes/scripts/hermes-voice-call.py`

## Voice Messages (Telegram) — Working

- STT: local faster-whisper (`stt.provider: local`, model: base)
- TTS: ElevenLabs (`tts.provider: elevenlabs`, voice_id: Q7IOSFX7VG3cnK4e8U4Z)
- Auto-TTS enabled: `voice.auto_tts: true`
- User sends voice message → transcribed → agent responds via ElevenLabs voice
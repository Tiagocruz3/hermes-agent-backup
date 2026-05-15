# ElevenLabs Voice ID Troubleshooting

## When TTS fails with "voice_not_found"

Happens when the configured `voice_id` doesn't exist in the ElevenLabs account. Common causes:
- Voice ID copied from a different account
- Voice was deleted from ElevenLabs
- Default voice IDs from other installations don't carry over

## Fix: Query Available Voices

List all voices in the ElevenLabs account to find a valid ID:

```bash
curl -s "https://api.elevenlabs.io/v1/voices" \
  -H "xi-api-key: $(grep ELEVENLABS_API_KEY ~/.hermes/.env | cut -d= -f2)" | \
  python3 -c "
import json,sys
data=json.load(sys.stdin)
for v in data.get('voices',[])[:15]:
    print(f\"{v['voice_id']} | {v['name']} | {v.get('labels',{}).get('accent','')} | {v.get('labels',{}).get('gender','')}\")
"
```

## Find a Specific Voice by Name

```bash
curl -s "https://api.elevenlabs.io/v1/voices" \
  -H "xi-api-key: $(grep ELEVENLABS_API_KEY ~/.hermes/.env | cut -d= -f2)" | \
  python3 -c "
import json,sys
data=json.load(sys.stdin)
for v in data.get('voices',[]):
    if 'adam' in v['name'].lower():
        print(f\"{v['voice_id']} | {v['name']}\")
"
```

## Set Voice ID

```bash
hermes config set tts.elevenlabs.voice_id <voice_id>
```

Restart gateway after: `systemctl --user restart hermes-gateway`

## Known Voice IDs for This Account (as of 2026-05-03)

- `pNInz6obpgDQGcFmaJgB` — Adam (Dominant, Firm, male)
- `Q7IOSFX7VG3cnK4e8U4Z` — requested by user (verify it exists before using)
- `CwhRBWXzGAHq8TQ4Fs17` — Roger (Laid-Back, Casual, Resonant, male, american)
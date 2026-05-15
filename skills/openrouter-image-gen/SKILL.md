---
name: openrouter-image-gen
description: "Generate images via OpenRouter using Google Nano Banana 2 or Nano Banana Pro (Gemini 3 Pro Image). Avoids FAL.ai entirely."
version: 1.0.0
author: Hermes
---

# OpenRouter Image Generation

Generate high-quality AI images using OpenRouter's Gemini image models instead of FAL.ai.

## Models

| Alias | OpenRouter Model ID | Quality | Cost |
|-------|-------------------|---------|------|
| `nanobanana2` | `google/gemini-3.1-flash-image-preview` | Fast, great | ~$0.0035/img |
| `nanobananapro` | `google/gemini-3-pro-image-preview` | Pro-level (default) | ~$0.014/img |

## Usage

Call the script via terminal:
```bash
python3 ~/.hermes/scripts/openrouter_image_gen.py "PROMPT" --model nanobanana2 --aspect landscape
```

Aspect ratios: `landscape` (16:9), `square` (1:1), `portrait` (9:16)

When the user asks for images, use this script. Share the output via `MEDIA:<path>`.

The script auto-detects `OPENROUTER_API_KEY` from:
1. Environment variable
2. `~/.hermes/.env`
3. `~/.hermes/auth.json` credential pools

## Example Tool Call

```bash
python3 ~/.hermes/scripts/openrouter_image_gen.py "A dragon reading a book in a coffee shop" --model nanobanana2 --aspect square --json
```

Output saved to `~/.hermes/image_cache/` and returned as JSON with the file path.

## API Details (important)

OpenRouter's image generation uses the standard **chat completions** endpoint, not a separate image endpoint. The key difference:

**Request:**
```json
{
  "model": "google/gemini-3-pro-image-preview",
  "messages": [{"role": "user", "content": [{"type": "text", "text": "prompt"}]}],
  "modalities": ["image", "text"]
}
```

**Response — images are in `choices[0].message.images` NOT in `content`:**
```json
{
  "choices": [{
    "message": {
      "content": null,
      "images": [{"image_url": {"url": "data:image/png;base64,..."}}]
    }
  }]
}
```

The `content` field is `null` — all image output is in the `images` array as base64 data URIs. The model also returns encrypted reasoning metadata in `reasoning_details`.

## Image Cache

Images are saved to `~/.hermes/image_cache/openrouter-gen-{timestamp}.png`. Deliver to user with `MEDIA:~/.hermes/image_cache/openrouter-gen-{timestamp}.png`.

## Output Format

The script returns JSON when invoked with `--json`:
```json
{
  "success": true,
  "path": "/home/ace/.hermes/image_cache/openrouter-gen-1777853898.png",
  "model": "nanobananapro",
  "model_id": "google/gemini-3-pro-image-preview",
  "file": "MEDIA:/home/ace/.hermes/image_cache/openrouter-gen-1777853898.png",
  "estimated_cost": "$0.014",
  "usage": {"prompt_tokens": 48, "completion_tokens": 1468, "total_tokens": 1516}
}
```

## Pitfalls

- Requires `OPENROUTER_API_KEY` set in `~/.hermes/.env`
- Images are ~1.5-2.5MB PNG files (base64 decoded)
- Generation takes 8-20 seconds
- Nano Banana Pro (~$0.014/img) has better reasoning and text rendering than Nano Banana 2 (~$0.0035/img)
- The `content` field in the API response is `null` — images come through `message.images[]`
- FAL.ai is the DEFAULT Hermes image backend — OpenRouter is a custom alternative, not a config switch
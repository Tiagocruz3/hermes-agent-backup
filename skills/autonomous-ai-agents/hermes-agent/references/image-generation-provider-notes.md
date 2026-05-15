# Image generation provider notes (Hermes)

## Symptom: image generation tool errors with missing provider key

Example error:
- `ValueError: FAL_KEY environment variable not set`

This indicates the image generation tool is configured to use (or defaults to) **FAL** as the backend in this Hermes build.

## Key points

- The *chat model/provider* (e.g. OpenRouter model selection) is separate from the **image generation tool backend**.
- Setting a default LLM to an OpenRouter model does **not** automatically enable image generation unless Hermes is explicitly wired to an image-capable backend.

## Fast path to working image generation

1) Obtain a FAL key (https://fal.ai/) and set:
```env
FAL_KEY=...
```
inside `~/.hermes/.env` (or your active profile's `.env`).

2) Restart Hermes (gateway/CLI) to reload env.

## Alternative: OpenRouter image generation (Nano Banana 2 / Nano Banana Pro)

Hermes' built-in `image_gen` tool is **FAL-only**, but OpenRouter proxies Google's image generation models via the standard chat completions API. You can bypass FAL entirely with a custom script.

### Available models on OpenRouter

| Alias | OpenRouter model ID | Cost | Quality |
|-------|-------------------|------|---------|
| `nanobanana2` | `google/gemini-3.1-flash-image-preview` | ~$0.0035/img | Fast, great |
| `nanobananapro` | `google/gemini-3-pro-image-preview` | ~$0.014/img | Pro-level |

### API call format

Images come through the standard chat completions endpoint — add `"modalities": ["image", "text"]` to the request:

```json
{
  "model": "google/gemini-3.1-flash-image-preview",
  "messages": [{"role": "user", "content": [{"type": "text", "text": "..."}]}],
  "modalities": ["image", "text"]
}
```

### Response format

Generated images arrive in `choices[0].message.images[]` — an array of objects with base64 data URIs (NOT in `content`, which will be null):

```json
{
  "choices": [{
    "message": {
      "content": null,
      "images": [{
        "type": "image_url",
        "image_url": {"url": "data:image/png;base64,..."}
      }]
    }
  }]
}
```

### Custom script

A ready-to-run Python script is at `scripts/openrouter_image_gen.py`. Invoke via terminal:

```bash
# Nano Banana 2 (fast, cheap)
python3 ~/.hermes/scripts/openrouter_image_gen.py "prompt here" --model nanobanana2 --aspect landscape --json

# Nano Banana Pro (higher quality)
python3 ~/.hermes/scripts/openrouter_image_gen.py "prompt here" --model nanobananapro --aspect square --json
```

The script reads `OPENROUTER_API_KEY` from `~/.hermes/.env` or `auth.json`, calls OpenRouter, decodes the base64 response, and saves to `~/.hermes/image_cache/`. Returns JSON with `path`, `file` (MEDIA: format), and `usage` fields.

### Verification

- `~/.hermes/logs/gateway.log` for image tool errors

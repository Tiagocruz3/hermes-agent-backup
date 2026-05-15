#!/usr/bin/env python3
"""
OpenRouter Image Generation Tool
Uses google/gemini-3.1-flash-image-preview (Nano Banana 2) or
google/gemini-3-pro-image-preview (Nano Banana Pro) via OpenRouter.
"""
import os, sys, json, base64, argparse, time
import urllib.request

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

MODELS = {
    "nanobanana2": "google/gemini-3.1-flash-image-preview",
    "nanobananapro": "google/gemini-3-pro-image-preview",
}

ASPECT_RATIOS = {
    "landscape": "16:9",
    "square": "1:1",
    "portrait": "9:16",
}

def get_api_key():
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if key:
        return key
    
    env_path = os.path.expanduser("~/.hermes/.env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("OPENROUTER_API_KEY="):
                    return line.split("=", 1)[1].strip('"').strip("'")
    
    # Try cred pools
    auth_path = os.path.expanduser("~/.hermes/auth.json")
    if os.path.exists(auth_path):
        with open(auth_path) as f:
            auth = json.load(f)
            pools = auth.get("credential_pools", {})
            openrouter = pools.get("openrouter", [])
            if openrouter:
                return openrouter[0].get("key", "")
    
    raise ValueError("OPENROUTER_API_KEY not found in env, .env, or auth.json")

def generate_image(prompt, model="nanobanana2", aspect_ratio="landscape"):
    model_id = MODELS.get(model, MODELS["nanobanana2"])
    aspect = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["landscape"])
    api_key = get_api_key()
    
    full_prompt = f"{prompt}. Generate as high-quality {aspect_ratio} image."
    
    payload = {
        "model": model_id,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": full_prompt}
                ]
            }
        ],
        "modalities": ["image", "text"]
    }
    
    req = urllib.request.Request(
        OPENROUTER_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
    )
    
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    
    if "error" in data:
        raise RuntimeError(f"API Error: {data['error']}")
    
    msg = data["choices"][0]["message"]
    images = msg.get("images", [])
    
    if not images:
        raise RuntimeError("No images in response")
    
    # Save the first image
    img = images[0]
    url = img["image_url"]["url"]
    
    if url.startswith("data:"):
        b64 = url.split(",", 1)[1]
        cache_dir = os.path.expanduser("~/.hermes/image_cache")
        os.makedirs(cache_dir, exist_ok=True)
        timestamp = int(time.time())
        fname = f"openrouter-gen-{timestamp}.png"
        fpath = os.path.join(cache_dir, fname)
        
        with open(fpath, "wb") as f:
            f.write(base64.b64decode(b64))
        
        cost = {
            "nanobanana2": "$0.0005 + $0.003/img = ~$0.0035",
            "nanobananapro": "$0.002 + $0.012/img = ~$0.014",
        }
        
        return {
            "success": True,
            "path": fpath,
            "model": model,
            "model_id": model_id,
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "file": f"MEDIA:{fpath}",
            "estimated_cost": cost.get(model, "unknown"),
            "usage": {
                "prompt_tokens": data["usage"]["prompt_tokens"],
                "completion_tokens": data["usage"]["completion_tokens"],
                "total_tokens": data["usage"]["total_tokens"],
            }
        }
    else:
        return {
            "success": True,
            "url": url,
            "model": model,
            "prompt": prompt,
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OpenRouter Image Generation")
    parser.add_argument("prompt", help="Image description")
    parser.add_argument("--model", default="nanobanana2", choices=["nanobanana2", "nanobananapro"])
    parser.add_argument("--aspect", default="landscape", choices=["landscape", "square", "portrait"])
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()
    
    result = generate_image(args.prompt, args.model, args.aspect)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"OK: {result['path']}")
    sys.exit(0)

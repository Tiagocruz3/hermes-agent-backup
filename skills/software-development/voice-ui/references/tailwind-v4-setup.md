# Tailwind CSS v4 + Vite + React Setup

Tailwind CSS v4 changes the integration pattern from v3. This reference covers the correct setup for a Vite + React + TypeScript project.

## Installation

```bash
npm install tailwindcss @tailwindcss/vite
```

## Vite Config

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()], // tailwindcss AFTER react
  server: { port: 5173, host: true },
})
```

**Plugin order matters:** `@tailwindcss/vite` must come AFTER `@vitejs/plugin-react` to avoid HMR issues.

## CSS Entry File

```css
@import "tailwindcss";

@theme {
  --color-hud-bg: #050a14;
  --color-hud-panel: #0a1525;
  --color-hud-border: #1a3a5c;
  --color-hud-glow: #00d4ff;
  --color-hud-glow-dim: #0088aa;
  --color-hud-text: #e0f7ff;
  --color-hud-text-dim: #7a9aaa;
  --color-hud-urgent: #ff4444;
  --color-hud-warn: #ffaa00;
  --color-hud-success: #00ff88;
}

/* Custom animations */
@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

**Key differences from v3:**
- No `@tailwind base/components/utilities` directives
- No `tailwind.config.js` needed for basic theming
- `@theme` block defines CSS custom properties
- `@import "tailwindcss"` brings in everything

## TypeScript Config

Disable strict unused checks for rapid iteration:

```json
{
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

This prevents build failures when you're prototyping and have temporary unused variables.

## Pitfalls

### `@tailwind` directives don't exist in v4
Using `@tailwind base; @tailwind components; @tailwind utilities;` causes a build error. Use `@import "tailwindcss"` instead.

### Missing `@tailwindcss/vite` plugin
If you only install `tailwindcss` without `@tailwindcss/vite`, Vite won't process Tailwind and your styles won't apply. No error — just missing styles.

### Conflicting with Vite's CSS handling
If you have existing CSS imports that conflict with Tailwind's reset, load order matters. Import Tailwind first in your entry CSS file.

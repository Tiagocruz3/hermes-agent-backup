---
name: fui-hud-design
description: Build futuristic HUD / FUI (Fictional User Interface) interfaces — Iron Man JARVIS style, sci-fi control panels, heads-up displays.
version: 1.0.0
author: ace
license: MIT
tags: [fui, hud, sci-fi, jarvis, iron-man, dashboard, creative, ui, react, svg]
triggers:
  - build a jarvis ui
  - iron man interface
  - sci-fi hud
  - futuristic dashboard
  - heads up display
  - fui design
  - holographic interface
  - arc reactor ui
---

# FUI / HUD Design

Build futuristic fictional user interfaces (FUI) — Iron Man JARVIS style, sci-fi control panels,
heads-up displays (HUD), holographic UIs. These are dark-themed, cyan-glowing, circular-HUD
interfaces with concentric rings, tick marks, bracket corners, and animated segments.

## Related skills

- **`claude-design`** — general design process, verification, artifact creation
- **`popular-web-designs`** — real design systems for when the FUI needs to feel grounded

## Core Design System

### Color Palette

```css
:root {
  --fui-bg: #05050a;
  --fui-bg-center: #0a1525;
  --fui-cyan: #00d2ff;
  --fui-cyan-dim: #0088aa;
  --fui-cyan-glow: #7df9ff;
  --fui-purple: #9d50bb;
  --fui-panel: rgba(20, 20, 30, 0.85);
  --fui-border: rgba(0, 210, 255, 0.25);
  --fui-text: #ffffff;
  --fui-text-dim: #7a9aaa;
  --fui-urgent: #ff4444;
  --fui-warn: #ffaa00;
  --fui-success: #00ff88;
}
```

Background: radial gradient from `#0a1525` center to `#05050a` edges.
Add purple accent `#9d50bb` for gradient borders and secondary glows.

### Typography

- Font: `'Segoe UI', 'Eurostile', 'Microgramma', 'Orbitron', system-ui, sans-serif`
- Tracking: `letter-spacing: 0.05em` minimum, `0.25em` for labels, `0.3em` for titles
- JARVIS-style text: periods between letters — `J.A.R.V.I.S.`
- All caps for labels, light weight, wide tracking
- Version tags: small `V2.0` style markers in top-right of panels

### Glow Effects

Every element gets an outer glow using:
- `filter: drop-shadow(0 0 8px var(--fui-cyan))`
- `box-shadow: 0 0 30px rgba(0,255,255,0.3), inset 0 0 20px rgba(0,255,255,0.2)`
- Opacity ranges: 60-90% for holographic feel
- Blend mode: screen/additive where possible

## Gradient Border Buttons

Pill-shaped buttons with purple-to-cyan gradient borders:

```css
.gradient-border {
  position: relative;
  background: rgba(10, 10, 20, 0.9);
  border-radius: 50px;
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50px;
  padding: 2px;
  background: linear-gradient(90deg, #9d50bb, #00d2ff);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.gradient-border-glow {
  box-shadow: 0 0 15px rgba(157, 80, 187, 0.3), 0 0 30px rgba(0, 210, 255, 0.2);
}
```

Use for primary actions: "Start Listening", "All Commands", etc.

## HUD Ring Architecture (5+ Layers)

Build from outside in:

1. **Outer Glow Halo** — large soft radial gradient behind all rings, pulses on active state
2. **Perimeter Ring** — thin dashed circle, `stroke-dasharray="4 8 2 12"`, slow rotation (60s)
3. **Bracket Corners** — four L-shaped brackets at top/bottom/left/right, static
4. **Thick Dark Ring with Cyan Segments** — outer frame ring (8px stroke), 12 cyan arc segments on top
5. **Tick Mark Ring** — solid circle with 48 tick marks, longer every 6th. Rotating dash segment.
6. **Inner Dashed Ring** — `stroke-dasharray="3 9"`, faster rotation (20s), smaller dash segments
7. **Core Orb** — thick ring with 16 waveform notches, glow pulse, center text

Right side: 5 hollow rectangle indicators (signal/battery style).

### SVG Construction Tips

- Use `viewBox="0 0 200 200"` on all SVGs for consistent scaling
- Position rings with percentage insets: `inset-[8%]`, `inset-[16%]`, etc.
- Rotate via CSS `transform-origin: 100px 100px` (center of viewBox)
- Use `stroke-linecap: butt` for mechanical digital aesthetic

## Responsive Behavior

```
Breakpoint strategy:
- Mobile (<640px):      Core only, no corner widgets, compact dock
- Tablet (640-1280px):  Core + dock, no corner widgets
- Desktop (>1280px):    Core + dock + corner widgets (xl:)
- Large desktop (>1536): Core + dock + all widgets visible
```

Core sizing:
```
Mobile:  w-[260px] h-[260px]
Tablet:  w-[320px] h-[320px]
Desktop: w-[400px] h-[400px]
```
## State Colors

| State | Color | Glow |
|-------|-------|------|
| idle | `#0088AA` | `rgba(0,136,170,0.3)` |
| listening | `#00FFFF` | `rgba(0,255,255,0.5)` |
| speaking | `#00FF88` | `rgba(0,255,136,0.5)` |
| thinking | `#FFAA00` | `rgba(255,170,0,0.5)` |
| urgent | `#FF4444` | `rgba(255,68,68,0.5)` |

## Desktop Corner Widgets

On `xl:` breakpoint, add four corner info panels around the central HUD:

### Top-Left: System Status
- RAM Usage bar (e.g. 52%) with gradient fill
- Internet status (Connected / Disconnected)
- Ping ms bar
- Oscilloscope-style line graph at bottom (SVG path with stepped waveform)
- Glassmorphism container: `bg-jarvis-panel/90 backdrop-blur-xl border border-jarvis-border/50 rounded-2xl`

### Top-Right: Weather
- Temperature with thermometer icon
- Condition (clouds, rain, etc.)
- Humidity % with droplet icon
- Wind speed with wind icon
- Minimalist line-art icons, colored per metric

### Bottom-Left: Battery
- "Battery" label + "Fully Charged" status
- Large percentage text (e.g. "100%")
- Thick pill-shaped gradient bar (blue → cyan)

### Bottom-Right: Earth + Radar
- **Earth widget**: glowing blue sphere with continent line paths, circular halo border
- **Voice Signal Radar**: concentric circles (20%, 40%, 60%), crosshairs, colored blip dots (cyan, green, amber), rotating sweep line via `conic-gradient` animation

All widgets: `w-52` to `w-56`, consistent glassmorphism styling.

## Desktop Side Panels

On `lg:` breakpoint, add flanking info panels:

**Left panel** (system stats):
- CPU / Memory / Network bars
- Label + value + 8-segment horizontal bar
- Border-left accent in cyan

**Right panel** (system log):
- Terminal-style log output
- `> System initialized` style entries
- Border-right accent in cyan
- Monospace font for log lines

Note: Corner widgets (xl) and side panels (lg) are mutually exclusive — use one or the other depending on layout density preference.

## Bottom Navigation Dock

Centered pill-shaped dock at bottom of screen:

```
Container: bg-panel/90 backdrop-blur-xl border border-border/50 rounded-full px-4 py-2.5
Icons: 5 items, evenly spaced, 20px gap
  - Calendar
  - Clock
  - Battery (with lightning bolt)
  - Cloud (weather)
  - Power
```

Icon style: outline stroke, 1.5px width, cyan color at 60% opacity, glow on hover.
Active state: `bg-cyan/10` background, full cyan color.

## Command Text Box

Centered above the HUD core:

```
Container: bg-panel/80 border border-border rounded-xl px-4 py-2
Content: "Comands, {transcript}" + blinking cursor + "V2.0" tag
Cursor: w-0.5 h-4 bg-cyan, opacity pulse animation
Version tag: text-[10px] text-dim/50, right-aligned
Min-width: 280px mobile, 360px desktop
```

## Animations

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 8px var(--fui-cyan)); }
  50% { opacity: 1; filter: drop-shadow(0 0 20px var(--fui-cyan)); }
}

@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes spin-slow-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
@keyframes flicker { 0%,100%{opacity:0.8} 50%{opacity:1} 75%{opacity:0.6} }
@keyframes radar-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
```

- Rings rotate at different speeds and directions
- Core orb pulses scale on active states
- Waveform bars animate height when listening/speaking (20 bars, 0.35s cycle)
- Radar sweep: `conic-gradient` rotating 360° over 3s
- Right-side hollow rectangles pulse opacity staggered (0.1s delay each)
- Title text opacity pulse: 3s cycle

## Scanline Overlay

Add CRT-style scanlines:

```css
.scanline::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0, 212, 255, 0.03) 2px,
    rgba(0, 212, 255, 0.03) 4px
  );
  pointer-events: none;
  z-index: 10;
}
```

## State Colors

| State | Color | Glow |
|-------|-------|------|
| idle | `#0088AA` | `rgba(0,136,170,0.3)` |
| listening | `#00FFFF` | `rgba(0,255,255,0.5)` |
| speaking | `#00FF88` | `rgba(0,255,136,0.5)` |
| thinking | `#FFAA00` | `rgba(255,170,0,0.5)` |
| urgent | `#FF4444` | `rgba(255,68,68,0.5)` |

## Touchscreen Optimization

- `touch-action: manipulation`
- `-webkit-tap-highlight-color: transparent`
- Minimum tap target: 44px
- `user-scalable=no` in viewport meta
- `active:scale-95` for tactile feedback
- Large core orb for easy tapping

## Tech Stack

- **Vite + React + TypeScript** — fast dev, type safety
- **Tailwind CSS v4** — `@import "tailwindcss"` + `@theme` blocks
- **Framer Motion** — ring rotations, pulse animations, transitions
- **SVG** — all ring geometry (no images), custom inline SVG icons for dock
- **Web Speech API** — browser STT
- **ElevenLabs WebSocket** — streaming TTS

For dock icons, use inline SVG components (not Lucide) to match the exact
outline style: `stroke="currentColor" strokeWidth="1.5"`, no fill.

## Build Verification

1. `npm run build` — must pass TypeScript + Vite
2. Screenshot at 1440x900 (desktop) and 390x844 (mobile)
3. Check all rings render, no console errors
4. Verify tap targets on mobile viewport

## Pitfalls

- Do NOT use `noUnusedLocals: true` in tsconfig — Framer Motion props often trigger this
- Tailwind v4 uses `@theme` not `tailwind.config.js` — use CSS custom properties
- SVG `stroke-dasharray` values are in user units (0-200 for viewBox), not pixels
- Web Speech API requires HTTPS or localhost in production
- ElevenLabs WebSocket needs AudioContext resume on user gesture
- Mobile: hide corner widgets (`hidden xl:flex`), show only core HUD + dock
- Desktop: show corner widgets, larger core
- Gradient border buttons: use `::before` pseudo-element with `-webkit-mask-composite: xor` technique — `border-image` does not support rounded corners
- Inline SVG icons for dock: match stroke width and style exactly or the dock looks inconsistent
- Command text box needs `min-width` to prevent truncation on mobile
- Title text may truncate on mobile narrow viewports — use responsive text scaling
- Earth widget: continent paths should be subtle (opacity 0.4-0.6) to not compete with core HUD
- Radar sweep: use `conic-gradient` on a rotating div, not SVG animation, for better performance

# Responsive JARVIS Layout Strategy

This reference covers the responsive layout pattern used for the Iron Me / J.A.R.V.I.S. voice UI — a HUD-style interface that adapts from mobile (phone) to desktop (monitor/car display).

## Breakpoint Strategy

| Breakpoint | Tailwind | What Shows |
|-----------|----------|-----------|
| Mobile | default (< 640px) | Centered HUD only, bottom nav dock |
| Tablet | sm: (640px+) | Slightly larger core, same layout |
| Desktop | xl: (1280px+) | Corner widgets + center HUD + bottom dock |
| Wide | lg: (1024px+) | Core scales to 380px |

## Mobile Layout (< 640px)

```
┌─────────────────────────┐
│  ● J.A.R.V.I.S.   9:54  │  ← Status bar
├─────────────────────────┤
│                         │
│   JARVIS Voice Assistant│  ← Title
│   [Comands, ...    V2.0]│  ← Command box
│   [All Cmds] [Start]    │  ← Buttons
│                         │
│        ╭─────╮          │
│       ╱  HUD  ╲         │  ← Core (240px)
│       ╲───────╱         │
│                         │
│   SAY 'HELLO JARVIS'    │
│                         │
│    ○ ○ ○ ○ ○            │  ← Bottom dock
└─────────────────────────┘
```

**Key decisions:**
- No side widgets — screen too narrow
- Core is 240px (small but tappable)
- Bottom nav dock stays (5 icons in pill)
- Buttons stack horizontally with gap-3

## Desktop Layout (1280px+)

```
┌─────────────────────────────────────────────────────┐
│  ● J.A.R.V.I.S.        9:54 AM        [💬]         │
├──────────┬──────────────────────────┬──────────────┤
│ SYSTEM   │                          │  25.05°C     │
│ STATUS   │   JARVIS Voice Assistant │  scattered   │
│ RAM 52%  │   [Comands, ...    V2.0] │  clouds      │
│ Net ✓    │   [All Cmds] [Start]     │  85% humidity│
│ Ping 65ms│                          │  2.32 m/s    │
│ ~~~~     │        ╭─────╮           │              │
│ Battery  │       ╱  HUD  ╲          │    Earth     │
│ 100%     │       ╲───────╱          │    Radar     │
│ ████████ │                          │              │
├──────────┴──────────────────────────┴──────────────┤
│              ○ ○ ○ ○ ○  (bottom dock)              │
└─────────────────────────────────────────────────────┘
```

**Key decisions:**
- 4 corner widgets visible (`hidden xl:flex`)
- Core scales to 380px
- Widgets use `absolute` positioning with `top-16 left-4` etc.
- Bottom dock centered at bottom

## Implementation Pattern

```tsx
// In VoiceCore component:
<div className="h-full w-full flex flex-col items-center justify-center relative">
  {/* Desktop corner widgets — hidden on mobile */}
  <div className="hidden xl:flex absolute top-16 left-4 flex-col gap-3">
    <SystemStatusPanel />
  </div>
  <div className="hidden xl:flex absolute top-16 right-4 flex-col gap-3">
    <WeatherWidget />
  </div>
  <div className="hidden xl:flex absolute bottom-20 left-4 flex-col gap-3">
    <BatteryWidget />
  </div>
  <div className="hidden xl:flex absolute bottom-20 right-4 flex-col gap-3">
    <EarthWidget />
    <RadarWidget />
  </div>

  {/* Center content — always visible */}
  <div className="text-center mb-2 z-10">
    <h1 className="text-base sm:text-lg lg:text-xl">JARVIS Voice Assistant</h1>
  </div>

  {/* Core — responsive sizing */}
  <div className="relative w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] lg:w-[380px] lg:h-[380px]">
    {/* ...rings, core, etc... */}
  </div>

  {/* Bottom dock — always visible */}
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
    <div className="flex items-center gap-1 sm:gap-2 bg-panel/90 rounded-full px-3 py-2">
      {/* ...5 icons... */}
    </div>
  </div>
</div>
```

## Core Size Scaling

```tsx
// Container div uses responsive classes:
<div className="relative w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] lg:w-[380px] lg:h-[380px]">
```

| Viewport | Size | Use Case |
|----------|------|----------|
| default | 240px | Phone portrait |
| sm: | 300px | Phone landscape / small tablet |
| lg: | 380px | Tablet / desktop |

All inner SVG elements use `viewBox` so they scale proportionally within the container.

## Widget Component Pattern

Each widget is a self-contained card:
```tsx
function SystemStatusPanel() {
  return (
    <div className="bg-panel/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 w-56">
      <span className="text-[10px] tracking-[0.2em] text-dim/60 block mb-3">SYSTEM STATUS</span>
      {/* ...content... */}
    </div>
  );
}
```

**Design tokens:**
- `bg-panel/90` — semi-transparent dark background
- `backdrop-blur-xl` — glassmorphism effect
- `border-border/50` — subtle cyan border
- `rounded-2xl` — consistent corner radius
- `w-56` / `w-52` / `w-40` — fixed widths per widget type
- `text-[10px]` — small label text with wide tracking

## Bottom Nav Dock

```tsx
<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
  <div className="flex items-center gap-1 sm:gap-2 bg-panel/90 backdrop-blur-xl border border-border/50 rounded-full px-3 py-2 sm:px-4 sm:py-2.5">
    {icons.map(icon => (
      <button className="p-2 rounded-full text-cyan/60 hover:text-cyan hover:bg-cyan/10 transition">
        <Icon className="w-4 h-4" />
      </button>
    ))}
  </div>
</div>
```

- Always visible (not hidden on mobile)
- Icon size: `w-4 h-4` mobile, can scale to `w-5 h-5` on desktop
- Padding scales: `px-3 py-2` mobile → `px-4 sm:py-2.5` desktop
- `z-20` ensures it's above other absolute-positioned elements

## Pitfalls

### Widgets overlap on medium screens
At 1024px–1280px (lg but not xl), widgets may overlap the core if not careful. The `xl:` breakpoint (1280px) is the safe threshold for 4 widgets + core.

### Absolute positioning without `inset-0` parent
Corner widgets use `absolute` positioning relative to the flex container. Ensure the parent has `relative` or the widgets will position relative to viewport.

### Mobile touch targets too small
Bottom dock icons are 32px tap targets (p-2 = 8px padding + 16px icon). This meets the 44px minimum when including the touch area. For critical actions, increase to `p-3` (48px target).

### Scanline overlay blocks interactions
If using `scanline::after` pseudo-element for CRT effect, add `pointer-events: none` so it doesn't block taps on the core or buttons.

## Testing Viewports

Use Chromium headless to screenshot both viewports:
```bash
# Mobile
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/mobile.png --window-size=390,844 \
  --virtual-time-budget=3000 http://localhost:3456

# Desktop
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/desktop.png --window-size=1440,900 \
  --virtual-time-budget=3000 http://localhost:3456
```

// Desktop corner widgets for JARVIS-style HUD interface
// Shows on xl breakpoint and up, hidden on mobile/tablet

// System Status Panel (top-left)
function SystemStatusPanel() {
  return (
    <div className="bg-jarvis-panel/90 backdrop-blur-xl border border-jarvis-border/50 rounded-2xl p-4 w-56">
      <span className="text-[10px] tracking-[0.2em] text-jarvis-text-dim/60 block mb-3">
        SYSTEM STATUS
      </span>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-jarvis-text-dim">RAM Usage</span>
            <span className="text-jarvis-cyan font-mono">52%</span>
          </div>
          <div className="h-1.5 bg-jarvis-bg rounded-full overflow-hidden">
            <div className="h-full w-[52%] bg-gradient-to-r from-jarvis-purple to-jarvis-cyan rounded-full" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-jarvis-text-dim">Internet</span>
            <span className="text-jarvis-success font-mono">Connected</span>
          </div>
          <div className="h-1.5 bg-jarvis-bg rounded-full overflow-hidden">
            <div className="h-full w-full bg-jarvis-cyan rounded-full" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-jarvis-text-dim">Ping</span>
            <span className="text-jarvis-cyan font-mono">65 ms</span>
          </div>
          <div className="h-1.5 bg-jarvis-bg rounded-full overflow-hidden">
            <div className="h-full w-[30%] bg-jarvis-cyan/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Oscilloscope graph */}
      <div className="mt-3 h-16 border border-jarvis-border/30 rounded-lg relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <path
            d="M0 30 L10 25 L20 35 L30 20 L40 40 L50 15 L60 35 L70 25 L80 30 L90 20 L100 35 L110 25 L120 30 L130 20 L140 35 L150 25 L160 30 L170 20 L180 35 L190 25 L200 30"
            fill="none"
            stroke="#00d2ff"
            strokeWidth="1"
            opacity="0.6"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}

// Weather Widget (top-right)
function WeatherWidget() {
  return (
    <div className="bg-jarvis-panel/90 backdrop-blur-xl border border-jarvis-border/50 rounded-2xl p-4 w-52">
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <ThermometerIcon className="w-4 h-4 text-jarvis-warn" />
          <span className="text-xs text-jarvis-text">25.05°C</span>
        </div>
        <div className="flex items-center gap-2">
          <CloudIcon className="w-4 h-4 text-jarvis-text-dim" />
          <span className="text-xs text-jarvis-text-dim">scattered clouds</span>
        </div>
        <div className="flex items-center gap-2">
          <DropletIcon className="w-4 h-4 text-jarvis-cyan" />
          <span className="text-xs text-jarvis-text-dim">85%</span>
        </div>
        <div className="flex items-center gap-2">
          <WindIcon className="w-4 h-4 text-jarvis-success" />
          <span className="text-xs text-jarvis-text-dim">2.32 m/s</span>
        </div>
      </div>
    </div>
  );
}

// Battery Widget (bottom-left)
function BatteryWidget() {
  return (
    <div className="bg-jarvis-panel/90 backdrop-blur-xl border border-jarvis-border/50 rounded-2xl p-4 w-52">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] tracking-[0.15em] text-jarvis-text-dim">Battery</span>
        <span className="text-[10px] text-jarvis-success">Fully Charged</span>
      </div>
      <div className="text-2xl font-light text-white mb-2">100%</div>
      <div className="h-3 bg-jarvis-bg rounded-full overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-blue-600 to-jarvis-cyan rounded-full" />
      </div>
    </div>
  );
}

// Earth Globe Widget (bottom-right)
function EarthWidget() {
  return (
    <div className="bg-jarvis-panel/90 backdrop-blur-xl border border-jarvis-border/50 rounded-2xl p-3 w-40 flex flex-col items-center">
      <span className="text-[10px] tracking-[0.15em] text-jarvis-text-dim mb-2">Earth</span>
      <div className="w-24 h-24 rounded-full relative overflow-hidden">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 opacity-80" />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <path d="M20 50 Q30 30 50 35 T80 50 Q70 70 50 65 T20 50" fill="none" stroke="#00d2ff" strokeWidth="0.8" opacity="0.6" />
          <path d="M15 40 Q25 25 45 30" fill="none" stroke="#00d2ff" strokeWidth="0.6" opacity="0.4" />
          <path d="M55 60 Q70 75 85 65" fill="none" stroke="#00d2ff" strokeWidth="0.6" opacity="0.4" />
        </svg>
        <div className="absolute inset-0 rounded-full border-2 border-jarvis-cyan/30" />
      </div>
    </div>
  );
}

// Voice Signal Radar (bottom-right)
function RadarWidget({ color }: { color: string }) {
  return (
    <div className="bg-jarvis-panel/90 backdrop-blur-xl border border-jarvis-border/50 rounded-2xl p-3 w-40 flex flex-col items-center">
      <span className="text-[10px] tracking-[0.15em] text-jarvis-text-dim mb-2">Voice Signal Radar</span>
      <div className="w-24 h-24 rounded-full relative overflow-hidden border border-jarvis-border/50">
        <div className="absolute inset-0 rounded-full border border-jarvis-border/30" />
        <div className="absolute inset-[20%] rounded-full border border-jarvis-border/20" />
        <div className="absolute inset-[40%] rounded-full border border-jarvis-border/15" />
        <div className="absolute inset-[60%] rounded-full border border-jarvis-border/10" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-jarvis-border/20" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-jarvis-border/20" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-jarvis-cyan top-[30%] left-[40%] animate-pulse" />
        <div className="absolute w-1 h-1 rounded-full bg-jarvis-success top-[60%] left-[65%] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-jarvis-warn top-[45%] left-[25%] animate-pulse" style={{ animationDelay: '1s' }} />
        <motion.div
          className="absolute inset-0"
          style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${color}20 30deg, transparent 60deg)` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

// Bottom nav dock (centered, all screen sizes)
function BottomNavDock() {
  const items = [
    { icon: CalendarIcon, label: 'Calendar' },
    { icon: ClockIcon, label: 'Clock' },
    { icon: BatteryIcon, label: 'Battery' },
    { icon: CloudIcon, label: 'Weather' },
    { icon: PowerIcon, label: 'Power' },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1 sm:gap-2 bg-jarvis-panel/90 backdrop-blur-xl border border-jarvis-border/50 rounded-full px-3 py-2">
        {items.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="p-2 rounded-full text-jarvis-cyan/60 hover:text-jarvis-cyan hover:bg-jarvis-cyan/10 transition active:scale-90"
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Responsive layout pattern:
// - Widgets use `hidden xl:flex` to show only on desktop (1280px+)
// - Core HUD scales: 240px mobile → 300px tablet → 380px desktop
// - Bottom nav dock visible on all sizes
// - Status bar adapts text sizes via sm: breakpoints

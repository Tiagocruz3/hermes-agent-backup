import { motion } from 'framer-motion'

interface VoiceCoreProps {
  isListening: boolean
  isSpeaking: boolean
  isTyping: boolean
  transcript: string
  onTap: () => void
}

export function VoiceCore({ isListening, isSpeaking, isTyping, transcript, onTap }: VoiceCoreProps) {
  const state = isListening ? 'listening' : isSpeaking ? 'speaking' : isTyping ? 'thinking' : 'idle'

  const colors = {
    idle: '#0088AA',
    listening: '#00FFFF',
    speaking: '#00FF88',
    thinking: '#FFAA00',
  }

  const glowColors = {
    idle: 'rgba(0, 136, 170, 0.3)',
    listening: 'rgba(0, 255, 255, 0.5)',
    speaking: 'rgba(0, 255, 136, 0.5)',
    thinking: 'rgba(255, 170, 0, 0.5)',
  }

  const c = colors[state]
  const g = glowColors[state]

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative scanline">
      {/* Ambient radial glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(circle at center, ${g} 0%, transparent 60%)` }}
        transition={{ duration: 1.5 }}
      />

      {/* Desktop side panels */}
      <div className="hidden lg:flex absolute inset-y-0 left-0 w-64 flex-col justify-center gap-6 px-6">
        <SystemPanel label="CPU" value="12%" bars={3} color={c} />
        <SystemPanel label="MEMORY" value="4.2GB" bars={5} color={c} />
        <SystemPanel label="NETWORK" value="ONLINE" bars={4} color={c} />
      </div>
      <div className="hidden lg:flex absolute inset-y-0 right-0 w-64 flex-col justify-center gap-6 px-6">
        <LogPanel color={c} />
      </div>

      {/* Main HUD */}
      <div className="relative flex items-center justify-center" onClick={onTap}>
        <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[480px] lg:h-[480px]">

          {/* Outer perimeter ring */}
          <motion.svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <motion.circle cx="100" cy="100" r="95" fill="none" stroke={c} strokeWidth="0.5"
              strokeDasharray="4 8 2 12" opacity={0.4}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '100px 100px' }}
            />
          </motion.svg>

          {/* Bracket corners */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <path d="M 70 10 L 70 18 L 130 18 L 130 10" fill="none" stroke={c} strokeWidth="1.5" opacity={0.7} />
            <path d="M 70 190 L 70 182 L 130 182 L 130 190" fill="none" stroke={c} strokeWidth="1.5" opacity={0.7} />
            <path d="M 10 70 L 18 70 L 18 130 L 10 130" fill="none" stroke={c} strokeWidth="1.5" opacity={0.7} />
            <path d="M 190 70 L 182 70 L 182 130 L 190 130" fill="none" stroke={c} strokeWidth="1.5" opacity={0.7} />
          </svg>

          {/* Tick mark ring */}
          <motion.svg className="absolute inset-[8%] w-[84%] h-[84%]" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke={c} strokeWidth="0.8" opacity={0.5} />
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = (i * 6 * Math.PI) / 180
              const inner = 82
              const outer = i % 5 === 0 ? 88 : 85
              return (
                <line key={i}
                  x1={100 + inner * Math.cos(angle)} y1={100 + inner * Math.sin(angle)}
                  x2={100 + outer * Math.cos(angle)} y2={100 + outer * Math.sin(angle)}
                  stroke={c} strokeWidth={i % 5 === 0 ? 1 : 0.5} opacity={0.6}
                />
              )
            })}
            <motion.circle cx="100" cy="100" r="90" fill="none" stroke={c} strokeWidth="1"
              strokeDasharray="60 300" opacity={0.6}
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '100px 100px' }}
            />
          </motion.svg>

          {/* Segmented arc blocks */}
          <svg className="absolute inset-[16%] w-[68%] h-[68%]" viewBox="0 0 200 200">
            {Array.from({ length: 8 }).map((_, i) => {
              const startAngle = 140 + i * 8
              const endAngle = startAngle + 5
              const r = 80
              const toRad = (deg: number) => (deg * Math.PI) / 180
              return (
                <path key={i}
                  d={`M ${100 + r * Math.cos(toRad(startAngle))} ${100 + r * Math.sin(toRad(startAngle))}
                      A ${r} ${r} 0 0 1 ${100 + r * Math.cos(toRad(endAngle))} ${100 + r * Math.sin(toRad(endAngle))}`}
                  fill="none" stroke={c} strokeWidth="3" opacity={0.7}
                />
              )
            })}
          </svg>

          {/* Inner dashed ring with dots */}
          <motion.svg className="absolute inset-[22%] w-[56%] h-[56%]" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="75" fill="none" stroke={c} strokeWidth="0.6"
              strokeDasharray="2 6" opacity={0.5} />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180
              return <circle key={i} cx={100 + 75 * Math.cos(angle)} cy={100 + 75 * Math.sin(angle)}
                r="1.5" fill={c} opacity={0.8} />
            })}
            <motion.circle cx="100" cy="100" r="75" fill="none" stroke={c} strokeWidth="1"
              strokeDasharray="40 200" opacity={0.4}
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '100px 100px' }}
            />
          </motion.svg>

          {/* Core orb */}
          <motion.div
            className="absolute inset-[30%] rounded-full flex items-center justify-center"
            style={{ border: `2px solid ${c}`, boxShadow: `0 0 30px ${g}, inset 0 0 20px ${g}` }}
            animate={{ scale: isListening ? [1, 1.08, 1] : isSpeaking ? [1, 1.12, 1] : [1, 1.01, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {Array.from({ length: 20 }).map((_, i) => {
                const angle = (i * 18 * Math.PI) / 180
                const baseR = 48
                const notchDepth = (isListening || isSpeaking) ? 4 + Math.sin(i * 0.8) * 3 : 2
                return (
                  <line key={i}
                    x1={50 + baseR * Math.cos(angle)} y1={50 + baseR * Math.sin(angle)}
                    x2={50 + (baseR + notchDepth) * Math.cos(angle)} y2={50 + (baseR + notchDepth) * Math.sin(angle)}
                    stroke={c} strokeWidth="1" opacity={0.8}
                  />
                )
              })}
            </svg>
            <div className="text-center z-10">
              <motion.span
                className="text-[10px] sm:text-xs lg:text-sm font-light tracking-[0.3em] text-white/90 block"
                style={{ textShadow: `0 0 10px ${c}` }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {state === 'idle' ? 'J.A.R.V.I.S.' : state === 'listening' ? 'LISTENING' : state === 'speaking' ? 'SPEAKING' : 'PROCESSING'}
              </motion.span>
            </div>
          </motion.div>

          {/* Right side hollow rectangles */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div key={i}
                className="w-3 h-1.5 sm:w-4 sm:h-2 border border-cyan-400/60 rounded-sm"
                animate={{ opacity: (isListening || isSpeaking) ? [0.3, 1, 0.3] : 0.4, borderColor: c }}
                transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Waveform bars */}
      {(isListening || isSpeaking) && (
        <div className="flex items-end gap-1 h-8 sm:h-10 mt-4 sm:mt-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div key={i} className="w-0.5 sm:w-1 rounded-full" style={{ backgroundColor: c }}
              animate={{ height: isListening ? [4, 24, 4] : isSpeaking ? [6, 32, 6] : 4 }}
              transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.03 }}
            />
          ))}
        </div>
      )}

      {/* Transcript */}
      <div className="mt-4 sm:mt-6 px-6 text-center max-w-md">
        <motion.p className="text-sm sm:text-base text-jarvis-text-dim min-h-[2.5rem] font-light tracking-wide"
          animate={{ opacity: transcript ? 1 : 0.5 }}
        >
          {transcript || (state === 'idle' ? 'Tap the core to initiate' : state === 'listening' ? 'Awaiting input...' : state === 'speaking' ? 'Transmitting response...' : 'Computing...')}
        </motion.p>
      </div>

      {/* Bottom hint */}
      <p className="absolute bottom-4 sm:bottom-6 text-[10px] sm:text-xs text-jarvis-text-dim/40 tracking-[0.2em] uppercase">
        {isListening ? 'Tap to terminate' : 'Tap core to activate'}
      </p>
    </div>
  )
}

function SystemPanel({ label, value, bars, color }: { label: string; value: string; bars: number; color: string }) {
  return (
    <div className="border-l-2 border-cyan-500/30 pl-3">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] tracking-[0.2em] text-jarvis-text-dim/60">{label}</span>
        <span className="text-xs text-jarvis-cyan font-mono">{value}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-sm"
            style={{ backgroundColor: i < bars ? color : 'rgba(0, 136, 170, 0.2)', opacity: i < bars ? 0.8 : 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}

function LogPanel({ color }: { color: string }) {
  const logs = ['System initialized', 'Voice module online', 'Neural network active', 'Awaiting command...']
  return (
    <div className="border-r-2 border-cyan-500/30 pr-3 text-right">
      <span className="text-[10px] tracking-[0.2em] text-jarvis-text-dim/60 block mb-2">SYSTEM LOG</span>
      {logs.map((log, i) => (
        <div key={i} className="text-[10px] text-jarvis-text-dim/50 mb-1 font-mono">
          <span style={{ color }}>{'>'}</span> {log}
        </div>
      ))}
    </div>
  )
}

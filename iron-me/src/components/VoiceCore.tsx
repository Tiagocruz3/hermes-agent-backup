import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Message } from '../types'

interface VoiceCoreProps {
  isListening: boolean
  isSpeaking: boolean
  isTyping: boolean
  transcript: string
  error: string | null
  useManualInput: boolean
  setUseManualInput: (v: boolean) => void
  onManualSubmit: (text: string) => void
  conversationMode?: boolean
  onInterrupt?: () => void
  messages?: Message[]
  onTap: () => void
}

export function VoiceCore({ 
  isListening, 
  isSpeaking, 
  isTyping, 
  transcript, 
  error, 
  useManualInput, 
  setUseManualInput, 
  onManualSubmit,
  conversationMode,
  onInterrupt,
  messages = [],
  onTap 
}: VoiceCoreProps) {
  const state = isListening ? 'listening' : isSpeaking ? 'speaking' : isTyping ? 'thinking' : 'idle'

  const colors = {
    idle: '#0088AA',
    listening: '#00d2ff',
    speaking: '#00FF88',
    thinking: '#FFAA00',
  }

  const glowColors = {
    idle: 'rgba(0, 136, 170, 0.3)',
    listening: 'rgba(0, 210, 255, 0.5)',
    speaking: 'rgba(0, 255, 136, 0.5)',
    thinking: 'rgba(255, 170, 0, 0.5)',
  }

  const c = colors[state]
  const g = glowColors[state]

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative scanline">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(circle at center, ${g} 0%, transparent 60%)` }}
        transition={{ duration: 1.5 }}
      />

      {/* Desktop corner widgets */}
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
        <RadarWidget color={c} />
      </div>

      {/* Title */}
      <div className="text-center mb-2 z-10">
        <motion.h1
          className="text-base sm:text-lg lg:text-xl font-light tracking-[0.3em] text-jarvis-cyan"
          style={{ textShadow: '0 0 20px rgba(0, 210, 255, 0.5)' }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          JARVIS Voice Assistant
        </motion.h1>
        {conversationMode && (
          <motion.span 
            className="text-[10px] text-jarvis-cyan/70 tracking-[0.2em]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            LIVE CONVERSATION MODE
          </motion.span>
        )}
      </div>

      {/* Command text box */}
      <div className="relative mb-3 z-10">
        <div className="flex items-center gap-2 bg-jarvis-panel/80 border border-jarvis-border rounded-xl px-4 py-2 min-w-[260px] sm:min-w-[340px]">
          <span className="text-xs text-jarvis-text-dim">{transcript || '...'}</span>
          <motion.span
            className="w-0.5 h-4 bg-jarvis-cyan"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <span className="text-[10px] text-jarvis-text-dim/50 ml-auto">V2.0</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mb-5 z-10 flex-wrap justify-center">
        <button className="gradient-border gradient-border-glow px-4 py-2 text-xs text-white tracking-wider hover:bg-white/5 transition">
          All Commands
        </button>
        <button
          onClick={onTap}
          className="gradient-border gradient-border-glow px-4 py-2 text-xs text-jarvis-cyan tracking-wider hover:bg-white/5 transition"
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
        {isSpeaking && onInterrupt && (
          <button
            onClick={(e) => { e.stopPropagation(); onInterrupt() }}
            className="gradient-border gradient-border-glow px-4 py-2 text-xs text-jarvis-urgent tracking-wider hover:bg-white/5 transition animate-pulse"
          >
            Interrupt
          </button>
        )}
        {!hasNativeSTT && (
          <button
            onClick={() => setUseManualInput(!useManualInput)}
            className="gradient-border gradient-border-glow px-4 py-2 text-xs text-jarvis-warn tracking-wider hover:bg-white/5 transition"
          >
            {useManualInput ? 'Hide Input' : 'Type'}
          </button>
        )}
      </div>

      {/* Manual input for Safari */}
      {useManualInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="z-10 mb-4 w-full max-w-[320px]"
        >
          <ManualInput onSubmit={onManualSubmit} />
        </motion.div>
      )}

      {/* Main HUD */}
      <div className="relative flex items-center justify-center" onClick={onTap}>
        <div className="relative w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] lg:w-[380px] lg:h-[380px]">
          <motion.div
            className="absolute inset-[-10%] rounded-full"
            style={{ background: `radial-gradient(circle, ${g} 0%, transparent 70%)` }}
            animate={{ scale: isListening ? [1, 1.1, 1] : isSpeaking ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Outer thick dark ring with cyan segments */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="95" fill="none" stroke="#0a1a2a" strokeWidth="8" />
            {Array.from({ length: 12 }).map((_, i) => {
              const startAngle = i * 30 + 5
              const endAngle = startAngle + 18
              const r = 95
              const toRad = (deg: number) => (deg * Math.PI) / 180
              return (
                <path
                  key={i}
                  d={`M ${100 + r * Math.cos(toRad(startAngle))} ${100 + r * Math.sin(toRad(startAngle))}
                      A ${r} ${r} 0 0 1 ${100 + r * Math.cos(toRad(endAngle))} ${100 + r * Math.sin(toRad(endAngle))}`}
                  fill="none" stroke={c} strokeWidth="3" opacity={0.8}
                />
              )
            })}
          </svg>

          {/* Thin rotating ring */}
          <motion.svg className="absolute inset-[5%] w-[90%] h-[90%]" viewBox="0 0 200 200">
            <motion.circle
              cx="100" cy="100" r="88"
              fill="none" stroke={c} strokeWidth="0.5"
              strokeDasharray="20 40 10 60"
              opacity={0.5}
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '100px 100px' }}
            />
          </motion.svg>

          {/* Tick mark ring */}
          <svg className="absolute inset-[10%] w-[80%] h-[80%]" viewBox="0 0 200 200">
            {Array.from({ length: 48 }).map((_, i) => {
              const angle = (i * 7.5 * Math.PI) / 180
              const inner = 78
              const outer = i % 6 === 0 ? 85 : 82
              return (
                <line
                  key={i}
                  x1={100 + inner * Math.cos(angle)}
                  y1={100 + inner * Math.sin(angle)}
                  x2={100 + outer * Math.cos(angle)}
                  y2={100 + outer * Math.sin(angle)}
                  stroke={c}
                  strokeWidth={i % 6 === 0 ? 1 : 0.5}
                  opacity={0.6}
                />
              )
            })}
          </svg>

          {/* Inner dashed ring */}
          <motion.svg className="absolute inset-[18%] w-[64%] h-[64%]" viewBox="0 0 200 200">
            <circle
              cx="100" cy="100" r="70"
              fill="none" stroke={c} strokeWidth="0.6"
              strokeDasharray="3 9"
              opacity={0.4}
            />
            <motion.circle
              cx="100" cy="100" r="70"
              fill="none" stroke={c} strokeWidth="1"
              strokeDasharray="50 200"
              opacity={0.3}
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '100px 100px' }}
            />
          </motion.svg>

          {/* Core */}
          <motion.div
            className="absolute inset-[25%] rounded-full flex items-center justify-center"
            style={{
              border: `2px solid ${c}`,
              boxShadow: `0 0 40px ${g}, inset 0 0 30px ${g}`,
            }}
            animate={{
              scale: isListening ? [1, 1.08, 1] : isSpeaking ? [1, 1.12, 1] : isTyping ? [1, 1.04, 1] : [1, 1.01, 1],
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 22.5 * Math.PI) / 180
                const baseR = 46
                const notchDepth = (isListening || isSpeaking) ? 3 + Math.sin(i * 0.7) * 2 : 1.5
                return (
                  <line
                    key={i}
                    x1={50 + baseR * Math.cos(angle)}
                    y1={50 + baseR * Math.sin(angle)}
                    x2={50 + (baseR + notchDepth) * Math.cos(angle)}
                    y2={50 + (baseR + notchDepth) * Math.sin(angle)}
                    stroke={c}
                    strokeWidth="1"
                    opacity={0.7}
                  />
                )
              })}
            </svg>

            <div className="text-center z-10">
              <motion.span
                className="text-[8px] sm:text-[9px] lg:text-[10px] font-light tracking-[0.25em] text-white/90 block"
                style={{ textShadow: `0 0 10px ${c}` }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {state === 'idle' ? 'J.A.R.V.I.S.' : state === 'listening' ? 'LISTENING' : state === 'speaking' ? 'SPEAKING' : 'PROCESSING'}
              </motion.span>
            </div>
          </motion.div>

          {/* Right side hollow rectangles */}
          <div className="absolute right-[-8%] top-1/2 -translate-y-1/2 flex flex-col gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-1.5 sm:w-2.5 sm:h-2 border border-jarvis-cyan/50 rounded-sm"
                animate={{
                  opacity: (isListening || isSpeaking) ? [0.3, 1, 0.3] : 0.4,
                  borderColor: c,
                }}
                transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Waveform */}
      {(isListening || isSpeaking) && (
        <div className="flex items-end gap-0.5 h-5 sm:h-6 mt-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-0.5 sm:w-0.5 rounded-full"
              style={{ backgroundColor: c }}
              animate={{ height: isListening ? [3, 18, 3] : isSpeaking ? [4, 24, 4] : 3 }}
              transition={{ duration: 0.35, repeat: Infinity, delay: i * 0.025 }}
            />
          ))}
        </div>
      )}

      {/* Conversation transcript */}
      {conversationMode && messages.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="z-10 mt-4 w-full max-w-[400px] px-4"
        >
          <div className="bg-jarvis-panel/60 backdrop-blur-sm border border-jarvis-border/30 rounded-xl p-3 max-h-[120px] overflow-y-auto">
            <span className="text-[10px] tracking-[0.2em] text-jarvis-text-dim/50 block mb-2">CONVERSATION</span>
            {messages.slice(-4).map((msg) => (
              <div key={msg.id} className="text-[11px] mb-1">
                <span className={msg.role === 'user' ? 'text-jarvis-cyan' : msg.role === 'assistant' ? 'text-jarvis-success' : 'text-jarvis-warn'}>
                  {msg.role === 'user' ? 'YOU: ' : msg.role === 'assistant' ? 'JARVIS: ' : 'SYSTEM: '}
                </span>
                <span className="text-jarvis-text/80">{msg.content.slice(0, 60)}{msg.content.length > 60 ? '...' : ''}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 px-4 py-2 bg-jarvis-urgent/10 border border-jarvis-urgent/30 rounded-lg text-[10px] text-jarvis-urgent text-center max-w-[280px]"
        >
          {error}
        </motion.div>
      )}

      {/* Bottom prompt */}
      <p className="mt-2 text-[10px] text-jarvis-text-dim/40 tracking-[0.2em] uppercase">
        {isListening ? 'Tap to terminate' : isSpeaking ? 'Tap orb to interrupt' : conversationMode ? 'Live mode active' : "Say 'Hello Jarvis'"}
      </p>

      {/* Bottom nav dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1 sm:gap-2 bg-jarvis-panel/90 backdrop-blur-xl border border-jarvis-border/50 rounded-full px-3 py-2">
          {[
            { icon: CalendarIcon, label: 'Calendar' },
            { icon: ClockIcon, label: 'Clock' },
            { icon: BatteryIcon, label: 'Battery' },
            { icon: CloudIcon, label: 'Weather' },
            { icon: PowerIcon, label: 'Power' },
          ].map(({ icon: Icon, label }) => (
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
    </div>
  )
}

/* Corner Widgets */

function SystemStatusPanel() {
  return (
    <div className="bg-jarvis-panel/90 backdrop-blur-xl border border-jarvis-border/50 rounded-2xl p-4 w-56">
      <span className="text-[10px] tracking-[0.2em] text-jarvis-text-dim/60 block mb-3">SYSTEM STATUS</span>

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
  )
}

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
  )
}

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
  )
}

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
  )
}

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
  )
}

/* Browser detection */
const hasNativeSTT = typeof window !== 'undefined' && 
  ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

/* Manual Input Component */
function ManualInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('')

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) {
            onSubmit(text.trim())
            setText('')
          }
        }}
        placeholder="Type command..."
        autoFocus
        className="flex-1 bg-jarvis-panel border border-jarvis-border rounded-lg px-3 py-2 text-xs text-jarvis-text placeholder:text-jarvis-text-dim/40 focus:outline-none focus:border-jarvis-cyan/50"
      />
      <button
        onClick={() => {
          if (text.trim()) {
            onSubmit(text.trim())
            setText('')
          }
        }}
        className="px-3 py-2 rounded-lg bg-jarvis-cyan/15 text-jarvis-cyan text-xs hover:bg-jarvis-cyan/25 transition"
      >
        Send
      </button>
    </div>
  )
}

/* SVG Icons */

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <line x1="22" y1="11" x2="22" y2="13" />
      <path d="M6 10v4" strokeWidth="2" />
    </svg>
  )
}

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  )
}

function PowerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

function ThermometerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  )
}

function DropletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  )
}

function WindIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
  )
}

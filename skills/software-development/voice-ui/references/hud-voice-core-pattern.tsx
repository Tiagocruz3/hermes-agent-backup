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

  const ringColors = {
    idle: '#1a3a5c',
    listening: '#00d4ff',
    speaking: '#00ff88',
    thinking: '#ffaa00',
  }

  const glowColors = {
    idle: 'rgba(0, 212, 255, 0.1)',
    listening: 'rgba(0, 212, 255, 0.4)',
    speaking: 'rgba(0, 255, 136, 0.4)',
    thinking: 'rgba(255, 170, 0, 0.4)',
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative">
      {/* Ambient glow background */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        animate={{
          background: `radial-gradient(circle, ${glowColors[state]} 0%, transparent 70%)`,
          scale: isListening || isSpeaking ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ width: '80%', height: '80%', margin: 'auto' }}
      />

      {/* Orbital rings container */}
      <div className="relative w-72 h-72 flex items-center justify-center" onClick={onTap}>
        {/* Outer ring — slow clockwise */}
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: ringColors[state] }}
          animate={{
            rotate: isListening || isSpeaking ? 360 : 0,
            scale: isListening ? [1, 1.05, 1] : isSpeaking ? [1, 1.1, 1] : 1,
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1.5, repeat: Infinity },
          }}
        />

        {/* Middle ring — slower counter-clockwise */}
        <motion.div
          className="absolute inset-4 rounded-full border"
          style={{ borderColor: ringColors[state] }}
          animate={{
            rotate: isListening || isSpeaking ? -360 : 0,
            scale: isListening ? [1, 0.95, 1] : isSpeaking ? [1, 1.05, 1] : 1,
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1.2, repeat: Infinity },
          }}
        />

        {/* Inner ring — dashed, fastest */}
        <motion.div
          className="absolute inset-8 rounded-full border-2 border-dashed"
          style={{ borderColor: ringColors[state] }}
          animate={{ rotate: isListening || isSpeaking ? 360 : 0 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />

        {/* Core orb — pulses by state */}
        <motion.div
          className="w-32 h-32 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: `radial-gradient(circle, ${ringColors[state]} 0%, transparent 70%)`,
            boxShadow: `0 0 60px ${ringColors[state]}`,
          }}
          animate={{
            scale: isListening ? [1, 1.15, 1] : isSpeaking ? [1, 1.2, 1] : isTyping ? [1, 1.05, 1] : [1, 1.02, 1],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-4xl font-light tracking-widest text-white/90">
            {state === 'idle' ? 'AISHA' : state === 'listening' ? '···' : state === 'speaking' ? '◆' : '◈'}
          </span>
        </motion.div>
      </div>

      {/* Waveform bars when active */}
      {(isListening || isSpeaking) && (
        <div className="flex items-end gap-1 h-12 mt-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 rounded-full"
              style={{ backgroundColor: ringColors[state] }}
              animate={{
                height: isListening ? [8, 32, 8] : isSpeaking ? [12, 40, 12] : 4,
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}

      {/* Transcript / Status text */}
      <div className="mt-6 px-8 text-center">
        <motion.p
          className="text-lg text-aisha-text-dim min-h-[3rem]"
          animate={{ opacity: transcript ? 1 : 0.6 }}
        >
          {transcript || (state === 'idle' ? 'Tap to speak' : state === 'listening' ? 'Listening...' : state === 'speaking' ? 'Speaking...' : 'Processing...')}
        </motion.p>
      </div>

      <p className="absolute bottom-8 text-xs text-aisha-text-dim/50 tracking-wider">
        {isListening ? 'TAP TO STOP' : 'TAP TO SPEAK'}
      </p>
    </div>
  )
}

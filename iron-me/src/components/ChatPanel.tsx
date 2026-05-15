import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import type { Message } from '../types'

interface Props {
  messages: Message[]
  isTyping: boolean
  onSend: (text: string) => void
}

export function ChatPanel({ messages, isTyping, onSend }: Props) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto w-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-jarvis-text-dim/30">
            <span className="text-4xl sm:text-6xl font-light tracking-[0.3em] mb-4">J.A.R.V.I.S.</span>
            <span className="text-xs sm:text-sm tracking-wider">How may I assist you today?</span>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-jarvis-cyan/10 text-jarvis-text ml-8 border border-jarvis-cyan/20'
                  : msg.role === 'system'
                  ? 'bg-jarvis-warn/10 text-jarvis-warn border border-jarvis-warn/30'
                  : 'bg-jarvis-panel text-jarvis-text mr-8 border border-jarvis-border'
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-jarvis-panel border border-jarvis-border rounded-2xl px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 bg-jarvis-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-jarvis-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-jarvis-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 border-t border-jarvis-border/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enter command..."
            className="flex-1 bg-jarvis-panel border border-jarvis-border rounded-xl px-4 py-3 text-sm text-jarvis-text placeholder:text-jarvis-text-dim/40 focus:outline-none focus:border-jarvis-cyan/50 tracking-wide"
          />
          <button
            onClick={handleSend}
            className="p-3 rounded-xl bg-jarvis-cyan/15 text-jarvis-cyan active:scale-90 transition hover:bg-jarvis-cyan/25"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

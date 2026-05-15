import { Mic, MessageSquare, Radio } from 'lucide-react'

interface Props {
  mode: 'voice' | 'chat'
  onToggleMode: () => void
  isConnected: boolean
  conversationMode?: boolean
  onToggleConversation?: () => void
}

export function StatusBar({ mode, onToggleMode, isConnected, conversationMode, onToggleConversation }: Props) {
  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="h-12 sm:h-14 flex items-center justify-between px-3 sm:px-6 border-b border-jarvis-border/30 bg-jarvis-bg/80 backdrop-blur-md z-40">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-jarvis-success animate-pulse' : 'bg-jarvis-urgent'}`} />
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs font-medium tracking-[0.25em] text-jarvis-text-dim">J.A.R.V.I.S.</span>
          <span className="text-[8px] sm:text-[10px] text-jarvis-text-dim/40 tracking-wider hidden sm:block">{date}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mode === 'voice' && onToggleConversation && (
          <button
            onClick={onToggleConversation}
            className={`p-2 sm:p-2.5 rounded-xl border transition active:scale-90 ${
              conversationMode 
                ? 'bg-jarvis-cyan/20 border-jarvis-cyan text-jarvis-cyan' 
                : 'bg-jarvis-panel border-jarvis-border/50 text-jarvis-text-dim hover:text-jarvis-cyan'
            }`}
            title="Live Conversation Mode"
          >
            <Radio className="w-4 h-4" />
          </button>
        )}

        <span className="text-xs sm:text-sm font-light text-jarvis-text font-mono">{time}</span>

        <button
          onClick={onToggleMode}
          className="p-2 sm:p-2.5 rounded-xl bg-jarvis-panel border border-jarvis-border/50 text-jarvis-cyan active:scale-90 transition hover:border-jarvis-cyan/50"
        >
          {mode === 'voice' ? <MessageSquare className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

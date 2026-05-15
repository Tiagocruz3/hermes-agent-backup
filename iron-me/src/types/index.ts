export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface Notification {
  id: string
  type: 'approval' | 'info' | 'warning' | 'urgent'
  title: string
  body: string
  timestamp: number
  actions?: { label: string; value: string }[]
}

export interface VoiceState {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
}

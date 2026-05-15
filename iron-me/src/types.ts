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

export interface TaskStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  icon: string
  timestamp: number
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  steps: TaskStep[]
  progress: number
  timestamp: number
  completedAt?: number
}

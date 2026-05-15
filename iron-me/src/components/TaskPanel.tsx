import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '../types'

interface Props {
  tasks: Task[]
  onDismiss: (id: string) => void
}

export function TaskPanel({ tasks, onDismiss }: Props) {
  const activeTasks = tasks.filter(t => t.status === 'running')
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed')

  if (tasks.length === 0) return null

  return (
    <div className="absolute top-16 right-4 z-30 flex flex-col gap-3 max-w-[320px] w-full">
      <AnimatePresence>
        {activeTasks.map(task => (
          <TaskCard key={task.id} task={task} onDismiss={onDismiss} />
        ))}
        {completedTasks.slice(0, 2).map(task => (
          <TaskCard key={task.id} task={task} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function TaskCard({ task, onDismiss }: { task: Task; onDismiss: (id: string) => void }) {
  const isRunning = task.status === 'running'
  const isFailed = task.status === 'failed'

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className={`bg-jarvis-panel/95 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl ${
        isFailed ? 'border-jarvis-urgent/50' : 'border-jarvis-border/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isRunning ? 'bg-jarvis-cyan animate-pulse' : isFailed ? 'bg-jarvis-urgent' : 'bg-jarvis-success'
          }`} />
          <span className="text-xs font-medium tracking-wider text-jarvis-text">{task.title}</span>
        </div>
        <button
          onClick={() => onDismiss(task.id)}
          className="text-jarvis-text-dim/50 hover:text-jarvis-text-dim text-xs"
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <p className="text-[10px] text-jarvis-text-dim mb-3 leading-relaxed">{task.description}</p>

      {/* Progress bar */}
      <div className="h-1.5 bg-jarvis-bg rounded-full overflow-hidden mb-3">
        <motion.div
          className={`h-full rounded-full ${isFailed ? 'bg-jarvis-urgent' : 'bg-gradient-to-r from-jarvis-purple to-jarvis-cyan'}`}
          initial={{ width: 0 }}
          animate={{ width: `${task.progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {task.steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-2 text-[10px] ${
              step.status === 'in_progress' ? 'text-jarvis-cyan' :
              step.status === 'completed' ? 'text-jarvis-success/70' :
              step.status === 'failed' ? 'text-jarvis-urgent' :
              'text-jarvis-text-dim/40'
            }`}
          >
            <span className="text-sm">{step.icon}</span>
            <span className={step.status === 'in_progress' ? 'font-medium' : ''}>
              {step.label}
            </span>
            {step.status === 'in_progress' && (
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-auto text-jarvis-cyan"
              >
                ●
              </motion.span>
            )}
            {step.status === 'completed' && (
              <span className="ml-auto text-jarvis-success">✓</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-jarvis-border/30 flex justify-between text-[9px] text-jarvis-text-dim/50">
        <span>{task.progress}% complete</span>
        {isRunning && <span className="text-jarvis-cyan animate-pulse">Processing...</span>}
        {task.status === 'completed' && <span className="text-jarvis-success">Done</span>}
        {isFailed && <span className="text-jarvis-urgent">Failed</span>}
      </div>
    </motion.div>
  )
}

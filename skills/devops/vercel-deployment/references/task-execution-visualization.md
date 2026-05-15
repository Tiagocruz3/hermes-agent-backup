# Task Execution Visualization — Animated Progress Tracker

Session: 2026-05-15 — Iron Me JARVIS Voice UI

## Problem

When a user gives a high-level command like "create a game" or "deploy the app", the AI agent works through multiple steps behind the scenes. Without visual feedback, the user has no idea what's happening or how long it will take.

## Solution

A **TaskPanel** component that appears when the AI starts working on a multi-step task. It shows:
- Task title (e.g., "Coding Task", "Deployment Task")
- Animated progress bar
- Individual steps with status icons
- Auto-dismiss on completion

## Architecture

```
User: "Create a game"
  → Frontend detects task keywords
  → Creates Task object with predefined steps
  → Shows TaskPanel with animated progress
  → Steps advance as API calls progress
  → Task completes → auto-dismiss
```

## Types

```ts
export interface TaskStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  timestamp: number
}

export interface Task {
  id: string
  type: string
  title: string
  description: string
  steps: TaskStep[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: number
  updatedAt: number
}
```

## Task Templates

Predefine step sequences for common task types:

```ts
const TASK_TEMPLATES: Record<string, { title: string; steps: Omit<TaskStep, 'id' | 'status' | 'timestamp'>[] }> = {
  code: {
    title: 'Coding Task',
    steps: [
      { label: 'Analyzing request...' },
      { label: 'Planning architecture...' },
      { label: 'Opening Codex...' },
      { label: 'Generating code...' },
      { label: 'Building project...' },
      { label: 'Verifying output...' },
    ],
  },
  deploy: {
    title: 'Deployment Task',
    steps: [
      { label: 'Analyzing request...' },
      { label: 'Preparing build...' },
      { label: 'Compiling assets...' },
      { label: 'Deploying to Vercel...' },
      { label: 'Verifying deployment...' },
      { label: 'Complete!' },
    ],
  },
  research: {
    title: 'Research Task',
    steps: [
      { label: 'Analyzing request...' },
      { label: 'Searching sources...' },
      { label: 'Synthesizing findings...' },
      { label: 'Preparing summary...' },
      { label: 'Complete!' },
    ],
  },
}
```

## Task Detection

Detect task type from user message keywords:

```ts
const detectTaskType = (text: string): string => {
  const lower = text.toLowerCase()
  if (lower.includes('create') || lower.includes('build') || lower.includes('code') || lower.includes('make') || lower.includes('write')) return 'code'
  if (lower.includes('deploy') || lower.includes('push') || lower.includes('publish')) return 'deploy'
  if (lower.includes('research') || lower.includes('find') || lower.includes('search') || lower.includes('look up')) return 'research'
  return 'default'
}
```

## Hook Implementation

```ts
// useTasks.ts
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])

  const createTask = useCallback((type: string, description: string): string => {
    const template = TASK_TEMPLATES[type] || TASK_TEMPLATES.default
    const id = Date.now().toString()
    const task: Task = {
      id,
      type,
      title: template.title,
      description,
      steps: template.steps.map((s, i) => ({
        id: `${id}-${i}`,
        ...s,
        status: i === 0 ? 'in_progress' : 'pending',
        timestamp: Date.now(),
      })),
      status: 'in_progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setTasks(prev => [...prev, task])
    return id
  }, [])

  const updateTaskStep = useCallback((taskId: string, stepIndex: number, status: TaskStep['status']) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task
      const steps = [...task.steps]
      steps[stepIndex] = { ...steps[stepIndex], status, timestamp: Date.now() }
      return { ...task, steps, updatedAt: Date.now() }
    }))
  }, [])

  const completeTask = useCallback((taskId: string, success: boolean) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task
      return { ...task, status: success ? 'completed' : 'failed', updatedAt: Date.now() }
    }))
    // Auto-dismiss after delay
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== taskId))
    }, 5000)
  }, [])

  const dismissTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  return { tasks, createTask, updateTaskStep, completeTask, dismissTask }
}
```

## Step Progression

Advance steps during the API call lifecycle:

```ts
const handleUserMessage = async (text: string) => {
  const taskType = detectTaskType(text)
  const taskId = createTask(taskType, text)

  // Simulate step progression
  const stepInterval = setInterval(() => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const currentStep = task.steps.findIndex(s => s.status === 'in_progress')
      if (currentStep >= 0 && currentStep < task.steps.length - 1) {
        updateTaskStep(taskId, currentStep, 'completed')
      }
    }
  }, 1500)

  try {
    const res = await fetch('/api/chat', { ... })
    const data = await res.json()
    clearInterval(stepInterval)
    completeTask(taskId, true)
  } catch {
    clearInterval(stepInterval)
    completeTask(taskId, false)
  }
}
```

## UI Component

```tsx
// TaskPanel.tsx
function TaskPanel({ tasks, onDismiss }: { tasks: Task[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {tasks.map(task => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-400 text-sm font-semibold">{task.title}</span>
              <button onClick={() => onDismiss(task.id)} className="text-white/50 hover:text-white">×</button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/10 rounded-full mb-3 overflow-hidden">
              <motion.div
                className="h-full bg-cyan-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{
                  width: `${(task.steps.filter(s => s.status === 'completed').length / task.steps.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {task.steps.map(step => (
                <div key={step.id} className="flex items-center gap-2 text-xs">
                  {step.status === 'completed' && <span className="text-green-400">✓</span>}
                  {step.status === 'in_progress' && <span className="text-cyan-400 animate-pulse">●</span>}
                  {step.status === 'pending' && <span className="text-white/30">○</span>}
                  {step.status === 'failed' && <span className="text-red-400">✗</span>}
                  <span className={step.status === 'completed' ? 'text-white/50 line-through' : 'text-white/80'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

## Key Design Decisions

1. **Fixed position, top-right** — Doesn't block the main UI (orb/chat)
2. **Auto-dismiss on completion** — Keeps screen clean, but 5s delay lets user see success
3. **AnimatePresence** — Smooth enter/exit animations with Framer Motion
4. **Progress bar** — Visual sense of overall completion
5. **Step icons** — ✓ completed, ● in-progress, ○ pending, ✗ failed
6. **Keyword detection** — Simple but effective; can be replaced with LLM-based intent classification

## Integration

Add to App.tsx:

```tsx
const { tasks, createTask, updateTaskStep, completeTask, dismissTask } = useTasks()

// In handleUserMessage:
const taskId = createTask(detectTaskType(text), text)

// After API response:
completeTask(taskId, true)

// In JSX:
<TaskPanel tasks={tasks} onDismiss={dismissTask} />
```

## Future Enhancements

- **Real step tracking:** Instead of timed simulation, track actual backend operations
- **LLM intent detection:** Use a lightweight classifier instead of keyword matching
- **Sub-tasks:** Nested tasks for complex multi-step operations
- **Persistent log:** Keep completed tasks in a history panel
- **Cancel button:** Allow user to abort long-running tasks

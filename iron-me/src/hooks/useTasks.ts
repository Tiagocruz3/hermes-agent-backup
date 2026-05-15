import { useState, useCallback } from 'react'
import type { Task, TaskStep } from '../types'

const TASK_TEMPLATES: Record<string, { title: string; steps: Omit<TaskStep, 'id' | 'status' | 'timestamp'>[] }> = {
  code: {
    title: 'Coding Task',
    steps: [
      { label: 'Analyzing request...', icon: '🧠' },
      { label: 'Planning architecture...', icon: '📝' },
      { label: 'Opening Codex...', icon: '💻' },
      { label: 'Generating code...', icon: '⚡' },
      { label: 'Building project...', icon: '🔨' },
      { label: 'Verifying output...', icon: '✅' },
    ],
  },
  deploy: {
    title: 'Deployment Task',
    steps: [
      { label: 'Analyzing request...', icon: '🧠' },
      { label: 'Preparing build...', icon: '📦' },
      { label: 'Compiling assets...', icon: '⚙️' },
      { label: 'Deploying to Vercel...', icon: '🚀' },
      { label: 'Verifying deployment...', icon: '🔍' },
      { label: 'Complete!', icon: '✅' },
    ],
  },
  research: {
    title: 'Research Task',
    steps: [
      { label: 'Analyzing query...', icon: '🧠' },
      { label: 'Searching sources...', icon: '🔍' },
      { label: 'Gathering data...', icon: '📊' },
      { label: 'Synthesizing findings...', icon: '⚡' },
      { label: 'Formatting report...', icon: '📝' },
      { label: 'Complete!', icon: '✅' },
    ],
  },
  default: {
    title: 'Processing Task',
    steps: [
      { label: 'Analyzing request...', icon: '🧠' },
      { label: 'Processing...', icon: '⚡' },
      { label: 'Complete!', icon: '✅' },
    ],
  },
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])

  const createTask = useCallback((type: string, description: string) => {
    const template = TASK_TEMPLATES[type] || TASK_TEMPLATES.default
    const now = Date.now()
    const task: Task = {
      id: `task-${now}`,
      title: template.title,
      description,
      status: 'running',
      progress: 0,
      timestamp: now,
      steps: template.steps.map((s, i) => ({
        id: `step-${now}-${i}`,
        ...s,
        status: i === 0 ? 'in_progress' : 'pending',
        timestamp: now,
      })),
    }
    setTasks(prev => [task, ...prev])
    return task.id
  }, [])

  const updateTaskStep = useCallback((taskId: string, stepIndex: number, status: TaskStep['status']) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task
      const newSteps = task.steps.map((step, i) => {
        if (i === stepIndex) return { ...step, status, timestamp: Date.now() }
        if (i < stepIndex) return { ...step, status: 'completed' as const }
        if (i === stepIndex + 1 && status === 'completed') return { ...step, status: 'in_progress' as const }
        return step
      })
      const completedSteps = newSteps.filter(s => s.status === 'completed').length
      const progress = Math.round((completedSteps / newSteps.length) * 100)
      return { ...task, steps: newSteps, progress }
    }))
  }, [])

  const completeTask = useCallback((taskId: string, success = true) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task
      return {
        ...task,
        status: success ? 'completed' : 'failed',
        progress: success ? 100 : task.progress,
        completedAt: Date.now(),
        steps: task.steps.map((s, i) => ({
          ...s,
          status: success ? 'completed' : i === task.steps.length - 1 ? 'failed' : 'completed',
        })),
      }
    }))
  }, [])

  const dismissTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  return { tasks, createTask, updateTaskStep, completeTask, dismissTask }
}

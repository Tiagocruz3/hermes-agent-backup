# Task Execution Visualization for Voice UIs

When a user gives a high-level voice command like "create a game" or "deploy the app", the AI agent works through multiple steps behind the scenes. A visual task tracker keeps the user informed.

## Use Case

Voice-first interfaces (JARVIS-style HUD, car systems, smart displays) have limited screen real estate. A compact, animated task card in the corner shows progress without disrupting the main voice interaction.

## Architecture

```
User: "Create a game"
  → Frontend detects task keywords
  → Creates Task object with predefined steps
  → Shows TaskPanel with animated progress
  → Steps advance as API calls progress
  → Task completes → auto-dismiss after 5s
```

## Task Types

| Type | Trigger Words | Steps |
|------|--------------|-------|
| `code` | create, build, code, make, write | Analyze → Plan → Open Codex → Generate → Build → Verify |
| `deploy` | deploy, push, publish | Analyze → Prepare → Compile → Deploy → Verify → Done |
| `research` | research, find, search, look up | Analyze → Search → Synthesize → Summarize → Done |

## Key Implementation

See `references/task-execution-visualization.md` in the `vercel-deployment` skill for full code (Task types, useTasks hook, TaskPanel component, step progression logic).

## Integration with Voice UI

```tsx
// In App.tsx or voice hook
const { tasks, createTask, completeTask, dismissTask } = useTasks()

const handleVoiceCommand = async (text: string) => {
  const taskId = createTask(detectTaskType(text), text)
  
  try {
    const response = await fetch('/api/chat', { ... })
    completeTask(taskId, true)
  } catch {
    completeTask(taskId, false)
  }
}

// In JSX
<TaskPanel tasks={tasks} onDismiss={dismissTask} />
```

## Design Notes

- **Fixed position, top-right** — Doesn't block the central orb
- **AnimatePresence** — Smooth Framer Motion enter/exit
- **Progress bar** — Cyan fill, shows overall completion
- **Step icons** — ✓ completed, ● in-progress (pulse), ○ pending
- **Auto-dismiss** — 5s delay after completion so user sees success
- **Dismiss button** — Manual close if user doesn't want to wait

## Pitfall: Timed vs Real Step Progression

The basic implementation simulates step advancement with `setInterval`. For production, replace with real backend signals:

```ts
// Instead of:
setInterval(() => advanceStep(), 1500)

// Use WebSocket or SSE:
ws.onmessage = (event) => {
  const { stepIndex, status } = JSON.parse(event.data)
  updateTaskStep(taskId, stepIndex, status)
}
```

Vercel serverless doesn't support WebSockets well. Options:
1. **Polling:** Client polls `/api/task/:id` every 2s
2. **Server-Sent Events:** Vercel Edge Functions support SSE
3. **Long polling:** Hold HTTP connection open, stream updates
4. **State in response:** Return task state in the main API response

For simple cases, state-in-response is sufficient:
```ts
// /api/chat returns:
{ reply: "...", task: { id: "...", currentStep: 3, status: "in_progress" } }
```

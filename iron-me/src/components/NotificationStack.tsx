import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Info, CheckCircle, Zap } from 'lucide-react'
import type { Notification } from '../types'

interface Props {
  notifications: Notification[]
  onDismiss: (id: string) => void
  onApproval: (notif: Notification, approved: boolean) => void
}

const icons = {
  approval: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  urgent: Zap,
}

const colors = {
  approval: 'border-jarvis-success/50 text-jarvis-success',
  info: 'border-jarvis-cyan/50 text-jarvis-cyan',
  warning: 'border-jarvis-warn/50 text-jarvis-warn',
  urgent: 'border-jarvis-urgent/50 text-jarvis-urgent',
}

export function NotificationStack({ notifications, onDismiss, onApproval }: Props) {
  return (
    <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 lg:left-72 lg:right-72 flex flex-col gap-3 z-50 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => {
          const Icon = icons[notif.type]
          const colorClass = colors[notif.type]
          return (
            <motion.div
              key={notif.id}
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              className={`pointer-events-auto bg-jarvis-panel/95 backdrop-blur-xl border ${colorClass} rounded-2xl p-4 shadow-2xl`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm tracking-wide">{notif.title}</h3>
                  <p className="text-xs text-jarvis-text-dim mt-1">{notif.body}</p>

                  {notif.type === 'approval' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onApproval(notif, false)}
                        className="flex-1 py-3 rounded-xl bg-jarvis-urgent/15 text-jarvis-urgent text-sm font-medium active:scale-95 transition hover:bg-jarvis-urgent/25"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => onApproval(notif, true)}
                        className="flex-1 py-3 rounded-xl bg-jarvis-success/15 text-jarvis-success text-sm font-medium active:scale-95 transition hover:bg-jarvis-success/25"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onDismiss(notif.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition"
                >
                  <X className="w-4 h-4 text-jarvis-text-dim" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

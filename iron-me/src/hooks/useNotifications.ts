import { useState, useCallback } from 'react'
import type { Notification } from '../types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp'>) => {
    const full: Notification = {
      ...notif,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    }
    setNotifications(prev => [...prev, full])
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return { notifications, addNotification, dismissNotification }
}

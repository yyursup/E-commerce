import { useState, useCallback, useRef } from 'react'

const MAX_NOTIFICATIONS = 5
const AUTO_DISMISS_MS = 5000
const STORAGE_KEY = 'chat_notif_enabled'

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const now = ctx.currentTime

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.12, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.22)

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.08)
    gain2.gain.setValueAtTime(0.15, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.35)
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
}

export function useChatNotification() {
  const [notifications, setNotifications] = useState([])
  const [notifEnabled, setNotifEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored === null ? true : stored === 'true'
    } catch {
      return true
    }
  })
  const timersRef = useRef({})

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }, [])

  const addNotification = useCallback(
    (msg) => {
      if (!notifEnabled) return
      playNotificationSound()
      const id = `notif-${Date.now()}-${Math.random()}`
      const notif = {
        id,
        threadId: msg.threadId,
        senderName: msg.senderName || 'Người dùng',
        senderRole: msg.senderRole,
        content:
          msg.messageType === 'IMAGE'
            ? '📷 Đã gửi một hình ảnh'
            : msg.messageType === 'VIDEO'
              ? '🎬 Đã gửi một video'
              : msg.content || '',
        createdAt: msg.createdAt,
      }

      setNotifications((prev) => {
        const next = [notif, ...prev]
        return next.slice(0, MAX_NOTIFICATIONS)
      })

      timersRef.current[id] = setTimeout(() => {
        dismissNotification(id)
      }, AUTO_DISMISS_MS)
    },
    [notifEnabled, dismissNotification],
  )

  const toggleNotif = useCallback(() => {
    setNotifEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout)
    timersRef.current = {}
    setNotifications([])
  }, [])

  return { notifications, notifEnabled, addNotification, dismissNotification, toggleNotif, clearAll }
}

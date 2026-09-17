import { useState, useCallback, useRef, useEffect } from 'react'

const MAX_NOTIFICATIONS = 5
const AUTO_DISMISS_MS = 5000
const STORAGE_KEY = 'chat_notif_enabled'
const MUTED_THREADS_KEY = 'buyer_muted_threads'

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

function getStoredMutedThreads() {
  try {
    const stored = localStorage.getItem(MUTED_THREADS_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.map((id) => String(id).toLowerCase()) : []
  } catch {
    return []
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
  const [mutedThreads, setMutedThreads] = useState(getStoredMutedThreads)

  const timersRef = useRef({})
  const mutedThreadsRef = useRef(mutedThreads)
  const notifEnabledRef = useRef(notifEnabled)

  useEffect(() => {
    mutedThreadsRef.current = mutedThreads
  }, [mutedThreads])

  useEffect(() => {
    notifEnabledRef.current = notifEnabled
  }, [notifEnabled])

  // Sync state across components and tabs via custom and storage events
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setNotifEnabled(e.newValue === null ? true : e.newValue === 'true')
      }
      if (e.key === MUTED_THREADS_KEY) {
        setMutedThreads(getStoredMutedThreads())
      }
    }

    const handleCustomSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        setNotifEnabled(stored === null ? true : stored === 'true')
      } catch {}
      setMutedThreads(getStoredMutedThreads())
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('buyer-notif-sync', handleCustomSync)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('buyer-notif-sync', handleCustomSync)
    }
  }, [])

  const isThreadMuted = useCallback((threadId) => {
    if (!threadId) return false
    const key = String(threadId).toLowerCase()
    return mutedThreadsRef.current.includes(key)
  }, [])

  const toggleMuteThread = useCallback((threadId) => {
    if (!threadId) return
    const key = String(threadId).toLowerCase()
    setMutedThreads((prev) => {
      const exists = prev.includes(key)
      const next = exists ? prev.filter((id) => id !== key) : [...prev, key]
      try {
        localStorage.setItem(MUTED_THREADS_KEY, JSON.stringify(next))
      } catch {}
      window.dispatchEvent(new CustomEvent('buyer-notif-sync'))
      return next
    })
  }, [])

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }, [])

  const addNotification = useCallback(
    (msg) => {
      if (!notifEnabledRef.current) return
      if (msg?.threadId && mutedThreadsRef.current.includes(String(msg.threadId).toLowerCase())) {
        return
      }

      playNotificationSound()
      const id = `notif-${Date.now()}-${Math.random()}`
      const notif = {
        id,
        threadId: msg.threadId,
        senderName: msg.senderName || 'Người dùng',
        senderRole: msg.senderRole,
        senderAvatar: msg.senderAvatar,
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
    [dismissNotification],
  )

  const toggleNotif = useCallback(() => {
    setNotifEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      window.dispatchEvent(new CustomEvent('buyer-notif-sync'))
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout)
    timersRef.current = {}
    setNotifications([])
  }, [])

  return {
    notifications,
    notifEnabled,
    mutedThreads,
    isThreadMuted,
    toggleMuteThread,
    addNotification,
    dismissNotification,
    toggleNotif,
    clearAll,
  }
}

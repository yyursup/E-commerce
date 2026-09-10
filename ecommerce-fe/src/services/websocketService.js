let ws = null
let reconnectAttempts = 0
let isIntentionallyClosed = false
let reconnectTimeoutId = null

const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 1000

// Event listeners map: eventName -> Set of callbacks
const listeners = new Map()

export const addWebSocketListener = (event, callback) => {
  if (!listeners.has(event)) {
    listeners.set(event, new Set())
  }
  listeners.get(event).add(callback)
  return () => {
    listeners.get(event)?.delete(callback)
  }
}

export const removeWebSocketListener = (event, callback) => {
  listeners.get(event)?.delete(callback)
}

const dispatchEvent = (event, data) => {
  const callbacks = listeners.get(event)
  if (callbacks) {
    callbacks.forEach((cb) => {
      try {
        cb(data)
      } catch (err) {
        console.error(`Error in WebSocket listener for [${event}]:`, err)
      }
    })
  }
}

export const createWebSocketConnection = (token) => {
  if (!token) return

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return
  }

  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId)
    reconnectTimeoutId = null
  }

  isIntentionallyClosed = false

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080'
  const wsBase = apiBase.replace(/^http/, 'ws')
  const wsUrl = `${wsBase}/api/v1/ws/chat?token=${encodeURIComponent(token)}`

  try {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('⚡ Chat WebSocket connected')
      reconnectAttempts = 0
      dispatchEvent('CONNECT', { connected: true })
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message && message.event) {
          dispatchEvent(message.event, message.data)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onclose = (event) => {
      console.log(`Chat WebSocket disconnected (Code: ${event.code})`, event.reason)
      dispatchEvent('DISCONNECT', { code: event.code })

      if (!isIntentionallyClosed && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts)
        reconnectTimeoutId = setTimeout(() => {
          reconnectAttempts++
          createWebSocketConnection(token)
        }, delay)
      }
    }

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error)
      dispatchEvent('ERROR', error)
    }
  } catch (err) {
    console.error('Failed to create WebSocket:', err)
  }
}

export const sendWebSocketMessage = (event, data) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, data }))
    return true
  } else {
    console.warn('Chat WebSocket is not connected, cannot send:', event)
    return false
  }
}

export const closeWebSocketConnection = () => {
  isIntentionallyClosed = true
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId)
    reconnectTimeoutId = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
}

export default {
  createWebSocketConnection,
  sendWebSocketMessage,
  closeWebSocketConnection,
  addWebSocketListener,
  removeWebSocketListener,
}

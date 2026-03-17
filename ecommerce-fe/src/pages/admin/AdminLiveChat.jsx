import { useState, useRef, useEffect, useCallback } from 'react'
import { HiOutlineChat, HiOutlinePaperAirplane } from 'react-icons/hi'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import { getAccessToken } from '../../lib/auth'

const WS_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const ADMIN_TOPIC = '/topic/admin/live-chat'
const REPLY_DEST = '/app/chat/reply'

export default function AdminLiveChat() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [sessions, setSessions] = useState([]) // [{ sessionId, messages: [{ from, text, at }], lastAt }]
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [connected, setConnected] = useState(false)
  const stompRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    selectedSessionId && scrollToBottom()
  }, [selectedSessionId, sessions])

  const connectLiveChat = useCallback(() => {
    if (stompRef.current?.connected) return
    const token = getAccessToken()
    const wsUrl = token ? `${WS_BASE}/api/v1/ws-chat?token=${encodeURIComponent(token)}` : `${WS_BASE}/api/v1/ws-chat`
    const sock = new SockJS(wsUrl, null, { withCredentials: true })
    const client = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true)
        client.subscribe(ADMIN_TOPIC, (msg) => {
          const body = JSON.parse(msg.body || '{}')
          const { sessionId, text, from } = body
          if (!sessionId) return
          setSessions((prev) => {
            const existing = prev.find((s) => s.sessionId === sessionId)
            const newMsg = { from: from || 'Khách', text: text || '', at: new Date().toISOString() }
            if (existing) {
              return prev.map((s) =>
                s.sessionId === sessionId
                  ? {
                      ...s,
                      messages: [...s.messages, newMsg],
                      lastAt: newMsg.at,
                    }
                  : s,
              )
            }
            return [...prev, { sessionId, messages: [newMsg], lastAt: newMsg.at }]
          })
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    })
    client.activate()
    stompRef.current = client
  }, [])

  useEffect(() => {
    connectLiveChat()
    return () => {
      if (stompRef.current) {
        stompRef.current.deactivate?.()
        stompRef.current = null
      }
      setConnected(false)
    }
  }, [connectLiveChat])

  const sendReply = () => {
    const text = replyText.trim()
    if (!text || !selectedSessionId || !stompRef.current?.connected) return
    stompRef.current.publish({
      destination: REPLY_DEST,
      body: JSON.stringify({ sessionId: selectedSessionId, text }),
    })
    setSessions((prev) =>
      prev.map((s) =>
        s.sessionId === selectedSessionId
          ? {
              ...s,
              messages: [...s.messages, { from: 'Bạn (Admin)', text, at: new Date().toISOString() }],
              lastAt: new Date().toISOString(),
            }
          : s,
      ),
    )
    setReplyText('')
  }

  const selectedSession = sessions.find((s) => s.sessionId === selectedSessionId)
  const sortedSessions = [...sessions].sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineChat className="h-6 w-6 text-amber-500" />
        <h1 className="text-xl font-semibold">Live Chat với khách hàng</h1>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            connected ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-stone-200 text-stone-500 dark:bg-slate-600 dark:text-slate-400',
          )}
        >
          {connected ? 'Đã kết nối' : 'Đang kết nối...'}
        </span>
      </div>

      <div
        className={cn(
          'grid min-h-[480px] gap-0 overflow-hidden rounded-2xl border',
          isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <div className="grid grid-cols-12">
          {/* Danh sách phiên chat */}
          <div
            className={cn(
              'col-span-4 flex flex-col border-r',
              isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-stone-50',
            )}
          >
            <div className="border-b p-3 font-medium">
              Phiên chat ({sessions.length})
            </div>
            <div className="flex-1 overflow-y-auto">
              {sortedSessions.length === 0 && (
                <p className="p-4 text-sm opacity-70">Chưa có tin nhắn nào. Khách bấm &quot;Gặp nhân viên&quot; trong chatbot sẽ xuất hiện ở đây.</p>
              )}
              {sortedSessions.map((s) => (
                <button
                  key={s.sessionId}
                  type="button"
                  onClick={() => setSelectedSessionId(s.sessionId)}
                  className={cn(
                    'w-full border-b p-3 text-left text-sm transition',
                    selectedSessionId === s.sessionId
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : isDark
                        ? 'border-slate-700 hover:bg-slate-700'
                        : 'border-stone-200 hover:bg-stone-100',
                  )}
                >
                  <span className="font-medium">Khách #{s.sessionId.slice(0, 8)}</span>
                  <span className="ml-1 text-xs opacity-70">
                    {s.messages.length} tin
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Khung chat đã chọn */}
          <div className="col-span-8 flex flex-col">
            {!selectedSession ? (
              <div className="flex flex-1 items-center justify-center text-sm opacity-60">
                Chọn một phiên chat bên trái
              </div>
            ) : (
              <>
                <div className="border-b p-3 font-medium">
                  Khách #{selectedSession.sessionId.slice(0, 8)}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedSession.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                        msg.from === 'Bạn (Admin)'
                          ? 'ml-auto bg-amber-500 text-white'
                          : isDark
                            ? 'bg-slate-700 text-slate-100'
                            : 'bg-stone-200 text-stone-800',
                      )}
                    >
                      <p className="text-xs opacity-80">{msg.from}</p>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t p-3 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                    placeholder="Nhập tin nhắn trả lời..."
                    className={cn(
                      'flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/30',
                      isDark
                        ? 'border-slate-600 bg-slate-800 text-white'
                        : 'border-stone-300 bg-white text-stone-900',
                    )}
                  />
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={!replyText.trim() || !connected}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiOutlinePaperAirplane className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

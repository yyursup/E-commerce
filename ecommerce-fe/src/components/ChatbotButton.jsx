import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChat, HiX, HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineReply } from 'react-icons/hi'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import chatbotService from '../services/chatbot'

const WS_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function formatPrice(value) {
  if (value == null) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ'
}

export default function ChatbotButton() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [options, setOptions] = useState([])
  const [inputExpected, setInputExpected] = useState(false)
  const [inputHint, setInputHint] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [liveChatMode, setLiveChatMode] = useState(false)
  const [liveChatConnected, setLiveChatConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const stompClientRef = useRef(null)
  const handoffSentRef = useRef(false)
  const liveChatSessionIdRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      inputRef.current?.focus()
    }
  }, [isOpen, messages, options])

  const handleToggle = () => {
    if (!isOpen && messages.length === 0) {
      setLoading(true)
      setError(null)
      chatbotService
        .init()
        .then((data) => {
          setMessages([
            {
              id: 'init',
              type: 'bot',
              text: data.messageText,
              productCards: data.productCards || [],
            },
          ])
          setOptions(data.options || [])
          setInputExpected(!!data.inputExpected)
          setInputHint(data.inputHint || '')
        })
        .catch((err) => {
          setError(err.response?.data?.message || err.message || 'Không kết nối được chatbot.')
          setMessages([
            {
              id: 'err',
              type: 'bot',
              text: 'Không thể tải chatbot. Bạn hãy thử lại sau hoặc liên hệ hỗ trợ.',
              productCards: [],
            },
          ])
        })
        .finally(() => setLoading(false))
    }
    setIsOpen(!isOpen)
  }

  const connectLiveChat = useCallback(() => {
    if (stompClientRef.current?.connected) return
    const sock = new SockJS(`${WS_BASE}/api/v1/ws-chat`, null, { withCredentials: true })
    const client = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 3000,
      onConnect: () => {
        setLiveChatConnected(true)
        const sessionId = liveChatSessionIdRef.current
        const replyTopic = sessionId ? `/topic/live-chat-reply/${sessionId}` : '/user/queue/chat'
        client.subscribe(replyTopic, (msg) => {
          const body = JSON.parse(msg.body || '{}')
          setMessages((prev) => [
            ...prev,
            {
              id: `admin-${Date.now()}`,
              type: 'bot',
              text: body.text || '',
              fromAdmin: true,
            },
          ])
        })
        if (!handoffSentRef.current) {
          client.publish({
            destination: '/app/chat',
            body: JSON.stringify({ text: 'Khách đã yêu cầu gặp nhân viên.' }),
          })
          handoffSentRef.current = true
        }
      },
      onDisconnect: () => setLiveChatConnected(false),
      onStompError: () => setLiveChatConnected(false),
    })
    client.activate()
    stompClientRef.current = client
  }, [])

  useEffect(() => {
    if (!isOpen || !liveChatMode) return
    connectLiveChat()
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate?.()
        stompClientRef.current = null
      }
      setLiveChatConnected(false)
    }
  }, [isOpen, liveChatMode, connectLiveChat])

  const sendInteraction = (payload) => {
    setLoading(true)
    setError(null)
    chatbotService
      .interact(payload)
      .then((data) => {
        if (data.messageText != null && data.messageText !== '') {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              type: 'bot',
              text: data.messageText,
              productCards: data.productCards || [],
            },
          ])
        }
        setOptions(data.options || [])
        setInputExpected(!!data.inputExpected)
        setInputHint(data.inputHint || '')
        if (data.humanHandoffRequired) {
          if (data.liveChatSessionId) liveChatSessionIdRef.current = data.liveChatSessionId
          setLiveChatMode(true)
          setInputExpected(true)
          setInputHint('Nhập tin nhắn gửi cho nhân viên hỗ trợ...')
          handoffSentRef.current = false
        } else {
          setLiveChatMode(false)
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra.')
      })
      .finally(() => setLoading(false))
  }

  const handleOptionClick = (opt) => {
    const userLabel = opt.buttonLabel
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, type: 'user', text: userLabel },
    ])
    const payload = { action: opt.actionPayload }
    if (opt.categoryId) payload.categoryId = opt.categoryId
    sendInteraction(payload)
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text) return

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, type: 'user', text },
    ])
    setInputValue('')

    if (liveChatMode && stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat',
        body: JSON.stringify({ text }),
      })
    } else {
      sendInteraction({ text })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleBackToMenu = () => {
    setLoading(true)
    setError(null)
    chatbotService
      .interact({ action: 'END_LIVE_CHAT' })
      .then((data) => {
        setLiveChatMode(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: 'bot',
            text: data.messageText || 'Bạn đã quay lại menu. Chọn một mục bên dưới.',
            productCards: data.productCards || [],
          },
        ])
        setOptions(data.options || [])
        setInputExpected(!!data.inputExpected)
        setInputHint(data.inputHint || '')
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Không thể quay lại menu.')
      })
      .finally(() => setLoading(false))
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        onClick={handleToggle}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl',
          isOpen
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700',
        )}
        aria-label="Mở chatbot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <HiX className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <HiOutlineChat className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[10px] font-bold text-white shadow-lg"
          >
            <HiOutlineSparkles className="h-3 w-3" />
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'fixed bottom-24 right-6 z-50 flex h-[520px] w-96 flex-col overflow-hidden rounded-2xl border shadow-2xl',
              isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between border-b p-4',
                isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-gradient-to-r from-amber-50 to-amber-100',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                    <HiOutlineSparkles className="h-5 w-5" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-800" />
                </div>
                <div>
                  <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                    {liveChatMode ? 'Chat với nhân viên' : 'Chatbot'}
                  </h3>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    {liveChatMode
                      ? (liveChatConnected ? 'Đã kết nối • Nhân viên sẽ phản hồi' : 'Đang kết nối...')
                      : 'Tìm sản phẩm & hỗ trợ'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading && messages.length === 0 && (
                <div className="flex justify-center py-8">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className={cn('h-2 w-2 rounded-full', isDark ? 'bg-slate-400' : 'bg-stone-400')}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex', msg.type === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5',
                        msg.type === 'user'
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-100' : 'bg-stone-100 text-stone-900',
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                      {msg.productCards && msg.productCards.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.productCards.slice(0, 4).map((card) => (
                            <a
                              key={card.id}
                              href={card.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                'flex gap-2 rounded-xl border p-2 text-left transition hover:opacity-90',
                                isDark ? 'border-slate-600 bg-slate-700' : 'border-stone-200 bg-white',
                              )}
                            >
                              {card.thumbnailUrl && (
                                <img
                                  src={card.thumbnailUrl}
                                  alt=""
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">{card.name}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">{formatPrice(card.basePrice)}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {options.length > 0 && !loading && (
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => (
                      <button
                        key={opt.actionPayload + (opt.categoryId || '')}
                        type="button"
                        onClick={() => handleOptionClick(opt)}
                        disabled={loading}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-xs font-medium transition disabled:opacity-50',
                          isDark
                            ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                            : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100',
                        )}
                      >
                        {opt.buttonLabel}
                      </button>
                    ))}
                  </div>
                )}

                {loading && messages.length > 0 && (
                  <div className="flex justify-start">
                    <div className={cn('rounded-2xl px-4 py-2.5', isDark ? 'bg-slate-800' : 'bg-stone-100')}>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className={cn('h-2 w-2 rounded-full', isDark ? 'bg-slate-400' : 'bg-stone-400')}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>

            <div
              className={cn(
                'border-t p-4',
                isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-stone-50',
              )}
            >
              {liveChatMode && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={handleBackToMenu}
                    disabled={loading}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-medium transition disabled:opacity-50',
                      isDark
                        ? 'border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600'
                        : 'border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200',
                    )}
                  >
                    <HiOutlineReply className="h-4 w-4" />
                    Quay lại menu
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={inputHint || 'Nhập tin nhắn...'}
                  disabled={loading}
                  className={cn(
                    'flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-700 text-white placeholder:text-slate-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                  )}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || loading}
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    'bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 hover:shadow-lg',
                  )}
                >
                  <HiOutlinePaperAirplane className="h-5 w-5" />
                </button>
              </div>
              {inputHint && (
                <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>{inputHint}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

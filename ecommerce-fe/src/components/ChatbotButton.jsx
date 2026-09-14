import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineChat, HiX, HiOutlinePaperAirplane, HiOutlineSparkles,
  HiOutlinePhotograph, HiOutlineUserGroup, HiOutlineVideoCamera,
  HiOutlinePencil, HiOutlineTrash, HiOutlineBell, HiCheck, HiDotsVertical,
} from 'react-icons/hi'
import { HiOutlineBellSlash } from 'react-icons/hi2'
import { Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import { getAccessToken } from '../lib/auth'
import chatbotService from '../services/chatbot'
import chatService from '../services/chatService'
import {
  createWebSocketConnection,
  addWebSocketListener,
  sendWebSocketMessage,
} from '../services/websocketService'
import { useChatNotification } from '../hooks/useChatNotification'
import ChatNotificationToast from './ChatNotificationToast'

function formatPrice(value) {
  if (value == null) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ'
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function ChatbotButton() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const user = useAuthStore((s) => s.user)
  const token = getAccessToken()
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('bot') // 'bot' | 'live'

  // --- BOT STATE ---
  const [botCurrentNodeId, setBotCurrentNodeId] = useState(null)
  const [botMessages, setBotMessages] = useState([])
  const [botOptions, setBotOptions] = useState([])
  const [inputExpected, setInputExpected] = useState(false)
  const [inputHint, setInputHint] = useState('')
  const [botInputValue, setBotInputValue] = useState('')
  const [botLoading, setBotLoading] = useState(false)
  const [botError, setBotError] = useState(null)

  // --- LIVE CHAT STATE ---
  const [supportThread, setSupportThread] = useState(null)
  const [liveMessages, setLiveMessages] = useState([])
  const [liveInputValue, setLiveInputValue] = useState('')
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveSending, setLiveSending] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [previewMedia, setPreviewMedia] = useState(null) // { url, type: 'image'|'video' }
  const [editingMsgId, setEditingMsgId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [hoveredMsgId, setHoveredMsgId] = useState(null)
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null)

  const botContainerRef = useRef(null)
  const liveContainerRef = useRef(null)
  const botInputRef = useRef(null)
  const liveInputRef = useRef(null)
  const editInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const adminTypingTimeoutRef = useRef(null)
  const supportThreadRef = useRef(supportThread)

  const { notifications, notifEnabled, addNotification, dismissNotification, toggleNotif } =
    useChatNotification()

  useEffect(() => {
    supportThreadRef.current = supportThread
  }, [supportThread])

  // Reset thread and messages when user/token changes (switching accounts)
  useEffect(() => {
    setSupportThread(null)
    supportThreadRef.current = null
    setLiveMessages([])
  }, [token, user?.id])

  // Click outside to close message options menu
  useEffect(() => {
    const handleDocClick = () => setActiveMenuMsgId(null)
    if (activeMenuMsgId) {
      document.addEventListener('click', handleDocClick)
      return () => document.removeEventListener('click', handleDocClick)
    }
  }, [activeMenuMsgId])

  const scrollToBottom = useCallback((smooth = true) => {
    if (activeTab === 'bot' && botContainerRef.current) {
      botContainerRef.current.scrollTo({
        top: botContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    } else if (activeTab === 'live' && liveContainerRef.current) {
      liveContainerRef.current.scrollTo({
        top: liveContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }, [activeTab])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false)
      if (activeTab === 'bot') {
        botInputRef.current?.focus()
      } else {
        liveInputRef.current?.focus()
      }
    }
  }, [isOpen, activeTab, botMessages, liveMessages, botOptions, adminTyping, scrollToBottom])

  // Toggle widget open/close
  const handleToggle = () => {
    if (!isOpen && botMessages.length === 0) {
      setBotLoading(true)
      setBotError(null)
      chatbotService
        .init()
        .then((data) => {
          if (data.currentNodeId) {
            setBotCurrentNodeId(data.currentNodeId)
          }
          setBotMessages([
            {
              id: 'init',
              type: 'bot',
              text: data.messageText,
              productCards: data.productCards || [],
            },
          ])
          setBotOptions(data.options || [])
          setInputExpected(!!data.inputExpected)
          setInputHint(data.inputHint || '')
        })
        .catch((err) => {
          setBotError(err.response?.data?.message || err.message || 'Không kết nối được chatbot.')
          setBotMessages([
            {
              id: 'err',
              type: 'bot',
              text: 'Không thể tải chatbot. Bạn hãy thử lại sau hoặc chuyển sang tab Hỗ trợ trực tuyến.',
              productCards: [],
            },
          ])
        })
        .finally(() => setBotLoading(false))
    }
    setIsOpen(!isOpen)
  }

  // --- LIVE CHAT LOGIC ---
  const initLiveChat = useCallback(async () => {
    if (!token) return
    try {
      setLiveLoading(true)
      createWebSocketConnection(token)

      // Fetch or create customer support thread
      const thread = await chatService.getOrCreateSupportThread()

      // *** Fix race condition: update ref IMMEDIATELY (sync) before setState ***
      // This ensures WebSocket messages that arrive during getMessages() fetch
      // are NOT dropped by the CHAT_MESSAGE listener (which reads supportThreadRef)
      supportThreadRef.current = thread
      setSupportThread(thread)

      // Fetch messages for thread
      if (thread?.id) {
        const pageRes = await chatService.getMessages(thread.id, 0, 50)
        const rawList = pageRes?.content ? [...pageRes.content].reverse() : []
        const unique = []
        const seenIds = new Set()
        for (const m of rawList) {
          const key = String(m.id).toLowerCase()
          if (!seenIds.has(key)) {
            seenIds.add(key)
            unique.push(m)
          }
        }
        setLiveMessages(unique)
        chatService.markRead(thread.id).catch(() => {})
      }
    } catch (err) {
      console.error('Lỗi khởi tạo Live Chat:', err)
    } finally {
      setLiveLoading(false)
    }
  }, [token])

  // Connect WebSocket when token is available so customer receives notifications even when widget is closed
  useEffect(() => {
    if (token) {
      createWebSocketConnection(token)
    }
  }, [token])

  useEffect(() => {
    if (isOpen && activeTab === 'live' && token) {
      initLiveChat()
    }
  }, [isOpen, activeTab, token, initLiveChat])

  // Listen to WebSocket events
  useEffect(() => {
    if (!token) return

    const unregMsg = addWebSocketListener('CHAT_MESSAGE', (msg) => {
      if (!msg) return
      const currentThread = supportThreadRef.current
      if (
        currentThread?.id &&
        String(msg.threadId).toLowerCase() === String(currentThread.id).toLowerCase()
      ) {
        setLiveMessages((prev) => {
          if (prev.some((m) => String(m.id).toLowerCase() === String(msg.id).toLowerCase())) return prev
          if (msg.messageType === 'IMAGE' && msg.imageUrl && prev.some((m) => m.imageUrl === msg.imageUrl)) return prev
          if (msg.messageType === 'VIDEO' && msg.videoUrl && prev.some((m) => m.videoUrl === msg.videoUrl)) return prev
          const tempIdx = prev.findIndex(
            (m) => String(m.id).startsWith('temp-') && m.content === msg.content,
          )
          if (tempIdx !== -1) {
            const next = [...prev]; next[tempIdx] = msg; return next
          }
          return [...prev, msg]
        })
        chatService.markRead(currentThread.id).catch(() => {})
      }

      // Show notification only for admin messages sent to this customer's thread when widget is closed or on bot tab
      const isSelf = user?.id && String(msg.senderId).toLowerCase() === String(user.id).toLowerCase()
      const isForMe =
        (currentThread?.id && String(msg.threadId).toLowerCase() === String(currentThread.id).toLowerCase()) ||
        (user?.id && msg.recipientId && String(msg.recipientId).toLowerCase() === String(user.id).toLowerCase())
      if (!isSelf && msg.senderRole !== 'CUSTOMER' && isForMe && (!isOpen || activeTab !== 'live')) {
        addNotification(msg)
      }
    })

    const unregEdited = addWebSocketListener('CHAT_MESSAGE_EDITED', (updated) => {
      if (!updated) return
      setLiveMessages((prev) =>
        prev.map((m) => String(m.id).toLowerCase() === String(updated.id).toLowerCase() ? updated : m)
      )
    })

    const unregDeleted = addWebSocketListener('CHAT_MESSAGE_DELETED', (payload) => {
      if (!payload) return
      setLiveMessages((prev) =>
        prev.map((m) =>
          String(m.id).toLowerCase() === String(payload.messageId).toLowerCase()
            ? { ...m, isDeleted: true, content: '[Tin nhắn đã bị xóa]' }
            : m
        )
      )
    })

    const unregTyping = addWebSocketListener('CHAT_TYPING', (data) => {
      const currentThread = supportThreadRef.current
      if (
        data &&
        currentThread?.id &&
        String(data.threadId).toLowerCase() === String(currentThread.id).toLowerCase()
      ) {
        setAdminTyping(data.typing)
        if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current)
        if (data.typing) {
          adminTypingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 3000)
        }
      }
    })

    return () => {
      unregMsg()
      unregEdited()
      unregDeleted()
      unregTyping()
    }
  }, [token, addNotification, isOpen, activeTab])

  // Handle Send Live Chat message
  const handleLiveSend = async (e) => {
    e?.preventDefault()
    const content = liveInputValue.trim()
    const threadId = supportThread?.id || supportThreadRef.current?.id
    if (!content || !threadId || liveSending) return

    const tempId = 'temp-' + Date.now()
    const optimisticMsg = {
      id: tempId,
      threadId: threadId,
      senderId: user?.id,
      senderName: user?.username || user?.email || 'Khách hàng',
      senderRole: 'CUSTOMER',
      content,
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
    }

    try {
      setLiveSending(true)
      setLiveMessages((prev) => [...prev, optimisticMsg])
      setLiveInputValue('')

      const sentViaWs = sendWebSocketMessage('CHAT_SEND', {
        threadId: threadId,
        content,
      })

      if (!sentViaWs) {
        const newMsg = await chatService.sendMessage(threadId, content)
        setLiveMessages((prev) => {
          const next = prev.filter((m) => m.id !== tempId)
          return [...next, newMsg]
        })
      }

      sendWebSocketMessage('CHAT_TYPING', {
        threadId: threadId,
        isTyping: false,
      })
    } catch (err) {
      console.error('Lỗi gửi tin nhắn live chat:', err)
      setLiveMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setLiveSending(false)
    }
  }

  const handleLiveInputChange = (e) => {
    const val = e.target.value
    setLiveInputValue(val)
    const threadId = supportThread?.id || supportThreadRef.current?.id
    if (threadId) {
      sendWebSocketMessage('CHAT_TYPING', {
        threadId,
        isTyping: val.length > 0,
      })
    }
  }

  // Handle Live Chat Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    const threadId = supportThread?.id || supportThreadRef.current?.id
    if (!file || !threadId || liveSending) return
    try {
      setLiveSending(true)
      const newMsg = await chatService.sendImage(threadId, file)
      setLiveMessages((prev) => {
        if (!newMsg) return prev
        if (prev.some((m) => String(m.id).toLowerCase() === String(newMsg.id).toLowerCase())) return prev
        if (newMsg.imageUrl && prev.some((m) => m.imageUrl === newMsg.imageUrl)) return prev
        return [...prev, newMsg]
      })
    } catch (err) { console.error('Lỗi tải ảnh:', err) }
    finally { setLiveSending(false) }
  }

  // Handle Live Chat Video Upload
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (videoInputRef.current) videoInputRef.current.value = ''
    const threadId = supportThread?.id || supportThreadRef.current?.id
    if (!file || !threadId || liveSending) return
    if (file.size > 50 * 1024 * 1024) { alert('Video tối đa 50MB'); return }
    try {
      setLiveSending(true)
      const newMsg = await chatService.sendVideo(threadId, file)
      setLiveMessages((prev) => {
        if (!newMsg) return prev
        if (prev.some((m) => String(m.id).toLowerCase() === String(newMsg.id).toLowerCase())) return prev
        if (newMsg.videoUrl && prev.some((m) => m.videoUrl === newMsg.videoUrl)) return prev
        return [...prev, newMsg]
      })
    } catch (err) { console.error('Lỗi tải video:', err) }
    finally { setLiveSending(false) }
  }

  // Handle Edit Message
  const handleStartEdit = (m) => {
    setEditingMsgId(String(m.id))
    setEditingContent(m.content)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }
  const handleSaveEdit = async () => {
    if (!editingMsgId || !editingContent.trim()) return
    try {
      const updated = await chatService.editMessage(editingMsgId, editingContent.trim())
      setLiveMessages((prev) => prev.map((m) => String(m.id) === editingMsgId ? updated : m))
    } catch (err) { console.error('Lỗi sửa tin nhắn:', err) }
    finally { setEditingMsgId(null); setEditingContent('') }
  }
  const handleCancelEdit = () => { setEditingMsgId(null); setEditingContent('') }

  // Handle Delete Message
  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) return
    try {
      await chatService.deleteMessage(msgId)
      setLiveMessages((prev) =>
        prev.map((m) => String(m.id) === String(msgId) ? { ...m, isDeleted: true, content: '[Tin nhắn đã bị xóa]' } : m)
      )
    } catch (err) { console.error('Lỗi xóa tin nhắn:', err) }
  }

  // Open live chat from notification
  const handleNotifOpen = useCallback(() => {
    setIsOpen(true)
    setActiveTab('live')
  }, [])

  // --- BOT LOGIC ---
  const sendBotInteraction = (payload) => {
    setBotLoading(true)
    setBotError(null)
    const fullPayload = {
      currentNodeId: botCurrentNodeId,
      ...payload,
    }
    chatbotService
      .interact(fullPayload)
      .then((data) => {
        if (data.currentNodeId) {
          setBotCurrentNodeId(data.currentNodeId)
        }
        if (data.messageText != null && data.messageText !== '') {
          setBotMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              type: 'bot',
              text: data.messageText,
              productCards: data.productCards || [],
            },
          ])
        }
        setBotOptions(data.options || [])
        setInputExpected(!!data.inputExpected)
        setInputHint(data.inputHint || '')

        // If handoff required, switch directly to live chat!
        if (data.humanHandoffRequired) {
          setActiveTab('live')
        }
      })
      .catch((err) => {
        setBotError(err.response?.data?.message || err.message || 'Có lỗi xảy ra.')
      })
      .finally(() => setBotLoading(false))
  }

  const handleBotOptionClick = (opt) => {
    setBotMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, type: 'user', text: opt.buttonLabel },
    ])
    if (opt.actionPayload === 'HANDOFF_LIVE_CHAT' || opt.actionPayload === 'HUMAN_HANDOFF') {
      setActiveTab('live')
      return
    }
    const payload = { action: opt.actionPayload, currentNodeId: botCurrentNodeId }
    if (opt.categoryId) payload.categoryId = opt.categoryId
    sendBotInteraction(payload)
  }

  const handleBotSend = () => {
    const text = botInputValue.trim()
    if (!text) return
    setBotMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, type: 'user', text },
    ])
    setBotInputValue('')
    sendBotInteraction({ text, currentNodeId: botCurrentNodeId })
  }

  // Do not render customer chatbot widget or toast inside admin panels
  if (location.pathname.startsWith('/admin')) {
    return null
  }

  return (
    <>
      {/* Notification toasts */}
      <ChatNotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onOpen={handleNotifOpen}
      />

      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        onClick={handleToggle}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl',
          isOpen
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700',
        )}
        aria-label="Mở chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HiX className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HiOutlineChat className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow"
          >
            <HiOutlineSparkles className="h-3 w-3" />
          </motion.div>
        )}
      </motion.button>

      {/* Chat Window Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'fixed bottom-24 right-6 z-50 flex h-[580px] w-[400px] flex-col overflow-hidden rounded-2xl border shadow-2xl',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            {/* Top Bar with Tab Selector */}
            <div
              className={cn(
                'flex flex-col border-b px-4 pt-3 pb-2',
                isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-amber-500 text-white',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <HiOutlineChat className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-tight">Trung tâm Trợ giúp</h3>
                    <p className="text-[11px] opacity-80">Trực tuyến 24/7</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Notification toggle bell */}
                  <button
                    type="button"
                    onClick={toggleNotif}
                    className="rounded-lg p-1.5 hover:bg-white/10 transition"
                    title={notifEnabled ? 'Tắt thông báo' : 'Bật thông báo'}
                  >
                    {notifEnabled
                      ? <HiOutlineBell className="h-4 w-4" />
                      : <HiOutlineBellSlash className="h-4 w-4 opacity-60" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1 hover:bg-white/10"
                  >
                    <HiX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-3 flex rounded-xl bg-black/10 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('bot')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition',
                    activeTab === 'bot'
                      ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-800 dark:text-amber-400'
                      : 'text-white/80 hover:text-white',
                  )}
                >
                  <HiOutlineSparkles className="h-4 w-4" />
                  Trợ lý AI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('live')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition',
                    activeTab === 'live'
                      ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-800 dark:text-amber-400'
                      : 'text-white/80 hover:text-white',
                  )}
                >
                  <HiOutlineUserGroup className="h-4 w-4" />
                  Hỗ trợ Trực tuyến
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'bot' ? (
              /* --- BOT TAB --- */
              <>
                <div ref={botContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {botLoading && botMessages.length === 0 && (
                    <div className="flex justify-center py-8">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={cn('h-2 w-2 rounded-full animate-bounce', isDark ? 'bg-slate-400' : 'bg-stone-400')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {botMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn('flex', msg.type === 'user' ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                          msg.type === 'user'
                            ? 'rounded-tr-xs bg-amber-500 text-white'
                            : isDark ? 'rounded-tl-xs bg-slate-800 text-slate-100 border border-slate-700' : 'rounded-tl-xs bg-stone-100 text-stone-900 border border-stone-200',
                        )}
                      >
                        <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
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
                                  isDark ? 'border-slate-700 bg-slate-750' : 'border-stone-200 bg-white',
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
                                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{formatPrice(card.basePrice)}</p>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {botOptions.length > 0 && !botLoading && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {botOptions.map((opt) => (
                        <button
                          key={opt.actionPayload + (opt.categoryId || '')}
                          type="button"
                          onClick={() => handleBotOptionClick(opt)}
                          className={cn(
                            'rounded-xl border px-3 py-1.5 text-xs font-medium transition',
                            opt.actionPayload === 'HANDOFF_LIVE_CHAT'
                              ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                              : isDark
                                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100',
                          )}
                        >
                          {opt.buttonLabel}
                        </button>
                      ))}
                    </div>
                  )}


                  {botError && <p className="text-xs text-rose-500">{botError}</p>}
                </div>


                <div
                  className={cn(
                    'border-t p-3',
                    isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-stone-50',
                  )}
                >
                  <div className="flex gap-2">
                    <input
                      ref={botInputRef}
                      type="text"
                      value={botInputValue}
                      onChange={(e) => setBotInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleBotSend()}
                      placeholder={inputHint || 'Nhập tin nhắn...'}
                      disabled={botLoading}
                      className={cn(
                        'flex-1 rounded-xl border px-3.5 py-2 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20',
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-white placeholder:opacity-50'
                          : 'border-stone-300 bg-white text-stone-900 placeholder:opacity-50',
                      )}
                    />
                    <button
                      type="button"
                      onClick={handleBotSend}
                      disabled={!botInputValue.trim() || botLoading}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40"
                    >
                      <HiOutlinePaperAirplane className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* --- LIVE CHAT TAB --- */
              <>
                {!token ? (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-3">
                      <HiOutlineUserGroup className="h-7 w-7" />
                    </div>
                    <h4 className="font-bold text-sm">Yêu cầu đăng nhập</h4>
                    <p className="mt-1 text-xs opacity-70 leading-relaxed max-w-xs">
                      Vui lòng đăng nhập vào tài khoản để trò chuyện trực tiếp với nhân viên hỗ trợ và lưu lịch sử cuộc hội thoại.
                    </p>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="mt-4 inline-flex rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow hover:bg-amber-600 transition"
                    >
                      Đăng nhập ngay
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Live messages container */}
                    <div ref={liveContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                      {liveLoading ? (
                        <div className="p-8 text-center text-xs opacity-60">Đang tải lịch sử hỗ trợ...</div>
                      ) : liveMessages.length === 0 ? (
                        <div className="p-6 text-center text-xs opacity-60 leading-relaxed">
                          Chào {user?.username || user?.email || 'bạn'}! Bạn đang kết nối với kênh hỗ trợ trực tuyến. Hãy gửi tin nhắn hoặc hình ảnh, nhân viên sẽ phản hồi bạn ngay.
                        </div>
                      ) : (
                        liveMessages.map((m) => {
                          const isMe = m.senderRole === 'CUSTOMER'
                          const isEditing = editingMsgId === String(m.id)
                          const isHovered = hoveredMsgId === String(m.id)
                          return (
                            <div
                              key={m.id || m.createdAt}
                              className={cn('flex flex-col relative', isMe ? 'items-end' : 'items-start')}
                              onMouseEnter={() => setHoveredMsgId(String(m.id))}
                              onMouseLeave={() => setHoveredMsgId(null)}
                            >
                              <span className="text-[10px] mb-0.5 px-1 opacity-60">
                                {m.senderName} • {formatTime(m.createdAt)}{m.editedAt && ' (đã sửa)'}
                              </span>

                              {isEditing ? (
                                <div className="flex w-full max-w-[85%] gap-1">
                                  <input
                                    ref={editInputRef}
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit() }}
                                    className={cn('flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/30',
                                      isDark ? 'border-slate-600 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                                    )}
                                  />
                                  <button onClick={handleSaveEdit} className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600"><HiCheck className="h-4 w-4" /></button>
                                  <button onClick={handleCancelEdit} className={cn('flex h-9 w-9 items-center justify-center rounded-xl border', isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-stone-300 hover:bg-stone-100')}><HiX className="h-4 w-4" /></button>
                                </div>
                              ) : (
                                <div className={cn('flex items-center gap-1.5 max-w-[85%]', isMe ? 'flex-row' : 'flex-row-reverse')}>
                                  {/* Messenger 3-dots action button */}
                                  {isMe && !m.isDeleted && (
                                    <div className="relative shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setActiveMenuMsgId(activeMenuMsgId === String(m.id) ? null : String(m.id))
                                        }}
                                        className={cn(
                                          'flex h-7 w-7 items-center justify-center rounded-full transition',
                                          activeMenuMsgId === String(m.id)
                                            ? (isDark ? 'bg-slate-700 text-white' : 'bg-stone-200 text-stone-800')
                                            : (isHovered ? 'opacity-100' : 'opacity-0'),
                                          isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-stone-200 text-stone-500'
                                        )}
                                        title="Tùy chọn tin nhắn"
                                      >
                                        <HiDotsVertical className="h-4 w-4" />
                                      </button>

                                      {/* Popover menu */}
                                      {activeMenuMsgId === String(m.id) && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className={cn(
                                            'absolute bottom-full mb-1.5 z-40 min-w-[130px] rounded-xl border p-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95',
                                            isMe ? 'right-0' : 'left-0',
                                            isDark
                                              ? 'border-slate-700 bg-slate-800/95 text-slate-200 shadow-black/40'
                                              : 'border-stone-200 bg-white/95 text-stone-800 shadow-stone-400/25'
                                          )}
                                        >
                                          {m.messageType === 'TEXT' && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveMenuMsgId(null)
                                                handleStartEdit(m)
                                              }}
                                              className={cn(
                                                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition text-left',
                                                isDark ? 'hover:bg-slate-700' : 'hover:bg-stone-100'
                                              )}
                                            >
                                              <HiOutlinePencil className="h-3.5 w-3.5" />
                                              <span>Chỉnh sửa</span>
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuMsgId(null)
                                              handleDeleteMsg(m.id)
                                            }}
                                            className={cn(
                                              'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition text-left text-rose-600 dark:text-rose-400',
                                              isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'
                                            )}
                                          >
                                            <HiOutlineTrash className="h-3.5 w-3.5" />
                                            <span>Xóa tin nhắn</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Message Bubble */}
                                  <div
                                    className={cn(
                                      'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                                      isMe
                                        ? 'rounded-tr-xs bg-amber-500 text-white'
                                        : isDark
                                          ? 'rounded-tl-xs bg-slate-800 text-slate-100 border border-slate-700'
                                          : 'rounded-tl-xs bg-stone-100 text-stone-900 border border-stone-200',
                                      (m.messageType === 'IMAGE' || m.messageType === 'VIDEO') && 'p-1.5 overflow-hidden',
                                      m.isDeleted && 'opacity-50 italic',
                                    )}
                                  >
                                    {m.messageType === 'IMAGE' ? (
                                      <div className="space-y-1">
                                        <img
                                          src={m.imageUrl}
                                          alt="Ảnh"
                                          onLoad={() => scrollToBottom(false)}
                                          onClick={() => setPreviewMedia({ url: m.imageUrl, type: 'image' })}
                                          className="max-h-44 max-w-full rounded-xl object-contain cursor-pointer transition hover:opacity-90 shadow-sm"
                                        />
                                        {m.content && m.content !== '[Hình ảnh]' && (
                                          <p className="px-2 py-1 text-xs whitespace-pre-wrap">{m.content}</p>
                                        )}
                                      </div>
                                    ) : m.messageType === 'VIDEO' ? (
                                      <video
                                        src={m.videoUrl}
                                        controls
                                        onLoadedData={() => scrollToBottom(false)}
                                        className="max-h-44 max-w-full rounded-xl object-contain shadow-sm"
                                      />
                                    ) : (
                                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}

                      {adminTyping && (
                        <div className="flex items-center gap-1.5 text-xs opacity-60 px-2 py-1">
                          <span className="animate-bounce">●</span>
                          <span className="animate-bounce [animation-delay:0.2s]">●</span>
                          <span className="animate-bounce [animation-delay:0.4s]">●</span>
                          <span>Nhân viên hỗ trợ đang soạn tin...</span>
                        </div>
                      )}
                    </div>


                    {/* Live input bar */}
                    <form
                      onSubmit={handleLiveSend}
                      className={cn(
                        'flex items-center gap-2 border-t p-3',
                        isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-stone-50',
                      )}
                    >
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      <input type="file" ref={videoInputRef} onChange={handleVideoUpload} accept="video/*" className="hidden" />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={liveSending}
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition',
                          isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                            : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100',
                        )}
                        title="Đính kèm ảnh"
                      >
                        <HiOutlinePhotograph className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={liveSending}
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition',
                          isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                            : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100',
                        )}
                        title="Đính kèm video (max 50MB)"
                      >
                        <HiOutlineVideoCamera className="h-4 w-4" />
                      </button>

                      <input
                        ref={liveInputRef}
                        type="text"
                        value={liveInputValue}
                        onChange={handleLiveInputChange}
                        placeholder="Nhắn tin cho nhân viên..."
                        disabled={liveSending}
                        className={cn(
                          'flex-1 rounded-xl border px-3.5 py-2 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20',
                          isDark
                            ? 'border-slate-700 bg-slate-800 text-white placeholder:opacity-50'
                            : 'border-stone-300 bg-white text-stone-900 placeholder:opacity-50',
                        )}
                      />

                      <button
                        type="submit"
                        disabled={!liveInputValue.trim() || liveSending}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40"
                      >
                        <HiOutlinePaperAirplane className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox for Image/Video Preview */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            {previewMedia.type === 'video' ? (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] rounded-xl shadow-2xl"
              />
            ) : (
              <img src={previewMedia.url} alt="Xem ảnh" className="max-h-[85vh] rounded-xl object-contain shadow-2xl" />
            )}
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-900 shadow hover:bg-stone-200"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

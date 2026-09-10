import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  HiOutlineChat,
  HiOutlinePaperAirplane,
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineDotsVertical,
  HiX,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import { getAccessToken } from '../../lib/auth'
import chatService from '../../services/chatService'
import {
  createWebSocketConnection,
  addWebSocketListener,
  sendWebSocketMessage,
} from '../../services/websocketService'

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

export default function AdminLiveChat() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const currentAccount = useAuthStore((s) => s.account)
  const [threads, setThreads] = useState([])
  const [selectedThreadId, setSelectedThreadId] = useState(() => {
    return sessionStorage.getItem('admin_selected_thread_id') || null
  })
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [connected, setConnected] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  const messagesContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const selectedThread = useMemo(() => {
    if (!selectedThreadId || !threads.length) return null
    return (
      threads.find(
        (t) => String(t.id).toLowerCase() === String(selectedThreadId).toLowerCase(),
      ) || null
    )
  }, [threads, selectedThreadId])

  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }, [])

  const handleSelectThread = useCallback((id) => {
    setSelectedThreadId(id)
    if (id) {
      sessionStorage.setItem('admin_selected_thread_id', id)
    } else {
      sessionStorage.removeItem('admin_selected_thread_id')
    }
  }, [])

  // Load thread list
  const loadThreads = useCallback(async () => {
    try {
      setLoadingThreads(true)
      const data = await chatService.getThreads()
      const list = data || []
      setThreads(list)
      setSelectedThreadId((prev) => {
        const savedId = sessionStorage.getItem('admin_selected_thread_id')
        if (savedId && list.some((t) => String(t.id).toLowerCase() === String(savedId).toLowerCase())) {
          return savedId
        }
        if (prev && list.some((t) => String(t.id).toLowerCase() === String(prev).toLowerCase())) {
          return prev
        }
        return list.length > 0 ? list[0].id : null
      })
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại:', err)
      toast.error('Không thể tải danh sách chat')
    } finally {
      setLoadingThreads(false)
    }
  }, [])

  // Load messages for selected thread
  const loadMessages = useCallback(async (threadId) => {
    if (!threadId) return
    try {
      setLoadingMessages(true)
      const res = await chatService.getMessages(threadId, 0, 50)
      // Reverse because content is sorted desc in backend for pagination
      const rawList = res?.content ? [...res.content].reverse() : []
      // Deduplicate messages by ID to prevent any duplicate rendering
      const uniqueList = []
      const seenIds = new Set()
      for (const m of rawList) {
        const key = String(m.id).toLowerCase()
        if (!seenIds.has(key)) {
          seenIds.add(key)
          uniqueList.push(m)
        }
      }
      setMessages(uniqueList)

      // Mark as read
      await chatService.markRead(threadId)
      setThreads((prev) =>
        prev.map((t) =>
          String(t.id).toLowerCase() === String(threadId).toLowerCase()
            ? { ...t, unreadCount: 0 }
            : t,
        ),
      )
    } catch (err) {
      console.error('Lỗi khi tải tin nhắn:', err)
      toast.error('Không thể tải tin nhắn')
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const selectedThreadIdRef = useRef(selectedThreadId)
  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId
  }, [selectedThreadId])

  // Initialize WebSocket & Data
  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      createWebSocketConnection(token)
    }

    loadThreads()

    const unregConnect = addWebSocketListener('CONNECT', () => setConnected(true))
    const unregDisconnect = addWebSocketListener('DISCONNECT', () => setConnected(false))

    const unregMessage = addWebSocketListener('CHAT_MESSAGE', (msg) => {
      if (!msg) return

      const currentSelected = selectedThreadIdRef.current
      const belongsToCurrent =
        currentSelected &&
        String(msg.threadId).toLowerCase() === String(currentSelected).toLowerCase()

      // If belongs to currently opened thread
      if (belongsToCurrent) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id).toLowerCase() === String(msg.id).toLowerCase())) return prev
          if (msg.messageType === 'IMAGE' && msg.imageUrl && prev.some((m) => m.imageUrl === msg.imageUrl)) return prev
          // Reconcile optimistic temp message
          const tempIdx = prev.findIndex(
            (m) => String(m.id).startsWith('temp-') && m.content === msg.content,
          )
          if (tempIdx !== -1) {
            const next = [...prev]
            next[tempIdx] = msg
            return next
          }
          return [...prev, msg]
        })
        chatService.markRead(currentSelected).catch(() => {})
      }

      // Update thread list preview & unread count
      setThreads((prev) => {
        const idx = prev.findIndex(
          (t) => String(t.id).toLowerCase() === String(msg.threadId).toLowerCase(),
        )
        if (idx !== -1) {
          const updated = {
            ...prev[idx],
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount:
              String(msg.threadId).toLowerCase() === String(selectedThreadIdRef.current).toLowerCase()
                ? 0
                : (prev[idx].unreadCount || 0) + (msg.senderRole === 'CUSTOMER' ? 1 : 0),
          }
          const next = [...prev]
          next.splice(idx, 1)
          return [updated, ...next]
        } else {
          // Refresh threads if new thread appeared
          chatService.getThreads().then((d) => setThreads(d || []))
          return prev
        }
      })
    })

    const unregThreadUpdated = addWebSocketListener('CHAT_THREAD_UPDATED', (updatedThread) => {
      if (!updatedThread) return
      setThreads((prev) => {
        const filtered = prev.filter(
          (t) => String(t.id).toLowerCase() !== String(updatedThread.id).toLowerCase(),
        )
        return [updatedThread, ...filtered]
      })
    })

    const unregThreadNew = addWebSocketListener('CHAT_THREAD_NEW', () => {
      loadThreads()
    })

    const unregTyping = addWebSocketListener('CHAT_TYPING', (typingData) => {
      const currentSelected = selectedThreadIdRef.current
      if (
        typingData &&
        currentSelected &&
        String(typingData.threadId).toLowerCase() === String(currentSelected).toLowerCase()
      ) {
        setPartnerTyping(typingData.typing)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        if (typingData.typing) {
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000)
        }
      }
    })

    return () => {
      unregConnect()
      unregDisconnect()
      unregMessage()
      unregThreadUpdated()
      unregThreadNew()
      unregTyping()
    }
  }, [loadThreads])

  // Reload messages when selected thread changes
  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId)
      setPartnerTyping(false)
    }
  }, [selectedThreadId, loadMessages])

  useEffect(() => {
    scrollToBottom(false)
  }, [messages, partnerTyping, scrollToBottom])

  // Handle typing debounce to send to client
  const handleInputChange = (e) => {
    const val = e.target.value
    setReplyText(val)

    if (selectedThreadId) {
      sendWebSocketMessage('CHAT_TYPING', {
        threadId: selectedThreadId,
        isTyping: val.length > 0,
        recipientId: selectedThread?.customerId,
      })
    }
  }

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault()
    const content = replyText.trim()
    if (!content || !selectedThreadId || sending) return

    const tempId = 'temp-' + Date.now()
    const optimisticMsg = {
      id: tempId,
      threadId: selectedThreadId,
      senderId: currentAccount?.id,
      senderName: 'Hỗ trợ viên (' + (currentAccount?.username || 'admin') + ')',
      senderRole: 'ADMIN',
      content,
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
    }

    // Optimistically show message immediately on admin screen
    setMessages((prev) => [...prev, optimisticMsg])
    setReplyText('')

    // Optimistically update thread preview in sidebar
    setThreads((prev) => {
      const idx = prev.findIndex(
        (t) => String(t.id).toLowerCase() === String(selectedThreadId).toLowerCase(),
      )
      if (idx !== -1) {
        const updated = {
          ...prev[idx],
          lastMessage: content,
          lastMessageAt: optimisticMsg.createdAt,
        }
        const next = [...prev]
        next.splice(idx, 1)
        return [updated, ...next]
      }
      return prev
    })

    try {
      setSending(true)
      // Send via WebSocket if connected, fallback to REST
      const sentViaWs = sendWebSocketMessage('CHAT_SEND', {
        threadId: selectedThreadId,
        content,
        recipientId: selectedThread?.customerId,
      })

      if (!sentViaWs) {
        const newMsg = await chatService.sendMessage(selectedThreadId, content, selectedThread?.customerId)
        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== tempId)
          return [...next, newMsg]
        })
      }

      // Stop typing
      sendWebSocketMessage('CHAT_TYPING', {
        threadId: selectedThreadId,
        isTyping: false,
        recipientId: selectedThread?.customerId,
      })
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err)
      toast.error('Không thể gửi tin nhắn')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  // Send image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file || !selectedThreadId || sending) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
      return
    }

    try {
      setSending(true)
      toast.loading('Đang tải ảnh...', { id: 'uploading' })
      const newMsg = await chatService.sendImage(selectedThreadId, file)
      setMessages((prev) => {
        if (!newMsg) return prev
        if (prev.some((m) => String(m.id).toLowerCase() === String(newMsg.id).toLowerCase())) return prev
        if (newMsg.imageUrl && prev.some((m) => m.imageUrl === newMsg.imageUrl)) return prev
        return [...prev, newMsg]
      })
      toast.success('Đã gửi ảnh', { id: 'uploading' })
    } catch (err) {
      console.error('Lỗi tải ảnh:', err)
      toast.error('Không thể gửi hình ảnh', { id: 'uploading' })
    } finally {
      setSending(false)
    }
  }

  const handleCloseThread = async () => {
    if (!selectedThreadId) return
    try {
      await chatService.closeThread(selectedThreadId)
      toast.success('Đã đóng cuộc hội thoại')
      loadThreads()
    } catch (err) {
      toast.error('Không thể đóng cuộc hội thoại')
    }
  }

  const filteredThreads = threads.filter(
    (t) =>
      (t.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[580px] max-h-[850px] space-y-3">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <HiOutlineChat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Trung tâm Hỗ trợ Trực tuyến</h1>
            <p className="text-xs opacity-70">
              Quản lý các cuộc hội thoại khách hàng theo luồng realtime
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              connected
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500',
              )}
            />
            {connected ? 'WebSocket Trực tuyến' : 'Mất kết nối WebSocket'}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={cn(
          'grid flex-1 min-h-0 grid-cols-12 overflow-hidden rounded-2xl border shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        {/* Left: Threads List */}
        <div
          className={cn(
            'col-span-12 md:col-span-5 lg:col-span-4 flex flex-col h-full min-h-0 border-r',
            isDark ? 'border-slate-800 bg-slate-900/50' : 'border-stone-200 bg-stone-50/50',
          )}
        >
          {/* Search Box */}
          <div className="shrink-0 p-3 border-b border-inherit">
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-white',
              )}
            >
              <HiOutlineSearch className="h-4 w-4 opacity-50" />
              <input
                type="text"
                placeholder="Tìm khách hàng hoặc tin nhắn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent outline-none placeholder:opacity-50"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')}>
                  <HiX className="h-4 w-4 opacity-50 hover:opacity-100" />
                </button>
              )}
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-inherit">
            {loadingThreads ? (
              <div className="p-8 text-center text-sm opacity-60">
                Đang tải danh sách cuộc hội thoại...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-sm opacity-60">
                Không tìm thấy cuộc hội thoại nào.
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected =
                  String(t.id).toLowerCase() === String(selectedThreadId).toLowerCase()
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectThread(t.id)}
                    className={cn(
                      'flex w-full items-start gap-3 p-3.5 text-left transition-colors',
                      isSelected
                        ? isDark
                          ? 'bg-amber-500/15 text-white'
                          : 'bg-amber-50 text-stone-900'
                        : isDark
                          ? 'hover:bg-slate-800/60 text-slate-200'
                          : 'hover:bg-stone-100 text-stone-700',
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 font-bold text-white text-base overflow-hidden">
                        {t.customerAvatar ? (
                          <img
                            src={t.customerAvatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (t.customerName || 'K')[0].toUpperCase()
                        )}
                      </div>
                      {t.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow">
                          {t.unreadCount > 99 ? '99+' : t.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-semibold text-sm">
                          {t.customerName || 'Khách hàng'}
                        </span>
                        <span className="text-[11px] opacity-60 whitespace-nowrap">
                          {formatTime(t.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs opacity-70">
                        {t.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 font-medium',
                            t.status === 'OPEN'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-stone-200 text-stone-600 dark:bg-slate-700 dark:text-slate-400',
                          )}
                        >
                          {t.status === 'OPEN' ? 'Đang mở' : 'Đã giải quyết'}
                        </span>
                        {t.type === 'SHOP' && (
                          <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-sky-600 dark:text-sky-400">
                            Shop: {t.shopName}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Message Stream */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
          {loadingThreads && !selectedThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm opacity-60">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p>Đang tải cuộc hội thoại...</p>
            </div>
          ) : !selectedThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm opacity-60">
              <HiOutlineChat className="h-12 w-12 stroke-[1.5]" />
              <p>Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu chat</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div
                className={cn(
                  'flex shrink-0 items-center justify-between border-b px-5 py-3.5',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white font-bold">
                    {selectedThread.customerAvatar ? (
                      <img
                        src={selectedThread.customerAvatar}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      (selectedThread.customerName || 'K')[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-sm leading-snug">
                      {selectedThread.customerName}
                    </h2>
                    <p className="text-[11px] opacity-60">
                      Cuộc hội thoại #{selectedThread.id.slice(0, 8)} •{' '}
                      {selectedThread.type === 'SUPPORT' ? 'Hỗ trợ khách hàng' : `Shop ${selectedThread.shopName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedThread.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={handleCloseThread}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
                        isDark
                          ? 'border-slate-700 hover:bg-slate-800'
                          : 'border-stone-200 hover:bg-stone-100',
                      )}
                    >
                      <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                      Đóng hội thoại
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Container */}
              <div
                ref={messagesContainerRef}
                className={cn(
                  'flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5',
                  isDark ? 'bg-slate-950/40' : 'bg-stone-50/60',
                )}
              >
                {loadingMessages ? (
                  <div className="p-8 text-center text-sm opacity-60">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-sm opacity-60">
                    Chưa có tin nhắn nào trong cuộc hội thoại này.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderRole === 'ADMIN'
                    return (
                      <div
                        key={m.id || m.createdAt}
                        className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}
                      >
                        <span className="text-[11px] mb-1 px-1 opacity-60">
                          {m.senderName} • {formatTime(m.createdAt)}
                        </span>
                        <div
                          className={cn(
                            'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                            isMe
                              ? 'rounded-tr-xs bg-amber-500 text-white'
                              : isDark
                                ? 'rounded-tl-xs bg-slate-800 text-slate-100 border border-slate-700'
                                : 'rounded-tl-xs bg-white text-stone-800 border border-stone-200',
                            m.messageType === 'IMAGE' && 'p-1.5 overflow-hidden',
                          )}
                        >
                          {m.messageType === 'IMAGE' ? (
                            <div className="space-y-1">
                              <img
                                src={m.imageUrl}
                                alt="Ảnh gửi"
                                onLoad={() => scrollToBottom(false)}
                                onClick={() => setPreviewImage(m.imageUrl)}
                                className="max-h-56 max-w-full rounded-xl object-contain cursor-pointer transition hover:opacity-90 shadow-sm"
                              />
                              {m.content && m.content !== '[Hình ảnh]' && (
                                <p className="px-2 py-1 text-xs whitespace-pre-wrap">{m.content}</p>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          )}
                        </div>
                        {isMe && m.readAt && (
                          <span className="text-[10px] mt-0.5 px-1 text-emerald-500 font-medium">
                            Đã xem
                          </span>
                        )}
                      </div>
                    )
                  })
                )}

                {/* Typing Indicator */}
                {partnerTyping && (
                  <div className="flex items-center gap-1.5 text-xs opacity-60 px-2 py-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce [animation-delay:0.2s]">●</span>
                    <span className="animate-bounce [animation-delay:0.4s]">●</span>
                    <span>Khách hàng đang soạn tin...</span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSend}
                className={cn(
                  'flex shrink-0 items-center gap-2 border-t p-3',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  title="Gửi hình ảnh"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition',
                    isDark
                      ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                      : 'border-stone-200 hover:bg-stone-100 text-stone-600',
                  )}
                >
                  <HiOutlinePhotograph className="h-5 w-5" />
                </button>

                <input
                  type="text"
                  value={replyText}
                  onChange={handleInputChange}
                  placeholder="Nhập tin nhắn phản hồi..."
                  disabled={sending}
                  className={cn(
                    'flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/30',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white placeholder:opacity-50'
                      : 'border-stone-200 bg-white text-stone-900 placeholder:opacity-50',
                  )}
                />

                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed shadow"
                >
                  <HiOutlinePaperAirplane className="h-5 w-5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img src={previewImage} alt="Phóng to" className="max-h-[85vh] rounded-xl object-contain shadow-2xl" />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-900 shadow hover:bg-stone-200"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

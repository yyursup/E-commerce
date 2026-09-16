import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  HiOutlineChat, HiOutlinePaperAirplane,
  HiOutlineSearch, HiOutlineDotsVertical, HiX,
  HiOutlinePencil, HiOutlineTrash,
  HiOutlineBell, HiCheck, HiPlus, HiOutlineEmojiHappy,
  HiOutlineShoppingBag, HiOutlineRefresh,
} from 'react-icons/hi'
import { HiOutlineBellSlash } from 'react-icons/hi2'
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
  isWebSocketConnected,
} from '../../services/websocketService'
import { useChatNotification } from '../../hooks/useChatNotification'
import ChatNotificationToast from '../../components/ChatNotificationToast'
import EmojiPickerPopover from '../../components/EmojiPickerPopover'
import MediaUploadPopover from '../../components/MediaUploadPopover'

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

function formatThreadDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

export default function ShopLiveChat() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const currentUser = useAuthStore((s) => s.user)
  const [threads, setThreads] = useState([])
  const [selectedThreadId, setSelectedThreadId] = useState(() => {
    return sessionStorage.getItem('seller_selected_thread_id') || null
  })
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [connected, setConnected] = useState(() => isWebSocketConnected())
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [previewMedia, setPreviewMedia] = useState(null) // { url, type: 'image'|'video' }
  const [editingMsgId, setEditingMsgId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [hoveredMsgId, setHoveredMsgId] = useState(null)
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMediaPopover, setShowMediaPopover] = useState(false)

  const messagesContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const editInputRef = useRef(null)
  const textInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const selectedThreadIdRef = useRef(selectedThreadId)

  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId
  }, [selectedThreadId])

  const { notifications, notifEnabled, addNotification, dismissNotification, toggleNotif } =
    useChatNotification()

  // Close menus on click outside
  useEffect(() => {
    const handleDocClick = () => {
      setActiveMenuMsgId(null)
    }
    if (activeMenuMsgId) {
      document.addEventListener('click', handleDocClick)
      return () => document.removeEventListener('click', handleDocClick)
    }
  }, [activeMenuMsgId])

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

  // Load messages for thread (defined early for handleSelectThread)
  const loadMessages = useCallback(async (threadId) => {
    if (!threadId) return
    try {
      setLoadingMessages(true)
      const res = await chatService.getMessages(threadId, 0, 50)
      const rawList = res?.content ? [...res.content].reverse() : []
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

      // Mark thread read
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

  const handleSelectThread = useCallback((id) => {
    setSelectedThreadId(id)
    if (id) {
      sessionStorage.setItem('seller_selected_thread_id', id)
      loadMessages(id)
    } else {
      sessionStorage.removeItem('seller_selected_thread_id')
    }
  }, [loadMessages])

  // Load shop threads from backend
  const loadThreads = useCallback(async () => {
    try {
      setLoadingThreads(true)
      const data = await chatService.getThreads('SHOP')
      const list = Array.isArray(data) ? data : data?.content || []
      setThreads(list)
      setSelectedThreadId((prev) => {
        const savedId = sessionStorage.getItem('seller_selected_thread_id')
        if (savedId && list.some((t) => String(t.id).toLowerCase() === String(savedId).toLowerCase())) {
          return savedId
        }
        if (prev && list.some((t) => String(t.id).toLowerCase() === String(prev).toLowerCase())) {
          return prev
        }
        return list.length > 0 ? list[0].id : null
      })
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại shop:', err)
      toast.error('Không thể tải danh sách chat')
    } finally {
      setLoadingThreads(false)
    }
  }, [])

  // Initialize WebSocket & Data
  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      createWebSocketConnection(token)
    }
    setConnected(isWebSocketConnected())

    loadThreads()

    const unregConnect = addWebSocketListener('CONNECT', () => setConnected(true))
    const unregDisconnect = addWebSocketListener('DISCONNECT', () => setConnected(false))

    const unregMessage = addWebSocketListener('CHAT_MESSAGE', (msg) => {
      if (!msg) return

      const currentSelected = selectedThreadIdRef.current
      const belongsToCurrent =
        currentSelected &&
        String(msg.threadId).toLowerCase() === String(currentSelected).toLowerCase()

      if (belongsToCurrent) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id).toLowerCase() === String(msg.id).toLowerCase())) return prev
          if (msg.messageType === 'IMAGE' && msg.imageUrl && prev.some((m) => m.imageUrl === msg.imageUrl)) return prev
          if (msg.messageType === 'VIDEO' && msg.videoUrl && prev.some((m) => m.videoUrl === msg.videoUrl)) return prev

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

      // Update thread list
      setThreads((prev) => {
        const isSelf = currentUser?.id && String(msg.senderId).toLowerCase() === String(currentUser.id).toLowerCase()
        const isCurrentSelected =
          selectedThreadIdRef.current &&
          String(msg.threadId).toLowerCase() === String(selectedThreadIdRef.current).toLowerCase()

        const idx = prev.findIndex(
          (t) => String(t.id).toLowerCase() === String(msg.threadId).toLowerCase(),
        )
        if (idx !== -1) {
          const updated = {
            ...prev[idx],
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount:
              isCurrentSelected || isSelf
                ? 0
                : (prev[idx].unreadCount || 0) + (msg.senderRole === 'CUSTOMER' ? 1 : 0),
          }
          const next = [...prev]
          next.splice(idx, 1)
          return [updated, ...next]
        } else {
          chatService.getThreads('SHOP').then((d) => {
            const list = Array.isArray(d) ? d : d?.content || []
            setThreads(list)
          })
          return prev
        }
      })

      // Toast notification for customer messages
      const isSelf = currentUser?.id && String(msg.senderId).toLowerCase() === String(currentUser.id).toLowerCase()
      if (msg.senderRole === 'CUSTOMER' && !isSelf) {
        addNotification(msg)
      }
    })

    const unregEdited = addWebSocketListener('CHAT_MESSAGE_EDITED', (updated) => {
      if (!updated) return
      setMessages((prev) =>
        prev.map((m) => String(m.id).toLowerCase() === String(updated.id).toLowerCase() ? updated : m)
      )
    })

    const unregDeleted = addWebSocketListener('CHAT_MESSAGE_DELETED', (payload) => {
      if (!payload) return
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id).toLowerCase() === String(payload.messageId).toLowerCase()
            ? { ...m, isDeleted: true, content: '[Tin nhắn đã bị xóa]' }
            : m
        )
      )
    })

    const unregThreadUpdated = addWebSocketListener('CHAT_THREAD_UPDATED', (updatedThread) => {
      if (!updatedThread) return
      setThreads((prev) => {
        const isCurrentSelected =
          selectedThreadIdRef.current &&
          String(updatedThread.id).toLowerCase() === String(selectedThreadIdRef.current).toLowerCase()

        const threadWithAdjustedUnread = isCurrentSelected
          ? { ...updatedThread, unreadCount: 0 }
          : updatedThread

        const filtered = prev.filter(
          (t) => String(t.id).toLowerCase() !== String(updatedThread.id).toLowerCase(),
        )
        return [threadWithAdjustedUnread, ...filtered]
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
      unregEdited()
      unregDeleted()
      unregThreadUpdated()
      unregThreadNew()
      unregTyping()
    }
  }, [loadThreads, currentUser?.id, addNotification])

  // Load messages when selected thread changes
  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId)
      setPartnerTyping(false)
      setShowEmojiPicker(false)
      setShowMediaPopover(false)
    } else {
      setMessages([])
    }
  }, [selectedThreadId, loadMessages])

  // Periodic polling fallback to guarantee messages are synced even if WS reconnects
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isWebSocketConnected()) {
        chatService.getThreads('SHOP').then((data) => {
          const list = Array.isArray(data) ? data : data?.content || []
          setThreads(list)
        }).catch(() => {})

        const curr = selectedThreadIdRef.current
        if (curr) {
          chatService.getMessages(curr, 0, 50).then((res) => {
            const rawList = res?.content ? [...res.content].reverse() : []
            if (rawList.length > 0) {
              setMessages((prev) => {
                const map = new Map(prev.map((m) => [String(m.id).toLowerCase(), m]))
                for (const m of rawList) {
                  map.set(String(m.id).toLowerCase(), m)
                }
                return Array.from(map.values())
              })
            }
          }).catch(() => {})
        }
      }
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom(false)
  }, [messages, partnerTyping, scrollToBottom])

  // Send text message
  const handleSend = async (e) => {
    e?.preventDefault()
    const content = replyText.trim()
    if (!content || !selectedThreadId || sending) return

    const tempId = 'temp-' + Date.now()
    const optimisticMsg = {
      id: tempId,
      threadId: selectedThreadId,
      senderId: currentUser?.id,
      senderName: currentUser?.shopName || currentUser?.username || 'Chủ Shop',
      senderRole: 'BUSINESS',
      content,
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
    }

    try {
      setSending(true)
      setMessages((prev) => [...prev, optimisticMsg])
      setReplyText('')

      const sentViaWs = sendWebSocketMessage('CHAT_SEND', {
        threadId: selectedThreadId,
        content,
      })

      if (!sentViaWs) {
        const newMsg = await chatService.sendMessage(selectedThreadId, content)
        setMessages((prev) => prev.map((m) => (m.id === tempId ? newMsg : m)))
      }

      sendWebSocketMessage('CHAT_TYPING', {
        threadId: selectedThreadId,
        isTyping: false,
      })

      setThreads((prev) =>
        prev.map((t) =>
          String(t.id).toLowerCase() === String(selectedThreadId).toLowerCase()
            ? { ...t, lastMessage: content, lastMessageAt: new Date().toISOString(), unreadCount: 0 }
            : t
        )
      )
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err)
      toast.error('Không thể gửi tin nhắn')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setSending(false)
      textInputRef.current?.focus()
    }
  }

  // Handle typing change
  const handleInputChange = (e) => {
    const val = e.target.value
    setReplyText(val)
    if (selectedThreadId) {
      sendWebSocketMessage('CHAT_TYPING', {
        threadId: selectedThreadId,
        isTyping: val.length > 0,
      })
    }
  }

  // Handle Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file || !selectedThreadId || sending) return

    try {
      setSending(true)
      const newMsg = await chatService.sendImage(selectedThreadId, file)
      setMessages((prev) => {
        if (!newMsg) return prev
        if (prev.some((m) => String(m.id).toLowerCase() === String(newMsg.id).toLowerCase())) return prev
        if (newMsg.imageUrl && prev.some((m) => m.imageUrl === newMsg.imageUrl)) return prev
        return [...prev, newMsg]
      })
      setThreads((prev) =>
        prev.map((t) =>
          String(t.id).toLowerCase() === String(selectedThreadId).toLowerCase()
            ? { ...t, lastMessage: '[Hình ảnh]', lastMessageAt: new Date().toISOString(), unreadCount: 0 }
            : t
        )
      )
      toast.success('Đã gửi hình ảnh thành công')
    } catch (err) {
      console.error('Lỗi tải ảnh:', err)
      toast.error('Không thể gửi hình ảnh')
    } finally {
      setSending(false)
    }
  }

  // Handle Video Upload
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (videoInputRef.current) videoInputRef.current.value = ''
    if (!file || !selectedThreadId || sending) return
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video tải lên tối đa 50MB')
      return
    }

    try {
      setSending(true)
      const newMsg = await chatService.sendVideo(selectedThreadId, file)
      setMessages((prev) => {
        if (!newMsg) return prev
        if (prev.some((m) => String(m.id).toLowerCase() === String(newMsg.id).toLowerCase())) return prev
        if (newMsg.videoUrl && prev.some((m) => m.videoUrl === newMsg.videoUrl)) return prev
        return [...prev, newMsg]
      })
      setThreads((prev) =>
        prev.map((t) =>
          String(t.id).toLowerCase() === String(selectedThreadId).toLowerCase()
            ? { ...t, lastMessage: '[Video]', lastMessageAt: new Date().toISOString(), unreadCount: 0 }
            : t
        )
      )
      toast.success('Đã gửi video thành công')
    } catch (err) {
      console.error('Lỗi tải video:', err)
      toast.error('Không thể gửi video')
    } finally {
      setSending(false)
    }
  }

  // Handle Select Emoji
  const handleSelectEmoji = (emoji) => {
    const input = textInputRef.current
    if (input) {
      const start = input.selectionStart ?? replyText.length
      const end = input.selectionEnd ?? replyText.length
      const nextVal = replyText.substring(0, start) + emoji + replyText.substring(end)
      setReplyText(nextVal)
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    } else {
      setReplyText((prev) => prev + emoji)
    }
  }

  // Handle Edit Message
  const handleStartEdit = (m) => {
    setEditingMsgId(String(m.id))
    setEditingContent(m.content)
    setActiveMenuMsgId(null)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  const handleSaveEdit = async () => {
    if (!editingMsgId || !editingContent.trim()) return
    try {
      const updated = await chatService.editMessage(editingMsgId, editingContent.trim())
      setMessages((prev) =>
        prev.map((m) => (String(m.id).toLowerCase() === String(editingMsgId).toLowerCase() ? updated : m))
      )
      setEditingMsgId(null)
      toast.success('Đã sửa tin nhắn')
    } catch (err) {
      console.error('Lỗi sửa tin nhắn:', err)
      toast.error('Không thể sửa tin nhắn này')
    }
  }

  const handleCancelEdit = () => {
    setEditingMsgId(null)
    setEditingContent('')
  }

  // Handle Delete Message
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return
    setActiveMenuMsgId(null)
    try {
      await chatService.deleteMessage(messageId)
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id).toLowerCase() === String(messageId).toLowerCase()
            ? { ...m, isDeleted: true, content: '[Tin nhắn đã bị xóa]' }
            : m
        )
      )
      toast.success('Đã xóa tin nhắn')
    } catch (err) {
      console.error('Lỗi xóa tin nhắn:', err)
      toast.error('Không thể xóa tin nhắn')
    }
  }

  // Filter threads by search term
  const filteredThreads = useMemo(() => {
    if (!searchTerm.trim()) return threads
    const term = searchTerm.toLowerCase()
    return threads.filter(
      (t) =>
        t.customerName?.toLowerCase().includes(term) ||
        t.lastMessage?.toLowerCase().includes(term)
    )
  }, [threads, searchTerm])

  return (
    <div className={cn('rounded-3xl border shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[580px] overflow-hidden',
      isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
    )}>
      {/* Toast notifications */}
      <ChatNotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onOpen={(threadId) => handleSelectThread(threadId)}
        position="top-right"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: Customer Threads List */}
        <aside
          className={cn(
            'w-80 sm:w-96 flex flex-col border-r shrink-0',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-stone-50/50'
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <HiOutlineChat className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Tin Nhắn Khách Hàng</h2>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    )}
                  />
                  <span className="opacity-60">{connected ? 'Trực tuyến' : 'Mất kết nối'}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  loadThreads()
                  if (selectedThreadId) loadMessages(selectedThreadId)
                  toast.success('Đã làm mới danh sách tin nhắn')
                }}
                className={cn(
                  'rounded-xl p-2 transition',
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-stone-200 text-stone-600'
                )}
                title="Làm mới tin nhắn"
              >
                <HiOutlineRefresh className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={toggleNotif}
                className={cn(
                  'rounded-xl p-2 transition',
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-stone-200 text-stone-600'
                )}
                title={notifEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
              >
                {notifEnabled ? (
                  <HiOutlineBell className="h-4 w-4 text-amber-500" />
                ) : (
                  <HiOutlineBellSlash className="h-4 w-4 opacity-50" />
                )}
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="p-3 border-b border-stone-200/60 dark:border-slate-800/80">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm khách hàng hoặc tin nhắn..."
                className={cn(
                  'w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border transition focus:ring-2 focus:ring-amber-500/20',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white placeholder:opacity-40'
                    : 'border-stone-300 bg-white text-stone-900 placeholder:opacity-40'
                )}
              />
            </div>
          </div>

          {/* Threads Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-slate-800/50">
            {loadingThreads ? (
              <div className="p-6 text-center text-xs opacity-60">Đang tải cuộc trò chuyện...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs opacity-60 space-y-2">
                <HiOutlineChat className="h-8 w-8 mx-auto opacity-30" />
                <p>Chưa có cuộc trò chuyện nào từ khách hàng.</p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected =
                  selectedThreadId &&
                  String(t.id).toLowerCase() === String(selectedThreadId).toLowerCase()
                const unread = t.unreadCount || 0

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectThread(t.id)}
                    className={cn(
                      'w-full p-3.5 text-left flex items-start gap-3 transition-colors relative',
                      isSelected
                        ? isDark
                          ? 'bg-slate-800/90'
                          : 'bg-amber-50/80'
                        : isDark
                          ? 'hover:bg-slate-850'
                          : 'hover:bg-stone-100/70'
                    )}
                  >
                    {/* Active border indicator */}
                    {isSelected && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r" />
                    )}

                    {/* Customer Avatar */}
                    <div className="relative shrink-0">
                      {t.customerAvatar ? (
                        <img
                          src={t.customerAvatar}
                          alt={t.customerName}
                          className="h-11 w-11 rounded-full object-cover border border-amber-500/20 shadow-xs"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                          {t.customerName?.charAt(0)?.toUpperCase() || 'K'}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    </div>

                    {/* Thread details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4
                          className={cn(
                            'text-xs font-bold truncate',
                            unread > 0
                              ? isDark ? 'text-white' : 'text-stone-900 font-extrabold'
                              : isDark ? 'text-slate-200' : 'text-stone-800'
                          )}
                        >
                          {t.customerName || 'Khách hàng'}
                        </h4>
                        <span className="text-[10px] opacity-50 shrink-0">
                          {formatThreadDate(t.lastMessageAt || t.updatedAt)}
                        </span>
                      </div>

                      <p
                        className={cn(
                          'text-xs truncate leading-snug',
                          unread > 0
                            ? 'font-bold text-stone-900 dark:text-white'
                            : 'opacity-70'
                        )}
                      >
                        {t.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {unread > 0 && (
                      <span className="shrink-0 flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: Active Chat Conversation */}
        <section className="flex-1 flex flex-col min-w-0 bg-transparent">
          {selectedThread ? (
            <>
              {/* Conversation Top Header */}
              <div
                className={cn(
                  'p-3.5 px-6 border-b flex items-center justify-between',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {selectedThread.customerAvatar ? (
                      <img
                        src={selectedThread.customerAvatar}
                        alt={selectedThread.customerName}
                        className="h-10 w-10 rounded-full object-cover border border-amber-500/20"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                        {selectedThread.customerName?.charAt(0)?.toUpperCase() || 'K'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate">
                      {selectedThread.customerName || 'Khách hàng'}
                    </h3>
                    {partnerTyping ? (
                      <p className="text-[11px] text-amber-500 font-medium animate-pulse">
                        Khách hàng đang soạn tin...
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Đang hoạt động trên sàn
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-xs opacity-50">
                    Mã hội thoại: #{selectedThread.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              {/* Messages scroll area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
              >
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs opacity-60">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs opacity-60 leading-relaxed max-w-sm mx-auto">
                    Chưa có tin nhắn nào trong phòng chat này. Hãy gửi lời chào đến khách hàng để bắt đầu tư vấn!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe =
                      (currentUser?.id && String(m.senderId).toLowerCase() === String(currentUser.id).toLowerCase()) ||
                      m.senderRole === 'BUSINESS' ||
                      m.senderRole === 'ADMIN'
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
                          {isMe ? 'Bạn (Chủ shop)' : (m.senderName || 'Khách hàng')} • {formatTime(m.createdAt)}
                          {m.editedAt && ' (đã sửa)'}
                        </span>

                        {isEditing ? (
                          <div className="flex w-full max-w-[85%] sm:max-w-[60%] gap-1.5">
                            <input
                              ref={editInputRef}
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit()
                                if (e.key === 'Escape') handleCancelEdit()
                              }}
                              className={cn(
                                'flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/30',
                                isDark ? 'border-slate-600 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                              )}
                            />
                            <button
                              onClick={handleSaveEdit}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                              title="Lưu"
                            >
                              <HiCheck className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-xl border',
                                isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-stone-300 hover:bg-stone-100'
                              )}
                              title="Hủy"
                            >
                              <HiX className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'flex items-center gap-1.5 max-w-[85%] sm:max-w-[65%]',
                              isMe ? 'flex-row' : 'flex-row-reverse'
                            )}
                          >
                            {/* Messenger-style 3-dots action menu for seller */}
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
                                      ? isDark ? 'bg-slate-700 text-white' : 'bg-stone-200 text-stone-800'
                                      : isHovered ? 'opacity-100' : 'opacity-0'
                                  )}
                                  title="Tùy chọn tin nhắn"
                                >
                                  <HiOutlineDotsVertical className="h-4 w-4" />
                                </button>

                                {activeMenuMsgId === String(m.id) && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={cn(
                                      'absolute bottom-full right-0 mb-1 z-30 w-32 rounded-xl border p-1 shadow-lg backdrop-blur-md',
                                      isDark
                                        ? 'border-slate-700 bg-slate-800/95 text-slate-100 shadow-black/50'
                                        : 'border-stone-200 bg-white/95 text-stone-800 shadow-stone-300/50'
                                    )}
                                  >
                                    {m.messageType === 'TEXT' && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartEdit(m)}
                                        className={cn(
                                          'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                                          isDark ? 'hover:bg-slate-700' : 'hover:bg-stone-100'
                                        )}
                                      >
                                        <HiOutlinePencil className="h-3.5 w-3.5 text-amber-500" />
                                        Chỉnh sửa
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessage(m.id)}
                                      className={cn(
                                        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 transition',
                                        isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                                      )}
                                    >
                                      <HiOutlineTrash className="h-3.5 w-3.5" />
                                      Xóa tin nhắn
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Message bubble */}
                            <div
                              className={cn(
                                'rounded-2xl text-xs break-words shadow-xs overflow-hidden',
                                isMe
                                  ? 'bg-amber-500 text-white rounded-tr-none'
                                  : isDark
                                    ? 'bg-slate-800 text-white rounded-tl-none border border-slate-700'
                                    : 'bg-stone-100 text-stone-900 rounded-tl-none border border-stone-200/80',
                                m.messageType === 'IMAGE' || m.messageType === 'VIDEO' ? 'p-1' : 'px-3.5 py-2.5'
                              )}
                            >
                              {m.isDeleted ? (
                                <span className="italic opacity-60 flex items-center gap-1">
                                  <HiOutlineTrash className="h-3.5 w-3.5" />
                                  Tin nhắn đã bị thu hồi
                                </span>
                              ) : m.messageType === 'IMAGE' && m.imageUrl ? (
                                <div
                                  className="cursor-pointer group relative overflow-hidden rounded-xl max-w-xs"
                                  onClick={() => setPreviewMedia({ url: m.imageUrl, type: 'image' })}
                                >
                                  <img
                                    src={m.imageUrl}
                                    alt="Ảnh gửi"
                                    className="max-h-64 rounded-xl object-cover transition duration-200 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                                    Bấm để phóng to
                                  </div>
                                </div>
                              ) : m.messageType === 'VIDEO' && m.videoUrl ? (
                                <div className="max-w-xs overflow-hidden rounded-xl">
                                  <video
                                    src={m.videoUrl}
                                    controls
                                    className="max-h-64 rounded-xl object-cover bg-black"
                                  />
                                </div>
                              ) : (
                                <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}

                {partnerTyping && (
                  <div className="flex items-center gap-2 text-xs opacity-60">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce delay-100" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce delay-200" />
                    </span>
                    <span>Khách hàng đang gõ...</span>
                  </div>
                )}
              </div>

              {/* Bottom Send Input Bar */}
              <div className="relative">
                {/* Media Popover (+ button) */}
                <MediaUploadPopover
                  isOpen={showMediaPopover}
                  onClose={() => setShowMediaPopover(false)}
                  onPickImage={() => {
                    setShowMediaPopover(false)
                    fileInputRef.current?.click()
                  }}
                  onPickVideo={() => {
                    setShowMediaPopover(false)
                    videoInputRef.current?.click()
                  }}
                  align="left"
                />

                {/* Emoji Popover (😊 button) */}
                <EmojiPickerPopover
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onSelectEmoji={handleSelectEmoji}
                  align="left"
                />

                <form
                  onSubmit={handleSend}
                  className={cn(
                    'flex items-center gap-2 border-t p-3',
                    isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-stone-50'
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoUpload}
                    accept="video/*"
                    className="hidden"
                  />

                  {/* Plus (+) Button for Media Options (Ảnh / Video) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaPopover((prev) => !prev)
                      setShowEmojiPicker(false)
                    }}
                    disabled={sending}
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95',
                      showMediaPopover
                        ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                        : isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                          : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
                    )}
                    title="Đính kèm ảnh hoặc video"
                  >
                    <HiPlus className={cn('h-5 w-5 transition-transform duration-200', showMediaPopover && 'rotate-45')} />
                  </button>

                  {/* Emoji (😊) Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker((prev) => !prev)
                      setShowMediaPopover(false)
                    }}
                    disabled={sending}
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95',
                      showEmojiPicker
                        ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                        : isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                          : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
                    )}
                    title="Chèn biểu cảm Emoji"
                  >
                    <HiOutlineEmojiHappy className="h-5 w-5" />
                  </button>

                  <input
                    ref={textInputRef}
                    type="text"
                    value={replyText}
                    onChange={handleInputChange}
                    placeholder="Nhập câu trả lời tư vấn cho khách hàng..."
                    disabled={sending}
                    className={cn(
                      'flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20',
                      isDark
                        ? 'border-slate-700 bg-slate-800 text-white placeholder:opacity-50'
                        : 'border-stone-300 bg-white text-stone-900 placeholder:opacity-50'
                    )}
                  />

                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40"
                    title="Gửi câu trả lời"
                  >
                    <HiOutlinePaperAirplane className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
                <HiOutlineChat className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-base mb-1">Chưa chọn cuộc hội thoại nào</h3>
              <p className="text-xs opacity-60 max-w-xs leading-relaxed">
                Hãy chọn một khách hàng từ danh sách bên trái để xem lịch sử trao đổi và phản hồi trực tiếp.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Lightbox Modal for Image / Video Fullscreen preview */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            {previewMedia.type === 'video' ? (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] rounded-2xl shadow-2xl"
              />
            ) : (
              <img
                src={previewMedia.url}
                alt="Xem ảnh"
                className="max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              />
            )}
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-900 shadow-md hover:bg-stone-200"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

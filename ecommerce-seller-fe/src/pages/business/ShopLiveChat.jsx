import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { HiOutlineChat } from 'react-icons/hi'
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

// Sub-components
import ShopChatSidebar from './components/chat/ShopChatSidebar'
import ShopChatHeader from './components/chat/ShopChatHeader'
import ShopChatMessageList from './components/chat/ShopChatMessageList'
import ShopChatInputBar from './components/chat/ShopChatInputBar'
import ShopChatMediaPreviewModal from './components/chat/ShopChatMediaPreviewModal'

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
  const [previewMedia, setPreviewMedia] = useState(null)
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

  const {
    notifications,
    notifEnabled,
    isThreadMuted,
    toggleMuteThread,
    addNotification,
    dismissNotification,
    toggleNotif,
  } = useChatNotification()

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

  const isThreadClosed = useMemo(() => {
    if (!selectedThread) return false
    if (
      selectedThread.status === 'CLOSED' ||
      selectedThread.isLocked ||
      selectedThread.locked
    ) {
      return true
    }
    return messages.some(
      (m) =>
        m.senderRole === 'SYSTEM' &&
        (m.content?.includes('Phòng trao đổi thương lượng đã đóng') ||
          m.content?.includes('Phòng chat đã đóng') ||
          m.content?.includes('Cuộc hội thoại đã đóng'))
    )
  }, [selectedThread, messages])

  const closeReasonText = useMemo(() => {
    if (selectedThread?.closeReason) return selectedThread.closeReason
    const systemCloseMsg = messages.find(
      (m) =>
        m.senderRole === 'SYSTEM' &&
        m.content?.includes('Phòng trao đổi thương lượng đã đóng: ')
    )
    if (systemCloseMsg) {
      const match = systemCloseMsg.content.match(/Phòng trao đổi thương lượng đã đóng:\s*([^.]+)/)
      if (match?.[1]) return match[1].trim()
    }
    return 'Vụ việc đã được hoàn tất và hồ sơ đã lưu trữ đối soát'
  }, [selectedThread?.closeReason, messages])

  useEffect(() => {
    if (isThreadClosed && selectedThread && selectedThread.status !== 'CLOSED') {
      setThreads((prev) =>
        prev.map((t) =>
          String(t.id).toLowerCase() === String(selectedThread.id).toLowerCase()
            ? { ...t, status: 'CLOSED', isLocked: true }
            : t
        )
      )
    }
  }, [isThreadClosed, selectedThread])

  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }, [])

  // Load messages for thread
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
        chatService.markRead(currentSelected).catch(() => { })
      }

      // Update thread list
      setThreads((prev) => {
        const isSelf = currentUser?.id && String(msg.senderId).toLowerCase() === String(currentUser.id).toLowerCase()
        const isCurrentSelected =
          selectedThreadIdRef.current &&
          String(msg.threadId).toLowerCase() === String(selectedThreadIdRef.current).toLowerCase()

        const isSystemClose =
          msg.senderRole === 'SYSTEM' &&
          (msg.content?.includes('Phòng trao đổi thương lượng đã đóng') ||
            msg.content?.includes('Phòng chat đã đóng') ||
            msg.content?.includes('Cuộc hội thoại đã đóng'))

        const idx = prev.findIndex(
          (t) => String(t.id).toLowerCase() === String(msg.threadId).toLowerCase(),
        )
        if (idx !== -1) {
          const updated = {
            ...prev[idx],
            status: isSystemClose ? 'CLOSED' : prev[idx].status,
            isLocked: isSystemClose ? true : prev[idx].isLocked,
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

      if (
        msg.senderRole === 'CUSTOMER' &&
        !isSelf &&
        !isThreadMuted(msg.threadId)
      ) {
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

        const exists = prev.some(
          (t) => String(t.id).toLowerCase() === String(updatedThread.id).toLowerCase(),
        )
        if (exists) {
          return prev.map((t) =>
            String(t.id).toLowerCase() === String(updatedThread.id).toLowerCase()
              ? { ...t, ...threadWithAdjustedUnread }
              : t,
          )
        }
        return [threadWithAdjustedUnread, ...prev]
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

    const unregThreadClosed = addWebSocketListener('CHAT_THREAD_CLOSED', (event) => {
      if (!event?.threadId) return
      setThreads((prev) =>
        prev.map((t) =>
          String(t.id).toLowerCase() === String(event.threadId).toLowerCase()
            ? { ...t, status: 'CLOSED', isLocked: true, locked: true, closeReason: event.closeReason }
            : t
        )
      )
      toast('Phòng chat đã được đóng và lưu trữ đối soát.', { icon: '🔒' })
    })

    const unregError = addWebSocketListener('ERROR', (errData) => {
      if (!errData) return
      const errMsg = typeof errData === 'string' ? errData : errData.message || 'Đã có lỗi xảy ra'
      toast.error(errMsg)
      if (errMsg.includes('khóa') || errMsg.includes('đóng')) {
        setThreads((prev) =>
          prev.map((t) =>
            selectedThreadIdRef.current &&
            String(t.id).toLowerCase() === String(selectedThreadIdRef.current).toLowerCase()
              ? { ...t, status: 'CLOSED', isLocked: true, locked: true }
              : t
          )
        )
      }
      setMessages((prev) => prev.filter((m) => !String(m.id).startsWith('temp-')))
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
      unregThreadClosed()
      unregError()
    }
  }, [loadThreads, currentUser?.id, addNotification, isThreadMuted])

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
        }).catch(() => { })

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
          }).catch(() => { })
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
    if (!content || !selectedThreadId || sending || isThreadClosed) return

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
    if (isThreadClosed) return
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
    if (!file || !selectedThreadId || sending || isThreadClosed) return

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
    if (!file || !selectedThreadId || sending || isThreadClosed) return
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
    <div
      className={cn(
        'rounded-3xl border shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[580px] overflow-hidden',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}
    >
      {/* Toast notifications */}
      <ChatNotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onMute={(threadId, senderName) => {
          toggleMuteThread(threadId)
          toast.success(`Đã tắt thông báo từ ${senderName || 'khách hàng này'}`)
        }}
        onOpen={(threadId) => handleSelectThread(threadId)}
        position="top-right"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: Customer Threads List */}
        <ShopChatSidebar
          threads={threads}
          filteredThreads={filteredThreads}
          selectedThreadId={selectedThreadId}
          connected={connected}
          loadingThreads={loadingThreads}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          notifEnabled={notifEnabled}
          toggleNotif={toggleNotif}
          loadThreads={loadThreads}
          loadMessages={loadMessages}
          handleSelectThread={handleSelectThread}
          isThreadMuted={isThreadMuted}
          isThreadClosed={isThreadClosed}
          isDark={isDark}
        />

        {/* RIGHT COLUMN: Active Chat Conversation */}
        <section className="flex-1 flex flex-col min-w-0 bg-transparent">
          {selectedThread ? (
            <>
              {/* Conversation Top Header */}
              <ShopChatHeader
                selectedThread={selectedThread}
                isThreadClosed={isThreadClosed}
                partnerTyping={partnerTyping}
                isThreadMuted={isThreadMuted}
                toggleMuteThread={toggleMuteThread}
                isDark={isDark}
              />

              {/* Messages scroll area */}
              <ShopChatMessageList
                messages={messages}
                loadingMessages={loadingMessages}
                currentUser={currentUser}
                selectedThread={selectedThread}
                isThreadClosed={isThreadClosed}
                messagesContainerRef={messagesContainerRef}
                hoveredMsgId={hoveredMsgId}
                setHoveredMsgId={setHoveredMsgId}
                activeMenuMsgId={activeMenuMsgId}
                setActiveMenuMsgId={setActiveMenuMsgId}
                editingMsgId={editingMsgId}
                editingContent={editingContent}
                setEditingContent={setEditingContent}
                editInputRef={editInputRef}
                handleStartEdit={handleStartEdit}
                handleSaveEdit={handleSaveEdit}
                handleCancelEdit={handleCancelEdit}
                handleDeleteMessage={handleDeleteMessage}
                partnerTyping={partnerTyping}
                setPreviewMedia={setPreviewMedia}
                isDark={isDark}
              />

              {/* Bottom Send Input Bar */}
              <ShopChatInputBar
                isThreadClosed={isThreadClosed}
                closeReasonText={closeReasonText}
                selectedThread={selectedThread}
                replyText={replyText}
                handleInputChange={handleInputChange}
                handleSend={handleSend}
                sending={sending}
                fileInputRef={fileInputRef}
                videoInputRef={videoInputRef}
                textInputRef={textInputRef}
                handleImageUpload={handleImageUpload}
                handleVideoUpload={handleVideoUpload}
                showMediaPopover={showMediaPopover}
                setShowMediaPopover={setShowMediaPopover}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                handleSelectEmoji={handleSelectEmoji}
                isDark={isDark}
              />
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
      <ShopChatMediaPreviewModal
        previewMedia={previewMedia}
        onClose={() => setPreviewMedia(null)}
      />
    </div>
  )
}

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChat, HiX, HiOutlineSparkles } from 'react-icons/hi'
import { useLocation } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useChatStore } from '../store/useChatStore'
import { cn } from '../lib/cn'
import { getAccessToken } from '../lib/auth'
import chatbotService from '../services/chatbot'
import chatService from '../services/chatService'
import {
  createWebSocketConnection,
  addWebSocketListener,
} from '../services/websocketService'
import { useChatNotification } from '../hooks/useChatNotification'
import toast from 'react-hot-toast'
import ChatNotificationToast from './ChatNotificationToast'
import ChatInboxList from './ChatInboxList'
import ChatQuickCheckout from './ChatQuickCheckout'

// Sub-components
import ChatWindowHeader from './chat/ChatWindowHeader'
import ChatBotTab from './chat/ChatBotTab'
import ChatLiveTab from './chat/ChatLiveTab'
import ChatMediaPreviewModal from './chat/ChatMediaPreviewModal'

function formatPrice(value) {
  if (value == null) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ'
}

export default function ChatbotButton() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const user = useAuthStore((s) => s.user)
  const token = getAccessToken()
  const location = useLocation()

  // Global Chat Store integration
  const isOpen = useChatStore((s) => s.isOpen)
  const setIsOpen = useChatStore((s) => s.setIsOpen)
  const closeChat = useChatStore((s) => s.closeChat)
  const viewMode = useChatStore((s) => s.viewMode)
  const setViewMode = useChatStore((s) => s.setViewMode)
  const backToInbox = useChatStore((s) => s.backToInbox)
  const unreadTotal = useChatStore((s) => s.unreadTotal)
  const activeShop = useChatStore((s) => s.activeShop)
  const activeProduct = useChatStore((s) => s.activeProduct)
  const storeChatMode = useChatStore((s) => s.chatMode)

  const [activeTab, setActiveTab] = useState('bot') // 'bot' | 'live'
  const [previewMedia, setPreviewMedia] = useState(null)

  // Sync activeTab with global chat store
  useEffect(() => {
    if (storeChatMode) {
      setActiveTab(storeChatMode)
    }
  }, [storeChatMode])

  useEffect(() => {
    if (activeShop) {
      setActiveTab('live')
    }
  }, [activeShop])

  // --- BOT STATE ---
  const [botMessages, setBotMessages] = useState([])
  const [botInputValue, setBotInputValue] = useState('')
  const [botLoading, setBotLoading] = useState(false)
  const [botError, setBotError] = useState(null)
  const [quickBuyProductId, setQuickBuyProductId] = useState(null)

  // --- LIVE CHAT STATE ---
  const [supportThread, setSupportThread] = useState(null)
  const [liveMessages, setLiveMessages] = useState([])
  const [liveLoading, setLiveLoading] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)

  const botContainerRef = useRef(null)
  const liveContainerRef = useRef(null)
  const botInputRef = useRef(null)
  const adminTypingTimeoutRef = useRef(null)
  const supportThreadRef = useRef(supportThread)

  const { notifications, notifEnabled, addNotification, dismissNotification, toggleNotif } =
    useChatNotification()

  const isLiveClosed = useMemo(() => {
    if (!supportThread) return false
    if (
      supportThread.status === 'CLOSED' ||
      supportThread.isLocked ||
      supportThread.locked
    ) {
      return true
    }
    return liveMessages.some(
      (m) =>
        m.senderRole === 'SYSTEM' &&
        (m.content?.includes('Phòng trao đổi thương lượng đã đóng') ||
          m.content?.includes('Phòng chat đã đóng') ||
          m.content?.includes('Cuộc hội thoại đã đóng'))
    )
  }, [supportThread, liveMessages])

  const liveCloseReason = useMemo(() => {
    if (supportThread?.closeReason) return supportThread.closeReason
    const systemCloseMsg = liveMessages.find(
      (m) =>
        m.senderRole === 'SYSTEM' &&
        m.content?.includes('Phòng trao đổi thương lượng đã đóng: ')
    )
    if (systemCloseMsg) {
      const match = systemCloseMsg.content.match(/Phòng trao đổi thương lượng đã đóng:\s*([^.]+)/)
      if (match?.[1]) return match[1].trim()
    }
    return 'Cuộc trò chuyện đã được hoàn tất và lưu trữ đối soát'
  }, [supportThread?.closeReason, liveMessages])

  useEffect(() => {
    supportThreadRef.current = supportThread
  }, [supportThread])

  // Reset thread and messages when user/token changes or shop changes
  useEffect(() => {
    setSupportThread(null)
    supportThreadRef.current = null
    setLiveMessages([])
  }, [token, user?.id, activeShop?.id])

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
      }
    }
  }, [isOpen, activeTab, botMessages, liveMessages, botLoading, adminTyping, scrollToBottom])

  // Toggle widget open/close
  const handleToggle = () => {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    if (nextOpen && !activeShop) {
      setViewMode('inbox')
    }
  }

  // --- LIVE CHAT INITIALIZER ---
  const initLiveChat = useCallback(async () => {
    if (!token) return
    try {
      setLiveLoading(true)
      createWebSocketConnection(token)

      let thread
      if (activeShop?.id) {
        thread = await chatService.getOrCreateShopThread(activeShop.id)
      } else {
        thread = await chatService.getOrCreateSupportThread()
      }

      supportThreadRef.current = thread
      setSupportThread(thread)

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
      const errorMsg = err.response?.data?.message || 'Không thể kết nối trò chuyện. Vui lòng thử lại sau!'
      toast.error(errorMsg)
      useChatStore.getState().backToInbox()
    } finally {
      setLiveLoading(false)
    }
  }, [token, activeShop?.id])

  useEffect(() => {
    if (token) {
      createWebSocketConnection(token)
    }
  }, [token])

  useEffect(() => {
    if (isOpen && activeTab === 'live' && token) {
      initLiveChat()
    }
  }, [isOpen, activeTab, token, activeShop?.id, initLiveChat])

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

      const isSystemClose =
        msg.senderRole === 'SYSTEM' &&
        (msg.content?.includes('Phòng trao đổi thương lượng đã đóng') ||
          msg.content?.includes('Phòng chat đã đóng') ||
          msg.content?.includes('Cuộc hội thoại đã đóng'))

      if (isSystemClose && currentThread?.id && String(msg.threadId).toLowerCase() === String(currentThread.id).toLowerCase()) {
        setSupportThread((prev) => (prev ? { ...prev, status: 'CLOSED', isLocked: true, locked: true } : prev))
      }

      const isSelf = user?.id && String(msg.senderId).toLowerCase() === String(user.id).toLowerCase()
      if (!isSelf && (msg.senderRole === 'BUSINESS' || msg.senderRole === 'ADMIN')) {
        let senderName = msg.senderName || 'Người bán'
        let senderAvatar = msg.senderAvatar
        if (activeShop && currentThread?.shopId && String(currentThread.shopId).toLowerCase() === String(activeShop.id).toLowerCase()) {
          senderName = activeShop.name || senderName
          senderAvatar = activeShop.logoUrl || senderAvatar
        }
        addNotification({
          ...msg,
          senderName,
          senderAvatar,
        })
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

    const unregClose = addWebSocketListener('CHAT_THREAD_CLOSED', (event) => {
      const currentThread = supportThreadRef.current
      if (currentThread?.id && String(event?.threadId).toLowerCase() === String(currentThread.id).toLowerCase()) {
        setSupportThread((prev) => (prev ? { ...prev, status: 'CLOSED', isLocked: true, locked: true, closeReason: event.closeReason } : prev))
        toast('Cuộc hội thoại đã đóng và lưu trữ đối soát.', { icon: '🔒' })
      }
    })

    const unregError = addWebSocketListener('ERROR', (errData) => {
      if (!errData) return
      const errMsg = typeof errData === 'string' ? errData : errData.message || 'Đã có lỗi xảy ra'
      toast.error(errMsg)
      if (errMsg.includes('khóa') || errMsg.includes('đóng')) {
        setSupportThread((prev) => (prev ? { ...prev, status: 'CLOSED', isLocked: true, locked: true } : prev))
      }
      setLiveMessages((prev) => prev.filter((m) => !String(m.id).startsWith('temp-')))
    })

    return () => {
      unregMsg()
      unregEdited()
      unregDeleted()
      unregTyping()
      unregClose()
      unregError()
    }
  }, [token, addNotification, isOpen, activeTab, activeShop, user?.id])

  // Open live chat from notification
  const handleNotifOpen = useCallback(() => {
    setIsOpen(true)
    setActiveTab('live')
  }, [setIsOpen])

  // --- BOT LOGIC ---
  const handleBotSend = (preset) => {
    const text = (typeof preset === 'string' ? preset : botInputValue).trim()
    if (!text || botLoading) return
    const userMsg = { id: `user-${Date.now()}`, type: 'user', text }
    const history = [...botMessages.filter((m) => !m.isError), userMsg]
    setBotMessages((prev) => [...prev, userMsg])
    setBotInputValue('')
    setBotLoading(true)
    setBotError(null)
    chatbotService
      .ask(history.map((m) => ({ role: m.type === 'user' ? 'user' : 'model', text: m.memo ? `${m.text}\n${m.memo}` : m.text })))
      .then((data) => {
        setBotMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: 'bot',
            text: data.reply,
            productCards: data.productCards || [],
            choices: data.choices || [],
            paymentUrl: data.paymentUrl,
            memo: data.memo,
          },
        ])
      })
      .catch((err) => {
        setBotMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, type: 'bot', isError: true, text: err?.message || 'Trợ lý AI đang bận, bạn thử lại sau nhé.', productCards: [] },
        ])
      })
      .finally(() => setBotLoading(false))
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
            className="absolute -right-1 -top-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow"
          >
            {unreadTotal > 0 ? (
              <span>{unreadTotal > 99 ? '99+' : unreadTotal}</span>
            ) : (
              <HiOutlineSparkles className="h-3 w-3" />
            )}
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
            {quickBuyProductId && (
              <ChatQuickCheckout
                productId={quickBuyProductId}
                isDark={isDark}
                onClose={(order) => {
                  setQuickBuyProductId(null)
                  if (order) {
                    setBotMessages((prev) => [
                      ...prev,
                      { id: `order-${order.id}`, type: 'bot', text: `Đã đặt đơn ${order.orderNumber} (${formatPrice(order.total)}). Xem tại mục Đơn hàng của tôi.`, productCards: [] },
                    ])
                  }
                }}
              />
            )}
            {viewMode === 'inbox' ? (
              <ChatInboxList
                onClose={() => closeChat()}
                notifEnabled={notifEnabled}
                toggleNotif={toggleNotif}
              />
            ) : (
              <>
                {/* Top Bar Header */}
                <ChatWindowHeader
                  activeShop={activeShop}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  notifEnabled={notifEnabled}
                  toggleNotif={toggleNotif}
                  backToInbox={backToInbox}
                  closeChat={closeChat}
                  isDark={isDark}
                />

                {/* Tab Content */}
                {activeTab === 'bot' ? (
                  <ChatBotTab
                    botMessages={botMessages}
                    botInputValue={botInputValue}
                    setBotInputValue={setBotInputValue}
                    botLoading={botLoading}
                    botError={botError}
                    handleBotSend={handleBotSend}
                    setQuickBuyProductId={setQuickBuyProductId}
                    botContainerRef={botContainerRef}
                    botInputRef={botInputRef}
                    isDark={isDark}
                  />
                ) : (
                  <ChatLiveTab
                    token={token}
                    user={user}
                    activeShop={activeShop}
                    activeProduct={activeProduct}
                    supportThread={supportThread}
                    liveMessages={liveMessages}
                    setLiveMessages={setLiveMessages}
                    liveLoading={liveLoading}
                    adminTyping={adminTyping}
                    isLiveClosed={isLiveClosed}
                    liveCloseReason={liveCloseReason}
                    initLiveChat={initLiveChat}
                    setPreviewMedia={setPreviewMedia}
                    scrollToBottom={scrollToBottom}
                    closeChat={closeChat}
                    liveContainerRef={liveContainerRef}
                    isDark={isDark}
                  />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox for Image/Video Preview */}
      <ChatMediaPreviewModal
        previewMedia={previewMedia}
        onClose={() => setPreviewMedia(null)}
      />
    </>
  )
}

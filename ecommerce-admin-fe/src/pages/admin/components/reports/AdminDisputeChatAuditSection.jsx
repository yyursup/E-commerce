import { useState, useEffect, useRef, useMemo } from 'react'
import {
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineChatAlt2,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineInformationCircle,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineExternalLink,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineRefresh,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import chatService from '../../../../services/chatService'
import { addWebSocketListener } from '../../../../services/websocketService'

export default function AdminDisputeChatAuditSection({
  requestId,
  orderId,
  isDark = false,
  setPreviewImage,
}) {
  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('ALL') // 'ALL' | 'CUSTOMER' | 'SELLER' | 'MEDIA' | 'SYSTEM'
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const fullscreenMessagesEndRef = useRef(null)
  const activeKeyRef = useRef('')

  const safeOpenUrl = (url) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const currentKey = `${requestId || ''}_${orderId || ''}`

  useEffect(() => {
    activeKeyRef.current = currentKey
    let isCancelled = false

    if (!requestId && !orderId) {
      setThread(null)
      setMessages([])
      setLoading(false)
      setError(null)
      return
    }

    const fetchThreadData = async () => {
      try {
        setLoading(true)
        setError(null)
        setThread(null)
        setMessages([])

        let currentThread = null
        if (requestId) {
          currentThread = await chatService.getDisputeThreadByRequestId(requestId)
        } else if (orderId) {
          currentThread = await chatService.getDisputeThreadByOrderId(orderId)
        }

        if (isCancelled || activeKeyRef.current !== currentKey) return

        setThread(currentThread)
        if (currentThread?.id) {
          const msgPage = await chatService.getMessages(currentThread.id, 0, 100)
          if (isCancelled || activeKeyRef.current !== currentKey) return

          const content = msgPage?.content || []
          const history = [...content].reverse()

          // Merge an toàn: bảo toàn tin nhắn realtime đến qua WebSocket trong lúc đang tải history
          setMessages((prev) => {
            if (!prev || prev.length === 0) return history
            const historyIds = new Set(history.map((m) => m.id))
            const realtimePending = prev.filter((m) => m.id && !historyIds.has(m.id))
            return [...history, ...realtimePending]
          })
        }
      } catch (err) {
        if (isCancelled || activeKeyRef.current !== currentKey) return
        if (err?.response?.status === 404 || err?.response?.status === 204) {
          setThread(null)
          setError(null)
        } else {
          console.warn('Lỗi tải phòng chat đối soát:', err)
          setError(err?.response?.data?.message || err?.message || 'Không thể tải phòng chat đối soát')
        }
      } finally {
        if (!isCancelled && activeKeyRef.current === currentKey) {
          setLoading(false)
        }
      }
    }

    fetchThreadData()

    return () => {
      isCancelled = true
    }
  }, [requestId, orderId, currentKey])

  const refreshThread = async () => {
    if (!requestId && !orderId) return
    const targetKey = `${requestId || ''}_${orderId || ''}`
    try {
      setLoading(true)
      setError(null)

      let currentThread = null
      if (requestId) {
        currentThread = await chatService.getDisputeThreadByRequestId(requestId)
      } else if (orderId) {
        currentThread = await chatService.getDisputeThreadByOrderId(orderId)
      }

      if (activeKeyRef.current !== targetKey) return

      setThread(currentThread)
      if (currentThread?.id) {
        const msgPage = await chatService.getMessages(currentThread.id, 0, 100)
        if (activeKeyRef.current !== targetKey) return

        const content = msgPage?.content || []
        const history = [...content].reverse()

        setMessages((prev) => {
          if (!prev || prev.length === 0) return history
          const historyIds = new Set(history.map((m) => m.id))
          const realtimePending = prev.filter((m) => m.id && !historyIds.has(m.id))
          return [...history, ...realtimePending]
        })
      }
    } catch (err) {
      if (activeKeyRef.current !== targetKey) return
      if (err?.response?.status === 404 || err?.response?.status === 204) {
        setThread(null)
        setError(null)
      } else {
        console.warn('Lỗi tải phòng chat đối soát:', err)
        setError(err?.response?.data?.message || err?.message || 'Không thể tải phòng chat đối soát')
      }
    } finally {
      if (activeKeyRef.current === targetKey) {
        setLoading(false)
      }
    }
  }

  // Lắng nghe WebSocket realtime
  useEffect(() => {
    if (!thread?.id) return

    const unsubMsg = addWebSocketListener('CHAT_MESSAGE', (newMsg) => {
      if (newMsg?.threadId === thread.id || newMsg?.thread?.id === thread.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      }
    })

    const unsubClose = addWebSocketListener('CHAT_THREAD_CLOSED', (event) => {
      if (event?.threadId === thread.id) {
        setThread((prev) => (prev ? { ...prev, status: 'CLOSED', isLocked: true, closeReason: event.closeReason } : prev))
      }
    })

    return () => {
      unsubMsg()
      unsubClose()
    }
  }, [thread?.id])

  // Thống kê tin nhắn
  const stats = useMemo(() => {
    let images = 0
    let videos = 0
    let customerCount = 0
    let sellerCount = 0
    let systemCount = 0

    messages.forEach((m) => {
      if (m.messageType === 'IMAGE' || m.imageUrl) images++
      if (m.messageType === 'VIDEO' || m.videoUrl) videos++
      if (m.messageType === 'SYSTEM' || m.senderRole === 'SYSTEM') systemCount++
      else if (m.senderRole === 'CUSTOMER' || m.senderId === thread?.customerId) customerCount++
      else sellerCount++
    })

    return { images, videos, customerCount, sellerCount, systemCount, total: messages.length }
  }, [messages, thread?.customerId])

  // Lọc tin nhắn theo Tab và Ô tìm kiếm
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const isSystem = msg.messageType === 'SYSTEM' || msg.senderRole === 'SYSTEM'
      const isCustomer = msg.senderRole === 'CUSTOMER' || msg.senderId === thread?.customerId
      const isSeller = !isSystem && !isCustomer
      const isMedia = msg.messageType === 'IMAGE' || msg.messageType === 'VIDEO' || Boolean(msg.imageUrl) || Boolean(msg.videoUrl)

      if (filterType === 'CUSTOMER' && !isCustomer) return false
      if (filterType === 'SELLER' && !isSeller) return false
      if (filterType === 'MEDIA' && !isMedia) return false
      if (filterType === 'SYSTEM' && !isSystem) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const contentMatch = msg.content?.toLowerCase().includes(q)
        const senderMatch = msg.senderName?.toLowerCase().includes(q)
        if (!contentMatch && !senderMatch) return false
      }

      return true
    })
  }, [messages, filterType, searchQuery, thread?.customerId])

  if (error && !thread && !loading) {
    return (
      <div
        className={cn(
          'rounded-2xl border p-4 mb-3 transition-all shadow-xs',
          isDark
            ? 'border-rose-900/50 bg-rose-950/20 text-rose-300'
            : 'border-rose-200 bg-rose-50 text-rose-800'
        )}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <HiOutlineInformationCircle className="h-5 w-5 shrink-0" />
            </div>
            <div className="text-xs">
              <p className="font-bold">Không thể tải dữ liệu phòng đối soát thương lượng</p>
              <p className="text-[11px] opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshThread}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <HiOutlineRefresh className="h-3.5 w-3.5" />
            <span>Thử tải lại</span>
          </button>
        </div>
      </div>
    )
  }

  if (!loading && !thread) {
    return null
  }

  const isClosed = thread?.status === 'CLOSED' || thread?.isLocked

  // Hàm render từng bubble tin nhắn
  const renderMessageBubble = (msg) => {
    const isSystem = msg.messageType === 'SYSTEM' || msg.senderRole === 'SYSTEM'
    const isCustomer = msg.senderRole === 'CUSTOMER' || msg.senderId === thread?.customerId

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center my-2">
          <div className="max-w-md sm:max-w-lg rounded-xl bg-stone-200/90 dark:bg-slate-800/90 border border-stone-300/60 dark:border-slate-700 px-4 py-2 text-center text-xs text-stone-700 dark:text-slate-300 shadow-xs space-y-0.5">
            <div className="font-bold flex items-center justify-center gap-1.5 text-stone-900 dark:text-slate-200">
              <HiOutlineShieldCheck className="h-4 w-4 text-orange-500 shrink-0" />
              <span>{msg.senderName || 'Hệ Thống Tranh Chấp'}</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-95">{msg.content}</p>
          </div>
        </div>
      )
    }

    return (
      <div
        key={msg.id}
        className={cn(
          'flex flex-col max-w-[85%] sm:max-w-[75%]',
          isCustomer ? 'mr-auto items-start' : 'ml-auto items-end'
        )}
      >
        <div className="flex items-center gap-1.5 text-[10px] text-stone-400 dark:text-slate-500 mb-1 px-1">
          {isCustomer ? (
            <>
              <HiOutlineUser className="h-3 w-3 text-sky-500 shrink-0" />
              <span className="font-bold text-sky-600 dark:text-sky-400">
                {msg.senderName || 'Người mua'}
              </span>
            </>
          ) : (
            <>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {msg.senderName || thread?.shopName || 'Người bán'}
              </span>
              <HiOutlineShoppingBag className="h-3 w-3 text-purple-500 shrink-0" />
            </>
          )}
          <span>•</span>
          <span>
            {msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
          </span>
        </div>

        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed break-words shadow-xs space-y-2',
            isCustomer
              ? isDark
                ? 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-xs'
                : 'bg-white text-stone-900 border border-stone-200 rounded-tl-xs'
              : isDark
              ? 'bg-purple-950/60 text-purple-100 border border-purple-800/60 rounded-tr-xs'
              : 'bg-purple-50 text-purple-900 border border-purple-200 rounded-tr-xs'
          )}
        >
          {/* Ảnh bằng chứng */}
          {msg.messageType === 'IMAGE' && msg.imageUrl && (
            <div className="space-y-1">
              <img
                src={msg.imageUrl}
                alt="Ảnh đối chất"
                onClick={() => (setPreviewImage ? setPreviewImage(msg.imageUrl) : safeOpenUrl(msg.imageUrl))}
                className="max-h-52 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-black/10"
              />
              {msg.content && msg.content !== '[Hình ảnh]' && (
                <p className="pt-1">{msg.content}</p>
              )}
            </div>
          )}

          {/* Video bằng chứng */}
          {msg.messageType === 'VIDEO' && msg.videoUrl && (
            <div className="space-y-1">
              <div className="relative rounded-xl overflow-hidden bg-black/90 max-w-sm border border-purple-500/20 group">
                <video
                  src={msg.videoUrl}
                  controls
                  preload="metadata"
                  playsInline
                  className="max-h-56 w-full rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => (setPreviewImage ? setPreviewImage(msg.videoUrl) : safeOpenUrl(msg.videoUrl))}
                  className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] font-bold inline-flex items-center gap-1 backdrop-blur-xs transition-colors"
                  title="Xem phóng to video"
                >
                  <HiOutlineExternalLink className="h-3.5 w-3.5" />
                  <span>Phóng to</span>
                </button>
              </div>
              {msg.content && msg.content !== '[Video]' && (
                <p className="pt-1">{msg.content}</p>
              )}
            </div>
          )}

          {/* Tin nhắn văn bản thuần túy */}
          {msg.messageType !== 'IMAGE' && msg.messageType !== 'VIDEO' && (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 1. KHỐI HIỂN THỊ INLINE (GIAO DIỆN CHÍNH TRONG MODAL CHI TIẾT) */}
      <div
        className={cn(
          'rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs',
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-stone-50/70'
        )}
      >
        {/* Header Collapsible */}
        <div
          className={cn(
            'p-3.5 sm:p-4 flex items-center justify-between gap-3 select-none transition-colors border-b',
            isDark
              ? 'border-slate-800 bg-slate-800/40'
              : 'border-stone-200 bg-stone-100/60'
          )}
        >
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="h-8 w-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <HiOutlineChatAlt2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                  Lịch Sử Đối Chất Thương Lượng 1:1
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  Audit View (Read-Only)
                </span>
                {isClosed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300">
                    <HiOutlineLockClosed className="h-3 w-3" /> Đã đóng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang mở thương lượng
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">
                {thread
                  ? `${stats.total} tin nhắn • ${stats.images} ảnh • ${stats.videos} video • ${thread.customerName || 'Người mua'} ↔ ${thread.shopName || 'Shop'}`
                  : 'Đang tải...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Nút Làm mới dữ liệu */}
            <button
              type="button"
              onClick={refreshThread}
              disabled={loading}
              title="Tải lại dữ liệu đối soát"
              className="p-1.5 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors"
            >
              <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin')} />
            </button>

            {/* Nút Phóng to Toàn Màn hình để đối soát dài không bị gò bó */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="Mở giao diện đối soát mở rộng toàn màn hình"
              className="px-2.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
            >
              <HiOutlineExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Toàn màn hình</span>
            </button>

            {/* Nút Thu gọn / Mở rộng Accordion */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors"
            >
              {isExpanded ? <HiOutlineChevronUp className="h-5 w-5" /> : <HiOutlineChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Body Timeline Inline */}
        {isExpanded && (
          <div className="flex flex-col">
            {/* Disclaimer Banner */}
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <HiOutlineShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Toàn bộ trao đổi, hình ảnh & video đối soát được bảo lưu bất biến.</span>
              </div>
              {isClosed && thread?.closeReason && (
                <span className="text-[10px] font-bold text-stone-500 dark:text-slate-400">
                  Lý do đóng: {thread.closeReason}
                </span>
              )}
            </div>

            {/* Khung tin nhắn cuộn mượt (chiều cao linh hoạt lên đến 480px) */}
            <div
              className={cn(
                'max-h-[480px] overflow-y-auto p-4 space-y-3.5 scrollbar-thin',
                isDark ? 'bg-slate-950/50' : 'bg-stone-50/50'
              )}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-xs text-stone-400 space-y-2">
                  <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải dòng thời gian đối chất...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-xs text-stone-400 space-y-1 text-center">
                  <HiOutlineInformationCircle className="h-8 w-8 text-stone-300 dark:text-slate-700" />
                  <p className="font-semibold">Hai bên chưa phát sinh tin nhắn nào trong phòng này.</p>
                </div>
              ) : (
                messages.map(renderMessageBubble)
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* 2. CHẾ ĐỘ ĐỐI SOÁT TOÀN MÀN HÌNH (FULLSCREEN AUDIT MODAL) DÀNH CHO CUỘC TRÒ CHUYỆN DÀI */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={cn(
              'w-full max-w-5xl h-[94vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden',
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900'
            )}
          >
            {/* Header Modal Toàn Màn Hình */}
            <div
              className={cn(
                'p-4 sm:p-5 border-b shrink-0 flex items-center justify-between gap-3',
                isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-stone-50'
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                    {thread?.title || 'Phòng Thương Lượng Tranh Chấp Đối Soát'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    Audit View Toàn Màn Hình
                  </span>
                  {isClosed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300">
                      <HiOutlineLockClosed className="h-3 w-3" /> Đã đóng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang mở thương lượng
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-1">
                  Người mua: <strong className="text-sky-600 dark:text-sky-400">{thread?.customerName || 'Khách hàng'}</strong> ↔ Người bán: <strong className="text-purple-600 dark:text-purple-400">{thread?.shopName || 'Gian hàng'}</strong>
                  {thread?.closeReason && ` • Lý do đóng: ${thread.closeReason}`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={refreshThread}
                  disabled={loading}
                  title="Tải lại dữ liệu đối soát"
                  className="p-2 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors"
                >
                  <HiOutlineRefresh className={cn('h-5 w-5', loading && 'animate-spin')} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-500 hover:text-rose-600 transition-colors"
                  title="Đóng chế độ toàn màn hình"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Thanh công cụ tìm kiếm và lọc tab chuyên dụng */}
            <div
              className={cn(
                'px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
              )}
            >
              {/* Tabs lọc */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                    filterType === 'ALL'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                  )}
                >
                  Tất cả ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('CUSTOMER')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                    filterType === 'CUSTOMER'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                  )}
                >
                  Người mua ({stats.customerCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('SELLER')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                    filterType === 'SELLER'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                  )}
                >
                  Người bán ({stats.sellerCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('MEDIA')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1',
                    filterType === 'MEDIA'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                  )}
                >
                  <HiOutlinePhotograph className="h-3.5 w-3.5" />
                  <span>Media ({stats.images + stats.videos})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('SYSTEM')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                    filterType === 'SYSTEM'
                      ? 'bg-stone-700 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                  )}
                >
                  Hệ thống ({stats.systemCount})
                </button>
              </div>

              {/* Ô tìm kiếm nội dung */}
              <div className="relative w-full sm:w-64">
                <HiOutlineSearch className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm nội dung tin nhắn..."
                  className={cn(
                    'w-full pl-9 pr-3.5 py-1.5 rounded-xl text-xs border outline-hidden transition-all',
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                      : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-purple-500'
                  )}
                />
              </div>
            </div>

            {/* Khung tin nhắn cuộn toàn màn hình */}
            <div
              className={cn(
                'flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin',
                isDark ? 'bg-slate-950/70' : 'bg-stone-50/70'
              )}
            >
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-xs text-stone-400 space-y-2 text-center">
                  <HiOutlineInformationCircle className="h-10 w-10 text-stone-300 dark:text-slate-700" />
                  <p className="font-semibold text-sm">Không tìm thấy tin nhắn nào phù hợp với bộ lọc.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('ALL')
                      setSearchQuery('')
                    }}
                    className="text-purple-600 dark:text-purple-400 underline font-bold"
                  >
                    Xóa bộ lọc tìm kiếm
                  </button>
                </div>
              ) : (
                filteredMessages.map(renderMessageBubble)
              )}
              <div ref={fullscreenMessagesEndRef} />
            </div>

            {/* Footer Modal Toàn Màn Hình */}
            <div
              className={cn(
                'p-3 px-5 border-t shrink-0 flex items-center justify-between text-xs',
                isDark ? 'border-slate-800 bg-slate-850 text-slate-400' : 'border-stone-200 bg-white text-stone-500'
              )}
            >
              <span>
                Hiển thị <strong>{filteredMessages.length}</strong> / <strong>{messages.length}</strong> tin nhắn đối chất.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fullscreenMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-3 py-1 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-[11px] font-bold text-stone-700 dark:text-slate-200"
                >
                  Cuộn xuống mới nhất ↓
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="px-3 py-1 rounded-lg bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-100 font-bold text-[11px]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

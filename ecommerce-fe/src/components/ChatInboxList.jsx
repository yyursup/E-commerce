import { useState, useEffect, useMemo } from 'react'
import {
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineSupport,
  HiOutlineShoppingBag,
  HiOutlineBadgeCheck,
  HiOutlineBell,
  HiX,
} from 'react-icons/hi'
import { HiOutlineBellSlash } from 'react-icons/hi2'
import { useThemeStore } from '../store/useThemeStore'
import { useChatStore } from '../store/useChatStore'
import { getAccessToken } from '../lib/auth'
import chatService from '../services/chatService'
import { addWebSocketListener } from '../services/websocketService'
import { cn } from '../lib/cn'
import toast from 'react-hot-toast'

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (yesterday.getDate() === date.getDate()) {
    return 'Hôm qua'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

export default function ChatInboxList({ onClose, notifEnabled, toggleNotif }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const token = getAccessToken()
  const openShopChat = useChatStore((s) => s.openShopChat)
  const openSupportChat = useChatStore((s) => s.openSupportChat)
  const openBotChat = useChatStore((s) => s.openBotChat)
  const setUnreadTotal = useChatStore((s) => s.setUnreadTotal)

  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Load threads
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    let isMounted = true
    const loadThreads = async () => {
      try {
        setLoading(true)
        const res = await chatService.getThreads('CUSTOMER')
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.content || []
          setThreads(list)

          // Calculate total unread
          const totalUnread = list.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
          setUnreadTotal(totalUnread)
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách hội thoại:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadThreads()

    // Listen to real-time thread updates
    const unregUpdated = addWebSocketListener('CHAT_THREAD_UPDATED', (updated) => {
      if (!updated) return
      setThreads((prev) => {
        const exists = prev.some((t) => String(t.id).toLowerCase() === String(updated.id).toLowerCase())
        if (exists) {
          return prev.map((t) =>
            String(t.id).toLowerCase() === String(updated.id).toLowerCase()
              ? { ...t, ...updated }
              : t,
          )
        }
        return [updated, ...prev]
      })
    })

    const unregMsg = addWebSocketListener('CHAT_MESSAGE', (msg) => {
      if (!msg) return
      setThreads((prev) => {
        const idx = prev.findIndex((t) => String(t.id).toLowerCase() === String(msg.threadId).toLowerCase())
        if (idx !== -1) {
          const target = { ...prev[idx], lastMessage: msg.content, lastMessageAt: msg.createdAt }
          const rest = prev.filter((_, i) => i !== idx)
          return [target, ...rest]
        }
        return prev
      })
    })

    return () => {
      isMounted = false
      unregUpdated()
      unregMsg()
    }
  }, [token, setUnreadTotal])

  // Separate shop threads vs support thread
  const supportThread = useMemo(() => {
    return threads.find((t) => t.type === 'SUPPORT')
  }, [threads])

  const shopThreads = useMemo(() => {
    const list = threads.filter((t) => t.type === 'SHOP')
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      (t) =>
        t.shopName?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.lastMessage?.toLowerCase().includes(q)
    )
  }, [threads, searchQuery])

  return (
    <div className="flex h-full flex-col select-none">
      {/* 1. Header (TikTok Shop Inbox Title) */}
      <div
        className={cn(
          'flex items-center justify-between border-b px-4 py-3 transition-colors',
          isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-white'
        )}
      >
        <div className="flex items-center gap-2">
          <h2 className={cn('text-base font-extrabold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Hộp thư
          </h2>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 animate-pulse" />
        </div>

        <div className="flex items-center gap-1">
          {/* Notification toggle */}
          <button
            type="button"
            onClick={() => {
              const nextState = !notifEnabled
              toggleNotif()
              if (nextState) {
                toast.success('Đã bật thông báo')
              } else {
                toast.success('Đã tắt thông báo')
              }
            }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-stone-100 text-stone-600'
            )}
            title={notifEnabled ? 'Tắt thông báo' : 'Bật thông báo'}
          >
            {notifEnabled ? (
              <HiOutlineBell className="h-4 w-4 text-amber-500" />
            ) : (
              <HiOutlineBellSlash className="h-4 w-4 opacity-50" />
            )}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-stone-100 text-stone-600'
            )}
            title="Đóng"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Search Input */}
      <div
        className={cn(
          'border-b px-3 py-2 transition-colors',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-100 bg-stone-50/70'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors',
            isDark ? 'border-slate-750 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
          )}
        >
          <HiOutlineSearch className="h-4 w-4 shrink-0 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm shop, tin nhắn..."
            className="w-full bg-transparent text-xs outline-none placeholder:opacity-50"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="opacity-50 hover:opacity-100">
              <HiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Channels List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-slate-800/60 scrollbar-thin">
        {/* Pinned: AI Assistant */}
        <button
          type="button"
          onClick={openBotChat}
          className={cn(
            'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
            isDark ? 'hover:bg-slate-800/80' : 'hover:bg-stone-50'
          )}
        >
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <HiOutlineSparkles className="h-6 w-6" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className={cn('text-xs font-bold truncate', isDark ? 'text-white' : 'text-stone-900')}>
                Trợ lý ảo AI
              </span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                24/7
              </span>
            </div>
            <p className={cn('mt-0.5 truncate text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tư vấn mua sắm, gợi ý sản phẩm và giải đáp thắc mắc
            </p>
          </div>
        </button>

        {/* Pinned: System Customer Support */}
        <button
          type="button"
          onClick={openSupportChat}
          className={cn(
            'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
            isDark ? 'hover:bg-slate-800/80' : 'hover:bg-stone-50'
          )}
        >
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <HiOutlineSupport className="h-6 w-6" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className={cn('text-xs font-bold truncate', isDark ? 'text-white' : 'text-stone-900')}>
                CSKH E-commerce Platform
              </span>
              {supportThread?.lastMessageAt && (
                <span className="text-[10px] opacity-50 shrink-0">
                  {formatTime(supportThread.lastMessageAt)}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <p className={cn('truncate text-[11px]', supportThread?.unreadCount > 0 ? (isDark ? 'font-bold text-slate-200' : 'font-bold text-stone-900') : (isDark ? 'text-slate-400' : 'text-stone-500'))}>
                {supportThread?.lastMessage || 'Kênh hỗ trợ chính thức sàn thương mại điện tử'}
              </p>
              {supportThread?.unreadCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                  {supportThread.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Section divider */}
        <div className={cn('px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider', isDark ? 'bg-slate-900 text-slate-500' : 'bg-stone-100 text-stone-400')}>
          Đoạn chat với các Shop ({shopThreads.length})
        </div>

        {/* List of Shop Threads */}
        {loading ? (
          <div className="py-8 text-center text-xs opacity-50">Đang tải hộp thư...</div>
        ) : shopThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-2">
              <HiOutlineShoppingBag className="h-6 w-6" />
            </div>
            <p className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-stone-700")}>Chưa có cuộc trò chuyện nào với Shop</p>
            <p className={cn("mt-1 text-[11px] max-w-xs leading-relaxed", isDark ? "text-slate-400" : "text-stone-500")}>
              Hãy nhấn nút <span className="font-semibold text-amber-500">"Chat Ngay"</span> tại trang chi tiết sản phẩm hoặc gian hàng để bắt đầu nhắn tin với người bán!
            </p>
          </div>
        ) : (
          shopThreads.map((thread) => {
            const hasUnread = thread.unreadCount > 0
            const shopName = thread.shopName || thread.title?.replace(/^Chat với\s*/, '') || 'Cửa hàng'
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  openShopChat({
                    id: thread.shopId,
                    name: shopName,
                    logo: thread.shopLogo,
                  })
                }}
                className={cn(
                  'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                  isDark ? 'hover:bg-slate-800/80' : 'hover:bg-stone-50',
                  hasUnread && (isDark ? 'bg-amber-500/5' : 'bg-amber-50/50')
                )}
              >
                {/* Shop Avatar */}
                <div className="relative shrink-0">
                  {thread.shopLogo ? (
                    <img
                      src={thread.shopLogo}
                      alt={shopName}
                      className="h-11 w-11 rounded-full object-cover border border-amber-500/20 shadow-xs group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
                      {shopName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>

                {/* Shop Info & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn('text-xs font-bold truncate', isDark ? 'text-white' : 'text-stone-900')}>
                        {shopName}
                      </span>
                      <HiOutlineBadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    </div>
                    {thread.lastMessageAt && (
                      <span className="text-[10px] opacity-50 shrink-0">
                        {formatTime(thread.lastMessageAt)}
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        'truncate text-[11px] leading-tight',
                        hasUnread
                          ? (isDark ? 'font-bold text-amber-300' : 'font-bold text-amber-700')
                          : (isDark ? 'text-slate-400' : 'text-stone-500')
                      )}
                    >
                      {thread.lastMessage || 'Bắt đầu cuộc trò chuyện với shop'}
                    </p>

                    {/* Unread dot or pill badge */}
                    {hasUnread && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                        {thread.unreadCount}
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
  )
}

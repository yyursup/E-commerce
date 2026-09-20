import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  HiOutlineViewGrid,
  HiOutlineShoppingBag,
  HiOutlineArchive,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineExternalLink,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineTicket,
  HiOutlineChat,
  HiOutlineClipboardList,
  HiOutlineVideoCamera,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import { getAccessToken } from '../lib/auth'
import chatService from '../services/chatService'
import {
  createWebSocketConnection,
  addWebSocketListener,
} from '../services/websocketService'
import { useChatNotification } from '../hooks/useChatNotification'
import ChatNotificationToast from './ChatNotificationToast'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', label: 'Tổng quan (Dashboard)', icon: HiOutlineViewGrid },
  { to: '/live', label: 'Kênh Livestream', icon: HiOutlineVideoCamera },
  { to: '/orders', label: 'Quản lý Đơn hàng', icon: HiOutlineShoppingBag },
  { to: '/products', label: 'Quản lý Sản phẩm', icon: HiOutlineArchive },
  { to: '/inventory-history', label: 'Lịch sử Kho hàng', icon: HiOutlineClipboardList },
  { to: '/vouchers', label: 'Mã Giảm Giá Shop', icon: HiOutlineTicket },
  { to: '/violations', label: 'Sức khỏe Shop & Vi phạm', icon: HiOutlineShieldCheck },
  { to: '/chat', label: 'Tin nhắn (Chat CSKH)', icon: HiOutlineChat, isChat: true },
  { to: '/settings', label: 'Cài đặt Kho & Gian hàng', icon: HiOutlineCog },
]

export default function SellerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'
  const [unreadChatTotal, setUnreadChatTotal] = useState(0)

  const {
    notifications,
    addNotification,
    dismissNotification,
    isThreadMuted,
    toggleMuteThread,
  } = useChatNotification()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const shopId = user?.shopId
  const token = getAccessToken()

  // Track unread messages from customer threads
  useEffect(() => {
    if (!token) return
    createWebSocketConnection(token)

    const fetchUnread = async () => {
      try {
        const res = await chatService.getThreads('SHOP')
        const list = Array.isArray(res) ? res : res?.content || []
        const selectedId = sessionStorage.getItem('seller_selected_thread_id')
        const total = list.reduce((acc, t) => {
          if (
            location.pathname.startsWith('/chat') &&
            selectedId &&
            String(t.id).toLowerCase() === String(selectedId).toLowerCase()
          ) {
            return acc
          }
          return acc + (t.unreadCount || 0)
        }, 0)
        setUnreadChatTotal(total)
      } catch (err) {
        console.warn('Lỗi tải số tin chưa đọc:', err)
      }
    }

    fetchUnread()

    const unregMsg = addWebSocketListener('CHAT_MESSAGE', (msg) => {
      if (!msg) return
      const isSelf = user?.id && String(msg.senderId).toLowerCase() === String(user.id).toLowerCase()
      if (isSelf) return

      fetchUnread()
      if (!location.pathname.startsWith('/chat') && msg.senderRole === 'CUSTOMER') {
        if (!isThreadMuted(msg.threadId)) {
          addNotification(msg)
        }
      }
    })

    const unregUpdated = addWebSocketListener('CHAT_THREAD_UPDATED', () => {
      fetchUnread()
    })

    return () => {
      unregMsg()
      unregUpdated()
    }
  }, [token, location.pathname, addNotification, isThreadMuted])

  return (
    <div className={cn('min-h-screen flex flex-col', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-900')}>
      {/* Top Navbar */}
      <header className={cn('sticky top-0 z-40 border-b backdrop-blur px-6 py-3 flex items-center justify-between',
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-stone-200'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black shadow-md shadow-amber-500/20">
            <HiOutlineShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-amber-500">Kênh Người Bán</span>
              <span className="rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 text-[10px] uppercase">
                Seller Centre
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">Hệ thống quản lý gian hàng đa kênh</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {shopId && (
            <a
              href={`http://localhost:3000/shop/${shopId}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <HiOutlineExternalLink className="h-4 w-4" />
              Xem Shop trên sàn
            </a>
          )}

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-stone-500 dark:text-slate-400 hover:text-amber-500 transition-colors"
          >
            Về sàn mua sắm &rarr;
          </a>

          <button
            onClick={toggleTheme}
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <HiOutlineSun className="h-5 w-5 text-amber-400" /> : <HiOutlineMoon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className={cn('sticky top-20 rounded-2xl border p-5 shadow-sm space-y-5',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
            )}>
              {/* Shop Badge Card */}
              <div className="flex items-center gap-3 pb-4 border-b border-stone-100 dark:border-slate-800">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {(user?.shopName || user?.email || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-sm truncate">{user?.shopName || 'Gian hàng của tôi'}</h3>
                  <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navItems.map(({ to, label, icon: Icon, isChat }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => cn(
                      'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-stone-600 hover:bg-stone-100',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </div>
                    {isChat && unreadChatTotal > 0 && (
                      <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                        {unreadChatTotal > 99 ? '99+' : unreadChatTotal}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <HiOutlineLogout className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </aside>

          {/* Main Workspace */}
          <main className="lg:col-span-3">
            {/* Top Banner cảnh báo vi phạm tinh gọn chuẩn Responsive */}
            {(user?.shopStatus === 'WARNED' || user?.shopStatus === 'SUSPENDED' || (user?.violationCount && user.violationCount >= 3)) && (
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">⚠️</span>
                  <span>
                    Gian hàng đang ở trạng thái <strong>{user?.shopStatus === 'SUSPENDED' ? 'Tạm ngưng hoạt động' : 'Cảnh báo vi phạm'}</strong> ({user?.violationCount || 3}/7 vi phạm). Sản phẩm có thể bị tạm ẩn và tiền ký quỹ Escrow được tạm giữ để đảm bảo an toàn.
                  </span>
                </div>
                <NavLink to="/violations" className="font-bold underline hover:text-amber-500 shrink-0 self-end sm:self-auto">
                  Xem chi tiết & Kháng cáo &rarr;
                </NavLink>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>

      {/* Incoming customer message notification popup when not on /chat */}
      <ChatNotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onMute={(threadId, senderName) => {
          toggleMuteThread(threadId)
          toast.success(`Đã tắt thông báo từ ${senderName || 'khách hàng này'}`)
        }}
        onOpen={(threadId) => {
          if (threadId) sessionStorage.setItem('seller_selected_thread_id', threadId)
          navigate('/chat')
        }}
        position="top-right"
      />
    </div>
  )
}

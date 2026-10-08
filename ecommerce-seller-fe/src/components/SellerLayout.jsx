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
  HiOutlineCash,
  HiOutlineClock,
  HiOutlineExclamation,
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
import shopService from '../services/shop'
import escrowFundService from '../services/escrowFund'

const navItems = [
  { to: '/dashboard', label: 'Tổng quan (Dashboard)', icon: HiOutlineViewGrid },
  { to: '/live', label: 'Kênh Livestream', icon: HiOutlineVideoCamera },
  { to: '/orders', label: 'Quản lý Đơn hàng', icon: HiOutlineShoppingBag },
  { to: '/products', label: 'Quản lý Sản phẩm', icon: HiOutlineArchive },
  { to: '/inventory-history', label: 'Lịch sử Kho hàng', icon: HiOutlineClipboardList },
  { to: '/vouchers', label: 'Mã Giảm Giá Shop', icon: HiOutlineTicket },
  { to: '/escrow-fund', label: 'Quỹ Ký Quỹ & Uy Tín', icon: HiOutlineCash, isEscrowRelated: true },
  { to: '/violations', label: 'Điểm uy tín Shop', icon: HiOutlineShieldCheck },
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
  const [escrowFund, setEscrowFund] = useState(null)

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

  // Tự động đồng bộ trạng thái Shop mới nhất từ Backend (ví dụ khi Admin vừa duyệt đóng shop)
  useEffect(() => {
    if (!token) return
    let isMounted = true
    const syncShopStatus = async () => {
      try {
        const profile = await shopService.getMyShop()
        if (isMounted && profile?.status && profile.status !== user?.shopStatus) {
          useAuthStore.getState().updateUser({
            shopStatus: profile.status,
            violationCount: profile.violationCount != null ? profile.violationCount : user?.violationCount,
            shopName: profile.name || user?.shopName,
          })
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Không thể đồng bộ trạng thái shop mới nhất:', err)
        }
      }
    }
    syncShopStatus()

    // Fetch escrow fund to check if they are participating
    const fetchEscrow = async () => {
      try {
        const data = await escrowFundService.getMyFund()
        if (isMounted) setEscrowFund(data)
      } catch(err) {
        // ignore
      }
    }
    fetchEscrow()

    return () => {
      isMounted = false
    }
  }, [token, location.pathname])

  const isNoneEscrow = !escrowFund || escrowFund.committedAmount === 0


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
                {navItems.map(({ to, label, icon: Icon, isChat, isEscrowRelated }) => {
                  const isDisabled = isEscrowRelated && isNoneEscrow
                  return (
                    <NavLink
                      key={to}
                      to={isDisabled ? '#' : to}
                      onClick={(e) => {
                        if (isDisabled) {
                          e.preventDefault()
                          toast.error('Vui lòng tham gia Quỹ Ký Quỹ để sử dụng tính năng này.')
                        }
                      }}
                      className={({ isActive }) => cn(
                        'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all',
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed text-stone-400 dark:text-slate-500'
                          : isActive
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
                  )
                })}
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
            {/* Banner thông báo gian hàng đã đóng cửa (CLOSED) */}
            {user?.shopStatus === 'CLOSED' && (
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-rose-500/5 px-4 py-3.5 text-xs text-rose-800 dark:text-rose-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <HiOutlineExclamation className="h-5 w-5 text-rose-500 shrink-0" />
                  <span>
                    Gian hàng đã hoàn tất thủ tục <strong>Đóng cửa (CLOSED)</strong> và nhận lại toàn bộ tiền ký quỹ. Các tính năng đăng bán, cập nhật sản phẩm và tạo voucher đã bị vô hiệu hóa. Bạn vẫn có thể xem lịch sử đơn hàng, quỹ ký quỹ và thực hiện rút số dư ví khả dụng.
                  </span>
                </div>
                <NavLink
                  to="/escrow-fund"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-sm transition shrink-0 self-end sm:self-auto"
                >
                  Xem quỹ & ví &rarr;
                </NavLink>
              </div>
            )}

            {/* Banner yêu cầu nạp ký quỹ để kích hoạt gian hàng */}
            {user?.shopStatus === 'PENDING_DEPOSIT' && (
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 px-4 py-3.5 text-xs text-amber-800 dark:text-amber-200 shadow-sm">
                <span>
                  Hồ sơ gian hàng đã được duyệt! Vui lòng <strong>nạp đủ số tiền ký quỹ cam kết</strong> để kích hoạt gian hàng và mở khóa tính năng đăng bán sản phẩm.
                </span>
                <NavLink
                  to="/escrow-fund"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition shrink-0 self-end sm:self-auto"
                >
                  Nạp ký quỹ kích hoạt &rarr;
                </NavLink>
              </div>
            )}

            {/* Top Banner cảnh báo vi phạm tinh gọn chuẩn Responsive */}
            {Boolean(user?.shopStatus === 'WARNED' || user?.shopStatus === 'SUSPENDED' || (Number(user?.violationCount || 0) >= 3)) && (
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                <span>
                  Gian hàng đang ở trạng thái <strong>{user?.shopStatus === 'SUSPENDED' ? 'Tạm ngưng hoạt động' : 'Cảnh báo vi phạm'}</strong> ({user?.violationCount || 3}/7 vi phạm). Sản phẩm có thể bị tạm ẩn và tiền ký quỹ Escrow được tạm giữ để đảm bảo an toàn.
                </span>
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

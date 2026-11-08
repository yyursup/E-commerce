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
  HiOutlineShieldCheck,
  HiOutlineCash,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineDocumentText,
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
  { to: '/dashboard', label: 'Tổng quan', icon: HiOutlineViewGrid, group: 'BÁN HÀNG' },
  { to: '/orders', label: 'Đơn hàng', icon: HiOutlineShoppingBag, group: 'BÁN HÀNG' },
  { to: '/products', label: 'Sản phẩm', icon: HiOutlineArchive, group: 'BÁN HÀNG' },
  { to: '/inventory-history', label: 'Lịch sử kho', icon: HiOutlineClipboardList, group: 'BÁN HÀNG' },
  { to: '/vouchers', label: 'Voucher shop', icon: HiOutlineTicket, group: 'BÁN HÀNG' },
  { to: '/escrow-fund', label: 'Ký quỹ & doanh thu', icon: HiOutlineCash, group: 'TÀI CHÍNH' },
  { to: '/violations', label: 'Vi phạm & uy tín', icon: HiOutlineShieldCheck, group: 'GIAN HÀNG' },
  { to: '/chat', label: 'Tin nhắn', icon: HiOutlineChat, isChat: true, group: 'GIAN HÀNG' },
  { to: '/policy', label: 'Chính sách', icon: HiOutlineDocumentText, group: 'GIAN HÀNG' },
  { to: '/settings', label: 'Cài đặt', icon: HiOutlineCog, group: 'GIAN HÀNG' },
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
        if (isMounted && profile) {
          useAuthStore.getState().updateUser({
            shopStatus: profile.status || user?.shopStatus,
            violationCount: profile.violationCount != null ? profile.violationCount : 0,
            shopViolationCount: profile.violationCount != null ? profile.violationCount : 0,
            shopName: profile.name || user?.shopName,
            suspendedUntil: profile.suspendedUntil || null,
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

  const isNoneEscrow = escrowFund && (Number(escrowFund.balance || 0) <= 0 && Number(escrowFund.committedAmount || 0) <= 0)


  const groups = navItems.reduce((acc, item) => {
    ;(acc[item.group] ||= []).push(item)
    return acc
  }, {})

  return (
    <div className={cn('flex min-h-screen', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-950')}>
      {/* Sidebar */}
      {/* Wrapper paints the black column full height; the aside itself stays pinned */}
      <div className="hidden w-64 shrink-0 bg-stone-950 lg:block">
      <aside className="sticky top-0 flex h-screen flex-col gap-5 overflow-y-auto px-3.5 py-5 text-white">
        <div className="flex flex-col gap-1 px-2">
          <span className="font-display text-[22px] font-extrabold tracking-[-0.04em]">
            E-Commerce<span className="text-amber-500">.</span>
          </span>
          <span className="font-mono text-[11px] text-stone-400">KÊNH NGƯỜI BÁN</span>
        </div>

        <nav aria-label="Kênh người bán" className="flex flex-col gap-4">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="flex flex-col gap-0.5">
              <span className="px-2.5 pb-1 font-mono text-[10px] tracking-[0.06em] text-stone-500">{group}</span>
              {items.map(({ to, label, icon: Icon, isChat, isEscrowRelated }) => {
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
                      'flex items-center justify-between rounded-md border-l-[3px] px-2.5 py-2 text-sm transition-colors',
                      isDisabled
                        ? 'cursor-not-allowed border-transparent text-stone-600'
                        : isActive
                          ? 'border-amber-500 bg-stone-900 font-bold text-white'
                          : 'border-transparent font-medium text-stone-300 hover:bg-stone-900 hover:text-white',
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </span>
                    {isChat && unreadChatTotal > 0 && (
                      <span className="rounded bg-amber-500 px-1.5 font-mono text-[11px] text-stone-950">
                        {unreadChatTotal > 99 ? '99+' : unreadChatTotal}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-stone-800 pt-3">
          <div className="flex items-center gap-2.5 px-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500 font-bold text-stone-950">
              {(user?.shopName || user?.email || 'S').charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-col">
              <strong className="truncate text-[13px]">{user?.shopName || 'Gian hàng của tôi'}</strong>
              <span className="truncate text-[11px] text-stone-400">{user?.email}</span>
            </span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-red-400 hover:bg-stone-900">
            <HiOutlineLogout className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cn('sticky top-0 z-40 flex items-center justify-between gap-3 border-b px-6 py-3', isDark ? 'border-slate-800 bg-slate-950' : 'border-stone-200 bg-white')}>
          <span className="font-display text-lg font-extrabold tracking-[-0.03em] lg:hidden">
            E-Commerce<span className="text-amber-500">.</span> <span className="font-mono text-xs font-medium">SELLER</span>
          </span>
          <span className={cn('hidden font-mono text-xs lg:inline', isDark ? 'text-slate-400' : 'text-stone-500')}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).toUpperCase()}
          </span>
          <div className="flex items-center gap-3">
            {shopId && (
              <a
                href={`http://localhost:3000/shop/${shopId}`}
                target="_blank"
                rel="noreferrer"
                className={cn('hidden items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold sm:inline-flex', isDark ? 'border-slate-600 text-white hover:bg-slate-800' : 'border-stone-950 text-stone-950 hover:bg-stone-100')}
              >
                <HiOutlineExternalLink className="h-4 w-4" />
                Xem shop trên sàn
              </a>
            )}
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className={cn('text-xs font-medium hover:underline', isDark ? 'text-slate-300' : 'text-stone-600')}>
              Về sàn mua sắm →
            </a>
            <button
              onClick={toggleTheme}
              className={cn('rounded-md p-2 transition-colors', isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100')}
              aria-label="Đổi giao diện sáng/tối"
            >
              {isDark ? <HiOutlineSun className="h-5 w-5" /> : <HiOutlineMoon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Mobile nav: the sidebar is desktop-only */}
        <nav aria-label="Kênh người bán" className={cn('flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden', isDark ? 'border-slate-800' : 'border-stone-200')}>
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => cn('shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold', isActive ? 'bg-stone-950 text-white dark:bg-white dark:text-stone-950' : isDark ? 'text-slate-300' : 'text-stone-600')}>
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="w-full max-w-[1280px] flex-1 px-4 py-7 sm:px-8">
            {/* Banner thông báo gian hàng đã đóng cửa (CLOSED) */}
            {user?.shopStatus === 'CLOSED' && (
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3.5 text-xs text-rose-800 dark:text-rose-200">
                <div className="flex items-center gap-2">
                  <HiOutlineExclamation className="h-5 w-5 text-rose-500 shrink-0" />
                  <span>
                    Gian hàng đã hoàn tất thủ tục <strong>Đóng cửa (CLOSED)</strong> và nhận lại toàn bộ tiền ký quỹ. Các tính năng đăng bán, cập nhật sản phẩm và tạo voucher đã bị vô hiệu hóa. Bạn vẫn có thể xem lịch sử đơn hàng, quỹ ký quỹ và thực hiện rút số dư ví khả dụng.
                  </span>
                </div>
                <NavLink
                  to="/escrow-fund"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shrink-0 self-end sm:self-auto"
                >
                  Xem quỹ & ví &rarr;
                </NavLink>
              </div>
            )}

            {/* Banner yêu cầu nạp ký quỹ để kích hoạt gian hàng */}
            {user?.shopStatus === 'PENDING_DEPOSIT' && (
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3.5 text-xs text-amber-900 dark:text-amber-100">
                <span>
                  Hồ sơ gian hàng đã được duyệt! Vui lòng <strong>nạp đủ số tiền ký quỹ cam kết</strong> để kích hoạt gian hàng và mở khóa tính năng đăng bán sản phẩm.
                </span>
                <NavLink
                  to="/escrow-fund"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-stone-950 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 font-bold text-xs transition shrink-0 self-end sm:self-auto"
                >
                  Nạp ký quỹ kích hoạt &rarr;
                </NavLink>
              </div>
            )}

            {/* Top Banner cảnh báo vi phạm tinh gọn chuẩn Responsive */}
            {Boolean(user?.shopStatus === 'WARNED' || user?.shopStatus === 'SUSPENDED' || (Number(user?.shopViolationCount ?? user?.violationCount ?? 0) >= 3)) && (
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-100">
                <span>
                  Gian hàng đang ở trạng thái <strong>{user?.shopStatus === 'SUSPENDED' ? 'Tạm ngưng hoạt động' : 'Cảnh báo vi phạm'}</strong> ({user?.shopViolationCount ?? user?.violationCount ?? 0}/7 vi phạm). Sản phẩm có thể bị tạm ẩn và tiền ký quỹ Escrow được tạm giữ để đảm bảo an toàn.
                </span>
                <NavLink to="/violations" className="font-bold underline hover:text-amber-500 shrink-0 self-end sm:self-auto">
                  Xem chi tiết & Kháng cáo &rarr;
                </NavLink>
              </div>
            )}
            <Outlet />
        </main>
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

import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  HiOutlineViewGrid,
  HiOutlineClipboardCheck,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineSearch,
  HiOutlineLogout,
  HiOutlineUserCircle,
  HiOutlineChartBar,
  HiOutlineChat,
  HiOutlineTrendingUp,
  HiOutlineCreditCard,
  HiOutlineTicket,
  HiOutlineShieldCheck,
  HiOutlineCash,
  HiOutlineDocumentText,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'

const navItems = [
  { to: '/dashboard', label: 'Tổng quan sàn', icon: HiOutlineViewGrid, group: 'VẬN HÀNH' },
  { to: '/requests', label: 'Duyệt yêu cầu & mở shop', icon: HiOutlineClipboardCheck, group: 'VẬN HÀNH' },
  { to: '/moderation', label: 'Kiểm duyệt sản phẩm', icon: HiOutlineShieldCheck, group: 'VẬN HÀNH' },
  { to: '/orders', label: 'Gian hàng & đơn hàng', icon: HiOutlineShoppingBag, group: 'VẬN HÀNH' },
  { to: '/reports', label: 'Khiếu nại & vi phạm', icon: HiOutlineClipboardCheck, group: 'VẬN HÀNH' },
  { to: '/live-chat', label: 'Live chat CSKH', icon: HiOutlineChat, group: 'VẬN HÀNH' },
  { to: '/platform-wallet', label: 'Tài chính & ví sàn', icon: HiOutlineCreditCard, group: 'TÀI CHÍNH' },
  { to: '/commissions', label: 'Hoa hồng & biểu phí', icon: HiOutlineChartBar, group: 'TÀI CHÍNH' },
  { to: '/trust-config', label: 'Ký quỹ & bậc sao', icon: HiOutlineCash, group: 'TÀI CHÍNH' },
  { to: '/vouchers', label: 'Voucher toàn sàn', icon: HiOutlineTicket, group: 'CẤU HÌNH' },
  { to: '/policies', label: 'Chính sách & quy chế', icon: HiOutlineDocumentText, group: 'CẤU HÌNH' },
]

const groups = navItems.reduce((acc, item) => {
  ;(acc[item.group] ||= []).push(item)
  return acc
}, {})

export default function AdminLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const normalizedRole = user?.role?.toUpperCase()?.replace(/^ROLE_/, '')
  const isAdmin = normalizedRole === 'ADMIN'

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className={cn('min-h-[calc(100vh-4rem)] px-4 py-12', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-800')}>
        <div className="mx-auto max-w-3xl rounded-lg border border-red-500/40 bg-red-500/10 p-8 text-center">
          <h1 className="text-xl font-semibold text-rose-500">Truy cập bị từ chối</h1>
          <p className="mt-2 text-sm opacity-80">Khu vực này chỉ dành riêng cho tài khoản Quản trị viên sàn.</p>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="mt-4 inline-flex rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950"
          >
            Đăng nhập lại bằng tài khoản Admin
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-screen', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-950')}>
      {/* Wrapper paints the black column full height; the aside itself stays pinned */}
      <div className="hidden w-64 shrink-0 bg-stone-950 lg:block">
      <aside className="sticky top-0 flex h-screen flex-col gap-5 overflow-y-auto px-3.5 py-5 text-white">
        <div className="flex flex-col gap-1 px-2">
          <span className="font-display text-[22px] font-extrabold tracking-[-0.04em]">
            E-Commerce<span className="text-amber-500">.</span>
          </span>
          <span className="font-mono text-[11px] text-stone-400">QUẢN TRỊ SÀN</span>
        </div>

        <nav aria-label="Quản trị sàn" className="flex flex-col gap-4">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="flex flex-col gap-0.5">
              <span className="px-2.5 pb-1 font-mono text-[10px] tracking-[0.06em] text-stone-500">{group}</span>
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 rounded-md border-l-[3px] px-2.5 py-2 text-sm transition-colors',
                    isActive
                      ? 'border-amber-500 bg-stone-900 font-bold text-white'
                      : 'border-transparent font-medium text-stone-300 hover:bg-stone-900 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-stone-800 pt-3">
          <div className="flex items-center gap-2.5 px-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500 text-stone-950">
              <HiOutlineUserCircle className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <strong className="text-[13px]">Quản trị viên</strong>
              <span className="truncate text-[11px] text-stone-400">{user?.email || 'Admin account'}</span>
            </span>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-red-400 hover:bg-stone-900"
          >
            <HiOutlineLogout className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cn('sticky top-0 z-40 flex items-center justify-between gap-3 border-b px-6 py-3', isDark ? 'border-slate-800 bg-slate-950' : 'border-stone-200 bg-white')}>
          <span className="font-display text-lg font-extrabold tracking-[-0.03em] lg:hidden">
            E-Commerce<span className="text-amber-500">.</span> <span className="font-mono text-xs font-medium">ADMIN</span>
          </span>
          <span className={cn('hidden font-mono text-xs lg:inline', isDark ? 'text-slate-400' : 'text-stone-500')}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).toUpperCase()}
          </span>
          <button
            onClick={toggleTheme}
            className={cn('rounded-md p-2 transition-colors', isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100')}
            aria-label="Đổi giao diện sáng/tối"
          >
            {isDark ? <HiOutlineSun className="h-5 w-5" /> : <HiOutlineMoon className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile nav: the sidebar is desktop-only */}
        <nav aria-label="Quản trị sàn" className={cn('flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden', isDark ? 'border-slate-800' : 'border-stone-200')}>
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => cn('shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold', isActive ? 'bg-stone-950 text-white dark:bg-white dark:text-stone-950' : isDark ? 'text-slate-300' : 'text-stone-600')}>
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="w-full max-w-[1280px] flex-1 px-4 py-7 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
